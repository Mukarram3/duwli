<?php

namespace Workdo\Assets\Database\Seeders;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Artisan;

class PermissionTableSeeder extends Seeder
{
    public function run()
    {
        Model::unguard();
        Artisan::call('cache:clear');

        $permission = [
            ['name' => 'manage-asset', 'module' => 'asset', 'label' => 'Manage Assets menu'],
            ['name' => 'manage-assets', 'module' => 'assets', 'label' => 'Manage Assets'],
            ['name' => 'manage-any-assets', 'module' => 'assets', 'label' => 'Manage All Assets'],
            ['name' => 'manage-own-assets', 'module' => 'assets', 'label' => 'Manage Own Assets'],
            ['name' => 'create-assets', 'module' => 'assets', 'label' => 'Create Assets'],
            ['name' => 'view-assets', 'module' => 'assets', 'label' => 'View Assets'],
            ['name' => 'edit-assets', 'module' => 'assets', 'label' => 'Edit Assets'],
            ['name' => 'delete-assets', 'module' => 'assets', 'label' => 'Delete Assets'],

            ['name' => 'manage-asset-categories', 'module' => 'categories', 'label' => 'Manage Categories'],
            ['name' => 'manage-any-asset-categories', 'module' => 'categories', 'label' => 'Manage All Categories'],
            ['name' => 'manage-own-asset-categories', 'module' => 'categories', 'label' => 'Manage Own Categories'],
            ['name' => 'create-asset-categories', 'module' => 'categories', 'label' => 'Create Categories'],
            ['name' => 'edit-asset-categories', 'module' => 'categories', 'label' => 'Edit Categories'],
            ['name' => 'delete-asset-categories', 'module' => 'categories', 'label' => 'Delete Categories'],

            ['name' => 'manage-asset-assignments', 'module' => 'asset-assignments', 'label' => 'Manage Asset Assignments'],
            ['name' => 'manage-any-asset-assignments', 'module' => 'asset-assignments', 'label' => 'Manage All Asset Assignments'],
            ['name' => 'manage-own-asset-assignments', 'module' => 'asset-assignments', 'label' => 'Manage Own Asset Assignments'],
            ['name' => 'create-asset-assignments', 'module' => 'asset-assignments', 'label' => 'Create Asset Assignments'],
            ['name' => 'view-asset-assignments', 'module' => 'asset-assignments', 'label' => 'View Asset Assignments'],
            ['name' => 'edit-asset-assignments', 'module' => 'asset-assignments', 'label' => 'Edit Asset Assignments'],
            ['name' => 'delete-asset-assignments', 'module' => 'asset-assignments', 'label' => 'Delete Asset Assignments'],
            ['name' => 'return-assets', 'module' => 'asset-assignments', 'label' => 'Return Assets'],

            ['name' => 'manage-asset-locations', 'module' => 'asset-locations', 'label' => 'Manage Locations'],
            ['name' => 'manage-any-asset-locations', 'module' => 'asset-locations', 'label' => 'Manage All Locations'],
            ['name' => 'manage-own-asset-locations', 'module' => 'asset-locations', 'label' => 'Manage Own Locations'],
            ['name' => 'create-asset-locations', 'module' => 'asset-locations', 'label' => 'Create Locations'],
            ['name' => 'view-asset-locations', 'module' => 'asset-locations', 'label' => 'View Locations'],
            ['name' => 'edit-asset-locations', 'module' => 'asset-locations', 'label' => 'Edit Locations'],
            ['name' => 'delete-asset-locations', 'module' => 'asset-locations', 'label' => 'Delete Locations'],

            // Asset Maintenance
            ['name' => 'manage-asset-maintenance', 'module' => 'asset-maintenance', 'label' => 'Manage Maintenance'],
            ['name' => 'manage-any-asset-maintenance', 'module' => 'asset-maintenance', 'label' => 'Manage All Maintenance'],
            ['name' => 'manage-own-asset-maintenance', 'module' => 'asset-maintenance', 'label' => 'Manage Own Maintenance'],
            ['name' => 'create-asset-maintenance', 'module' => 'asset-maintenance', 'label' => 'Create Maintenance'],
            ['name' => 'view-asset-maintenance', 'module' => 'asset-maintenance', 'label' => 'View Maintenance'],
            ['name' => 'edit-asset-maintenance', 'module' => 'asset-maintenance', 'label' => 'Edit Maintenance'],
            ['name' => 'delete-asset-maintenance', 'module' => 'asset-maintenance', 'label' => 'Delete Maintenance'],

            ['name' => 'manage-asset-depreciation', 'module' => 'asset-depreciation', 'label' => 'Manage Depreciation'],
            ['name' => 'manage-any-asset-depreciation', 'module' => 'asset-depreciation', 'label' => 'Manage All Depreciation'],
            ['name' => 'manage-own-asset-depreciation', 'module' => 'asset-depreciation', 'label' => 'Manage Own Depreciation'],
            ['name' => 'create-asset-depreciation', 'module' => 'asset-depreciation', 'label' => 'Create Depreciation'],
            ['name' => 'edit-asset-depreciation', 'module' => 'asset-depreciation', 'label' => 'Edit Depreciation'],
            ['name' => 'delete-asset-depreciation', 'module' => 'asset-depreciation', 'label' => 'Delete Depreciation'],
        ];

        $company_role = Role::where('name', 'company')->first();

        foreach ($permission as $perm) {
            $permission_obj = Permission::firstOrCreate(
                ['name' => $perm['name'], 'guard_name' => 'web'],
                [
                    'module' => $perm['module'],
                    'label' => $perm['label'],
                    'add_on' => 'Assets',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            if ($company_role && !$company_role->hasPermissionTo($permission_obj)) {
                $company_role->givePermissionTo($permission_obj);
            }
        }
    }
}
