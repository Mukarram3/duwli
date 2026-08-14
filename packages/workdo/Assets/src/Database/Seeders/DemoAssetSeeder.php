<?php

namespace Workdo\Assets\Database\Seeders;

use Illuminate\Database\Seeder;
use Workdo\Assets\Models\Asset;
use Workdo\Assets\Models\AssetsCategory;
use Workdo\Assets\Models\AssetLocation;

class DemoAssetSeeder extends Seeder
{
    public function run($userId): void
    {
        if (Asset::where('created_by', $userId)->exists()) {
            return;
        }
        
        $categories = AssetsCategory::where('created_by', $userId)->get();
        $locations = AssetLocation::where('created_by', $userId)->get();

        if ($categories->isEmpty() || $locations->isEmpty()) {
            return;
        }

        // Create a mapping of location names to IDs
        $locationMap = [
            'IT Department' => $locations->where('name', 'Floor 3 - IT Department')->first()?->id ?? $locations->first()->id,
            'Office Floor 2' => $locations->where('name', 'Floor 2 - Administration')->first()?->id ?? $locations->first()->id,
            'Office Floor 3' => $locations->where('name', 'Floor 3 - IT Department')->first()?->id ?? $locations->first()->id,
            'Parking Lot A' => $locations->where('name', 'Main Office Building')->first()?->id ?? $locations->first()->id,
            'Production Floor' => $locations->where('name', 'Production Floor')->first()?->id ?? $locations->first()->id,
            'Conference Rooms' => $locations->where('name', 'Conference Room A')->first()?->id ?? $locations->first()->id,
            'Digital Assets' => $locations->where('name', 'Server Room')->first()?->id ?? $locations->first()->id,
            'Server Room' => $locations->where('name', 'Server Room')->first()?->id ?? $locations->first()->id,
            'Maintenance Workshop' => $locations->where('name', 'Warehouse District A')->first()?->id ?? $locations->first()->id,
            'Building Infrastructure' => $locations->where('name', 'Main Office Building')->first()?->id ?? $locations->first()->id,
            'Design Department' => $locations->where('name', 'Tech Campus Site')->first()?->id ?? $locations->first()->id,
            'Parking Lot B' => $locations->where('name', 'Main Office Building')->first()?->id ?? $locations->first()->id,
            'Building Perimeter' => $locations->where('name', 'Main Office Building')->first()?->id ?? $locations->first()->id,
        ];

        $assets = [
            ['name' => 'Dell Latitude 5520 Laptop', 'serial_code' => 'DL-LAP-001', 'quantity' => 5, 'unit_price' => 1200.00, 'purchase_cost' => 6000.00, 'warranty_period' => '3 years', 'location_key' => 'IT Department', 'description' => 'High-performance business laptop', 'purchase_date' => '2024-01-15', 'supported_date' => '2027-01-15', 'image' => 'dell-laptop.jpg'],
            ['name' => 'HP ProDesk Desktop', 'serial_code' => 'HP-DSK-002', 'quantity' => 10, 'unit_price' => 800.00, 'purchase_cost' => 8000.00, 'warranty_period' => '3 years', 'location_key' => 'Office Floor 2', 'description' => 'Desktop computer for office use', 'purchase_date' => '2024-02-10', 'supported_date' => '2027-02-10', 'image' => 'hp-desktop.jpg'],
            ['name' => 'Executive Office Desk', 'serial_code' => 'FUR-DSK-003', 'quantity' => 15, 'unit_price' => 450.00, 'purchase_cost' => 6750.00, 'warranty_period' => '5 years', 'location_key' => 'Office Floor 3', 'description' => 'Ergonomic executive desk', 'purchase_date' => '2024-01-20', 'supported_date' => '2029-01-20', 'image' => 'office-desk.jpg'],
            ['name' => 'Toyota Camry 2024', 'serial_code' => 'VEH-CAR-004', 'quantity' => 2, 'unit_price' => 28000.00, 'purchase_cost' => 56000.00, 'warranty_period' => '5 years', 'location_key' => 'Parking Lot A', 'description' => 'Company vehicle for executives', 'purchase_date' => '2024-03-01', 'supported_date' => '2029-03-01', 'image' => 'toyota-camry.jpg'],
            ['name' => 'Industrial Printer MX-5000', 'serial_code' => 'MAC-PRT-005', 'quantity' => 3, 'unit_price' => 3500.00, 'purchase_cost' => 10500.00, 'warranty_period' => '2 years', 'location_key' => 'Production Floor', 'description' => 'High-speed industrial printer', 'purchase_date' => '2024-02-15', 'supported_date' => '2026-02-15', 'image' => 'industrial-printer.jpg'],
            ['name' => 'Samsung 55" Smart TV', 'serial_code' => 'ELC-TV-006', 'quantity' => 8, 'unit_price' => 650.00, 'purchase_cost' => 5200.00, 'warranty_period' => '2 years', 'location_key' => 'Conference Rooms', 'description' => 'Smart TV for presentations', 'purchase_date' => '2024-01-25', 'supported_date' => '2026-01-25', 'image' => 'samsung-tv.jpg'],
            ['name' => 'Microsoft Office 365 License', 'serial_code' => 'SFT-O365-007', 'quantity' => 50, 'unit_price' => 150.00, 'purchase_cost' => 7500.00, 'warranty_period' => '1 year', 'location_key' => 'Digital Assets', 'description' => 'Annual software license', 'purchase_date' => '2024-01-01', 'supported_date' => '2025-01-01', 'image' => 'office-license.jpg'],
            ['name' => 'Cisco Network Switch 48-Port', 'serial_code' => 'NET-SW-008', 'quantity' => 4, 'unit_price' => 2200.00, 'purchase_cost' => 8800.00, 'warranty_period' => '5 years', 'location_key' => 'Server Room', 'description' => 'Enterprise network switch', 'purchase_date' => '2024-02-20', 'supported_date' => '2029-02-20', 'image' => 'cisco-switch.jpg'],
            ['name' => 'iPhone 15 Pro', 'serial_code' => 'MOB-IPH-009', 'quantity' => 20, 'unit_price' => 1100.00, 'purchase_cost' => 22000.00, 'warranty_period' => '1 year', 'location_key' => 'IT Department', 'description' => 'Company mobile phones', 'purchase_date' => '2024-03-10', 'supported_date' => '2025-03-10', 'image' => 'iphone-pro.jpg'],
            ['name' => 'Power Drill Set Professional', 'serial_code' => 'TOL-DRL-010', 'quantity' => 12, 'unit_price' => 250.00, 'purchase_cost' => 3000.00, 'warranty_period' => '2 years', 'location_key' => 'Maintenance Workshop', 'description' => 'Professional power drill set', 'purchase_date' => '2024-01-30', 'supported_date' => '2026-01-30', 'image' => 'power-drill.jpg'],
            ['name' => 'HVAC System Unit', 'serial_code' => 'BLD-HVAC-011', 'quantity' => 6, 'unit_price' => 5500.00, 'purchase_cost' => 33000.00, 'warranty_period' => '10 years', 'location_key' => 'Building Infrastructure', 'description' => 'Central HVAC system', 'purchase_date' => '2024-02-01', 'supported_date' => '2034-02-01', 'image' => 'hvac-system.jpg'],
            ['name' => 'MacBook Pro 16"', 'serial_code' => 'APL-MBP-012', 'quantity' => 8, 'unit_price' => 2800.00, 'purchase_cost' => 22400.00, 'warranty_period' => '3 years', 'location_key' => 'Design Department', 'description' => 'High-end laptop for designers', 'purchase_date' => '2024-03-05', 'supported_date' => '2027-03-05', 'image' => 'macbook-pro.jpg'],
            ['name' => 'Conference Table 12-Seater', 'serial_code' => 'FUR-TBL-013', 'quantity' => 5, 'unit_price' => 1200.00, 'purchase_cost' => 6000.00, 'warranty_period' => '5 years', 'location_key' => 'Conference Rooms', 'description' => 'Large conference table', 'purchase_date' => '2024-01-18', 'supported_date' => '2029-01-18', 'image' => 'conference-table.jpg'],
            ['name' => 'Ford Transit Van 2024', 'serial_code' => 'VEH-VAN-014', 'quantity' => 3, 'unit_price' => 35000.00, 'purchase_cost' => 105000.00, 'warranty_period' => '5 years', 'location_key' => 'Parking Lot B', 'description' => 'Cargo van for deliveries', 'purchase_date' => '2024-03-15', 'supported_date' => '2029-03-15', 'image' => 'ford-van.jpg'],
            ['name' => 'Security Camera System', 'serial_code' => 'ELC-CAM-015', 'quantity' => 25, 'unit_price' => 300.00, 'purchase_cost' => 7500.00, 'warranty_period' => '3 years', 'location_key' => 'Building Perimeter', 'description' => 'IP security cameras', 'purchase_date' => '2024-02-25', 'supported_date' => '2027-02-25', 'image' => 'security-camera.jpg'],
        ];

        foreach ($assets as $index => $asset) {
            $categoryIndex = $index % $categories->count();
            $locationKey = $asset['location_key'];
            unset($asset['location_key']);

            Asset::create(array_merge($asset, [
                'category_id' => $categories[$categoryIndex]->id,
                'location_id' => $locationMap[$locationKey] ?? $locations->first()->id,
                'creator_id' => $userId,
                'created_by' => $userId,
            ]));
        }
    }
}
