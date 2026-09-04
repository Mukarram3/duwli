<?php
// packages/workdo/Account/src/Services/ReceiptExportService.php

namespace Workdo\Account\Services;

use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Workdo\Account\Models\CustomerPayment;
use Workdo\Account\Models\VendorPayment;

/**
 * Excel export for receipts.
 *
 * Customer and vendor payments share an identical shape, so one service
 * handles both and can also emit the combined "All Receipts" view.
 *
 * Direction is carried as an explicit column rather than being implied by
 * which sheet you opened — in a combined list, money in and money out must
 * never be ambiguous.
 */
class ReceiptExportService
{
    public const COLUMNS = [
        'payment_number'   => 'Receipt Number',
        'payment_date'     => 'Date',
        'direction'        => 'Direction',
        'party'            => 'Customer / Vendor',
        'bank_account'     => 'Bank Account',
        'reference_number' => 'Reference',
        'payment_amount'   => 'Amount',
        'status'           => 'Status',
        'notes'            => 'Notes',
    ];

    /** @param string $scope customer|vendor|all */
    public function export(string $scope = 'all', array $filters = []): string
    {
        $rows = [];

        if ($scope === 'customer' || $scope === 'all') {
            $rows = array_merge($rows, $this->rowsFor(
                CustomerPayment::with(['customer:id,company_name', 'bankAccount:id,account_name']),
                'Received',
                'customer',
                $filters,
            ));
        }

        if ($scope === 'vendor' || $scope === 'all') {
            $rows = array_merge($rows, $this->rowsFor(
                VendorPayment::with(['vendor:id,company_name', 'bankAccount:id,account_name']),
                'Paid',
                'vendor',
                $filters,
            ));
        }

        // Newest first across both sources.
        usort($rows, fn($a, $b) => strcmp((string) $b[1], (string) $a[1]));

        $basename = match ($scope) {
            'customer' => 'customer-receipts',
            'vendor'   => 'vendor-receipts',
            default    => 'all-receipts',
        };

        return $this->writeSheet($rows, $basename);
    }

    private function rowsFor($query, string $direction, string $partyType, array $filters): array
    {
        // Company scoping, matching what both payment controllers do.
        $query->where('created_by', creatorId());

        if (!empty($filters['search'])) {
            $query->where('payment_number', 'like', '%' . $filters['search'] . '%');
        }
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('payment_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('payment_date', '<=', $filters['date_to']);
        }

        return $query->get()->map(function ($payment) use ($direction, $partyType) {
            $party = $partyType === 'customer' ? $payment->customer : $payment->vendor;

            return [
                $payment->payment_number,
                $payment->payment_date ? $payment->payment_date->format('Y-m-d') : '',
                $direction,
                $party->company_name ?? '',
                $payment->bankAccount->account_name ?? '',
                $payment->reference_number,
                (float) $payment->payment_amount,
                $payment->status,
                $payment->notes,
            ];
        })->all();
    }

    private function writeSheet(array $rows, string $basename): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Receipts');
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
