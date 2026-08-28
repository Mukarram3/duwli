<?php
// packages/workdo/Account/src/Services/JournalImportService.php

namespace Workdo\Account\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Workdo\Account\Models\ChartOfAccount;

/**
 * Excel import/export for journal vouchers.
 *
 * A journal is many rows, not one, so the sheet is line-per-row and rows are
 * grouped into entries by a shared "Voucher No" — the way an accountant lays
 * out a JV in a spreadsheet:
 *
 *   Voucher No | Date | Description | Account Code | Line Description | Debit | Credit
 *   JV-001     | ...  | Rent Aug    | 5100         | Office rent      | 5000  | 0
 *   JV-001     |      |             | 1010         | Paid from bank   | 0     | 5000
 *   JV-002     | ...  | Salary Aug  | 5200         | Staff salary     | 8000  | 0
 *   JV-002     |      |             | 1010         |                  | 0     | 8000
 *
 * Date and Description are read from the first row of each voucher; the rest
 * may be left blank, which is how people actually type these.
 *
 * Accounts are matched on ACCOUNT CODE, not name — codes are stable and unique,
 * names get edited and translated.
 *
 * The import is all-or-nothing: every voucher is validated and every one must
 * balance before anything is written. A half-imported batch of journals is far
 * harder to unpick than a rejected file.
 */
class JournalImportService
{
    public const COLUMNS = [
        'voucher_no'       => 'Voucher No',
        'journal_date'     => 'Date',
        'description'      => 'Description',
        'account_code'     => 'Account Code',
        'line_description' => 'Line Description',
        'debit'            => 'Debit',
        'credit'           => 'Credit',
    ];

    /** A template with a worked two-voucher example. */
    public function template(): string
    {
        $rows = [
            ['JV-001', date('Y-m-d'), 'Office rent for August', '5100', 'Rent expense', 5000, 0],
            ['JV-001', '', '', '1010', 'Paid from bank', 0, 5000],
            ['JV-002', date('Y-m-d'), 'Owner capital introduced', '1010', 'Bank receipt', 10000, 0],
            ['JV-002', '', '', '3000', 'Owner equity', 0, 10000],
        ];

        return $this->writeSheet($rows, 'journal-entries-template');
    }

    /** Export existing entries in the same shape the importer accepts. */
    public function export(): string
    {
        $entries = \Workdo\Account\Models\JournalEntry::with(['items.account'])
            ->where('created_by', creatorId())
            ->orderBy('journal_date')
            ->get();

        $rows = [];

        foreach ($entries as $entry) {
            $first = true;
            foreach ($entry->items as $item) {
                $rows[] = [
                    $entry->journal_number,
                    $first ? \Carbon\Carbon::parse($entry->journal_date)->format('Y-m-d') : '',
                    $first ? $entry->description : '',
                    $item->account->account_code ?? '',
                    $item->description,
                    (float) $item->debit_amount,
                    (float) $item->credit_amount,
                ];
                $first = false;
            }
        }

        return $this->writeSheet($rows, 'journal-entries');
    }

    /**
     * @return array{imported:int, lines:int, errors:array<string>}
     */
    public function import(string $path, bool $post = false): array
    {
        $sheet = IOFactory::load($path)->getActiveSheet();
        $raw = $sheet->toArray(null, true, true, false);

        if (count($raw) < 2) {
            return ['imported' => 0, 'lines' => 0, 'errors' => [__('The file has no data rows.')]];
        }

        $header = array_map(fn($h) => strtolower(trim((string) $h)), array_shift($raw));

        $index = [];
        foreach (self::COLUMNS as $key => $label) {
            $position = array_search(strtolower($label), $header, true);
            if ($position !== false) {
                $index[$key] = $position;
            }
        }

        $required = ['voucher_no', 'account_code', 'debit', 'credit'];
        $missing = array_diff($required, array_keys($index));
        if (!empty($missing)) {
            $labels = array_map(fn($k) => self::COLUMNS[$k], $missing);
            return [
                'imported' => 0,
                'lines'    => 0,
                'errors'   => [__('Missing required columns: ') . implode(', ', $labels)],
            ];
        }

        // Account codes for this company, indexed for lookup.
        $accounts = ChartOfAccount::where('created_by', creatorId())
            ->pluck('id', 'account_code');

        $errors = [];
        $vouchers = [];

        foreach ($raw as $offset => $row) {
            $rowNumber = $offset + 2;

            $value = function (string $key) use ($row, $index) {
                if (!isset($index[$key])) return null;
                $raw = $row[$index[$key]] ?? null;
                return is_string($raw) ? trim($raw) : $raw;
            };

            $voucher = (string) $value('voucher_no');
            $code    = (string) $value('account_code');
            $debit   = (float) ($value('debit') ?: 0);
            $credit  = (float) ($value('credit') ?: 0);

            // Skip blank rows.
            if ($voucher === '' && $code === '' && $debit == 0 && $credit == 0) {
                continue;
            }

            if ($voucher === '') {
                $errors[] = __('Row :row: Voucher No is required.', ['row' => $rowNumber]);
                continue;
            }

            if (!isset($accounts[$code])) {
                $errors[] = __('Row :row: account code ":code" does not exist.', [
                    'row' => $rowNumber, 'code' => $code,
                ]);
                continue;
            }

            if ($debit > 0 && $credit > 0) {
                $errors[] = __('Row :row: a line cannot have both a debit and a credit.', ['row' => $rowNumber]);
                continue;
            }

            if ($debit <= 0 && $credit <= 0) {
                $errors[] = __('Row :row: enter either a debit or a credit amount.', ['row' => $rowNumber]);
                continue;
            }

            if (!isset($vouchers[$voucher])) {
                $vouchers[$voucher] = [
                    'journal_date' => $this->parseDate($value('journal_date')),
                    'description'  => (string) ($value('description') ?: $voucher),
                    'first_row'    => $rowNumber,
                    'lines'        => [],
                ];
            }

            // Date and description may appear only on the voucher's first row.
            if (!$vouchers[$voucher]['journal_date'] && $value('journal_date')) {
                $vouchers[$voucher]['journal_date'] = $this->parseDate($value('journal_date'));
            }

            $vouchers[$voucher]['lines'][] = [
                'account_id'    => $accounts[$code],
                'description'   => (string) ($value('line_description') ?: ''),
                'debit_amount'  => round($debit, 2),
                'credit_amount' => round($credit, 2),
            ];
        }

        // Each voucher must have at least two lines and must balance.
        foreach ($vouchers as $reference => $voucher) {
            if (count($voucher['lines']) < 2) {
                $errors[] = __('Voucher :ref: needs at least two lines.', ['ref' => $reference]);
                continue;
            }

            $totalDebit  = round(array_sum(array_column($voucher['lines'], 'debit_amount')), 2);
            $totalCredit = round(array_sum(array_column($voucher['lines'], 'credit_amount')), 2);

            if (abs($totalDebit - $totalCredit) > 0.01) {
                $errors[] = __('Voucher :ref is out of balance: debits :debit, credits :credit.', [
                    'ref'    => $reference,
                    'debit'  => number_format($totalDebit, 2),
                    'credit' => number_format($totalCredit, 2),
                ]);
            }

            if (!$voucher['journal_date']) {
                $errors[] = __('Voucher :ref has no date.', ['ref' => $reference]);
            }
        }

        if (!empty($errors)) {
            return ['imported' => 0, 'lines' => 0, 'errors' => $errors];
        }

        $journalService = app(JournalService::class);
        $lineCount = 0;

        DB::transaction(function () use ($vouchers, $journalService, $post, &$lineCount) {
            foreach ($vouchers as $voucher) {
                $journalService->createManualJournal([
                    'journal_date' => $voucher['journal_date'],
                    'description'  => $voucher['description'],
                    'lines'        => $voucher['lines'],
                ], $post);

                $lineCount += count($voucher['lines']);
            }
        });

        return ['imported' => count($vouchers), 'lines' => $lineCount, 'errors' => []];
    }

    /** Accept Excel serial dates as well as text dates. */
    private function parseDate($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Exception $e) {
                return null;
            }
        }

        try {
            return \Carbon\Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function writeSheet(array $rows, string $basename): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Journal Entries');

        $sheet->fromArray(array_values(self::COLUMNS), null, 'A1');

        $lastColumn = $sheet->getHighestColumn();
        $headerRange = "A1:{$lastColumn}1";

        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1E3A6F');
        $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(22);
        $sheet->freezePane('A2');

        if (!empty($rows)) {
            $sheet->fromArray($rows, null, 'A2');
        }

        foreach (range('A', $lastColumn) as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $path = storage_path('app/' . $basename . '-' . now()->format('Ymd-His') . '.xlsx');
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        (new XlsxWriter($spreadsheet))->save($path);
        $spreadsheet->disconnectWorksheets();

        return $path;
    }
}
