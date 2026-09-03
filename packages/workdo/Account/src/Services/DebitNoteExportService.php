<?php
// packages/workdo/Account/src/Services/DebitNoteExportService.php

namespace Workdo\Account\Services;

use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Workdo\Account\Models\DebitNote;

/**
 * Excel export for debit notes.
 *
 * Export only — there is deliberately no import. A debit note is raised from a
 * purchase return and carries return_id, so importing standalone rows would
 * create notes with no source document, breaking the audit trail back to the
 * goods actually returned.
 *
 * Honours the current filters, so what the user exports matches what they are
 * looking at rather than the whole table.
 */
class DebitNoteExportService
{
    public const COLUMNS = [
        'debit_note_number' => 'Debit Note Number',
        'debit_note_date'   => 'Date',
        'vendor'            => 'Vendor',
        'purchase_return'   => 'Purchase Return',
        'reason'            => 'Reason',
        'subtotal'          => 'Subtotal',
        'tax_amount'        => 'Tax',
        'discount_amount'   => 'Discount',
        'total_amount'      => 'Total Amount',
        'applied_amount'    => 'Applied',
        'balance_amount'    => 'Balance',
        'status'            => 'Status',
        'approved_by'       => 'Approved By',
        'notes'             => 'Notes',
    ];

    public function export(array $filters = []): string
    {
        $query = DebitNote::with(['vendor:id,name', 'purchaseReturn:id,return_number', 'approvedBy:id,name'])
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-debit-notes')) {
                    $q->where('created_by', creatorId());
                } elseif (Auth::user()->can('manage-own-debit-notes')) {
                    $q->where('creator_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            });

        // Mirror the list screen's filters so the export matches the view.
        if (!empty($filters['search'])) {
            $query->where('debit_note_number', 'like', '%' . $filters['search'] . '%');
        }
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('debit_note_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('debit_note_date', '<=', $filters['date_to']);
        }

        $notes = $query->orderByDesc('debit_note_date')->get();

        $rows = $notes->map(fn($note) => [
            $note->debit_note_number,
            $note->debit_note_date ? \Carbon\Carbon::parse($note->debit_note_date)->format('Y-m-d') : '',
            $note->vendor->name ?? '',
            $note->purchaseReturn->return_number ?? '',
            $note->reason,
            (float) $note->subtotal,
            (float) $note->tax_amount,
            (float) $note->discount_amount,
            (float) $note->total_amount,
            (float) $note->applied_amount,
            (float) $note->balance_amount,
            $note->status,
            $note->approvedBy->name ?? '',
            $note->notes,
        ])->all();

        return $this->writeSheet($rows);
    }

    private function writeSheet(array $rows): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Debit Notes');
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

        $path = storage_path('app/debit-notes-' . now()->format('Ymd-His') . '.xlsx');
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        (new XlsxWriter($spreadsheet))->save($path);
        $spreadsheet->disconnectWorksheets();

        return $path;
    }
}
