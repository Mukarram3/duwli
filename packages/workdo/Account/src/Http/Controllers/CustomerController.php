<?php

namespace Workdo\Account\Http\Controllers;

use App\Models\User;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Account\Models\Customer;
use Workdo\Account\Http\Requests\StoreCustomerRequest;
use Workdo\Account\Http\Requests\UpdateCustomerRequest;
use Workdo\Account\Events\CreateCustomer;
use Workdo\Account\Events\UpdateCustomer;
use Workdo\Account\Events\DestroyCustomer;
use Workdo\Account\Services\CustomerImportExportService;
use Illuminate\Http\Request;
use App\Models\SalesInvoice;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-customers')){
            $customers = Customer::query()
                ->with('user:id,name,avatar,is_disable')
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-customers')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-customers')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('company_name'), fn($q) => $q->where('company_name', 'like', '%' . request('company_name') . '%'))
                ->when(request('customer_code'), fn($q) => $q->where('customer_code', 'like', '%' . request('customer_code') . '%'))
                ->when(request('tax_number'), fn($q) => $q->where('tax_number', 'like', '%' . request('tax_number') . '%'))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            /*
             * Attach each customer's receivable position to the rows on this
             * page. Computed with ONE grouped query over the page's customer
             * ids rather than a subquery per row — with a per-row subquery a
             * 100-row page would fire 200 extra queries.
             */
            $balances = $this->balancesFor($customers->getCollection()->pluck('user_id')->filter()->all());

            $customers->getCollection()->transform(function ($customer) use ($balances) {
                $row = $balances[$customer->user_id] ?? null;

                $customer->balance      = (float) ($row->balance ?? 0);
                $customer->overdue      = (float) ($row->overdue ?? 0);
                $customer->open_count   = (int) ($row->open_count ?? 0);

                /*
                 * A customer's status is derived, not stored. The order matters:
                 * overdue outranks owing, because money past due is the thing
                 * the user needs to act on.
                 */
                $customer->account_status = $customer->overdue > 0
                    ? 'overdue'
                    : ($customer->balance > 0 ? 'due' : 'paid');

                return $customer;
            });

            $users = User::where('type', 'client')
                ->where('created_by', creatorId())
                ->whereNotIn('id', Customer::pluck('user_id')->filter())
                ->select('id', 'name', 'email', 'mobile_no')
                ->get();

            return Inertia::render('Account/Customers/Index', [
                'customers' => $customers,
                'users' => $users,
                'stats' => $this->indexStats(),
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }

    /**
     * Outstanding balance and overdue amount per customer, for the given
     * customer user ids.
     *
     * Draft and cancelled invoices are excluded: neither is money anyone owes.
     * "Overdue" is computed from due_date rather than read from the invoice
     * status, because an invoice only becomes overdue by the passage of time
     * and nothing rewrites its stored status when the date passes.
     *
     * @param  array<int>  $customerIds
     */
    private function balancesFor(array $customerIds)
    {
        if (empty($customerIds)) {
            return collect();
        }

        return SalesInvoice::query()
            ->where('created_by', creatorId())
            ->whereIn('customer_id', $customerIds)
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->where('balance_amount', '>', 0)
            ->selectRaw('customer_id')
            ->selectRaw('SUM(balance_amount) as balance')
            ->selectRaw('SUM(CASE WHEN due_date < CURDATE() THEN balance_amount ELSE 0 END) as overdue')
            ->selectRaw('COUNT(*) as open_count')
            ->groupBy('customer_id')
            ->get()
            ->keyBy('customer_id');
    }

    /**
     * Summary figures for the KPI strip above the customer list.
     *
     * Deliberately NOT filtered by the request's search/filter parameters: the
     * strip describes the customer book as a whole, so the totals stay stable
     * while the user filters the table beneath them. A KPI that moves every
     * time a filter changes cannot be used as a reference point.
     *
     * Scoped by the same ownership rules as the list itself, so a user who may
     * only see their own customers does not see company-wide receivables.
     */
    private function indexStats(): array
    {
        $scope = function ($query, string $column = 'created_by') {
            if (Auth::user()->can('manage-any-customers')) {
                return $query->where($column, creatorId());
            }
            if (Auth::user()->can('manage-own-customers')) {
                return $query->where('creator_id', Auth::id());
            }
            return $query->whereRaw('1 = 0');
        };

        $customerIds = $scope(Customer::query())->pluck('user_id')->filter();

        $invoices = SalesInvoice::query()
            ->where('created_by', creatorId())
            ->whereIn('customer_id', $customerIds);

        $receivable = (clone $invoices)
            ->whereNotIn('status', ['paid', 'cancelled', 'draft'])
            ->sum(DB::raw('COALESCE(total_amount, 0) - COALESCE(paid_amount, 0)'));

        $overdueQuery = (clone $invoices)
            ->whereNotIn('status', ['paid', 'cancelled', 'draft'])
            ->whereDate('due_date', '<', now());

        return [
            'total'       => $scope(Customer::query())->count(),
            'receivable'  => (float) $receivable,
            'overdue'     => (float) (clone $overdueQuery)
                                ->sum(DB::raw('COALESCE(total_amount, 0) - COALESCE(paid_amount, 0)')),
            'overdueCount'=> (clone $overdueQuery)->count(),
            'newThisMonth'=> $scope(Customer::query())
                                ->whereYear('created_at', now()->year)
                                ->whereMonth('created_at', now()->month)
                                ->count(),
        ];
    }

    public function store(StoreCustomerRequest $request)
    {
        if(Auth::user()->can('create-customers')){
            $validated = $request->validated();

            $customer = new Customer();
            $customer->user_id = $validated['user_id'] ?? null;
            $customer->company_name = $validated['company_name'];
            $customer->contact_person_name = $validated['contact_person_name'];
            $customer->contact_person_email = $validated['contact_person_email'] ?? null;
            $customer->contact_person_mobile = $validated['contact_person_mobile'] ?? null;
            $customer->tax_number = $validated['tax_number'] ?? null;
            $customer->payment_terms = $validated['payment_terms'] ?? null;
            $customer->billing_address = $validated['billing_address'];
            $customer->shipping_address = $validated['same_as_billing'] ? $validated['billing_address'] : $validated['shipping_address'];
            $customer->same_as_billing = $validated['same_as_billing'] ?? false;
            $customer->notes = $validated['notes'] ?? null;
            $customer->creator_id = Auth::id();
            $customer->created_by = creatorId();
            $customer->save();

            CreateCustomer::dispatch($request, $customer);

            return redirect()->route('account.customers.index')->with('success', __('The customer has been created successfully.'));
        }
        return redirect()->route('account.customers.index')->with('error', __('Permission denied'));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        if(Auth::user()->can('edit-customers')){
            $validated = $request->validated();

            $customer->company_name = $validated['company_name'];
            $customer->contact_person_name = $validated['contact_person_name'];
            $customer->contact_person_email = $validated['contact_person_email'] ?? null;
            $customer->contact_person_mobile = $validated['contact_person_mobile'] ?? null;
            $customer->tax_number = $validated['tax_number'] ?? null;
            $customer->payment_terms = $validated['payment_terms'] ?? null;
            $customer->billing_address = $validated['billing_address'];
            $customer->shipping_address = $validated['same_as_billing'] ? $validated['billing_address'] : $validated['shipping_address'];
            $customer->same_as_billing = $validated['same_as_billing'] ?? false;
            $customer->notes = $validated['notes'] ?? null;
            $customer->save();

            UpdateCustomer::dispatch($request, $customer);

            return back()->with('success', __('The customer details are updated successfully.'));
        }
        return back()->with('error', __('Permission denied'));
    }

    public function destroy(Customer $customer)
    {
        if(Auth::user()->can('delete-customers')){
            DestroyCustomer::dispatch($customer);
            $customer->delete();
            return back()->with('success', __('The customer has been deleted.'));
        }
        return back()->with('error', __('Permission denied'));
    }

    // -----------------------------------------------------------------
    // Excel import / export
    // -----------------------------------------------------------------

    /** Download every visible customer as .xlsx. */
    public function export(CustomerImportExportService $service)
    {
        if (!Auth::user()->can('manage-customers')) {
            return back()->with('error', __('Permission denied'));
        }

        try {
            $path = $service->export();
        } catch (\Exception $e) {
            return back()->with('error', __('Export failed: ') . $e->getMessage());
        }

        return response()->download($path, 'customers-' . now()->format('Y-m-d') . '.xlsx')
            ->deleteFileAfterSend(true);
    }

    /** Download a blank sheet with the expected headers. */
    public function importTemplate(CustomerImportExportService $service)
    {
        if (!Auth::user()->can('create-customers')) {
            return back()->with('error', __('Permission denied'));
        }

        $path = $service->template();

        return response()->download($path, 'customers-template.xlsx')
            ->deleteFileAfterSend(true);
    }

    /** Import customers from an uploaded sheet. */
    public function import(Request $request, CustomerImportExportService $service)
    {
        if (!Auth::user()->can('create-customers')) {
            return back()->with('error', __('Permission denied'));
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ], [
            'file.mimes' => __('Please upload an .xlsx, .xls or .csv file.'),
            'file.max'   => __('The file may not be larger than 5 MB.'),
        ]);

        try {
            $result = $service->import($request->file('file')->getRealPath());
        } catch (\Exception $e) {
            return back()->with('error', __('Import failed: ') . $e->getMessage());
        }

        if (!empty($result['errors'])) {
            // Nothing was written — show the first errors so the user can fix
            // the file, but cap the list so the banner stays readable.
            return back()
                ->with('error', __('Import cancelled — :count problem(s) found. No customers were added.', [
                    'count' => count($result['errors']),
                ]))
                ->with('importErrors', array_slice($result['errors'], 0, 20));
        }

        return back()->with('success', __(':count customer(s) imported.', [
            'count' => $result['imported'],
        ]));
    }
}
