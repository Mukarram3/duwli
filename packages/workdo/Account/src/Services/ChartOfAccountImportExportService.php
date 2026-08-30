<?php
// packages/workdo/Account/src/Services/ChartOfAccountImportExportService.php

namespace Workdo\Account\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Workdo\Account\Models\AccountType;
use Workdo\Account\Models\ChartOfAccount;

/**
 * Excel import/export for the chart of accounts.
 *
 * Parents are referenced by ACCOUNT CODE rather than id, so a chart can be
 * written in a spreadsheet without knowing anything about the database. Rows
 * are inserted parent-before-child regardless of the order they appear in the
 * file — otherwise a child listed above its parent would fail, and people do
 * not write charts in dependency order.
 */
class ChartOfAccountImportExportService
{
    public const COLUMNS = [
        'account_code'    => 'Account Code',
        'account_name'    => 'Account Name',
        'account_type'    => 'Account Type',
        'normal_balance'  => 'Normal Balance (debit/credit)',
        'parent_code'     => 'Parent Account Code',
        'is_group'        => 'Is Group (Yes/No)',
        'opening_balance' => 'Opening Balance',
        'is_active'       => 'Active (Yes/No)',
        'description'     => 'Description',
    ];

    public function export(): string
    {
        $accounts = ChartOfAccount::with(['account_type:id,name', 'parent_account:id,account_code'])
            ->where('created_by', creatorId())
            ->orderBy('account_code')
            ->get();

        $rows = $accounts->map(fn($a) => [
            $a->account_code,
            $a->account_name,
            $a->account_type->name ?? '',
            $a->normal_balance,
            $a->parent_account->account_code ?? '',
            $a->is_group ? 'Yes' : 'No',
            (float) $a->opening_balance,
            $a->is_active ? 'Yes' : 'No',
            $a->description,
        ])->all();

        return $this->writeSheet($rows, 'chart-of-accounts');
    }

    public function template(): string
    {
        return $this->writeSheet([
            ['1000', 'Assets', 'Current Assets', 'debit', '', 'Yes', 0, 'Yes', 'Top-level heading'],
            ['1010', 'Bank Account', 'Current Assets', 'debit', '1000', 'No', 0, 'Yes', 'Detail account under Assets'],
        ], 'chart-of-accounts-template');
    }

    /** @return array{imported:int, errors:array<string>} */
    public function import(string $path): array
    {
        $sheet = IOFactory::load($path)->getActiveSheet();
        $raw = $sheet->toArray(null, true, true, false);

        if (count($raw) < 2) {
            return ['imported' => 0, 'errors' => [__('The file has no data rows.')]];
        }

        $header = array_map(fn($h) => strtolower(trim((string) $h)), array_shift($raw));

        $index = [];
        foreach (self::COLUMNS as $key => $label) {
            $position = array_search(strtolower($label), $header, true);
            if ($position !== false) {
                $index[$key] = $position;
            }
        }

        foreach (['account_code', 'account_name', 'normal_balance'] as $required) {
            if (!isset($index[$required])) {
                return [
                    'imported' => 0,
                    'errors'   => [__('Missing required column: ') . self::COLUMNS[$required]],
                ];
            }
        }

        $types = AccountType::where('created_by', creatorId())->pluck('id', 'name');
        $existing = ChartOfAccount::where('created_by', creatorId())->pluck('id', 'account_code');

        $errors = [];
        $parsed = [];

        foreach ($raw as $offset => $row) {
            $rowNumber = $offset + 2;
            $value = function (string $key) use ($row, $index) {
                if (!isset($index[$key])) return null;
                $v = $row[$index[$key]] ?? null;
                return is_string($v) ? trim($v) : $v;
            };

            $code = (string) $value('account_code');
            $name = (string) $value('account_name');

            if ($code === '' && $name === '') {
                continue;
            }

            if ($code === '' || $name === '') {
                $errors[] = __('Row :row: account code and name are both required.', ['row' => $rowNumber]);
                continue;
            }

            if (isset($existing[$code])) {
                $errors[] = __('Row :row: account code :code already exists.', ['row' => $rowNumber, 'code' => $code]);
                continue;
            }

            if (isset($parsed[$code])) {
                $errors[] = __('Row :row: account code :code appears twice in the file.', ['row' => $rowNumber, 'code' => $code]);
                continue;
            }

            $balance = strtolower((string) $value('normal_balance'));
            if (!in_array($balance, ['debit', 'credit'], true)) {
                $errors[] = __('Row :row: normal balance must be "debit" or "credit".', ['row' => $rowNumber]);
                continue;
            }

            $typeName = (string) $value('account_type');
            $typeId = $types[$typeName] ?? null;
            if ($typeName !== '' && !$typeId) {
                $errors[] = __('Row :row: account type ":type" does not exist.', ['row' => $rowNumber, 'type' => $typeName]);
                continue;
            }
            if (!$typeId) {
                $errors[] = __('Row :row: account type is required.', ['row' => $rowNumber]);
                continue;
            }

            $isGroup = in_array(strtolower((string) $value('is_group')), ['yes', 'y', '1', 'true'], true);
            $parentCode = (string) ($value('parent_code') ?? '');

            // A detail account must sit under a parent — the same rule the
            // create form enforces.
            if (!$isGroup && $parentCode === '') {
                $errors[] = __('Row :row: :code is not a group account, so it needs a parent account code.', [
                    'row' => $rowNumber, 'code' => $code,
                ]);
                continue;
            }

            $parsed[$code] = [
                'row'             => $rowNumber,
                'account_code'    => $code,
                'account_name'    => $name,
                'account_type_id' => $typeId,
                'normal_balance'  => $balance,
                'parent_code'     => $parentCode,
                'is_group'        => $isGroup,
                'opening_balance' => (float) ($value('opening_balance') ?: 0),
                'is_active'       => !in_array(strtolower((string) ($value('is_active') ?? 'yes')), ['no', 'n', '0', 'false'], true),
                'description'     => (string) ($value('description') ?? ''),
            ];
        }

        // Every parent must exist, either already or elsewhere in this file.
        foreach ($parsed as $code => $account) {
            $parent = $account['parent_code'];
            if ($parent !== '' && !isset($existing[$parent]) && !isset($parsed[$parent])) {
                $errors[] = __('Row :row: parent account code :parent was not found.', [
                    'row' => $account['row'], 'parent' => $parent,
                ]);
            }
            // PHP casts numeric array keys to integers, so $code arrives as an
            // int while $parent is a string — a strict comparison would never
            // match and an account could be made its own parent.
            if ($parent !== '' && $parent === (string) $code) {
                $errors[] = __('Row :row: an account cannot be its own parent.', ['row' => $account['row']]);
            }
        }

        if (!empty($errors)) {
            return ['imported' => 0, 'errors' => $errors];
        }

        $imported = 0;

        DB::transaction(function () use ($parsed, $existing, &$imported) {
            $codeToId = $existing->toArray();
            $pending = $parsed;
            $guard = 0;

            // Insert parents before children. Each pass writes every row whose
            // parent is already resolved; repeats until nothing is left.
            while (!empty($pending) && $guard++ < 50) {
                $progressed = false;

                foreach ($pending as $code => $account) {
                    $parent = $account['parent_code'];
                    if ($parent !== '' && !isset($codeToId[$parent])) {
                        continue; // parent not written yet
                    }

                    $parentId = $parent !== '' ? $codeToId[$parent] : null;
                    $level = 1;
                    if ($parentId) {
                        $parentModel = ChartOfAccount::find($parentId);
                        $level = $parentModel ? ((int) $parentModel->level + 1) : 2;

                        // Being chosen as a parent makes an account a group.
                        if ($parentModel && !$parentModel->is_group) {
                            $parentModel->is_group = true;
                            $parentModel->save();
                        }
                    }

                    $created = ChartOfAccount::create([
                        'account_code'      => $account['account_code'],
                        'account_name'      => $account['account_name'],
                        'account_type_id'   => $account['account_type_id'],
                        'normal_balance'    => $account['normal_balance'],
                        'parent_account_id' => $parentId,
                        'is_group'          => $account['is_group'],
                        'level'             => $level,
                        'opening_balance'   => $account['opening_balance'],
                        'current_balance'   => $account['opening_balance'],
                        'is_active'         => $account['is_active'],
                        'is_system_account' => 0,
                        'description'       => $account['description'],
                        'creator_id'        => Auth::id(),
                        'created_by'        => creatorId(),
                    ]);

                    $codeToId[$code] = $created->id;
                    unset($pending[$code]);
                    $imported++;
                    $progressed = true;
                }

                // A cycle (A parents B, B parents A) would loop forever.
                if (!$progressed) {
                    throw new \Exception(__('The parent accounts in this file form a loop.'));
                }
            }
        });

        return ['imported' => $imported, 'errors' => []];
    }

    private function writeSheet(array $rows, string $basename): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Chart Of Accounts');
        $sheet->fromArray(array_values(self::COLUMNS), null, 'A1');

        $lastColumn = $sheet->getHighestColumn();
        $range = "A1:{$lastColumn}1";
        $sheet->getStyle($range)->getFont()->setBold(true);
        $sheet->getStyle($range)->getFill()->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('1E3A6F');
        $sheet->getStyle($range)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($range)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
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
