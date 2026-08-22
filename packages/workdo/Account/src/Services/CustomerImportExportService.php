<?php
// packages/workdo/Account/src/Services/CustomerImportExportService.php

namespace Workdo\Account\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Workdo\Account\Models\Customer;

/**
 * Excel import/export for customers.
 *
 * Built on phpoffice/phpspreadsheet (already a dependency) rather than pulling
 * in maatwebsite/excel, so nothing new has to be installed.
 *
 * The column set is shared by the export, the blank template and the importer,
 * so a file exported from the system can be edited and imported straight back.
 */
class CustomerImportExportService
{
    /**
     * Sheet columns, in order. Keys map to model attributes; dotted keys
     * address the JSON address columns.
     */
    public const COLUMNS = [
        'customer_code'                  => 'Customer Code',
        'company_name'                   => 'Company Name',
        'contact_person_name'            => 'Contact Person Name',
        'contact_person_email'           => 'Contact Person Email',
        'contact_person_mobile'          => 'Contact Person Mobile',
        'tax_number'                     => 'Tax Number',
        'payment_terms'                  => 'Payment Terms',
        'billing_address.name'           => 'Billing Name',
        'billing_address.address_line_1' => 'Billing Address Line 1',
        'billing_address.address_line_2' => 'Billing Address Line 2',
        'billing_address.city'           => 'Billing City',
        'billing_address.state'          => 'Billing State',
        'billing_address.country'        => 'Billing Country',
        'billing_address.zip_code'       => 'Billing Zip Code',
        'same_as_billing'                => 'Shipping Same As Billing (Yes/No)',
        'shipping_address.name'          => 'Shipping Name',
        'shipping_address.address_line_1' => 'Shipping Address Line 1',
        'shipping_address.address_line_2' => 'Shipping Address Line 2',
        'shipping_address.city'          => 'Shipping City',
        'shipping_address.state'         => 'Shipping State',
        'shipping_address.country'       => 'Shipping Country',
        'shipping_address.zip_code'      => 'Shipping Zip Code',
        'notes'                          => 'Notes',
    ];

    /** Columns the importer requires a value for. */
    private const REQUIRED = [
        'company_name',
        'contact_person_name',
        'contact_person_email',
        'billing_address.name',
        'billing_address.address_line_1',
        'billing_address.city',
        'billing_address.state',
        'billing_address.country',
        'billing_address.zip_code',
    ];

    // -----------------------------------------------------------------
    // Export
    // -----------------------------------------------------------------

    /** Build an .xlsx of every customer this user may see. Returns a temp file path. */
    public function export(): string
    {
        $customers = Customer::query()
            ->where(function ($q) {
                if (Auth::user()->can('manage-any-customers')) {
                    $q->where('created_by', creatorId());
                } elseif (Auth::user()->can('manage-own-customers')) {
                    $q->where('creator_id', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->orderBy('customer_code')
            ->get();

        $rows = $customers->map(function ($customer) {
            $row = [];
            foreach (array_keys(self::COLUMNS) as $key) {
                $row[] = $this->readValue($customer, $key);
            }
            return $row;
        })->all();

        return $this->writeSheet($rows, 'customers');
    }

    /** A header-only workbook users can fill in and import. */
    public function template(): string
    {
        // One example row makes the expected format obvious.
        $example = [
            '', 'Acme Trading LLC', 'Sara Ahmed', 'sara@acme.com', '0551234567',
            '300000000000003', 'Net 30',
            'Acme Trading LLC', 'King Fahd Road', 'Building 12', 'Riyadh', 'Riyadh', 'Saudi Arabia', '11564',
            'Yes',
            '', '', '', '', '', '', '',
            'Example row — delete before importing',
        ];

        return $this->writeSheet([$example], 'customers-template');
    }

    // -----------------------------------------------------------------
    // Import
    // -----------------------------------------------------------------

    /**
     * Import customers from an uploaded sheet.
     *
     * Every row is validated before anything is written, and the whole import
     * runs in a transaction — a file with errors imports nothing, so you never
     * end up with a half-loaded customer list.
     *
     * @return array{imported:int, skipped:int, errors:array<string>}
     */
    public function import(string $path): array
    {
        $sheet = IOFactory::load($path)->getActiveSheet();
        $raw = $sheet->toArray(null, true, true, false);

        if (count($raw) < 2) {
            return ['imported' => 0, 'skipped' => 0, 'errors' => [__('The file has no data rows.')]];
        }

        // Map the file's header row onto our column keys, so column order in
        // the uploaded file does not have to match ours.
        $header = array_map(fn($h) => strtolower(trim((string) $h)), array_shift($raw));
        $index = [];
        foreach (self::COLUMNS as $key => $label) {
            $position = array_search(strtolower($label), $header, true);
            if ($position !== false) {
                $index[$key] = $position;
            }
        }

        $missingHeaders = array_diff(self::REQUIRED, array_keys($index));
        if (!empty($missingHeaders)) {
            $labels = array_map(fn($k) => self::COLUMNS[$k], $missingHeaders);
            return [
                'imported' => 0,
                'skipped'  => 0,
                'errors'   => [__('Missing required columns: ') . implode(', ', $labels)],
            ];
        }

        $errors = [];
        $prepared = [];
        $seenEmails = [];

        foreach ($raw as $offset => $row) {
            $rowNumber = $offset + 2; // +1 for header, +1 for 1-based rows

            $values = [];
            foreach ($index as $key => $position) {
                $values[$key] = isset($row[$position]) ? trim((string) $row[$position]) : null;
            }

            // Skip rows that are entirely blank.
            if (count(array_filter($values, fn($v) => $v !== null && $v !== '')) === 0) {
                continue;
            }

            $sameAsBilling = in_array(
                strtolower((string) ($values['same_as_billing'] ?? '')),
                ['yes', 'y', '1', 'true'],
                true
            );

            $data = [
                'company_name'           => $values['company_name'] ?? null,
                'contact_person_name'    => $values['contact_person_name'] ?? null,
                'contact_person_email'   => $values['contact_person_email'] ?? null,
                'contact_person_mobile'  => $values['contact_person_mobile'] ?? null,
                'tax_number'             => $values['tax_number'] ?? null,
                'payment_terms'          => $values['payment_terms'] ?? null,
                'same_as_billing'        => $sameAsBilling,
                'notes'                  => $values['notes'] ?? null,
                'billing_address'        => $this->addressFrom($values, 'billing_address'),
            ];

            $data['shipping_address'] = $sameAsBilling
                ? $data['billing_address']
                : $this->addressFrom($values, 'shipping_address');

            $validator = Validator::make($data, [
                'company_name'                   => 'required|string|max:255',
                'contact_person_name'            => 'required|string|max:255',
                'contact_person_email'           => 'required|email|max:255',
                'contact_person_mobile'          => 'nullable|string|max:255',
                'tax_number'                     => 'nullable|string|max:255',
                'billing_address.name'           => 'required|string|max:255',
                'billing_address.address_line_1' => 'required|string|max:255',
                'billing_address.city'           => 'required|string|max:255',
                'billing_address.state'          => 'required|string|max:255',
                'billing_address.country'        => 'required|string|max:255',
                'billing_address.zip_code'       => 'required|string|max:20',
                'shipping_address.name'          => 'required|string|max:255',
                'shipping_address.address_line_1' => 'required|string|max:255',
                'shipping_address.city'          => 'required|string|max:255',
                'shipping_address.state'         => 'required|string|max:255',
                'shipping_address.country'       => 'required|string|max:255',
                'shipping_address.zip_code'      => 'required|string|max:20',
            ]);

            if ($validator->fails()) {
                foreach ($validator->errors()->all() as $message) {
                    $errors[] = __('Row :row: :message', ['row' => $rowNumber, 'message' => $message]);
                }
                continue;
            }

            // Duplicate checks — within the file, and against existing records.
            $email = strtolower($data['contact_person_email']);
            if (isset($seenEmails[$email])) {
                $errors[] = __('Row :row: duplicate email :email (already on row :other)', [
                    'row' => $rowNumber, 'email' => $data['contact_person_email'], 'other' => $seenEmails[$email],
                ]);
                continue;
            }
            $seenEmails[$email] = $rowNumber;

            $exists = Customer::where('created_by', creatorId())
                ->where('contact_person_email', $data['contact_person_email'])
                ->exists();

            if ($exists) {
                $errors[] = __('Row :row: a customer with email :email already exists', [
                    'row' => $rowNumber, 'email' => $data['contact_person_email'],
                ]);
                continue;
            }

            // Honour a supplied customer code if it is not already taken.
            $code = $values['customer_code'] ?? null;
            if ($code && !Customer::where('created_by', creatorId())->where('customer_code', $code)->exists()) {
                $data['customer_code'] = $code;
            }

            $prepared[] = $data;
        }

        // Nothing is written if any row failed — partial customer lists are
        // harder to clean up than a rejected file.
        if (!empty($errors)) {
            return ['imported' => 0, 'skipped' => count($errors), 'errors' => $errors];
        }

        DB::transaction(function () use ($prepared) {
            $linker = app(CustomerUserLinkService::class);

            foreach ($prepared as $data) {
                $customer = Customer::create(array_merge($data, [
                    'creator_id' => Auth::id(),
                    'created_by' => creatorId(),
                ]));

                // Imported customers must also reach the invoice pickers.
                $linker->link($customer);
            }
        });

        return ['imported' => count($prepared), 'skipped' => 0, 'errors' => []];
    }

    // -----------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------

    private function addressFrom(array $values, string $prefix): array
    {
        return [
            'name'           => $values["{$prefix}.name"] ?? null,
            'address_line_1' => $values["{$prefix}.address_line_1"] ?? null,
            'address_line_2' => $values["{$prefix}.address_line_2"] ?? null,
            'city'           => $values["{$prefix}.city"] ?? null,
            'state'          => $values["{$prefix}.state"] ?? null,
            'country'        => $values["{$prefix}.country"] ?? null,
            'zip_code'       => $values["{$prefix}.zip_code"] ?? null,
        ];
    }

    /** Read a possibly-dotted key off the model, casting booleans for the sheet. */
    private function readValue(Customer $customer, string $key)
    {
        if ($key === 'same_as_billing') {
            return $customer->same_as_billing ? 'Yes' : 'No';
        }

        if (!str_contains($key, '.')) {
            return $customer->{$key};
        }

        [$attribute, $field] = explode('.', $key, 2);
        $address = $customer->{$attribute};

        return is_array($address) ? ($address[$field] ?? '') : '';
    }

    /** Write rows beneath a styled header row and return the temp file path. */
    private function writeSheet(array $rows, string $basename): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Customers');

        $labels = array_values(self::COLUMNS);
        $sheet->fromArray($labels, null, 'A1');

        $lastColumn = $sheet->getHighestColumn();
        $headerRange = "A1:{$lastColumn}1";

        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('1E3A5F');
        $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getAlignment()
            ->setVertical(Alignment::VERTICAL_CENTER);
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
