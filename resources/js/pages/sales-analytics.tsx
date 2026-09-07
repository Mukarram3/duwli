// resources/js/pages/sales-analytics.tsx
import { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    AreaChart,
    Area,
    PieChart,
    Pie,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from 'recharts';
import {
    Wallet,
    Package,
    Banknote,
    PieChart as PieIcon,
    Download,
    CalendarDays,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { cn } from '@/lib/utils';

/**
 * SALES ANALYTICS
 * ----------------------------------------------------------------------------
 * Rebuilt from the Kanakku template's Sales Analytics screen. The template is
 * Bootstrap + ApexCharts; this is React + Tailwind + Recharts, matching the
 * layout, panel order, card treatment and chart styling rather than copying
 * markup that cannot run here.
 *
 * Panels, top to bottom:
 *   Sales Performance (bars on a track)  |  Total Sales gauge + Sales Status
 *   Sales Growth (area)
 *   4 KPI cards, the first on a gradient
 *   Top Countries by Sales
 *   Revenue by Hour (donut)
 *   Recent Sales (table)
 *
 * Every figure is a prop with an empty default, so panels render an empty
 * state rather than invented numbers when the backend sends nothing.
 */

type MonthPoint = { month: string; sales: number };
type GrowthPoint = { label: string; value: number };
type CountryRow = { country: string; flag?: string; amount: number };
type HourSlice = { name: string; value: number };
type SaleRow = {
    id: number | string;
    order_id: string;
    client: string;
    avatar?: string;
    product: string;
    amount: number | string;
    payment_method: string;
    status: string;
};

type Props = {
    period?: string;
    salesPerformance?: MonthPoint[];
    totalSales?: { percent: number; count: number };
    salesStatus?: { paid: number; refunded: number; cancelled: number };
    salesGrowth?: { percent: number; comparedTo?: string; series: GrowthPoint[] };
    stats?: {
        revenue?: { value: number | string; delta?: number };
        orders?: { value: number | string; delta?: number };
        profit?: { value: number | string; delta?: number };
        conversion?: { value: number | string; delta?: number };
    };
    topCountries?: CountryRow[];
    revenueByHour?: { peakPercent: number; current: number; pastHour: number; slices?: HourSlice[] };
    recentSales?: SaleRow[];
    viewAllUrl?: string;
};

const PURPLE = 'hsl(var(--primary))';
const PURPLE_SOFT = 'hsl(var(--muted))';
const ORANGE = '#F0561D';

export default function SalesAnalytics({
    period,
    salesPerformance = [],
    totalSales,
    salesStatus,
    salesGrowth,
    stats = {},
    topCountries = [],
    revenueByHour,
    recentSales = [],
    viewAllUrl,
}: Props) {
    const { t } = useTranslation();

    const gauge = useMemo(
        () => [{ name: 'sales', value: totalSales?.percent ?? 0, fill: PURPLE }],
        [totalSales],
    );

    // Revenue by Hour is drawn as many thin segments, as in the template.
    const hourSlices = useMemo(() => {
        if (revenueByHour?.slices?.length) return revenueByHour.slices;
        const filled = Math.round(((revenueByHour?.peakPercent ?? 0) / 100) * 36);
        return Array.from({ length: 36 }, (_, i) => ({
            name: String(i),
            value: 1,
            active: i < filled,
        })) as any[];
    }, [revenueByHour]);

    const statusTotal =
        (salesStatus?.paid ?? 0) + (salesStatus?.refunded ?? 0) + (salesStatus?.cancelled ?? 0);

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Home') }, { label: t('Sales Analytics') }]}
            pageTitle={t('Sales Analytics')}
            pageActions={
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]">
                        <CalendarDays className="h-4 w-4" />
                        {period || t('This period')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]">
                        <Download className="h-4 w-4" />
                        {t('Export')}
                    </Button>
                </div>
            }
        >
            <Head title={t('Sales Analytics')} />

            <div className="space-y-5">
                {/* Row 1 — Sales Performance | Total Sales + Sales Status */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <Panel title={t('Sales Performance')} className="lg:col-span-2">
                        {salesPerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={salesPerformance} barCategoryGap="28%">
                                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                                    <YAxis hide />
                                    <ReTooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={tooltipStyle}
                                        formatter={(v: any) => formatCurrency(v)}
                                    />
                                    {/* The pale track behind each bar, as in the template. */}
                                    <Bar
                                        dataKey={() => Math.max(...salesPerformance.map((p) => p.sales), 1)}
                                        fill={PURPLE_SOFT}
                                        radius={[8, 8, 8, 8]}
                                        isAnimationActive={false}
                                        legendType="none"
                                        tooltipType="none"
                                        stackId="track"
                                    />
                                    <Bar dataKey="sales" radius={[8, 8, 8, 8]} maxBarSize={34}>
                                        {salesPerformance.map((_, i) => (
                                            <Cell key={i} fill={PURPLE} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Empty text={t('No sales recorded for this period.')} />
                        )}
                    </Panel>

                    <div className="space-y-5">
                        <Panel title={t('Total Sales')}>
                            {totalSales ? (
                                <div className="flex items-center justify-between">
                                    <div className="h-[130px] w-[150px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                innerRadius="72%"
                                                outerRadius="100%"
                                                data={gauge}
                                                startAngle={200}
                                                endAngle={-20}
                                            >
                                                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                                <RadialBar
                                                    background={{ fill: PURPLE_SOFT }}
                                                    dataKey="value"
                                                    cornerRadius={10}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="text-end">
                                        <p className="text-2xl font-semibold">{totalSales.percent}%</p>
                                        <p className="text-sm text-muted-foreground">
                                            {totalSales.count.toLocaleString()} {t('Sales')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <Empty text={t('No data.')} height={130} />
                            )}
                        </Panel>

                        <Panel title={t('Sales Status')}>
                            {statusTotal > 0 ? (
                                <>
                                    <div className="mb-4 flex h-3 overflow-hidden rounded-full">
                                        <span
                                            className="bg-amber-400"
                                            style={{ width: `${(salesStatus!.paid / statusTotal) * 100}%` }}
                                        />
                                        <span
                                            className="bg-orange-500"
                                            style={{ width: `${(salesStatus!.refunded / statusTotal) * 100}%` }}
                                        />
                                        <span
                                            className="bg-primary"
                                            style={{ width: `${(salesStatus!.cancelled / statusTotal) * 100}%` }}
                                        />
                                    </div>
                                    <StatusRow color="bg-amber-400" label={t('Paid')} value={salesStatus!.paid} />
                                    <StatusRow color="bg-orange-500" label={t('Refunded')} value={salesStatus!.refunded} />
                                    <StatusRow color="bg-primary" label={t('Cancelled')} value={salesStatus!.cancelled} />
                                </>
                            ) : (
                                <Empty text={t('No data.')} height={120} />
                            )}
                        </Panel>
                    </div>
                </div>

                {/* Row 2 — Sales Growth */}
                <Panel title={t('Sales Growth')}>
                    {salesGrowth?.series?.length ? (
                        <>
                            <p className="text-3xl font-semibold">{salesGrowth.percent}%</p>
                            <p className="mb-3 text-sm">
                                <span className="font-medium text-emerald-600">
                                    {salesGrowth.comparedTo || ''}
                                </span>{' '}
                                <span className="text-muted-foreground">{t('compared with last period')}</span>
                            </p>
                            <ResponsiveContainer width="100%" height={230}>
                                <AreaChart data={salesGrowth.series} margin={{ left: -20, right: 0 }}>
                                    <defs>
                                        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={ORANGE} stopOpacity={0.35} />
                                            <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" hide />
                                    <YAxis hide />
                                    <ReTooltip contentStyle={tooltipStyle} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={ORANGE}
                                        strokeWidth={2}
                                        fill="url(#growthFill)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </>
                    ) : (
                        <Empty text={t('No growth data for this period.')} />
                    )}
                </Panel>

                {/* Row 3 — four KPI cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Kpi
                        gradient
                        icon={Wallet}
                        label={t('Total Revenue')}
                        value={formatCurrency(stats.revenue?.value ?? 0)}
                        delta={stats.revenue?.delta}
                        caption={t('From Last Week')}
                    />
                    <Kpi
                        icon={Package}
                        iconClass="bg-orange-500"
                        label={t('Total Orders')}
                        value={String(stats.orders?.value ?? 0)}
                        delta={stats.orders?.delta}
                        caption={t('From Last Week')}
                    />
                    <Kpi
                        icon={Banknote}
                        iconClass="bg-emerald-500"
                        label={t('Net Profit')}
                        value={formatCurrency(stats.profit?.value ?? 0)}
                        delta={stats.profit?.delta}
                        caption={t('From Last Week')}
                    />
                    <Kpi
                        icon={PieIcon}
                        iconClass="bg-teal-600"
                        label={t('Conversion Rate')}
                        value={String(stats.conversion?.value ?? 0)}
                        delta={stats.conversion?.delta}
                        caption={t('From Last Week')}
                    />
                </div>

                {/* Row 4 — Top Countries */}
                <Panel title={t('Top Countries by Sales')}>
                    {topCountries.length > 0 ? (
                        <div className="space-y-4">
                            {topCountries.map((row) => {
                                const max = Math.max(...topCountries.map((c) => c.amount), 1);
                                return (
                                    <div key={row.country} className="flex items-center gap-3">
                                        <span className="w-40 shrink-0 truncate text-sm font-medium">
                                            {row.flag ? `${row.flag} ` : ''}
                                            {row.country}
                                        </span>
                                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${(row.amount / max) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-24 shrink-0 text-end text-sm font-semibold">
                                            {formatCurrency(row.amount)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <Empty text={t('No country data available.')} height={160} />
                    )}
                </Panel>

                {/* Row 5 — Revenue by Hour */}
                <Panel title={t('Revenue by Hour')}>
                    {revenueByHour ? (
                        <>
                            <div className="relative mx-auto h-[260px] w-full max-w-[380px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={hourSlices}
                                            dataKey="value"
                                            innerRadius="72%"
                                            outerRadius="100%"
                                            paddingAngle={2}
                                            startAngle={90}
                                            endAngle={-270}
                                            isAnimationActive={false}
                                        >
                                            {hourSlices.map((slice: any, i: number) => (
                                                <Cell key={i} fill={slice.active === false ? PURPLE_SOFT : PURPLE} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-semibold">{revenueByHour.peakPercent}%</span>
                                    <span className="text-sm text-muted-foreground">{t('Peak Revenue')}</span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 border-t">
                                <div className="flex items-center justify-center gap-2 py-4">
                                    <span className="font-semibold">{formatCurrency(revenueByHour.current)}</span>
                                    <span className="text-xs text-muted-foreground">{t('Current')}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 border-l py-4">
                                    <span className="font-semibold">{formatCurrency(revenueByHour.pastHour)}</span>
                                    <span className="text-xs text-muted-foreground">{t('Past Hour')}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <Empty text={t('No hourly data.')} />
                    )}
                </Panel>

                {/* Row 6 — Recent Sales */}
                <Card className="overflow-hidden shadow-[0_1px_2px_0_rgb(5_19_33/0.04)]">
                    <div className="flex items-center justify-between px-5 py-4">
                        <h2 className="text-base font-semibold">{t('Recent Sales')}</h2>
                        {viewAllUrl && (
                            <Link href={viewAllUrl}>
                                <Button size="sm" className="h-8 bg-primary text-[13px] hover:bg-primary/90">
                                    {t('View All')}
                                </Button>
                            </Link>
                        )}
                    </div>

                    {recentSales.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-start">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">{t('Order ID')}</th>
                                        <th className="px-5 py-3 font-medium">{t('Client Name')}</th>
                                        <th className="px-5 py-3 font-medium">{t('Product')}</th>
                                        <th className="px-5 py-3 font-medium">{t('Amount')}</th>
                                        <th className="px-5 py-3 font-medium">{t('Payment Method')}</th>
                                        <th className="px-5 py-3 font-medium">{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSales.map((sale) => {
                                        const paid = String(sale.status).toLowerCase() === 'paid';
                                        return (
                                            <tr key={sale.id} className="border-t hover:bg-muted/30">
                                                <td className="px-5 py-3 font-medium">{sale.order_id}</td>
                                                <td className="px-5 py-3">
                                                    <span className="flex items-center gap-2">
                                                        {sale.avatar ? (
                                                            <img
                                                                src={sale.avatar}
                                                                alt=""
                                                                className="h-7 w-7 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                                {sale.client?.charAt(0) || '?'}
                                                            </span>
                                                        )}
                                                        {sale.client}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">{sale.product}</td>
                                                <td className="px-5 py-3">{formatCurrency(sale.amount)}</td>
                                                <td className="px-5 py-3">{sale.payment_method}</td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 text-xs font-medium',
                                                            paid ? 'text-emerald-600' : 'text-sky-600',
                                                        )}
                                                    >
                                                        {t(sale.status)}
                                                        {paid ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Clock className="h-3.5 w-3.5" />
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <Empty text={t('No recent sales.')} height={180} />
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

/* -- small pieces -------------------------------------------------------- */

const tooltipStyle = {
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    fontSize: 12,
};

function Panel({
    title,
    action,
    className,
    children,
}: {
    title: string;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className={cn('p-5 shadow-[0_1px_2px_0_rgb(5_19_33/0.04)]', className)}>
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{title}</h2>
                {action}
            </div>
            {children}
        </Card>
    );
}

function StatusRow({ color, label, value }: { color: string; label: string; value: number }) {
    return (
        <div className="flex items-center justify-between py-1 text-sm">
            <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', color)} />
                {label}
            </span>
            <span className="font-medium">{value}%</span>
        </div>
    );
}

function Kpi({
    icon: Icon,
    iconClass,
    label,
    value,
    delta,
    caption,
    gradient,
}: {
    icon: React.ComponentType<{ className?: string }>;
    iconClass?: string;
    label: string;
    value: string;
    delta?: number;
    caption: string;
    gradient?: boolean;
}) {
    const rising = (delta ?? 0) >= 0;

    return (
        <Card
            className={cn(
                'p-5 shadow-[0_1px_2px_0_rgb(5_19_33/0.04)]',
                gradient && 'border-transparent bg-gradient-to-r from-primary to-primary/75 text-white',
            )}
        >
            <div className="mb-6 flex items-start justify-between">
                <span
                    className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl text-white',
                        gradient ? 'bg-white/20' : iconClass || 'bg-primary',
                    )}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <span className={cn('text-sm', gradient ? 'text-white/90' : 'text-muted-foreground')}>
                    {label}
                </span>
            </div>

            <div className="flex items-end justify-between gap-2">
                <span className="text-2xl font-semibold">{value}</span>
                <span className="text-end">
                    {typeof delta === 'number' && (
                        <span
                            className={cn(
                                'flex items-center justify-end gap-0.5 text-xs font-medium',
                                gradient ? 'text-white' : rising ? 'text-emerald-600' : 'text-red-600',
                            )}
                        >
                            {rising ? (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                                <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {Math.abs(delta)}%
                        </span>
                    )}
                    <span className={cn('block text-xs', gradient ? 'text-white/80' : 'text-muted-foreground')}>
                        {caption}
                    </span>
                </span>
            </div>
        </Card>
    );
}

function Empty({ text, height = 240 }: { text: string; height?: number }) {
    return (
        <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
        >
            {text}
        </div>
    );
}
