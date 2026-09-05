// resources/js/components/duwli/cells.tsx
import * as React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, formatDateTime, getImagePath } from '@/utils/helpers';
import { cn } from '@/lib/utils';

/**
 * DUWLI TABLE CELLS
 * ----------------------------------------------------------------------------
 * Consistent rendering for the four value types that appear in almost every
 * table in the system: money, dates, entities and document references.
 *
 * Audit finding this replaces: money is currently rendered a dozen different
 * ways across the codebase — some cells call formatCurrency, some do
 * `${symbol}${value.toFixed(2)}`, some print the raw number. Alignment is
 * inconsistent too, so decimal points do not line up down a column and users
 * cannot scan for magnitude. In an accounting system that is not cosmetic; it
 * is the primary way people spot an error.
 *
 * Rules encoded here:
 *   - Money is RIGHT-aligned and tabular-nums, always. Decimals line up.
 *   - Negative money is red and parenthesised, per accounting convention.
 *   - Zero money is muted, so a column of real figures stands out from empties.
 *   - Dates use the company's configured format, never a hardcoded one.
 *   - An empty value renders an em dash, never a blank cell — a blank cell is
 *     indistinguishable from a rendering failure.
 *
 * All of these wrap the EXISTING helpers in @/utils/helpers, so company
 * currency, decimal and date settings continue to apply.
 */

const EMPTY = '—';

/* ---------------------------------------------------------------- money --- */

type MoneyProps = {
    value: number | string | null | undefined;
    /** Colours positive green / negative red. Off by default — most columns
     *  are neither good nor bad, and colouring everything destroys the signal. */
    colored?: boolean;
    /** Renders in accounting style: negatives as (1,234.00). Default true. */
    accounting?: boolean;
    /** Emphasise, e.g. for a totals row. */
    bold?: boolean;
    /** Mutes a zero value. Default true. */
    muteZero?: boolean;
    className?: string;
};

export function MoneyCell({
    value,
    colored = false,
    accounting = true,
    bold = false,
    muteZero = true,
    className,
}: MoneyProps) {
    const pageProps = usePage().props as any;

    if (value === null || value === undefined || value === '') {
        return <span className="block text-end text-muted-foreground">{EMPTY}</span>;
    }

    const num = Number(value) || 0;
    const negative = num < 0;
    const formatted = formatCurrency(Math.abs(num), pageProps);

    return (
        <span
            className={cn(
                'block text-end tabular-nums',
                bold && 'font-semibold',
                num === 0 && muteZero && 'text-muted-foreground',
                colored && num > 0 && 'text-emerald-600 dark:text-emerald-400',
                (colored || accounting) && negative && 'text-red-600 dark:text-red-400',
                className,
            )}
        >
            {negative && accounting ? `(${formatted})` : negative ? `-${formatted}` : formatted}
        </span>
    );
}

/* ----------------------------------------------------------------- date --- */

type DateProps = {
    value: string | Date | null | undefined;
    /** Also show the time. */
    withTime?: boolean;
    /** Colours the date red once it is in the past. For due dates. */
    overdue?: boolean;
    /** Small muted line under the date, e.g. "in 12 days". */
    caption?: string;
    className?: string;
};

export function DateCell({ value, withTime = false, overdue = false, caption, className }: DateProps) {
    const pageProps = usePage().props as any;

    if (!value) return <span className="text-muted-foreground">{EMPTY}</span>;

    const isPast = overdue && new Date(value) < new Date(new Date().toDateString());
    const text = withTime ? formatDateTime(value, pageProps) : formatDate(value, pageProps);

    return (
        <span className={cn('block whitespace-nowrap tabular-nums', className)}>
            <span className={cn(isPast && 'font-medium text-red-600 dark:text-red-400')}>
                {text}
            </span>
            {caption && (
                <span className="block text-xs text-muted-foreground">{caption}</span>
            )}
        </span>
    );
}

/* --------------------------------------------------------------- entity --- */

type EntityProps = {
    /** Display name. */
    name: string | null | undefined;
    /** Second line: email, code, reference. */
    secondary?: string | null;
    /** Avatar or logo path. Passed through getImagePath. */
    image?: string | null;
    /** Makes the name a link to the entity's detail screen. */
    href?: string;
    /** Fallback initials source when there is no image. Defaults to `name`. */
    initialsFrom?: string;
    className?: string;
};

/** Two-line entity cell: avatar + name over a muted secondary line. */
export function EntityCell({
    name,
    secondary,
    image,
    href,
    initialsFrom,
    className,
}: EntityProps) {
    if (!name) return <span className="text-muted-foreground">{EMPTY}</span>;

    const initials = (initialsFrom ?? name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('');

    const nameNode = href ? (
        <Link
            href={href}
            className="truncate font-medium text-foreground transition-colors hover:text-primary hover:underline"
        >
            {name}
        </Link>
    ) : (
        <span className="truncate font-medium text-foreground">{name}</span>
    );

    return (
        <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {image ? (
                    <img
                        src={getImagePath(image)}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                ) : (
                    initials
                )}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
                {nameNode}
                {secondary && (
                    <span className="truncate text-xs text-muted-foreground">{secondary}</span>
                )}
            </span>
        </div>
    );
}

/* ------------------------------------------------------------ reference --- */

type RefProps = {
    /** Document number, e.g. INV-000124. */
    value: string | null | undefined;
    href?: string;
    /** Second line, e.g. the related customer or a PO reference. */
    secondary?: string | null;
    className?: string;
};

/** Document number cell — monospaced so numbers of equal length align. */
export function ReferenceCell({ value, href, secondary, className }: RefProps) {
    if (!value) return <span className="text-muted-foreground">{EMPTY}</span>;

    return (
        <span className={cn('flex flex-col leading-tight', className)}>
            {href ? (
                <Link
                    href={href}
                    className="font-medium tabular-nums text-primary transition-colors hover:underline"
                >
                    {value}
                </Link>
            ) : (
                <span className="font-medium tabular-nums">{value}</span>
            )}
            {secondary && (
                <span className="truncate text-xs text-muted-foreground">{secondary}</span>
            )}
        </span>
    );
}

/* -------------------------------------------------------------- numeric --- */

type NumberProps = {
    value: number | string | null | undefined;
    /** Suffix, e.g. a unit like "kg" or "pcs". */
    unit?: string;
    decimals?: number;
    /** Warn styling below this threshold — used for stock quantities. */
    lowThreshold?: number;
    className?: string;
};

/** Plain quantity cell — right-aligned and tabular, like money, without a symbol. */
export function NumberCell({
    value,
    unit,
    decimals = 0,
    lowThreshold,
    className,
}: NumberProps) {
    if (value === null || value === undefined || value === '') {
        return <span className="block text-end text-muted-foreground">{EMPTY}</span>;
    }

    const num = Number(value) || 0;
    const low = typeof lowThreshold === 'number' && num <= lowThreshold;

    return (
        <span
            className={cn(
                'block text-end tabular-nums',
                low && 'font-medium text-amber-600 dark:text-amber-400',
                className,
            )}
        >
            {num.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
            {unit && <span className="ms-1 text-xs text-muted-foreground">{unit}</span>}
        </span>
    );
}

/* --------------------------------------------------------------- simple --- */

/** Text cell that renders an em dash rather than an empty cell. */
export function TextCell({
    value,
    className,
}: {
    value: React.ReactNode;
    className?: string;
}) {
    const isEmpty =
        value === null || value === undefined || value === '' || value === false;

    return (
        <span className={cn(isEmpty && 'text-muted-foreground', className)}>
            {isEmpty ? EMPTY : value}
        </span>
    );
}

/** Percentage cell with optional up/down colouring. */
export function PercentCell({
    value,
    colored = true,
    decimals = 1,
    className,
}: {
    value: number | string | null | undefined;
    colored?: boolean;
    decimals?: number;
    className?: string;
}) {
    const { t } = useTranslation();

    if (value === null || value === undefined || value === '') {
        return <span className="block text-end text-muted-foreground">{EMPTY}</span>;
    }

    const num = Number(value) || 0;

    return (
        <span
            className={cn(
                'block text-end tabular-nums',
                colored && num > 0 && 'text-emerald-600 dark:text-emerald-400',
                colored && num < 0 && 'text-red-600 dark:text-red-400',
                className,
            )}
            title={t('Percentage')}
        >
            {num.toFixed(decimals)}%
        </span>
    );
}
