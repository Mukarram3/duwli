// resources/js/pages/Sales/Dashboard.tsx
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
    GradientAreaChart,
    TrackedBarChart,
    RingChart,
} from '@/components/charts/kanakku-charts';
import {
    KpiStrip,
    SectionCard,
    StatusBadge,
    EmptyState,
    MoneyCell,
    DateCell,
    EntityCell,
    ReferenceCell,
} from '@/components/duwli';
import {
    LayoutDashboard, Wallet, TrendingUp, TrendingDown, ArrowRight,
    Plus, UserPlus, Package, FileText, Receipt, CircleDollarSign,
    ArrowDownLeft, ArrowUpRight, Banknote,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { cn } from '@/lib/utils';

/**
 * SALES DASHBOARD
 * ----------------------------------------------------------------------------
 * The overview screen for the Sales section, built on the Kanakku admin
 * dashboard layout and the Duwli design system.
 *
 * EVERY FIGURE COMES FROM SalesDashboardController. Nothing here is seeded or
 * estimated — panels the schema cannot support were dropped rather than filled
 * with plausible numbers (see the controller docblock for which, and why).
 *
 * Two behaviours worth knowing:
 *
 *   - Each panel renders its own empty state when it has no data, rather than
 *     an empty chart frame. A blank axis reads as a broken screen; "no invoices
 *     in this period" reads as an answer.
 *
 *   - Almost every figure links through to the filtered list it came from.
 *     A dashboard number the user cannot open is trivia; the point of the
 *     overdue figure is to get to the overdue invoices.
 */

type Money = number;

interface DashboardProps {
    period: { from: string; to: string; label: string };
    headline: {
        revenue: Money;
        collected: Money;
        outstanding: Money;
        change: number | null;
        priorLabel: string;
    };
    invoiceOverview: {
        total: number;
        value: Money;
        paid: { count: number; value: Money };
        pending: { count: number; value: Money };
        draft: { count: number; value: Money };
        cancelled: { count: number; value: Money };
        overdue: { count: number; value: Money };
    };
    revenueExpenses: Array<{ month: string; key: string; revenue: Money; expense: Money }>;
    cashFlow: { inflow: Money; outflow: Money; net: Money };
    topProducts: Array<{ name: string; value: Money; qty: number }>;
    topCustomers: Array<{ id: number; name: string; email: string | null; avatar: string | null; count: number; total: Money }>;
    collections: Array<{ name: string; value: Money; count: number }>;
    expenseBreakdown: Array<{ name: string; value: Money }>;
    recentInvoices: Array<any>;
    [key: string]: any;
}

const RING_COLORS = [
    'hsl(var(--primary))',
    '#06AED4',
    '#27AE60',
    '#E2B93B',
    '#DD2590',
    '#8CB9FE',
];

export default function Dashboard() {
    const { t } = useTranslation();
    const pageProps = usePage<DashboardProps>().props;
    const {
        period, headline, invoiceOverview, revenueExpenses,
        cashFlow, topProducts, topCustomers, collections,
        expenseBreakdown, recentInvoices, auth,
    } = pageProps;

    const money = (value: any) => formatCurrency(value ?? 0, pageProps);
    const can = (permission: string) => Boolean(auth?.user?.permissions?.includes(permission));

    const applyPeriod = (range: string) => {
        const [from, to] = (range || '').split(' - ');
        router.get(route('sales.dashboard'), from && to ? { from, to } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const invoiceUrl = (params: Record<string, any> = {}) =>
        route('sales-invoices.index', params);

    /** Status split under the invoice overview. Percentages of the period total. */
    const statusRows = [
        { key: 'paid', label: 'Paid', tone: 'text-emerald-600', dot: 'bg-emerald-500', ...invoiceOverview.paid },
        { key: 'posted', label: 'Pending', tone: 'text-amber-600', dot: 'bg-amber-500', ...invoiceOverview.pending },
        { key: 'overdue', label: 'Overdue', tone: 'text-red-600', dot: 'bg-red-500', ...invoiceOverview.overdue },
        { key: 'cancelled', label: 'Cancelled', tone: 'text-slate-500', dot: 'bg-slate-400', ...invoiceOverview.cancelled },
    ];

    const hasRevenueData = revenueExpenses.some((m) => m.revenue > 0 || m.expense > 0);
    const expenseTotal = expenseBreakdown.reduce((sum, e) => sum + e.value, 0);

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Sales'), url: invoiceUrl() }, { label: t('Dashboard') }]}
            pageTitle={t('Sales Dashboard')}
            pageDescription={period.label}
            pageIcon={LayoutDashboard}
            pageActions={
                <>
                    <DateRangePicker
                        value={`${period.from} - ${period.to}`}
                        onChange={applyPeriod}
                        placeholder={t('Select period')}
                    />
                    {can('create-sales-invoices') && (
                        <Button size="sm" asChild className="h-9 px-3.5 text-[13px] font-semibold">
                            <Link href={route('sales-invoices.create')}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('New Invoice')}
                            </Link>
                        </Button>
                    )}
                </>
            }
        >
            <Head title={t('Sales Dashboard')} />

            {/* ------------------------------------------------- headline --- */}
            <KpiStrip
                items={[
                    {
                        label: 'Revenue',
                        value: money(headline.revenue),
                        // change is null when there is no comparable prior
                        // period; showing 0% would claim "flat", which is a
                        // different and false statement.
                        delta: headline.change ?? undefined,
                        caption: headline.change !== null
                            ? `vs ${headline.priorLabel}`
                            : 'No prior period to compare',
                        icon: Wallet,
                        tone: 'gradient',
                    },
                    {
                        label: 'Collected',
                        value: money(headline.collected),
                        caption: 'Received against these invoices',
                        icon: CircleDollarSign,
                        tone: 'success',
                    },
                    {
                        label: 'Outstanding',
                        value: money(headline.outstanding),
                        caption: 'Still owed',
                        icon: Receipt,
                        tone: 'warning',
                        href: invoiceUrl(),
                    },
                    {
                        label: 'Overdue',
                        value: money(invoiceOverview.overdue.value),
                        caption: `${invoiceOverview.overdue.count} ${t('invoices past due')}`,
                        icon: TrendingDown,
                        tone: invoiceOverview.overdue.count > 0 ? 'danger' : 'plain',
                        href: invoiceUrl({ status: 'overdue' }),
                    },
                ]}
            />

            <div className="grid gap-5 lg:grid-cols-3">
                {/* ------------------------------------- invoice overview --- */}
                <SectionCard
                    title="Invoice Overview"
                    description={`${invoiceOverview.total} ${t('invoices in this period')}`}
                    className="lg:col-span-1"
                >
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">{t('Total invoiced')}</p>
                        <p className="text-2xl font-semibold">{money(invoiceOverview.value)}</p>
                    </div>

                    {invoiceOverview.total === 0 ? (
                        <EmptyState
                            variant="empty"
                            icon={FileText}
                            title="No invoices in this period"
                            description="Change the date range, or create an invoice."
                            createPermission="create-sales-invoices"
                            createLabel="New Invoice"
                            createHref={route('sales-invoices.create')}
                        />
                    ) : (
                        <ul className="space-y-3">
                            {statusRows.map((row) => {
                                const pct = invoiceOverview.total > 0
                                    ? Math.round((row.count / invoiceOverview.total) * 100)
                                    : 0;
                                return (
                                    <li key={row.key}>
                                        <Link
                                            href={invoiceUrl({ status: row.key })}
                                            className="flex items-center justify-between gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted/60"
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <span className={cn('h-2 w-2 shrink-0 rounded-full', row.dot)} />
                                                <span className="truncate text-sm">{t(row.label)}</span>
                                            </span>
                                            <span className="flex shrink-0 items-baseline gap-2">
                                                <span className={cn('text-sm font-semibold tabular-nums', row.tone)}>
                                                    {row.count}
                                                </span>
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {pct}%
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </SectionCard>

                {/* ------------------------------- revenue vs expenses --- */}
                <SectionCard
                    title="Revenue & Expenses"
                    description="Monthly comparison across the selected period."
                    className="lg:col-span-2"
                >
                    {!hasRevenueData ? (
                        <EmptyState
                            variant="empty"
                            icon={TrendingUp}
                            title="Nothing to chart yet"
                            description="No invoices or expenses were recorded in this period."
                        />
                    ) : (
                        <>
                            <GradientAreaChart
                                data={revenueExpenses}
                                xKey="month"
                                series={[
                                    { key: 'revenue', label: t('Revenue'), color: 'hsl(var(--primary))' },
                                    { key: 'expense', label: t('Expenses'), color: '#27AE60' },
                                ]}
                                height={280}
                                format={money}
                            />
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">{t('Total Revenue')}</p>
                                    <p className="mt-0.5 text-lg font-semibold">
                                        {money(revenueExpenses.reduce((s, m) => s + m.revenue, 0))}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">{t('Total Expenses')}</p>
                                    <p className="mt-0.5 text-lg font-semibold">
                                        {money(revenueExpenses.reduce((s, m) => s + m.expense, 0))}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </SectionCard>
            </div>

            {/* ------------------------------------------------ cash flow --- */}
            <div className="mt-5">
                <SectionCard
                    title="Cash Flow"
                    description="Payments received against expenses paid in this period."
                >
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                            <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400">
                                <ArrowDownLeft className="h-4 w-4" />
                            </span>
                            <p className="text-xs text-muted-foreground">{t('Inflow')}</p>
                            <p className="text-xl font-semibold">{money(cashFlow.inflow)}</p>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50/60 p-4 dark:border-red-900 dark:bg-red-950/30">
                            <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-400">
                                <ArrowUpRight className="h-4 w-4" />
                            </span>
                            <p className="text-xs text-muted-foreground">{t('Outflow')}</p>
                            <p className="text-xl font-semibold">{money(cashFlow.outflow)}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Banknote className="h-4 w-4" />
                            </span>
                            <p className="text-xs text-muted-foreground">{t('Net')}</p>
                            {/* Negative net is the one figure on this screen
                                that should be coloured — it is a warning. */}
                            <p className={cn(
                                'text-xl font-semibold',
                                cashFlow.net < 0 && 'text-red-600 dark:text-red-400',
                            )}>
                                {money(cashFlow.net)}
                            </p>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {/* -------------------------------------- top products --- */}
                <SectionCard title="Top Products" description="By value invoiced in this period.">
                    {topProducts.length === 0 ? (
                        <EmptyState
                            variant="empty"
                            icon={Package}
                            title="No product sales yet"
                            description="Products sold in this period will be ranked here."
                        />
                    ) : (
                        <TrackedBarChart
                            data={topProducts}
                            xKey="name"
                            yKey="value"
                            height={260}
                            format={money}
                        />
                    )}
                </SectionCard>

                {/* -------------------------------------- collections --- */}
                <SectionCard
                    title="Collections by Account"
                    description="Where payments landed. Add a payment-method column to split by card, transfer and cash."
                >
                    {collections.length === 0 ? (
                        <EmptyState
                            variant="empty"
                            icon={Wallet}
                            title="No payments received"
                            description="Customer payments in this period will appear here."
                        />
                    ) : (
                        <>
                            <RingChart
                                slices={collections.map((c, i) => ({
                                    name: c.name,
                                    value: c.value,
                                    color: RING_COLORS[i % RING_COLORS.length],
                                }))}
                                centerValue={money(collections.reduce((s, c) => s + c.value, 0))}
                                centerLabel={t('Collected')}
                                height={240}
                                format={money}
                            />
                            <ul className="mt-4 space-y-2">
                                {collections.map((row, i) => (
                                    <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span
                                                className="h-2 w-2 shrink-0 rounded-full"
                                                style={{ background: RING_COLORS[i % RING_COLORS.length] }}
                                            />
                                            <span className="truncate">{row.name}</span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {row.count} {t('payments')}
                                            </span>
                                        </span>
                                        <span className="shrink-0 font-medium tabular-nums">{money(row.value)}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </SectionCard>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                {/* ---------------------------------- expense breakdown --- */}
                <SectionCard title="Expense Breakdown" description="By category." className="lg:col-span-1">
                    {expenseBreakdown.length === 0 ? (
                        <EmptyState
                            variant="empty"
                            icon={TrendingDown}
                            title="No expenses recorded"
                            description="Expenses in this period will be broken down here."
                        />
                    ) : (
                        // Rendered locally rather than with SegmentedBar: that
                        // component takes a Tailwind class for its colour and
                        // shows percentages only. On an expense panel the
                        // amount is the point, so both are shown here.
                        <>
                            <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted">
                                {expenseBreakdown.map((row, i) => (
                                    <span
                                        key={row.name}
                                        title={`${row.name} — ${money(row.value)}`}
                                        style={{
                                            width: `${(row.value / (expenseTotal || 1)) * 100}%`,
                                            background: RING_COLORS[i % RING_COLORS.length],
                                        }}
                                    />
                                ))}
                            </div>
                            <ul className="space-y-2">
                                {expenseBreakdown.map((row, i) => (
                                    <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span
                                                className="h-2 w-2 shrink-0 rounded-full"
                                                style={{ background: RING_COLORS[i % RING_COLORS.length] }}
                                            />
                                            <span className="truncate">{row.name}</span>
                                        </span>
                                        <span className="flex shrink-0 items-baseline gap-2">
                                            <span className="font-medium tabular-nums">{money(row.value)}</span>
                                            <span className="w-9 text-end text-xs text-muted-foreground tabular-nums">
                                                {Math.round((row.value / (expenseTotal || 1)) * 100)}%
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </SectionCard>

                {/* ------------------------------------- top customers --- */}
                <SectionCard
                    title="Top Customers"
                    description="By value invoiced in this period."
                    className="lg:col-span-2"
                    action={
                        <Button variant="ghost" size="sm" asChild className="gap-1">
                            <Link href={route('account.customers.index')}>
                                {t('View all')}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    }
                >
                    {topCustomers.length === 0 ? (
                        <EmptyState
                            variant="empty"
                            icon={UserPlus}
                            title="No customer activity"
                            description="Customers invoiced in this period will be ranked here."
                        />
                    ) : (
                        <ul className="divide-y">
                            {topCustomers.map((customer) => (
                                <li key={customer.id} className="flex items-center justify-between gap-4 py-2.5">
                                    <EntityCell
                                        name={customer.name}
                                        secondary={customer.email}
                                        image={customer.avatar}
                                    />
                                    <span className="flex shrink-0 items-center gap-5">
                                        <span className="text-xs text-muted-foreground">
                                            {customer.count} {t('invoices')}
                                        </span>
                                        <span className="min-w-24 text-end font-semibold tabular-nums">
                                            {money(customer.total)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                {/* --------------------------------------- quick actions --- */}
                <SectionCard title="Quick Actions" className="lg:col-span-1">
                    <div className="space-y-2">
                        {[
                            { label: 'Create Invoice', hint: 'Bill a customer', href: route('sales-invoices.create'), icon: FileText, permission: 'create-sales-invoices' },
                            { label: 'Add Customer', hint: 'New customer record', href: route('account.customers.index'), icon: UserPlus, permission: 'create-customers' },
                            { label: 'Record Payment', hint: 'Log a receipt', href: route('account.customer-payments.index'), icon: CircleDollarSign, permission: 'manage-customer-payments' },
                            { label: 'Add Product', hint: 'Extend the catalogue', href: route('product-service.items.index'), icon: Package, permission: 'create-product-service-item' },
                        ]
                            .filter((action) => !action.permission || can(action.permission))
                            .map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-muted/60"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <Icon className="h-[18px] w-[18px]" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{t(action.label)}</span>
                                            <span className="block truncate text-xs text-muted-foreground">{t(action.hint)}</span>
                                        </span>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                );
                            })}
                    </div>
                </SectionCard>

                {/* ------------------------------------ recent invoices --- */}
                <SectionCard
                    title="Recent Invoices"
                    className="lg:col-span-2"
                    flush
                    action={
                        <Button variant="ghost" size="sm" asChild className="gap-1">
                            <Link href={invoiceUrl()}>
                                {t('View all')}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    }
                >
                    {recentInvoices.length === 0 ? (
                        <EmptyState
                            variant="empty"
                            icon={Receipt}
                            title="No invoices yet"
                            description="Create your first invoice to start billing customers."
                            createPermission="create-sales-invoices"
                            createLabel="New Invoice"
                            createHref={route('sales-invoices.create')}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2.5 text-start font-medium">{t('Invoice')}</th>
                                        <th className="px-4 py-2.5 text-start font-medium">{t('Customer')}</th>
                                        <th className="px-4 py-2.5 text-start font-medium">{t('Due')}</th>
                                        <th className="px-4 py-2.5 text-end font-medium">{t('Amount')}</th>
                                        <th className="px-4 py-2.5 text-start font-medium">{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map((invoice: any) => (
                                        <tr key={invoice.id} className="border-t hover:bg-muted/30">
                                            <td className="px-4 py-2.5">
                                                <ReferenceCell
                                                    value={invoice.invoice_number}
                                                    href={route('sales-invoices.show', invoice.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <EntityCell name={invoice.customer} image={invoice.avatar} />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <DateCell
                                                    value={invoice.due_date}
                                                    overdue={invoice.status === 'overdue'}
                                                />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <MoneyCell value={invoice.total_amount} />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <StatusBadge status={invoice.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
