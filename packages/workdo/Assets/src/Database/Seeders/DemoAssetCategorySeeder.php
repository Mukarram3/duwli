<?php

namespace Workdo\Assets\Database\Seeders;

use Illuminate\Database\Seeder;
use Workdo\Assets\Models\AssetsCategory;

class DemoAssetCategorySeeder extends Seeder
{
    public function run($userId): void
    {
        if (AssetsCategory::where('created_by', $userId)->exists()) {
            return;
        }
        
        $categories = [
            ['name' => 'Computer Equipment'],
            ['name' => 'Office Furniture'],
            ['name' => 'Vehicles'],
            ['name' => 'Machinery'],
            ['name' => 'Electronics'],
            ['name' => 'Software Licenses'],
            ['name' => 'Network Equipment'],
            ['name' => 'Mobile Devices'],
            ['name' => 'Tools & Equipment'],
            ['name' => 'Building Infrastructure'],
        ];

        foreach ($categories as $category) {
            AssetsCategory::create(array_merge($category, [
                'creator_id' => $userId,
                'created_by' => $userId,
            ]));
        }
    }
}
