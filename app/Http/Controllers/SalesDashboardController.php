<?php

namespace App\Http\Controllers;

use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Workdo\Account\Models\CustomerPayment;
use Workdo\Account\Models\Expense;

/**
 * SALES DASHBOARD
 * =============================================================================
 * The overview screen for the Sales section, modelled on the Kanakku admin
 * dashboard layout.
 *
 * EVERY FIGURE ON THIS SCREEN IS QUERIED FROM REAL DATA. Nothing is seeded,
 * estimated or hard-coded. Where the schema cannot support a panel from the
 * reference design, the panel is either sourced from the nearest real
 * equivalent (and labelled as such) or omitted — see the notes below. A
 * dashboard that shows invented numbers is worse than one that shows fewer.
 *
 * PANELS THAT DIFFER FROM THE REFERENCE DESIGN, AND WHY
 *
 *   "Payment Method" (donut)
 *       The reference splits collections by Credit Card / Bank Transfer /
 *       Digital Wallet / Cash. `customer_payments` has no payment-method
 *       column — it records `bank_account_id`. The donut therefore shows
 *       COLLECTIONS BY BANK ACCOUNT, which is the same question this schema
 *       can actually answer. Add a `payment_method` column to
 *       `customer_payments` and this panel can match the reference exactly.
 *
 *   "Revenue Target" (hero card)
 *       There is no target stored anywhere in the system. The hero shows
 *       revenue for the period with its year-on-year movement instead, and the
 *       progress bar is omitted rather than drawn against a made-up target.
 *       Add a company setting for an annual sales target to restore it.
 *
 *   "Profit Margin" (three gauges)
 *       True margin needs cost of goods sold per line item.
 *       `sales_invoice_items` stores no cost, so margin cannot be computed
 *       without inventing a cost basis. The panel is omitted. It becomes
 *       available once purchase cost is carried onto sale lines.
 *
 * PERIOD
 * All figures respect the `from`/`to` query parameters, defaulting to the
 * current calendar year. The period is echoed back to the view so the header
 * can state what the reader is looking at — a dashboard whose date range is
 * invisible is a dashboard nobody can act on.
 */
class SalesDashboardController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::user()->can('manage-sales-invoices')) {
            return back()->with('error', __('Permission denied'));
        }

        [$from, $to] = $this->period($request);

        return Inertia::render('Sales/Dashboard', [
            'period' => [
                'from'  => $from->toDateString(),
                'to'    => $to->toDateString(),
                'label' => $from->format('d M Y') . ' — ' . $to->format('d M Y'),
            ],
            'headline'         => $this->headline($from, $to),
            'invoiceOverview'  => $this->invoiceOverview($from, $to),
            'revenueExpenses'  => $this->revenueExpenses($from, $to),
            'cashFlow'         => $this->cashFlow($from, $to),
            'topProducts'      => $this->topProducts($from, $to),
            'topCustomers'     => $this->topCustomers($from, $to),
            'collections'      => $this->collectionsByAccount($from, $to),
            'expenseBreakdown' => $this->expenseBreakdown($from, $to),
            'recentInvoices'   => $this->recentInvoices(),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /* Scoping                                                             */
    /* ------------------------------------------------------------------ */

    /**
     * The same ownership rules the invoice list uses. A user restricted to
     * their own invoices must not see company-wide revenue through the
     * dashboard — that would be a permission bypass dressed up as a chart.
     */
    private function invoices()
    {
        return SalesInvoice::query()->where(function ($q) {
            if (Auth::user()->can('manage-any-sales-invoices')) {
                $q->where('created_by', creatorId());
            } elseif (Auth::user()->can('manage-own-sales-invoices')) {
                $q->where('creator_id', Auth::id())->orWhere('customer_id', Auth::id());
            } else {
                $q->whereRaw('1 = 0');
            }
        });
    }

    /** Draft and cancelled invoices are not revenue and never count as sales. */
    private function realInvoices()
    {
        return $this->invoices()->whereNotIn('status', ['draft', 'cancelled']);
    }

    private function period(Request $request): array
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->get('from'))->startOfDay()
            : now()->startOfYear();

        $to = $request->filled('to')
            ? Carbon::parse($request->get('to'))->endOfDay()
            : now()->endOfDay();

        // A reversed range returns nothing and looks like a bug to the user.
        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }

    /* ------------------------------------------------------------------ */
    /* Panels                                                              */
    /* ------------------------------------------------------------------ */

    private function headline(Carbon $from, Carbon $to): array
    {
        $revenue = (float) $this->realInvoices()
            ->whereBetween('invoice_date', [$from, $to])
            ->sum('total_amount');

        // Same span, shifted back one year — the only honest comparison for a
        // period of arbitrary length.
        $priorFrom = $from->copy()->subYear();
        $priorTo   = $to->copy()->subYear();

        $prior = (float) $this->realInvoices()
            ->whereBetween('invoice_date', [$priorFrom, $priorTo])
            ->sum('total_amount');

        $collected = (float) $this->realInvoices()
            ->whereBetween('invoice_date', [$from, $to])
            ->sum('paid_amount');

        return [
            'revenue'      => $revenue,
            'collected'    => $collected,
            'outstanding'  => max($revenue - $collected, 0),
            // Null rather than 0 when there is no prior period: "no comparison
            // available" and "flat versus last year" are different statements.
            'change'       => $prior > 0 ? round((($revenue - $prior) / $prior) * 100, 1) : null,
            'priorLabel'   => $priorFrom->format('Y'),
        ];
    }

    private function invoiceOverview(Carbon $from, Carbon $to): array
    {
        $rows = $this->invoices()
            ->whereBetween('invoice_date', [$from, $to])
            ->selectRaw('status, COUNT(*) as c, SUM(total_amount) as v')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $overdue = $this->invoices()
            ->whereBetween('invoice_date', [$from, $to])
            ->whereNotIn('status', ['draft', 'cancelled', 'paid'])
            ->where('balance_amount', '>', 0)
            ->whereDate('due_date', '<', now())
            ->selectRaw('COUNT(*) as c, SUM(balance_amount) as v')
            ->first();

        $bucket = fn (string $status) => [
            'count' => (int) ($rows[$status]->c ?? 0),
            'value' => (float) ($rows[$status]->v ?? 0),
        ];

        $total = $this->invoices()->whereBetween('invoice_date', [$from, $to])->count();

        return [
            'total'     => $total,
            'value'     => (float) $this->realInvoices()
                                ->whereBetween('invoice_date', [$from, $to])
                                ->sum('total_amount'),
            'paid'      => $bucket('paid'),
            'pending'   => $bucket('posted'),
            'draft'     => $bucket('draft'),
            'cancelled' => $bucket('cancelled'),
            'overdue'   => [
                'count' => (int) ($overdue->c ?? 0),
                'value' => (float) ($overdue->v ?? 0),
            ],
        ];
    }

    /**
     * Month-by-month revenue against expenses across the period.
     *
     * Months with no activity are filled with zeroes rather than skipped — a
     * line chart that jumps from March to July implies continuity that is not
     * there.
     */
    private function revenueExpenses(Carbon $from, Carbon $to): array
    {
        $revenue = $this->realInvoices()
            ->whereBetween('invoice_date', [$from, $to])
            ->selectRaw("DATE_FORMAT(invoice_date, '%Y-%m') as m, SUM(total_amount) as v")
            ->groupBy('m')
            ->pluck('v', 'm');

        $expenses = Expense::query()
            ->where('created_by', creatorId())
            ->whereBetween('expense_date', [$from, $to])
            ->selectRaw("DATE_FORMAT(expense_date, '%Y-%m') as m, SUM(amount) as v")
            ->groupBy('m')
            ->pluck('v', 'm');

        $series = [];
        $cursor = $from->copy()->startOfMonth();

        while ($cursor->lessThanOrEqualTo($to)) {
            $key = $cursor->format('Y-m');
            $series[] = [
                'month'   => $cursor->format('M'),
                'key'     => $key,
                'revenue' => (float) ($revenue[$key] ?? 0),
                'expense' => (float) ($expenses[$key] ?? 0),
            ];
            $cursor->addMonth();
        }

        return $series;
    }

    private function cashFlow(Carbon $from, Carbon $to): array
    {
        $inflow = (float) CustomerPayment::query()
            ->where('created_by', creatorId())
            ->whereBetween('payment_date', [$from, $to])
            ->sum('payment_amount');

        $outflow = (float) Expense::query()
            ->where('created_by', creatorId())
            ->whereBetween('expense_date', [$from, $to])
            ->sum('amount');

        return [
            'inflow'  => $inflow,
            'outflow' => $outflow,
            'net'     => $inflow - $outflow,
        ];
    }

    private function topProducts(Carbon $from, Carbon $to): array
    {
        return SalesInvoiceItem::query()
            ->join('sales_invoices', 'sales_invoices.id', '=', 'sales_invoice_items.invoice_id')
            ->join('product_service_items', 'product_service_items.id', '=', 'sales_invoice_items.product_id')
            ->where('sales_invoices.created_by', creatorId())
            ->whereNotIn('sales_invoices.status', ['draft', 'cancelled'])
            ->whereBetween('sales_invoices.invoice_date', [$from, $to])
            ->selectRaw('product_service_items.name as name, SUM(sales_invoice_items.total_amount) as value, SUM(sales_invoice_items.quantity) as qty')
            ->groupBy('product_service_items.id', 'product_service_items.name')
            ->orderByDesc('value')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name'  => $row->name,
                'value' => (float) $row->value,
                'qty'   => (float) $row->qty,
            ])
            ->all();
    }

    private function topCustomers(Carbon $from, Carbon $to): array
    {
        return $this->realInvoices()
            ->whereBetween('invoice_date', [$from, $to])
            ->with('customer:id,name,email,avatar')
            ->selectRaw('customer_id, COUNT(*) as invoice_count, SUM(total_amount) as total')
            ->groupBy('customer_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id'     => $row->customer_id,
                'name'   => $row->customer->name ?? __('Unknown customer'),
                'email'  => $row->customer->email ?? null,
                'avatar' => $row->customer->avatar ?? null,
                'count'  => (int) $row->invoice_count,
                'total'  => (float) $row->total,
            ])
            ->all();
    }

    /**
     * Collections split by the bank account they landed in.
     *
     * The reference design splits by payment METHOD (card / transfer / wallet /
     * cash). `customer_payments` stores no method — only `bank_account_id` —
     * so this answers the nearest real question rather than inventing a
     * breakdown. See the class docblock.
     */
    private function collectionsByAccount(Carbon $from, Carbon $to): array
    {
        return CustomerPayment::query()
            ->leftJoin('bank_accounts', 'bank_accounts.id', '=', 'customer_payments.bank_account_id')
            ->where('customer_payments.created_by', creatorId())
            ->whereBetween('customer_payments.payment_date', [$from, $to])
            ->selectRaw('COALESCE(bank_accounts.bank_name, ?) as name, SUM(customer_payments.payment_amount) as value, COUNT(*) as c', [__('Unassigned')])
            ->groupBy('bank_accounts.id', 'bank_accounts.bank_name')
            ->orderByDesc('value')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'name'  => $row->name,
                'value' => (float) $row->value,
                'count' => (int) $row->c,
            ])
            ->all();
    }

    private function expenseBreakdown(Carbon $from, Carbon $to): array
    {
        return Expense::query()
            ->leftJoin('expense_categories', 'expense_categories.id', '=', 'expenses.category_id')
            ->where('expenses.created_by', creatorId())
            ->whereBetween('expenses.expense_date', [$from, $to])
            ->selectRaw('COALESCE(expense_categories.category_name, ?) as name, SUM(expenses.amount) as value', [__('Uncategorised')])
            ->groupBy('expense_categories.id', 'expense_categories.category_name')
            ->orderByDesc('value')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'name'  => $row->name,
                'value' => (float) $row->value,
            ])
            ->all();
    }

    /** Latest activity, not period-bound — "recent" means recent. */
    private function recentInvoices(): array
    {
        return $this->invoices()
            ->with('customer:id,name,avatar')
            ->latest('invoice_date')
            ->latest('id')
            ->limit(6)
            ->get()
            ->map(fn (SalesInvoice $invoice) => [
                'id'             => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'customer'       => $invoice->customer->name ?? null,
                'avatar'         => $invoice->customer->avatar ?? null,
                'invoice_date'   => $invoice->invoice_date,
                'due_date'       => $invoice->due_date,
                'total_amount'   => (float) $invoice->total_amount,
                'paid_amount'    => (float) $invoice->paid_amount,
                'status'         => $invoice->display_status,
            ])
            ->all();
    }
}
