// resources/js/components/duwli/kpi-strip.tsx
import * as React from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * DUWLI KPI STRIP
 * ----------------------------------------------------------------------------
 * The band of summary figures that sits between the page header and the table.
 *
 * Audit finding this replaces: only 2 of 191 list screens show any summary
 * figures at all. A user opening Invoices sees 20 rows and no idea what they
 * are owed in total. Kanakku puts a four-card strip above every list, and that
 * single habit is most of why it reads as an ERP rather than a table viewer.
 *
 * Design notes:
 *   - Four cards on desktop, two on tablet, one on mobile. Never three across:
 *     an odd count leaves a ragged gap on the second row.
 *   - The FIRST card may take the `gradient` tone — Kanakku's hero card. Use it
 *     for the figure the page is actually about (total receivable on Invoices,
 *     cash position on Bank Accounts). One hero per strip, never more.
 *   - A delta is only shown when a comparison period genuinely exists. A "0%"
 *     badge on a page with no prior period is noise pretending to be insight.
 *   - `href` makes a card a drill-through into the filtered list. This is the
 *     behaviour the brief asks for under "drill-down functionality".
 *   - `loading` renders skeletons at the same dimensions, so the strip does not
 *     reflow when deferred props arrive.
 */

export type KpiTone = 'gradient' | 'plain' | 'success' | 'warning' | 'danger' | 'info';

export type Kpi = {
    /** Short label. Untranslated; translated here. */
    label: string;
    /** Pre-formatted display value. Format money with formatCurrency() first. */
    value: React.ReactNode;
    /** Percentage change vs the comparison period. Omit when there is none. */
    delta?: number;
    /** Small line under the value, e.g. "vs last month" or "12 documents". */
    caption?: string;
    icon?: React.ComponentType<{ className?: string }>;
    tone?: KpiTone;
    /** Makes the card a drill-through link into the filtered list. */
    href?: string;
    /** Hides the card entirely — use for permission-gated figures. */
    hidden?: boolean;
};

type Props = {
    items: Kpi[];
    /** Cards per row on large screens. 2, 3 or 4. Default 4. */
    columns?: 2 | 3 | 4;
    loading?: boolean;
    className?: string;
};

const surface: Record<KpiTone, string> = {
    gradient:
        'border-transparent bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
    plain: 'bg-card text-card-foreground',
    success: 'bg-card text-card-foreground',
    warning: 'bg-card text-card-foreground',
    danger: 'bg-card text-card-foreground',
    info: 'bg-card text-card-foreground',
};

const iconSurface: Record<KpiTone, string> = {
    gradient: 'bg-white/15 text-white',
    plain: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
};

const gridCols: Record<NonNullable<Props['columns']>, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 xl:grid-cols-4',
};

function KpiCard({ item }: { item: Kpi }) {
    const { t } = useTranslation();
    const tone = item.tone ?? 'plain';
    const onGradient = tone === 'gradient';
    const Icon = item.icon;
    const rising = (item.delta ?? 0) >= 0;

    const body = (
        <div
            className={cn(
                'h-full rounded-lg border p-4 shadow-[0_1px_2px_0_rgb(5_19_33/0.04)]',
                'transition-shadow',
                item.href && 'hover:shadow-md',
                surface[tone],
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'truncate text-[13px]',
                            onGradient ? 'text-white/80' : 'text-muted-foreground',
                        )}
                    >
                        {t(item.label)}
                    </p>
                    <p className="mt-1 truncate text-[22px] font-semibold leading-tight">
                        {item.value}
                    </p>

                    {(typeof item.delta === 'number' || item.caption) && (
                        <div className="mt-2 flex items-center gap-1.5">
                            {typeof item.delta === 'number' && (
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium',
                                        onGradient
                                            ? 'bg-white/15 text-white'
                                            : rising
                                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                              : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
                                    )}
                                >
                                    {rising ? (
                                        <ArrowUp className="h-3 w-3" />
                                    ) : (
                                        <ArrowDown className="h-3 w-3" />
                                    )}
                                    {Math.abs(item.delta)}%
                                </span>
                            )}
                            {item.caption && (
                                <span
                                    className={cn(
                                        'truncate text-[11px]',
                                        onGradient ? 'text-white/70' : 'text-muted-foreground',
                                    )}
                                >
                                    {t(item.caption)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {Icon && (
                    <span
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                            iconSurface[tone],
                        )}
                    >
                        <Icon className="h-[18px] w-[18px]" />
                    </span>
                )}
            </div>
        </div>
    );

    if (!item.href) return body;

    return (
        <Link
            href={item.href}
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            {body}
        </Link>
    );
}

export function KpiStrip({ items, columns = 4, loading = false, className }: Props) {
    const visible = items.filter((item) => !item.hidden);

    if (loading) {
        return (
            <div className={cn('mb-5 grid grid-cols-1 gap-4', gridCols[columns], className)}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-2 h-7 w-32" />
                        <Skeleton className="mt-3 h-4 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (visible.length === 0) return null;

    return (
        <div className={cn('mb-5 grid grid-cols-1 gap-4', gridCols[columns], className)}>
            {visible.map((item) => (
                <KpiCard key={item.label} item={item} />
            ))}
        </div>
    );
}
