<?php

namespace Workdo\Assets\Database\Seeders;

use Illuminate\Database\Seeder;
use Workdo\Assets\Models\AssetMaintenance;
use Workdo\Assets\Models\Asset;

class DemoAssetMaintenanceSeeder extends Seeder
{
    public function run($userId): void
    {
        if (AssetMaintenance::where('created_by', $userId)->exists()) {
            return;
        }
        
        $assets = Asset::where('created_by', $userId)->limit(8)->get();

        if ($assets->isEmpty()) {
            return;
        }

        $maintenances = [
            ['maintenance_type' => 'preventive', 'title' => 'Quarterly System Check', 'description' => 'Regular system maintenance and updates', 'scheduled_date' => '2024-04-15', 'completed_date' => null, 'cost' => 150.00, 'technician_name' => 'Tech Support Team', 'status' => 'scheduled', 'priority' => 'medium', 'notes' => 'Standard preventive maintenance', 'next_maintenance_date' => '2024-07-15'],
            ['maintenance_type' => 'corrective', 'title' => 'Screen Replacement', 'description' => 'Replace damaged screen', 'scheduled_date' => '2024-03-20', 'completed_date' => '2024-03-22', 'cost' => 350.00, 'technician_name' => 'John Repair', 'status' => 'completed', 'priority' => 'high', 'notes' => 'Screen was cracked, replaced successfully', 'next_maintenance_date' => null],
            ['maintenance_type' => 'preventive', 'title' => 'Annual Service', 'description' => 'Comprehensive annual maintenance', 'scheduled_date' => '2024-05-01', 'completed_date' => null, 'cost' => 500.00, 'technician_name' => 'Service Center', 'status' => 'scheduled', 'priority' => 'low', 'notes' => 'Scheduled annual service', 'next_maintenance_date' => '2025-05-01'],
            ['maintenance_type' => 'emergency', 'title' => 'System Crash Recovery', 'description' => 'Emergency repair after system failure', 'scheduled_date' => '2024-03-10', 'completed_date' => '2024-03-10', 'cost' => 800.00, 'technician_name' => 'Emergency IT Team', 'status' => 'completed', 'priority' => 'critical', 'notes' => 'System restored from backup', 'next_maintenance_date' => null],
            ['maintenance_type' => 'preventive', 'title' => 'Battery Replacement', 'description' => 'Replace aging battery', 'scheduled_date' => '2024-04-05', 'completed_date' => null, 'cost' => 120.00, 'technician_name' => 'Hardware Team', 'status' => 'in_progress', 'priority' => 'medium', 'notes' => 'Battery health below 80%', 'next_maintenance_date' => null],
            ['maintenance_type' => 'corrective', 'title' => 'Network Port Repair', 'description' => 'Fix damaged ethernet port', 'scheduled_date' => '2024-03-25', 'completed_date' => '2024-03-26', 'cost' => 75.00, 'technician_name' => 'Network Tech', 'status' => 'completed', 'priority' => 'medium', 'notes' => 'Port replaced and tested', 'next_maintenance_date' => null],
            ['maintenance_type' => 'preventive', 'title' => 'Software Updates', 'description' => 'Install latest security patches', 'scheduled_date' => '2024-04-10', 'completed_date' => null, 'cost' => 0.00, 'technician_name' => 'IT Department', 'status' => 'scheduled', 'priority' => 'high', 'notes' => 'Critical security updates', 'next_maintenance_date' => '2024-05-10'],
            ['maintenance_type' => 'corrective', 'title' => 'Cooling Fan Replacement', 'description' => 'Replace noisy cooling fan', 'scheduled_date' => '2024-03-28', 'completed_date' => null, 'cost' => 95.00, 'technician_name' => 'Hardware Specialist', 'status' => 'scheduled', 'priority' => 'medium', 'notes' => 'Fan making unusual noise', 'next_maintenance_date' => null],
        ];

        foreach ($maintenances as $index => $maintenance) {
            $assetIndex = $index % $assets->count();

            AssetMaintenance::create(array_merge($maintenance, [
                'asset_id' => $assets[$assetIndex]->id,
                'creator_id' => $userId,
                'created_by' => $userId,
            ]));
        }
    }
}
