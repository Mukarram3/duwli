// resources/js/pages/dashboard-erp.tsx
import { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/stat-card';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    Wallet,
    TrendingDown,
    Landmark,
    FileWarning,
    ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';

/**
 * ERP DASHBOARD — Kanakku layout
 * ----------------------------------------------------------------------------
 * Mirrors the template's dashboard structure:
 *
 *   row 1  four KPI cards, the first on a primary gradient
 *   row 2  Revenue & Expenses (area)  +  Invoice Overview (donut)
 *   row 3  Weekly Sales (bar)         +  Recent Transactions (table)
 *
 * Every figure comes in as a prop. Nothing is computed here and nothing is
 * hard-coded, so wiring this to the real controller is a matter of passing the
 * same shapes — the component does not need to change.
 *
 * The empty defaults are deliberate: a dashboard that invents numbers when the
 * backend sends none is worse than one that shows zero.
 */

type Series = { name: string; revenue: number; expenses: number };
type WeeklyPoint = { day: string; sales: number };
type InvoiceSlice = { name: string; value: number; color: string };
type Txn = {
    id: number | string;
    reference: string;
    party: string;
    date: string;
    amount: number | string;
    status: string;
    href?: string;
};

type Props = {
    stats?: {
        revenue?: { value: number | string; delta?: number };
        expenses?: { value: number | string; delta?: number };
        cash?: { value: number | string; delta?: number };
        receivables?: { value: number | string; delta?: number };
        payables?: { value: number | string; delta?: number };
    };
    revenueExpenses?: Series[];
    weeklySales?: WeeklyPoint[];
    invoiceOverview?: { paid: number; unpaid: number; overdue: number; draft: number };
    recentTransactions?: Txn[];
};

const statusTone: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    posted: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    partial: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    unpaid: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    overdue: 'bg-red-100 text-red-800 hover:bg-red-100',
    draft: 'bg-slate-200 text-slate-700 hover:bg-slate-200',
};

export default function DashboardErp({
    stats = {},
    revenueExpenses = [],
    weeklySales = [],
    invoiceOverview,
    recentTransactions = [],
}: Props) {
    const { t } = useTranslation();

    const donut: InvoiceSlice[] = useMemo(() => {
        if (!invoiceOverview) return [];
        return [
            { name: t('Paid'), value: invoiceOverview.paid, color: '#27AE60' },
            { name: t('Unpaid'), value: invoiceOverview.unpaid, color: '#E2B93B' },
            { name: t('Overdue'), value: invoiceOverview.overdue, color: '#EF1E1E' },
            { name: t('Draft'), value: invoiceOverview.draft, color: '#AAB0B6' },
        ].filter((slice) => slice.value > 0);
    }, [invoiceOverview, t]);

    const hasSeries = revenueExpenses.length > 0;
    const hasWeekly = weeklySales.length > 0;

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Dashboard') }]}
            pageTitle={t('Dashboard')}
            pageDescription={t('Your financial position at a glance.')}
        >
            <Head title={t('Dashboard')} />

            <div className="space-y-5">
                {/* Row 1 — KPI cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        tone="gradient"
                        label={t('Total Revenue')}
                        value={formatCurrency(stats.revenue?.value ?? 0)}
                        delta={stats.revenue?.delta}
                        caption={t('this year')}
                        icon={Wallet}
                    />
                    <StatCard
                        label={t('Total Expenses')}
                        value={formatCurrency(stats.expenses?.value ?? 0)}
                        delta={stats.expenses?.delta}
                        caption={t('this year')}
                        icon={TrendingDown}
                        tone="warning"
                    />
                    <StatCard
                        label={t('Cash & Bank')}
                        value={formatCurrency(stats.cash?.value ?? 0)}
                        delta={stats.cash?.delta}
                        caption={t('across all accounts')}
                        icon={Landmark}
                        tone="success"
                    />
                    <StatCard
                        label={t('Receivables')}
                        value={formatCurrency(stats.receivables?.value ?? 0)}
                        delta={stats.receivables?.delta}
                        caption={t('outstanding')}
                        icon={FileWarning}
                        tone="danger"
                    />
                </div>

                {/* Row 2 — Revenue & Expenses + Invoice Overview */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="border-b py-4">
                            <CardTitle className="text-base">
                                {t('Revenue & Expenses')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {hasSeries ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={revenueExpenses}>
                                        <defs>
                                            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E2B93B" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#E2B93B" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={70} />
                                        <ReTooltip
                                            contentStyle={{
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid hsl(var(--border))',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            name={t('Revenue')}
                                            stroke="hsl(var(--primary))"
                                            fill="url(#gRev)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expenses"
                                            name={t('Expenses')}
                                            stroke="#E2B93B"
                                            fill="url(#gExp)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyPanel text={t('No revenue or expense data for this period.')} />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b py-4">
                            <CardTitle className="text-base">{t('Invoice Overview')}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {donut.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={donut}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={2}
                                        >
                                            {donut.map((slice) => (
                                                <Cell key={slice.name} fill={slice.color} />
                                            ))}
                                        </Pie>
                                        <ReTooltip
                                            contentStyle={{
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid hsl(var(--border))',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyPanel text={t('No invoices yet.')} />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Row 3 — Weekly Sales + Recent Transactions */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="border-b py-4">
                            <CardTitle className="text-base">{t('Weekly Sales')}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {hasWeekly ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={weeklySales}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} />
                                        <ReTooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            contentStyle={{
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid hsl(var(--border))',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar
                                            dataKey="sales"
                                            name={t('Sales')}
                                            fill="hsl(var(--primary))"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={28}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyPanel text={t('No sales recorded this week.')} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                            <CardTitle className="text-base">
                                {t('Recent Transactions')}
                            </CardTitle>
                            <Link
                                href={(() => {
                                    try {
                                        return (window as any).route('sales-invoices.index');
                                    } catch {
                                        return '#';
                                    }
                                })()}
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                                {t('View all')}
                                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentTransactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-left">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">{t('Reference')}</th>
                                                <th className="px-4 py-3 font-medium">{t('Name')}</th>
                                                <th className="px-4 py-3 font-medium">{t('Date')}</th>
                                                <th className="px-4 py-3 text-right font-medium">{t('Amount')}</th>
                                                <th className="px-4 py-3 font-medium">{t('Status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map((txn) => (
                                                <tr key={txn.id} className="border-t hover:bg-muted/30">
                                                    <td className="px-4 py-3 font-mono text-xs">
                                                        {txn.href ? (
                                                            <Link href={txn.href} className="text-primary hover:underline">
                                                                {txn.reference}
                                                            </Link>
                                                        ) : (
                                                            txn.reference
                                                        )}
                                                    </td>
                                                    <td className="max-w-[180px] truncate px-4 py-3">{txn.party}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{txn.date}</td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {formatCurrency(txn.amount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant="secondary"
                                                            className={statusTone[String(txn.status).toLowerCase()] || ''}
                                                        >
                                                            {t(txn.status)}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyPanel text={t('No transactions yet.')} className="py-16" />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function EmptyPanel({ text, className }: { text: string; className?: string }) {
    return (
        <div className={`flex h-[260px] items-center justify-center text-sm text-muted-foreground ${className || ''}`}>
            {text}
        </div>
    );
}
