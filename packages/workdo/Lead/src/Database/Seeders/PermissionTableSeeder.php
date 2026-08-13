<?php

namespace Workdo\Lead\Database\Seeders;

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
            ['name' => 'manage-crm-dashboard', 'module' => 'lead', 'label' => 'Manage CRM Dashboard'],            

            // Pipeline management
            ['name' => 'manage-pipelines', 'module' => 'pipelines', 'label' => 'Manage Pipelines'],
            ['name' => 'manage-any-pipelines', 'module' => 'pipelines', 'label' => 'Manage All Pipelines'],
            ['name' => 'manage-own-pipelines', 'module' => 'pipelines', 'label' => 'Manage Own Pipelines'],
            ['name' => 'create-pipelines', 'module' => 'pipelines', 'label' => 'Create Pipelines'],
            ['name' => 'edit-pipelines', 'module' => 'pipelines', 'label' => 'Edit Pipelines'],
            ['name' => 'delete-pipelines', 'module' => 'pipelines', 'label' => 'Delete Pipelines'],

            // LeadStage management
            ['name' => 'manage-lead-stages', 'module' => 'lead-stages', 'label' => 'Manage LeadStages'],
            ['name' => 'manage-any-lead-stages', 'module' => 'lead-stages', 'label' => 'Manage All LeadStages'],
            ['name' => 'manage-own-lead-stages', 'module' => 'lead-stages', 'label' => 'Manage Own LeadStages'],
            ['name' => 'create-lead-stages', 'module' => 'lead-stages', 'label' => 'Create LeadStages'],
            ['name' => 'edit-lead-stages', 'module' => 'lead-stages', 'label' => 'Edit LeadStages'],
            ['name' => 'delete-lead-stages', 'module' => 'lead-stages', 'label' => 'Delete LeadStages'],

            // DealStage management
            ['name' => 'manage-deal-stages', 'module' => 'deal-stages', 'label' => 'Manage DealStages'],
            ['name' => 'manage-any-deal-stages', 'module' => 'deal-stages', 'label' => 'Manage All DealStages'],
            ['name' => 'manage-own-deal-stages', 'module' => 'deal-stages', 'label' => 'Manage Own DealStages'],
            ['name' => 'create-deal-stages', 'module' => 'deal-stages', 'label' => 'Create DealStages'],
            ['name' => 'edit-deal-stages', 'module' => 'deal-stages', 'label' => 'Edit DealStages'],
            ['name' => 'delete-deal-stages', 'module' => 'deal-stages', 'label' => 'Delete DealStages'],

            // Label management
            ['name' => 'manage-labels', 'module' => 'labels', 'label' => 'Manage Labels'],
            ['name' => 'manage-any-labels', 'module' => 'labels', 'label' => 'Manage All Labels'],
            ['name' => 'manage-own-labels', 'module' => 'labels', 'label' => 'Manage Own Labels'],
            ['name' => 'create-labels', 'module' => 'labels', 'label' => 'Create Labels'],
            ['name' => 'edit-labels', 'module' => 'labels', 'label' => 'Edit Labels'],
            ['name' => 'delete-labels', 'module' => 'labels', 'label' => 'Delete Labels'],

            // Source management
            ['name' => 'manage-sources', 'module' => 'sources', 'label' => 'Manage Sources'],
            ['name' => 'manage-any-sources', 'module' => 'sources', 'label' => 'Manage All Sources'],
            ['name' => 'manage-own-sources', 'module' => 'sources', 'label' => 'Manage Own Sources'],
            ['name' => 'create-sources', 'module' => 'sources', 'label' => 'Create Sources'],
            ['name' => 'edit-sources', 'module' => 'sources', 'label' => 'Edit Sources'],
            ['name' => 'delete-sources', 'module' => 'sources', 'label' => 'Delete Sources'],

            // Lead management
            ['name' => 'manage-leads', 'module' => 'leads', 'label' => 'Manage Leads'],
            ['name' => 'manage-any-leads', 'module' => 'leads', 'label' => 'Manage All Leads'],
            ['name' => 'manage-own-leads', 'module' => 'leads', 'label' => 'Manage Own Leads'],
            ['name' => 'view-leads', 'module' => 'leads', 'label' => 'View Leads'],
            ['name' => 'create-leads', 'module' => 'leads', 'label' => 'Create Leads'],
            ['name' => 'edit-leads', 'module' => 'leads', 'label' => 'Edit Leads'],
            ['name' => 'delete-leads', 'module' => 'leads', 'label' => 'Delete Leads'],
            ['name' => 'lead-move', 'module' => 'leads', 'label' => 'Move Leads'],

            // Lead Task management
            ['name' => 'manage-lead-tasks', 'module' => 'lead-tasks', 'label' => 'Manage Lead Tasks'],
            ['name' => 'manage-any-lead-tasks', 'module' => 'lead-tasks', 'label' => 'Manage All Lead Tasks'],
            ['name' => 'manage-own-lead-tasks', 'module' => 'lead-tasks', 'label' => 'Manage Own Lead Tasks'],
            ['name' => 'create-lead-tasks', 'module' => 'lead-tasks', 'label' => 'Create Lead Tasks'],
            ['name' => 'edit-lead-tasks', 'module' => 'lead-tasks', 'label' => 'Edit Lead Tasks'],
            ['name' => 'delete-lead-tasks', 'module' => 'lead-tasks', 'label' => 'Delete Lead Tasks'],

            // Lead User management
            ['name' => 'manage-lead-users', 'module' => 'lead-users', 'label' => 'Manage Lead Users'],
            ['name' => 'create-lead-users', 'module' => 'lead-users', 'label' => 'Create Lead Users'],
            ['name' => 'delete-lead-users', 'module' => 'lead-users', 'label' => 'Delete Lead Users'],

            // Lead Product management
            ['name' => 'manage-lead-products', 'module' => 'lead-products', 'label' => 'Manage Lead Products'],
            ['name' => 'create-lead-products', 'module' => 'lead-products', 'label' => 'Create Lead Products'],
            ['name' => 'delete-lead-products', 'module' => 'lead-products', 'label' => 'Delete Lead Products'],

            // Lead Sources management
            ['name' => 'manage-lead-sources', 'module' => 'lead-sources', 'label' => 'Manage Lead Sources'],
            ['name' => 'create-lead-sources', 'module' => 'lead-sources', 'label' => 'Create Lead Sources'],
            ['name' => 'delete-lead-sources', 'module' => 'lead-sources', 'label' => 'Delete Lead Sources'],

            // Lead File management
            ['name' => 'manage-lead-files', 'module' => 'lead-files', 'label' => 'Manage Lead Files'],
            ['name' => 'create-lead-files', 'module' => 'lead-files', 'label' => 'Create Lead Files'],
            ['name' => 'view-lead-files', 'module' => 'lead-files', 'label' => 'View Lead Files'],
            ['name' => 'delete-lead-files', 'module' => 'lead-files', 'label' => 'Delete Lead Files'],

            // Lead Calls management
            ['name' => 'manage-lead-calls', 'module' => 'lead-calls', 'label' => 'Manage Lead Calls'],
            ['name' => 'create-lead-calls', 'module' => 'lead-calls', 'label' => 'Create Lead Calls'],
            ['name' => 'edit-lead-calls', 'module' => 'lead-calls', 'label' => 'Edit Lead Calls'],
            ['name' => 'delete-lead-calls', 'module' => 'lead-calls', 'label' => 'Delete Lead Calls'],

            // Lead Activity management
            ['name' => 'manage-lead-activity', 'module' => 'lead-activity', 'label' => 'Manage Lead Activity'],

            // Deal management
            ['name' => 'manage-deals', 'module' => 'deals', 'label' => 'Manage Deals'],
            ['name' => 'manage-any-deals', 'module' => 'deals', 'label' => 'Manage All Deals'],
            ['name' => 'manage-own-deals', 'module' => 'deals', 'label' => 'Manage Own Deals'],
            ['name' => 'view-deals', 'module' => 'deals', 'label' => 'View Deals'],
            ['name' => 'create-deals', 'module' => 'deals', 'label' => 'Create Deals'],
            ['name' => 'edit-deals', 'module' => 'deals', 'label' => 'Edit Deals'],
            ['name' => 'delete-deals', 'module' => 'deals', 'label' => 'Delete Deals'],
            ['name' => 'deal-move', 'module' => 'deals', 'label' => 'Move Deals'],

            // Deal Task management
            ['name' => 'manage-deal-tasks', 'module' => 'deal-tasks', 'label' => 'Manage Deal Tasks'],
            ['name' => 'manage-any-deal-tasks', 'module' => 'deal-tasks', 'label' => 'Manage All Deal Tasks'],
            ['name' => 'manage-own-deal-tasks', 'module' => 'deal-tasks', 'label' => 'Manage Own Deal Tasks'],
            ['name' => 'create-deal-tasks', 'module' => 'deal-tasks', 'label' => 'Create Deal Tasks'],
            ['name' => 'edit-deal-tasks', 'module' => 'deal-tasks', 'label' => 'Edit Deal Tasks'],
            ['name' => 'delete-deal-tasks', 'module' => 'deal-tasks', 'label' => 'Delete Deal Tasks'],

            // Report management
            ['name' => 'manage-reports', 'module' => 'reports', 'label' => 'Manage Reports'],
            ['name' => 'view-reports', 'module' => 'reports', 'label' => 'View Reports'],

            // Deal User management
            ['name' => 'manage-deal-users', 'module' => 'deal-users', 'label' => 'Manage Deal Users'],
            ['name' => 'create-deal-users', 'module' => 'deal-users', 'label' => 'Create Deal Users'],
            ['name' => 'delete-deal-users', 'module' => 'deal-users', 'label' => 'Delete Deal Users'],

            // Deal Product management
            ['name' => 'manage-deal-products', 'module' => 'deal-products', 'label' => 'Manage Deal Products'],
            ['name' => 'create-deal-products', 'module' => 'deal-products', 'label' => 'Create Deal Products'],
            ['name' => 'delete-deal-products', 'module' => 'deal-products', 'label' => 'Delete Deal Products'],

            // Deal Sources management
            ['name' => 'manage-deal-sources', 'module' => 'deal-sources', 'label' => 'Manage Deal Sources'],
            ['name' => 'create-deal-sources', 'module' => 'deal-sources', 'label' => 'Create Deal Sources'],
            ['name' => 'delete-deal-sources', 'module' => 'deal-sources', 'label' => 'Delete Deal Sources'],

            // Deal File management
            ['name' => 'manage-deal-files', 'module' => 'deal-files', 'label' => 'Manage Deal Files'],
            ['name' => 'create-deal-files', 'module' => 'deal-files', 'label' => 'Create Deal Files'],
            ['name' => 'view-deal-files', 'module' => 'deal-files', 'label' => 'View Deal Files'],
            ['name' => 'delete-deal-files', 'module' => 'deal-files', 'label' => 'Delete Deal Files'],

            // Deal Calls management
            ['name' => 'manage-deal-calls', 'module' => 'deal-calls', 'label' => 'Manage Deal Calls'],
            ['name' => 'create-deal-calls', 'module' => 'deal-calls', 'label' => 'Create Deal Calls'],
            ['name' => 'edit-deal-calls', 'module' => 'deal-calls', 'label' => 'Edit Deal Calls'],
            ['name' => 'delete-deal-calls', 'module' => 'deal-calls', 'label' => 'Delete Deal Calls'],

            // Deal Client management
            ['name' => 'manage-deal-clients', 'module' => 'deal-clients', 'label' => 'Manage Deal Clients'],
            ['name' => 'create-deal-clients', 'module' => 'deal-clients', 'label' => 'Create Deal Clients'],
            ['name' => 'delete-deal-clients', 'module' => 'deal-clients', 'label' => 'Delete Deal Clients'],

            // Deal Activity management
            ['name' => 'manage-deal-activity', 'module' => 'deal-activity', 'label' => 'Manage Deal Activity'],

        ];

        $company_role = Role::where('name', 'company')->first();

        foreach ($permission as $perm) {
            $permission_obj = Permission::firstOrCreate(
                ['name' => $perm['name'], 'guard_name' => 'web'],
                [
                    'module' => $perm['module'],
                    'label' => $perm['label'],
                    'add_on' => 'Lead',
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