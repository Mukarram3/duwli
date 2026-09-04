<?php
// packages/workdo/Assets/src/Services/AssetImportExportService.php

namespace Workdo\Assets\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Workdo\Assets\Models\Asset;
use Workdo\Assets\Models\AssetsCategory;
use Workdo\Assets\Models\AssetLocation;

/**
 * Excel import/export for fixed assets.
 *
 * Categories and locations are referenced BY NAME, and a name that does not
 * exist yet is created rather than rejected. An asset register usually arrives
 * as a spreadsheet before anyone has set up the classification lists, so
 * demanding they exist first makes the import unusable in practice.
 *
 * Serial code is the natural key: a row whose serial already exists is
 * reported rather than silently duplicated, because a duplicated asset means
 * the register double-counts value.
 */
class AssetImportExportService
{
    public const COLUMNS = [
        'name'            => 'Asset Name',
        'serial_code'     => 'Serial Code',
        'category'        => 'Category',
        'location'        => 'Location',
        'purchase_date'   => 'Purchase Date',
        'supported_date'  => 'Supported Until',
        'quantity'        => 'Quantity',
        'unit_price'      => 'Unit Price',
        'purchase_cost'   => 'Purchase Cost',
        'warranty_period' => 'Warranty (months)',
        'description'     => 'Description',
    ];

    private const REQUIRED = ['name', 'purchase_date'];

    public function export(): string
    {
        $assets = Asset::with(['category:id,name', 'location:id,name'])
            ->where('created_by', creatorId())
            ->orderBy('name')
            ->get();

        $rows = $assets->map(fn($a) => [
            $a->name,
            $a->serial_code,
            $a->category->name ?? '',
            $a->location->name ?? '',
            $a->purchase_date ? $a->purchase_date->format('Y-m-d') : '',
            $a->supported_date ? $a->supported_date->format('Y-m-d') : '',
            (int) $a->quantity,
            (float) $a->unit_price,
            (float) $a->purchase_cost,
            $a->warranty_period,
            $a->description,
        ])->all();

        return $this->writeSheet($rows, 'fixed-assets');
    }

    public function template(): string
    {
        return $this->writeSheet([
            ['Dell Latitude 5540', 'SN-100234', 'IT Equipment', 'Head Office',
             date('Y-m-d'), date('Y-m-d', strtotime('+3 years')), 1, 4500, 4500, 36, 'Finance department laptop'],
            ['Office Desk', 'SN-100235', 'Furniture', 'Head Office',
             date('Y-m-d'), '', 4, 800, 3200, 12, ''],
        ], 'fixed-assets-template');
    }

    /** @return array{imported:int, created_categories:int, created_locations:int, errors:array<string>} */
    public function import(string $path): array
    {
        $sheet = IOFactory::load($path)->getActiveSheet();
        $raw = $sheet->toArray(null, true, true, false);

        if (count($raw) < 2) {
            return ['imported' => 0, 'created_categories' => 0, 'created_locations' => 0,
                    'errors' => [__('The file has no data rows.')]];
        }

        $header = array_map(fn($h) => strtolower(trim((string) $h)), array_shift($raw));

        $index = [];
        foreach (self::COLUMNS as $key => $label) {
            $position = array_search(strtolower($label), $header, true);
            if ($position !== false) {
                $index[$key] = $position;
            }
        }

        $missing = array_diff(self::REQUIRED, array_keys($index));
        if (!empty($missing)) {
            $labels = array_map(fn($k) => self::COLUMNS[$k], $missing);
            return ['imported' => 0, 'created_categories' => 0, 'created_locations' => 0,
                    'errors' => [__('Missing required columns: ') . implode(', ', $labels)]];
        }

        $existingSerials = Asset::where('created_by', creatorId())
            ->whereNotNull('serial_code')
            ->pluck('serial_code')
            ->map(fn($s) => strtolower($s))
            ->flip();

        $errors = [];
        $parsed = [];
        $seenSerials = [];

        foreach ($raw as $offset => $row) {
            $rowNumber = $offset + 2;
            $value = function (string $key) use ($row, $index) {
                if (!isset($index[$key])) return null;
                $v = $row[$index[$key]] ?? null;
                return is_string($v) ? trim($v) : $v;
            };

            $name = (string) $value('name');
            if ($name === '') {
                // Blank row rather than a bad one.
                if (count(array_filter($row, fn($c) => $c !== null && trim((string) $c) !== '')) === 0) {
                    continue;
                }
                $errors[] = __('Row :row: asset name is required.', ['row' => $rowNumber]);
                continue;
            }

            $purchaseDate = $this->parseDate($value('purchase_date'));
            if (!$purchaseDate) {
                $errors[] = __('Row :row: purchase date is missing or not a date.', ['row' => $rowNumber]);
                continue;
            }

            $serial = (string) ($value('serial_code') ?? '');
            if ($serial !== '') {
                $key = strtolower($serial);
                if (isset($existingSerials[$key])) {
                    $errors[] = __('Row :row: serial code :serial already exists.', [
                        'row' => $rowNumber, 'serial' => $serial,
                    ]);
                    continue;
                }
                if (isset($seenSerials[$key])) {
                    $errors[] = __('Row :row: serial code :serial appears twice in the file (also row :other).', [
                        'row' => $rowNumber, 'serial' => $serial, 'other' => $seenSerials[$key],
                    ]);
                    continue;
                }
                $seenSerials[$key] = $rowNumber;
            }

            $quantity = (int) ($value('quantity') ?: 1);
            $unitPrice = (float) ($value('unit_price') ?: 0);
            $cost = (float) ($value('purchase_cost') ?: 0);

            // If only one of unit price / total is given, derive the other.
            if ($cost <= 0 && $unitPrice > 0) {
                $cost = round($unitPrice * max($quantity, 1), 2);
            }
            if ($unitPrice <= 0 && $cost > 0 && $quantity > 0) {
                $unitPrice = round($cost / $quantity, 2);
            }

            $parsed[] = [
                'name'            => $name,
                'serial_code'     => $serial ?: null,
                'category_name'   => (string) ($value('category') ?? ''),
                'location_name'   => (string) ($value('location') ?? ''),
                'purchase_date'   => $purchaseDate,
                'supported_date'  => $this->parseDate($value('supported_date')),
                'quantity'        => max($quantity, 1),
                'unit_price'      => $unitPrice,
                'purchase_cost'   => $cost,
                'warranty_period' => $value('warranty_period') ?: null,
                'description'     => (string) ($value('description') ?? ''),
            ];
        }

        if (!empty($errors)) {
            return ['imported' => 0, 'created_categories' => 0, 'created_locations' => 0, 'errors' => $errors];
        }

        $imported = 0;
        $newCategories = 0;
        $newLocations = 0;

        DB::transaction(function () use ($parsed, &$imported, &$newCategories, &$newLocations) {
            $categories = AssetsCategory::where('created_by', creatorId())
                ->pluck('id', 'name')
                ->mapWithKeys(fn($id, $name) => [strtolower($name) => $id])
                ->toArray();

            $locations = AssetLocation::where('created_by', creatorId())
                ->pluck('id', 'name')
                ->mapWithKeys(fn($id, $name) => [strtolower($name) => $id])
                ->toArray();

            foreach ($parsed as $row) {
                $categoryId = null;
                if ($row['category_name'] !== '') {
                    $key = strtolower($row['category_name']);
                    if (!isset($categories[$key])) {
                        $created = AssetsCategory::create([
                            'name'       => $row['category_name'],
                            'creator_id' => Auth::id(),
                            'created_by' => creatorId(),
                        ]);
                        $categories[$key] = $created->id;
                        $newCategories++;
                    }
                    $categoryId = $categories[$key];
                }

                $locationId = null;
                if ($row['location_name'] !== '') {
                    $key = strtolower($row['location_name']);
                    if (!isset($locations[$key])) {
                        $created = AssetLocation::create([
                            'name'       => $row['location_name'],
                            // type is part of the location schema; imported
                            // locations default to a plain building.
                            'type'       => 'building',
                            'creator_id' => Auth::id(),
                            'created_by' => creatorId(),
                        ]);
                        $locations[$key] = $created->id;
                        $newLocations++;
                    }
                    $locationId = $locations[$key];
                }

                Asset::create([
                    'name'            => $row['name'],
                    'serial_code'     => $row['serial_code'],
                    'category_id'     => $categoryId,
                    'location_id'     => $locationId,
                    'purchase_date'   => $row['purchase_date'],
                    'supported_date'  => $row['supported_date'],
                    'quantity'        => $row['quantity'],
                    'unit_price'      => $row['unit_price'],
                    'purchase_cost'   => $row['purchase_cost'],
                    'warranty_period' => $row['warranty_period'],
                    'description'     => $row['description'],
                    'creator_id'      => Auth::id(),
                    'created_by'      => creatorId(),
                ]);

                $imported++;
            }
        });

        return [
            'imported'           => $imported,
            'created_categories' => $newCategories,
            'created_locations'  => $newLocations,
            'errors'             => [],
        ];
    }

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
        $sheet->setTitle('Fixed Assets');
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
