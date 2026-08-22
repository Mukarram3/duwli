<?php
// packages/workdo/Account/src/Console/CheckAccountingSetup.php

namespace Workdo\Account\Console;

use App\Models\User;
use App\Models\UserActiveModule;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Workdo\Account\Models\Customer;
use Workdo\Account\Models\Vendor;
use Workdo\Account\Models\JournalEntry;

/**
 * End-to-end accounting health check.
 *
 *   php artisan account:check
 *
 * Answers, with evidence rather than guesswork, why transactions are not
 * reaching the trial balance / income statement, why suppliers and customers
 * do not appear in pickers, and whether logo uploads can work.
 */
class CheckAccountingSetup extends Command
{
    protected $signature = 'account:check {--company= : Only this company user id}';

    protected $description = 'Diagnose accounting linkage: journals, pickers, reports, uploads';

    public function handle(): int
    {
        $problems = 0;

        $this->info('ACCOUNTING HEALTH CHECK');
        $this->newLine();

        // ---- 1. Storage symlink (logo uploads) --------------------------
        $this->line('<options=bold>1. File uploads (logo)</>');
        $link = public_path('storage');

        if (!file_exists($link)) {
            $this->line('   <fg=red>FAIL</> public/storage does not exist — run: php artisan storage:link');
            $problems++;
        } elseif (!is_link($link) && !is_dir($link)) {
            $this->line('   <fg=red>FAIL</> public/storage is a plain file, not a symlink — delete it and run: php artisan storage:link');
            $problems++;
        } else {
            $this->line('   <fg=green>PASS</> public/storage resolves');
        }

        $uploadDir = storage_path('app/public');
        if (!is_dir($uploadDir) || !is_writable($uploadDir)) {
            $this->line('   <fg=red>FAIL</> storage/app/public is missing or not writable — chmod -R 775 storage');
            $problems++;
        } else {
            $this->line('   <fg=green>PASS</> storage/app/public is writable');
        }

        $this->line('   php.ini upload_max_filesize = ' . ini_get('upload_max_filesize')
            . ', post_max_size = ' . ini_get('post_max_size'));

        // ---- 2. Ledger tables -------------------------------------------
        $this->newLine();
        $this->line('<options=bold>2. Ledger tables</>');
        foreach (['journal_entries', 'journal_entry_items', 'chart_of_accounts', 'account_types'] as $table) {
            if (Schema::hasTable($table)) {
                $this->line("   <fg=green>PASS</> {$table}");
            } else {
                $this->line("   <fg=red>FAIL</> {$table} missing — run: php artisan migrate");
                $problems++;
            }
        }

        // ---- 3. Per company ---------------------------------------------
        $companies = $this->option('company')
            ? User::where('id', $this->option('company'))->get()
            : User::where('type', 'company')->get();

        foreach ($companies as $company) {
            $this->newLine();
            $this->line("<options=bold>Company: {$company->email}</>");

            // Module activation — the journal listeners are gated on this.
            $accountActive = UserActiveModule::where('user_id', $company->id)
                ->where('module', 'Account')->exists();

            if ($accountActive) {
                $this->line('   <fg=green>PASS</> Account module active');
            } else {
                $this->line('   <fg=red>FAIL</> Account module NOT active — every journal listener is skipped, so NOTHING reaches the reports');
                $problems++;
            }

            // Chart of accounts must exist before journals can post.
            $coaCount = DB::table('chart_of_accounts')->where('created_by', $company->id)->count();
            if ($coaCount > 0) {
                $this->line("   <fg=green>PASS</> {$coaCount} chart of accounts row(s)");
            } else {
                $this->line('   <fg=red>FAIL</> No chart of accounts — journals cannot post without accounts to post to');
                $problems++;
            }

            // Customer / vendor linkage.
            $unlinkedCustomers = Customer::whereNull('user_id')->where('created_by', $company->id)->count();
            $unlinkedVendors = Vendor::whereNull('user_id')->where('created_by', $company->id)->count();

            if ($unlinkedCustomers === 0) {
                $this->line('   <fg=green>PASS</> All customers linked to users');
            } else {
                $this->line("   <fg=red>FAIL</> {$unlinkedCustomers} customer(s) not linked — they will NOT appear in the Sales Invoice picker. Run: php artisan account:link-customers");
                $problems++;
            }

            if ($unlinkedVendors === 0) {
                $this->line('   <fg=green>PASS</> All vendors linked to users');
            } else {
                $this->line("   <fg=red>FAIL</> {$unlinkedVendors} vendor(s) not linked — they will NOT appear in the Purchase Invoice picker. Run: php artisan account:link-customers");
                $problems++;
            }

            // Draft vs posted — the usual reason reports look empty.
            $draftSales = DB::table('sales_invoices')->where('created_by', $company->id)->where('status', 'draft')->count();
            $postedSales = DB::table('sales_invoices')->where('created_by', $company->id)->where('status', 'posted')->count();
            $journals = JournalEntry::where('created_by', $company->id)->count();
            $postedJournals = JournalEntry::where('created_by', $company->id)->where('status', 'posted')->count();

            $this->line("   Sales invoices: {$draftSales} draft, {$postedSales} posted");
            $this->line("   Journal entries: {$journals} total, {$postedJournals} posted");

            if ($draftSales > 0 && $postedSales === 0) {
                $this->line('   <fg=yellow>NOTE</> All sales invoices are DRAFT. A draft posts nothing to the ledger — open each invoice and click Post.');
            }

            if ($postedSales > 0 && $journals === 0) {
                $this->line('   <fg=red>FAIL</> Invoices are posted but no journal entries exist — the event listeners are not firing. Run: php artisan optimize:clear');
                $problems++;
            }

            if ($postedJournals === 0 && $journals > 0) {
                $this->line('   <fg=yellow>NOTE</> Journal entries exist but none are posted. Reports only include POSTED entries.');
            }
        }

        // ---- Summary -----------------------------------------------------
        $this->newLine();
        if ($problems === 0) {
            $this->info('No structural problems found.');
            $this->line('If reports are still empty, confirm invoices have been POSTED (not left as draft)');
            $this->line('and that the report date range covers the transaction dates.');
            return self::SUCCESS;
        }

        $this->warn("{$problems} problem(s) found — see FAIL lines above.");
        return self::FAILURE;
    }
}
