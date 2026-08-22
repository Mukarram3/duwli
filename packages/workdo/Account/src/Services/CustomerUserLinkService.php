<?php
// packages/workdo/Account/src/Services/CustomerUserLinkService.php

namespace Workdo\Account\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Workdo\Account\Models\Customer;
use Workdo\Account\Models\Vendor;

/**
 * Bridges the two customer systems in ERPGo.
 *
 * The Account module stores customers in `customers`, but every transactional
 * table — sales_invoices, sales_returns, sales_proposals, credit_notes,
 * customer_payments — has customer_id as a foreign key to `users`, and the
 * pickers on those screens query User::where('type', 'client').
 *
 * The result is that a customer created on the Customers page never appears in
 * the Sales Invoice customer dropdown: the two systems never meet. `customers`
 * already carries a nullable user_id for exactly this purpose, but nothing was
 * populating it.
 *
 * This service creates (or finds) the matching client user and links it, so a
 * customer created once is usable everywhere. It is deliberately additive — no
 * migration, no foreign key change, and existing invoices keep working.
 */
class CustomerUserLinkService
{
    /**
     * Ensure the customer has a linked client user, and return it.
     *
     * If a client user with the same email already exists for this company it
     * is reused rather than duplicated — re-importing a customer list must not
     * create a second login for the same person.
     */
    public function link(Customer $customer): ?User
    {
        // Already linked and the user still exists — nothing to do.
        if ($customer->user_id && User::find($customer->user_id)) {
            return User::find($customer->user_id);
        }

        $email = $customer->contact_person_email;

        // Without an email there is nothing to identify a login by.
        if (empty($email)) {
            return null;
        }

        $existing = User::where('email', $email)->first();

        if ($existing) {
            // Reuse it only if it belongs to this company and is a client.
            if ($existing->type === 'client' && $existing->created_by == creatorId()) {
                $customer->user_id = $existing->id;
                $customer->saveQuietly();
                return $existing;
            }

            // The address belongs to a staff or company account — do not
            // hijack it, and do not create a duplicate.
            return null;
        }

        $user = User::create([
            'name'              => $customer->company_name ?: $customer->contact_person_name,
            'email'             => $email,
            'mobile_no'         => $customer->contact_person_mobile,
            'password'          => Hash::make(Str::random(32)),
            'type'              => 'client',
            'lang'              => company_setting('defaultLanguage') ?? 'en',
            'avatar'            => '',
            // Customers created from the Customers page are records, not
            // logins. Portal access can be enabled later from the user screen.
            'is_enable_login'   => 0,
            'email_verified_at' => now(),
            'creator_id'        => Auth::id(),
            'created_by'        => creatorId(),
        ]);

        $role = Role::where('name', 'client')->where('created_by', creatorId())->first();
        if ($role) {
            $user->assignRole($role);
        }

        $customer->user_id = $user->id;
        $customer->saveQuietly();

        return $user;
    }

    /** Keep the linked user's name, email and mobile in step with the customer. */
    public function sync(Customer $customer): void
    {
        if (!$customer->user_id) {
            $this->link($customer);
            return;
        }

        $user = User::find($customer->user_id);
        if (!$user) {
            $customer->user_id = null;
            $this->link($customer);
            return;
        }

        // Only take the email if it is not already used by someone else.
        $emailTaken = $customer->contact_person_email
            && User::where('email', $customer->contact_person_email)
                ->where('id', '!=', $user->id)
                ->exists();

        $user->name = $customer->company_name ?: $customer->contact_person_name;
        $user->mobile_no = $customer->contact_person_mobile;

        if ($customer->contact_person_email && !$emailTaken) {
            $user->email = $customer->contact_person_email;
        }

        $user->save();
    }

    /**
     * Backfill every customer that has no linked user.
     * Used by the account:link-customers command.
     *
     * @return array{linked:int, skipped:int, reasons:array<string>}
     */
    public function backfill(): array
    {
        $customers = Customer::whereNull('user_id')
            ->where('created_by', creatorId())
            ->get();

        $linked = 0;
        $skipped = 0;
        $reasons = [];

        foreach ($customers as $customer) {
            $user = $this->link($customer);

            if ($user) {
                $linked++;
                continue;
            }

            $skipped++;
            $reasons[] = empty($customer->contact_person_email)
                ? "{$customer->company_name}: no email address"
                : "{$customer->company_name}: {$customer->contact_person_email} is already used by a non-client account";
        }

        return ['linked' => $linked, 'skipped' => $skipped, 'reasons' => $reasons];
    }

    // -----------------------------------------------------------------
    // Vendors — identical split, identical fix
    // -----------------------------------------------------------------

    /**
     * Vendors have exactly the same problem: purchase_invoices.vendor_id and
     * vendor_payments.vendor_id are foreign keys to `users`, and the pickers
     * query User::where('type', 'vendor'), while the Vendors page writes to
     * the `vendors` table.
     */
    public function linkVendor(Vendor $vendor): ?User
    {
        if ($vendor->user_id && User::find($vendor->user_id)) {
            return User::find($vendor->user_id);
        }

        $email = $vendor->contact_person_email;
        if (empty($email)) {
            return null;
        }

        $existing = User::where('email', $email)->first();

        if ($existing) {
            if ($existing->type === 'vendor' && $existing->created_by == creatorId()) {
                $vendor->user_id = $existing->id;
                $vendor->saveQuietly();
                return $existing;
            }
            return null;
        }

        $user = User::create([
            'name'              => $vendor->company_name ?: $vendor->contact_person_name,
            'email'             => $email,
            'mobile_no'         => $vendor->contact_person_mobile,
            'password'          => Hash::make(Str::random(32)),
            'type'              => 'vendor',
            'lang'              => company_setting('defaultLanguage') ?? 'en',
            'avatar'            => '',
            'is_enable_login'   => 0,
            'email_verified_at' => now(),
            'creator_id'        => Auth::id(),
            'created_by'        => creatorId(),
        ]);

        $role = Role::where('name', 'vendor')->where('created_by', creatorId())->first();
        if ($role) {
            $user->assignRole($role);
        }

        $vendor->user_id = $user->id;
        $vendor->saveQuietly();

        return $user;
    }

    public function syncVendor(Vendor $vendor): void
    {
        if (!$vendor->user_id) {
            $this->linkVendor($vendor);
            return;
        }

        $user = User::find($vendor->user_id);
        if (!$user) {
            $vendor->user_id = null;
            $this->linkVendor($vendor);
            return;
        }

        $emailTaken = $vendor->contact_person_email
            && User::where('email', $vendor->contact_person_email)
                ->where('id', '!=', $user->id)
                ->exists();

        $user->name = $vendor->company_name ?: $vendor->contact_person_name;
        $user->mobile_no = $vendor->contact_person_mobile;

        if ($vendor->contact_person_email && !$emailTaken) {
            $user->email = $vendor->contact_person_email;
        }

        $user->save();
    }

    /** @return array{linked:int, skipped:int, reasons:array<string>} */
    public function backfillVendors(): array
    {
        $vendors = Vendor::whereNull('user_id')->where('created_by', creatorId())->get();

        $linked = 0;
        $skipped = 0;
        $reasons = [];

        foreach ($vendors as $vendor) {
            if ($this->linkVendor($vendor)) {
                $linked++;
                continue;
            }
            $skipped++;
            $reasons[] = empty($vendor->contact_person_email)
                ? "{$vendor->company_name}: no email address"
                : "{$vendor->company_name}: {$vendor->contact_person_email} is already used by another account";
        }

        return ['linked' => $linked, 'skipped' => $skipped, 'reasons' => $reasons];
    }
}
