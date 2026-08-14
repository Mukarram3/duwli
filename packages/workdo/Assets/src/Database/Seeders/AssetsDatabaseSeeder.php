<?php

namespace Workdo\Assets\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

class AssetsDatabaseSeeder extends Seeder
{
    public function run()
    {
        Model::unguard();

        $this->call(PermissionTableSeeder::class);
        // $this->call(MarketplaceSettingSeeder::class);

        if(config('app.run_demo_seeder'))
        {
            // Add here your demo data seeders
            $userId = User::where('email', 'company@example.com')->first()->id;
            (new DemoAssetCategorySeeder())->run($userId);
            (new DemoAssetLocationSeeder())->run($userId);
            (new DemoAssetSeeder())->run($userId);
            (new DemoAssetAssignmentSeeder())->run($userId);
            (new DemoAssetDepreciationSeeder())->run($userId);
            (new DemoAssetMaintenanceSeeder())->run($userId);
        }
    }
}
