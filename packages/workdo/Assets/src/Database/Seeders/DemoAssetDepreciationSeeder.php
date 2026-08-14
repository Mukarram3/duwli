<?php

namespace Workdo\Assets\Database\Seeders;

use Illuminate\Database\Seeder;
use Workdo\Assets\Models\AssetDepreciation;
use Workdo\Assets\Models\Asset;

class DemoAssetDepreciationSeeder extends Seeder
{
    public function run($userId): void
    {
        if (AssetDepreciation::where('created_by', $userId)->exists()) {
            return;
        }
        
        $assets = Asset::where('created_by', $userId)->limit(10)->get();

        if ($assets->isEmpty()) {
            return;
        }

        foreach ($assets as $asset) {
            $purchaseCost = $asset->purchase_cost ?? 0;
            $salvageValue = $purchaseCost * 0.1; // 10% salvage value
            $usefulLife = 5; // 5 years
            $annualDepreciation = ($purchaseCost - $salvageValue) / $usefulLife;

            AssetDepreciation::create([
                'asset_id' => $asset->id,
                'depreciation_method' => 'straight_line',
                'useful_life_years' => $usefulLife,
                'salvage_value' => $salvageValue,
                'annual_depreciation' => $annualDepreciation,
                'accumulated_depreciation' => 0,
                'book_value' => $purchaseCost,
                'depreciation_start_date' => $asset->purchase_date ?? now(),
                'is_fully_depreciated' => false,
                'notes' => 'Standard depreciation schedule',
                'creator_id' => $userId,
                'created_by' => $userId,
            ]);
        }
    }
}
