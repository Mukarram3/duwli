// resources/js/components/duwli/statement.tsx
import * as React from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/helpers';
import { cn } from '@/lib/utils';

/**
 * DUWLI FINANCIAL STATEMENT
 * ----------------------------------------------------------------------------
 * The vertical statement format used for Profit & Loss, Balance Sheet, Cash
 * Flow and any other report that presents accounts in a running column with
 * subtotals.
 *
 * WHY VERTICAL
 * The reports were built side-by-side: revenue in a left column, expenses in a
 * right column, each with its own total at the foot. That is the T-account
 * layout — correct for a ledger, wrong for a published statement.
 *
 * IFRS presentation, Saudi and UAE practice, and every audited set of accounts
 * a reader will have seen use a SINGLE VERTICAL COLUMN, where each figure is
 * derived from the one above it:
 *
 *      Revenue                          1,240,000
 *        4100 Product sales               980,000
 *        4200 Service income              260,000
 *      ─────────────────────────────────────────
 *      Total Revenue                    1,240,000
 *
 *      Expenses
 *        5100 Salaries                    420,000
 *        5200 Rent                        180,000
 *      ─────────────────────────────────────────
 *      Total Expenses                     600,000
 *      ═════════════════════════════════════════
 *      NET PROFIT                         640,000
 *
 * The vertical form is not just convention. It carries the ARITHMETIC: the
 * reader's eye travels down the same column that the calculation travels, so
 * the net figure is visibly the result of what precedes it. In the two-column
 * layout the net profit relates to neither column and appears from nowhere.
 *
 * It also prints properly. Two columns on A4 forces either a cramped squeeze or
 * landscape; one column flows down the page and across pages naturally.
 *
 * INDENTATION CARRIES MEANING
 * Depth 0 is a section heading, depth 1 a line account, depth 2 a sub-account.
 * A reader uses indentation to know what rolls up into what, so it is a
 * structural property here, not decoration.
 */

type Align = { pageProps: any };

const useMoney = () => {
    const pageProps = usePage().props as any;
    return (value: number | string | null | undefined) =>
        formatCurrency(Number(value ?? 0), pageProps);
};

/* ---------------------------------------------------------------- shell --- */

export function Statement({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('mx-auto w-full max-w-3xl', className)}>
            <table className="doc-table w-full text-sm">
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

/* -------------------------------------------------------------- heading --- */

/** A section heading — "Revenue", "Current Assets". No figure of its own. */
export function StatementSection({
    label,
    /** Optional figure shown on the heading row, e.g. a prior-year comparative. */
    value,
    className,
}: {
    label: string;
    value?: React.ReactNode;
    className?: string;
}) {
    const { t } = useTranslation();

    return (
        <tr className={cn('doc-keep-with-next', className)}>
            <td className="pb-1 pt-5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t(label)}
            </td>
            <td className="pb-1 pt-5 text-end text-[13px] font-semibold text-muted-foreground tabular-nums">
                {value}
            </td>
        </tr>
    );
}

/* ------------------------------------------------------------------ row --- */

/** One account line. */
export function StatementRow({
    /** Account code, e.g. "4100". Rendered muted before the name. */
    code,
    label,
    value,
    /** 1 = account, 2 = sub-account. Indentation carries the hierarchy. */
    depth = 1,
    /** Renders the figure in parentheses, accounting-style. */
    negative = false,
    className,
}: {
    code?: string | null;
    label: string;
    value: number | string | null | undefined;
    depth?: 1 | 2;
    negative?: boolean;
    className?: string;
}) {
    const money = useMoney();
    const amount = money(value);

    return (
        <tr className={cn('border-b border-border/50', className)}>
            <td className={cn('py-1.5', depth === 1 ? 'ps-4' : 'ps-10')}>
                {code && (
                    <span className="me-2 text-xs text-muted-foreground tabular-nums">{code}</span>
                )}
                {label}
            </td>
            <td className="py-1.5 text-end tabular-nums">
                {negative ? `(${amount})` : amount}
            </td>
        </tr>
    );
}

/* ---------------------------------------------------------------- empty --- */

export function StatementEmpty({ label }: { label: string }) {
    const { t } = useTranslation();

    return (
        <tr>
            <td colSpan={2} className="py-3 ps-4 text-sm text-muted-foreground">
                {t(label)}
            </td>
        </tr>
    );
}

/* ---------------------------------------------------------------- total --- */

/**
 * A subtotal — "Total Revenue". Single rule above, per accounting convention:
 * one line means "this is the sum of what is directly above".
 */
export function StatementTotal({
    label,
    value,
    negative = false,
    className,
}: {
    label: string;
    value: number | string | null | undefined;
    negative?: boolean;
    className?: string;
}) {
    const { t } = useTranslation();
    const money = useMoney();
    const amount = money(value);

    return (
        <tr className={cn('doc-no-break', className)}>
            <td className="border-t border-foreground/60 py-2 ps-4 font-semibold">
                {t(label)}
            </td>
            <td className="border-t border-foreground/60 py-2 text-end font-semibold tabular-nums">
                {negative ? `(${amount})` : amount}
            </td>
        </tr>
    );
}

/**
 * The result line — net profit, total assets, the figure the statement exists
 * to produce. Double rule, per accounting convention: two lines mean "final".
 */
export function StatementResult({
    label,
    value,
    /** Colours the figure by sign. Use for profit/loss, not for a balance total. */
    signed = false,
    className,
}: {
    label: string;
    value: number;
    signed?: boolean;
    className?: string;
}) {
    const { t } = useTranslation();
    const money = useMoney();
    const negative = Number(value) < 0;
    const amount = money(Math.abs(Number(value)));

    return (
        <tr className={cn('doc-no-break', className)}>
            <td className="border-y-[3px] border-double border-foreground py-3 ps-4 text-[15px] font-bold">
                {t(label)}
            </td>
            <td
                className={cn(
                    'border-y-[3px] border-double border-foreground py-3 text-end text-[15px] font-bold tabular-nums',
                    signed && negative && 'text-red-600 dark:text-red-400',
                    signed && !negative && 'text-emerald-700 dark:text-emerald-400',
                )}
            >
                {/* A loss prints in parentheses, not with a minus sign — that is
                    how every audited statement shows it, and a minus is easy to
                    miss at the end of a long column. */}
                {negative ? `(${amount})` : amount}
            </td>
        </tr>
    );
}

/** Blank spacer between blocks. Keeps the column reading as one statement. */
export function StatementSpacer() {
    return (
        <tr>
            <td colSpan={2} className="h-4" />
        </tr>
    );
}
