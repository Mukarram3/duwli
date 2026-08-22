<?php
// packages/workdo/Account/src/Console/LinkCustomers.php

namespace Workdo\Account\Console;

use Illuminate\Console\Command;
use App\Models\User;
use Workdo\Account\Models\Customer;
use Workdo\Account\Models\Vendor;
use Workdo\Account\Services\CustomerUserLinkService;

/**
 * Backfills the link between Account customers and client users.
 *
 *   php artisan account:link-customers            (all companies)
 *   php artisan account:link-customers --company=2
 *
 * Customers created before this fix have user_id = null and therefore never
 * appear in the Sales Invoice / Proposal / Return customer pickers, which read
 * users where type = client. This links them.
 */
class LinkCustomers extends Command
{
    protected $signature = 'account:link-customers {--company= : Only this company user id}';

    protected $description = 'Link existing customers and vendors to users so they appear in invoice pickers';

    public function handle(CustomerUserLinkService $linker): int
    {
        $companies = $this->option('company')
            ? User::where('id', $this->option('company'))->get()
            : User::where('type', 'company')->get();

        if ($companies->isEmpty()) {
            $this->error('No company users found.');
            return self::FAILURE;
        }

        $totalLinked = 0;
        $totalSkipped = 0;

        foreach ($companies as $company) {
            $unlinkedCustomers = Customer::whereNull('user_id')->where('created_by', $company->id)->count();
            $unlinkedVendors = Vendor::whereNull('user_id')->where('created_by', $company->id)->count();

            $this->line("Company {$company->email}: {$unlinkedCustomers} customer(s), {$unlinkedVendors} vendor(s) unlinked");

            if ($unlinkedCustomers === 0 && $unlinkedVendors === 0) {
                continue;
            }

            // creatorId() reads the authenticated user, so act as this company.
            auth()->setUser($company);

            foreach (['customers' => fn() => $linker->backfill(),
                         'vendors'   => fn() => $linker->backfillVendors()] as $label => $run) {
                $result = $run();
                $totalLinked += $result['linked'];
                $totalSkipped += $result['skipped'];

                $this->line("  {$label}: <fg=green>linked</> {$result['linked']}"
                    . ($result['skipped'] ? ", <fg=yellow>skipped</> {$result['skipped']}" : ''));

                foreach (array_slice($result['reasons'], 0, 10) as $reason) {
                    $this->line("    - {$reason}");
                }
                if (count($result['reasons']) > 10) {
                    $this->line('    ... and ' . (count($result['reasons']) - 10) . ' more');
                }
            }
        }

        $this->newLine();
        $this->info("Done. Linked {$totalLinked}, skipped {$totalSkipped}.");

        if ($totalSkipped > 0) {
            $this->warn('Skipped customers usually have no email address. Add one and re-run, or they will not appear in invoice pickers.');
        }

        return self::SUCCESS;
    }
}
