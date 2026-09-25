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

/*
 * CARD SURFACE — white with a hairline border, on every card.
 *
 * The first card used to be a filled gradient "hero". It is gone: with one
 * card filled and three plain, the strip reads as though the first figure is
 * more important, when in fact they are four peers. The reference treats them
 * identically and distinguishes them by ICON COLOUR instead, which carries the
 * same signal without the visual shouting.
 */
const surface: Record<KpiTone, string> = {
    gradient: 'bg-card text-card-foreground',
    plain:    'bg-card text-card-foreground',
    success:  'bg-card text-card-foreground',
    warning:  'bg-card text-card-foreground',
    danger:   'bg-card text-card-foreground',
    info:     'bg-card text-card-foreground',
};

/**
 * SOLID circular badge, white glyph — the reference's treatment.
 *
 * A tinted-background badge disappears at a glance; a solid one is the thing
 * that lets you find "overdue" on a strip of four without reading any labels.
 */
const iconSurface: Record<KpiTone, string> = {
    gradient: 'bg-violet-600 text-white',
    plain:    'bg-violet-600 text-white',
    success:  'bg-emerald-500 text-white',
    warning:  'bg-amber-500 text-white',
    danger:   'bg-red-500 text-white',
    info:     'bg-sky-500 text-white',
};

/** The soft corner swoosh, tinted to match the badge. */
const swoosh: Record<KpiTone, string> = {
    gradient: 'text-violet-500/10',
    plain:    'text-violet-500/10',
    success:  'text-emerald-500/10',
    warning:  'text-amber-500/10',
    danger:   'text-red-500/10',
    info:     'text-sky-500/10',
};

const gridCols: Record<NonNullable<Props['columns']>, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 xl:grid-cols-4',
};

function KpiCard({ item }: { item: Kpi }) {
    const { t } = useTranslation();
    const tone = item.tone ?? 'plain';
    const Icon = item.icon;
    const rising = (item.delta ?? 0) >= 0;

    const body = (
        <div
            className={cn(
                'relative h-full overflow-hidden rounded-xl border p-5',
                'shadow-[0_1px_3px_0_rgb(5_19_33/0.06)] transition-shadow',
                item.href && 'hover:shadow-md',
                surface[tone],
            )}
        >
            {/*
              Decorative corner swoosh. aria-hidden and pointer-events-none —
              it is texture, and a screen reader announcing it would be noise.
              Positioned with logical inset-inline-end so it moves to the left
              corner under RTL without a second rule.
            */}
            <svg
                aria-hidden
                viewBox="0 0 120 90"
                className={cn(
                    'pointer-events-none absolute bottom-0 h-[70px] w-[100px] fill-current',
                    'end-0 rtl:scale-x-[-1]',
                    swoosh[tone],
                )}
            >
                <path d="M120 90H0C40 90 60 60 70 35 78 14 96 0 120 0z" />
                <path d="M120 90H30C64 90 80 62 90 38 98 18 104 8 120 4z" opacity="0.6" />
            </svg>

            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-muted-foreground">{t(item.label)}</p>

                    {/*
                      ltr-text on the value: a currency glyph beside an Arabic
                      interface gets reordered by the bidi algorithm and lands
                      on the wrong side of the number — "875.00ريال". Isolating
                      the value keeps the amount readable in both languages.
                    */}
                    <p className="ltr-text mt-1 truncate text-[24px] font-bold leading-tight tabular-nums">
                        {item.value}
                    </p>
                </div>

                {Icon && (
                    <span
                        className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                            'shadow-sm',
                            iconSurface[tone],
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                )}
            </div>

            {(typeof item.delta === 'number' || item.caption) && (
                <>
                    {/* Hairline above the trend line, as in the reference —
                        it separates the figure from its commentary. */}
                    <div className="relative mt-4 border-t pt-2.5" />
                    <div className="relative -mt-2.5 flex items-center gap-1.5 pt-2.5 text-[12px]">
                        {typeof item.delta === 'number' && (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-0.5 font-semibold',
                                    rising
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-red-600 dark:text-red-400',
                                )}
                            >
                                {rising ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                                {Math.abs(item.delta)}%
                            </span>
                        )}
                        {item.caption && (
                            <span className="truncate text-muted-foreground">{t(item.caption)}</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    if (!item.href) return body;

    return (
        <Link
            href={item.href}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
