<?php
// packages/workdo/Account/src/Console/CheckJournalSetup.php

namespace Workdo\Account\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;
use App\Models\UserActiveModule;

/**
 * Diagnoses why "Journal Entries" is not appearing in the sidebar.
 *
 *   php artisan account:check-journal
 *   php artisan account:check-journal --fix
 *
 * Checks every gate the menu item has to pass, in order, and reports
 * exactly which one is failing rather than leaving you to guess.
 */
class CheckJournalSetup extends Command
{
    protected $signature = 'account:check-journal {--fix : Create missing permissions and assign them}';

    protected $description = 'Diagnose why the Journal Entries menu is not visible';

    private array $permissions = [
        'manage-journal-entries' => 'Manage Journal Entries',
        'view-journal-entries'   => 'View Journal Entries',
        'create-journal-entries' => 'Create Journal Entries',
        'edit-journal-entries'   => 'Edit Journal Entries',
        'delete-journal-entries' => 'Delete Journal Entries',
        'post-journal-entries'   => 'Post & Reverse Journal Entries',
    ];

    public function handle(): int
    {
        $this->info('Checking Journal Entries setup...');
        $this->newLine();

        $failures = 0;

        // 1. Controller present and autoloaded
        $controller = \Workdo\Account\Http\Controllers\JournalEntryController::class;
        if (class_exists($controller)) {
            $this->line('  <fg=green>PASS</> Controller found');
        } else {
            $this->line('  <fg=red>FAIL</> Controller missing — copy JournalEntryController.php, then run: composer dump-autoload');
            $failures++;
        }

        // 2. Routes registered
        if (Route::has('account.journal-entries.index')) {
            $this->line('  <fg=green>PASS</> Routes registered');
        } else {
            $this->line('  <fg=red>FAIL</> Route account.journal-entries.index not found — check Account/src/Routes/web.php, then: php artisan optimize:clear');
            $failures++;
        }

        // 3. Tables exist
        foreach (['journal_entries', 'journal_entry_items'] as $table) {
            if (Schema::hasTable($table)) {
                $this->line("  <fg=green>PASS</> Table {$table} exists");
            } else {
                $this->line("  <fg=red>FAIL</> Table {$table} missing — run: php artisan migrate");
                $failures++;
            }
        }

        // 4. Permissions exist
        $missing = [];
        foreach (array_keys($this->permissions) as $name) {
            if (!Permission::where('name', $name)->where('guard_name', 'web')->exists()) {
                $missing[] = $name;
            }
        }

        if (empty($missing)) {
            $this->line('  <fg=green>PASS</> All 6 permissions exist');
        } else {
            $this->line('  <fg=red>FAIL</> Missing permissions: ' . implode(', ', $missing));
            $failures++;

            if ($this->option('fix')) {
                foreach ($missing as $name) {
                    Permission::create([
                        'name'       => $name,
                        'guard_name' => 'web',
                        'module'     => 'journal-entries',
                        'label'      => $this->permissions[$name],
                        'add_on'     => 'Account',
                    ]);
                }
                $this->line('       <fg=yellow>FIXED</> Created ' . count($missing) . ' permissions');
            } else {
                $this->line('       Run with --fix, or: php artisan package:seed Account');
            }
        }

        // 5. Company role holds them
        $role = Role::where('name', 'company')->first();
        if (!$role) {
            $this->line('  <fg=yellow>SKIP</> No "company" role found');
        } else {
            $held = $role->permissions->pluck('name')->intersect(array_keys($this->permissions))->count();
            if ($held === count($this->permissions)) {
                $this->line('  <fg=green>PASS</> Company role holds all permissions');
            } else {
                $this->line("  <fg=red>FAIL</> Company role holds only {$held}/6 permissions");
                $failures++;

                if ($this->option('fix')) {
                    foreach (array_keys($this->permissions) as $name) {
                        $p = Permission::where('name', $name)->where('guard_name', 'web')->first();
                        if ($p && !$role->hasPermissionTo($p)) {
                            $role->givePermissionTo($p);
                        }
                    }
                    $this->line('       <fg=yellow>FIXED</> Assigned to company role');
                }
            }
        }

        // 6. Account module active for each company
        $companies = User::where('type', 'company')->get();
        foreach ($companies as $company) {
            $active = UserActiveModule::where('user_id', $company->id)
                ->where('module', 'Account')
                ->exists();
            if ($active) {
                $this->line("  <fg=green>PASS</> Account module active for {$company->email}");
            } else {
                $this->line("  <fg=red>FAIL</> Account module NOT active for {$company->email}");
                $failures++;

                if ($this->option('fix')) {
                    UserActiveModule::create(['user_id' => $company->id, 'module' => 'Account']);
                    $this->line('       <fg=yellow>FIXED</> Activated');
                }
            }
        }

        // 7. Compiled assets contain the menu entry
        $manifest = public_path('build/manifest.json');
        if (!file_exists($manifest)) {
            $this->line('  <fg=red>FAIL</> public/build/manifest.json missing — run: npx vite build');
            $failures++;
        } else {
            $found = false;
            foreach (glob(public_path('build/assets/*.js')) as $file) {
                if (str_contains(file_get_contents($file), 'account.journal-entries.index')) {
                    $found = true;
                    break;
                }
            }
            if ($found) {
                $this->line('  <fg=green>PASS</> Menu entry present in compiled assets');
            } else {
                $this->line('  <fg=red>FAIL</> Compiled assets do NOT contain the menu entry — run: npx vite build');
                $failures++;
            }
        }

        $this->newLine();

        if ($failures === 0) {
            $this->info('All checks passed. Log out and back in, then look under Accounting > Journal Entries.');
            return self::SUCCESS;
        }

        $this->warn("{$failures} check(s) failed. Fix the items marked FAIL above, then re-run this command.");
        if (!$this->option('fix')) {
            $this->line('Tip: re-run with --fix to repair permissions and module activation automatically.');
        }

        return self::FAILURE;
    }
}
