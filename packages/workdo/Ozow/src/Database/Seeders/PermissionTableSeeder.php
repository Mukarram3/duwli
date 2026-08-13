<?php

namespace Workdo\Ozow\Database\Seeders;

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
            ['name' => 'manage-ozow-settings', 'module' => 'ozow', 'label' => 'Manage Ozow Settings'],
            ['name' => 'edit-ozow-settings', 'module' => 'ozow', 'label' => 'Edit Ozow Settings'],
        ];

        $superadmin_role = Role::where('name', 'superadmin')->first();
        $company_role = Role::where('name', 'company')->first();

        foreach ($permission as $perm) {
            $permission_obj = Permission::firstOrCreate(
                ['name' => $perm['name'], 'guard_name' => 'web'],
                [
                    'module' => $perm['module'],
                    'label' => $perm['label'],
                    'add_on' => 'Ozow',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            if ($superadmin_role && !$superadmin_role->hasPermissionTo($permission_obj)) {
                $superadmin_role->givePermissionTo($permission_obj);
            }

            if ($company_role && !$company_role->hasPermissionTo($permission_obj)) {
                $company_role->givePermissionTo($permission_obj);
            }
        }
    }
}