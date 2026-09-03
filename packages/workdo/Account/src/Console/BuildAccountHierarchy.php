<?php
// packages/workdo/Account/src/Console/BuildAccountHierarchy.php

namespace Workdo\Account\Console;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Workdo\Account\Models\AccountType;
use Workdo\Account\Models\ChartOfAccount;

/**
 * Restructures a flat chart of accounts into the five standard roots.
 *
 *   php artisan account:build-hierarchy --dry-run
 *   php artisan account:build-hierarchy
 *   php artisan account:build-hierarchy --company=2
 *
 * Creates (or reuses) five group accounts — 1 Assets, 2 Liability, 3 Equity,
 * 4 Revenue, 5 Expenses — and parents every existing top-level account under
 * the one matching the first digit of its code. 1005 Petty Cash goes under
 * 1 Assets, 4000 Sales Revenue under 4 Revenue, and so on.
 *
 * Accounts that already have a parent are left alone, so existing sub-trees
 * are preserved and the command is safe to run more than once.
 */
class BuildAccountHierarchy extends Command
{
    protected $signature = 'account:build-hierarchy
                            {--company= : Only this company user id}
                            {--dry-run  : Show what would change without writing}';

    protected $description = 'Group the chart of accounts under the five standard root accounts';

    /** code => [name, normal balance, account-type name to look for] */
    private const ROOTS = [
        '1' => ['Assets',      'debit',  ['Current Assets', 'Fixed Assets', 'Other Assets']],
        '2' => ['Liability',   'credit', ['Current Liabilities', 'Long Term Liabilities', 'Other Liabilities']],
        '3' => ['Equity',      'credit', ['Equity', 'Owner Equity']],
        '4' => ['Revenue',     'credit', ['Revenue', 'Income', 'Other Income']],
        '5' => ['Expenses',    'debit',  ['Expenses', 'Expense', 'Cost of Goods Sold']],
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $companies = $this->option('company')
            ? User::where('id', $this->option('company'))->get()
            : User::where('type', 'company')->get();

        if ($companies->isEmpty()) {
            $this->error('No company users found.');
            return self::FAILURE;
        }

        if ($dryRun) {
            $this->warn('DRY RUN — nothing will be written.');
            $this->newLine();
        }

        foreach ($companies as $company) {
            $this->line("<options=bold>Company: {$company->email}</>");

            // creatorId() reads the authenticated user, so act as this company.
            auth()->setUser($company);

            $accounts = ChartOfAccount::where('created_by', $company->id)->get();

            if ($accounts->isEmpty()) {
                $this->line('  no accounts, skipped');
                $this->newLine();
                continue;
            }

            $types = AccountType::where('created_by', $company->id)->pluck('id', 'name');
            if ($types->isEmpty()) {
                $this->line('  <fg=red>no account types found — run the Account seeder first</>');
                $this->newLine();
                continue;
            }

            $created = 0;
            $moved = 0;
            $skipped = 0;

            DB::beginTransaction();

            try {
                $rootIds = [];

                foreach (self::ROOTS as $code => [$name, $balance, $typeNames]) {
                    $root = $accounts->firstWhere('account_code', $code);

                    if (!$root) {
                        // Pick the closest matching type, else any type — the
                        // column is NOT NULL so something has to go in it.
                        $typeId = null;
                        foreach ($typeNames as $typeName) {
                            if (isset($types[$typeName])) {
                                $typeId = $types[$typeName];
                                break;
                            }
                        }
                        $typeId = $typeId ?: $types->first();

                        if ($dryRun) {
                            $this->line("  <fg=yellow>would create</> root {$code} - {$name}");
                            $rootIds[$code] = "new-{$code}";
                            $created++;
                            continue;
                        }

                        $root = ChartOfAccount::create([
                            'account_code'      => $code,
                            'account_name'      => $name,
                            'account_type_id'   => $typeId,
                            'normal_balance'    => $balance,
                            'parent_account_id' => null,
                            'is_group'          => true,
                            'level'             => 1,
                            'opening_balance'   => 0,
                            'current_balance'   => 0,
                            'is_active'         => true,
                            'is_system_account' => 1,
                            'description'       => null,
                            'creator_id'        => $company->id,
                            'created_by'        => $company->id,
                        ]);

                        $created++;
                        $this->line("  <fg=green>created</> root {$code} - {$name}");
                    } else {
                        // Make sure an existing root is marked as a group.
                        if (!$dryRun && !$root->is_group) {
                            $root->update(['is_group' => true, 'level' => 1, 'parent_account_id' => null]);
                        }
                        $this->line("  root {$code} - {$name} already exists");
                    }

                    $rootIds[$code] = $root->id ?? $rootIds[$code];
                }

                // Re-parent every top-level account under its matching root.
                foreach ($accounts as $account) {
                    $code = (string) $account->account_code;

                    // The roots themselves.
                    if (isset(self::ROOTS[$code])) {
                        continue;
                    }

                    // Already inside a hierarchy — leave it be.
                    if ($account->parent_account_id) {
                        $skipped++;
                        continue;
                    }

                    $firstDigit = substr(ltrim($code), 0, 1);
                    if (!isset($rootIds[$firstDigit])) {
                        $this->line("  <fg=yellow>skipped</> {$code} - {$account->account_name} (code does not start 1-5)");
                        $skipped++;
                        continue;
                    }

                    if ($dryRun) {
                        $this->line("  would move {$code} - {$account->account_name} under {$firstDigit}");
                        $moved++;
                        continue;
                    }

                    $account->update([
                        'parent_account_id' => $rootIds[$firstDigit],
                        'level'             => 2,
                    ]);
                    $moved++;
                }

                if ($dryRun) {
                    DB::rollBack();
                } else {
                    DB::commit();
                }
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error('  failed: ' . $e->getMessage());
                return self::FAILURE;
            }

            $this->line("  <fg=green>roots created: {$created}</>, moved: {$moved}, left alone: {$skipped}");
            $this->newLine();
        }

        if ($dryRun) {
            $this->info('Dry run complete. Re-run without --dry-run to apply.');
        } else {
            $this->info('Done. Open Chart of Accounts — the five roots should now expand.');
        }

        return self::SUCCESS;
    }
}
