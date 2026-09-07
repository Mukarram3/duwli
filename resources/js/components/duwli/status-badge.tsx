// resources/js/components/duwli/status-badge.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * DUWLI STATUS BADGE
 * ----------------------------------------------------------------------------
 * ONE canonical map from a document status to its colour and label, for the
 * whole system.
 *
 * The problem this solves: today each screen decides its own status colours
 * inline. "Paid" is emerald on one screen, green-600 on another and a plain
 * Badge variant="default" on a third. Users learn colour before they read
 * words, so inconsistent status colour is the single loudest signal that a
 * system was assembled rather than designed.
 *
 * Rules encoded here:
 *   - green   = settled, finished, good        (paid, approved, posted, active)
 *   - amber   = in progress, needs attention   (pending, partial, draft-sent)
 *   - red     = failed, overdue, rejected      (overdue, cancelled, rejected)
 *   - blue    = informational, in flight       (sent, processing, submitted)
 *   - slate   = inert, not started             (draft, inactive, archived)
 *
 * Tones use the Kanakku "transparent" surface style already in the tokens:
 * a very light tinted background with a saturated text colour and a hairline
 * ring, rather than a solid filled pill. Solid pills at table density fight
 * with the data; tinted pills read as metadata, which is what a status is.
 *
 * USAGE
 *   <StatusBadge status={invoice.status} />                  // auto-mapped
 *   <StatusBadge status="paid" label="Fully paid" />         // custom label
 *   <StatusBadge status="custom" tone="info" label="On hold" />
 */

export type StatusTone =
    | 'success'
    | 'warning'
    | 'orange'
    | 'danger'
    | 'critical'
    | 'info'
    | 'neutral'
    | 'purple';

const toneClasses: Record<StatusTone, string> = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-400/20',
    // Sits between warning and danger. Debt ageing needs five distinguishable
    // bands, and amber-to-red alone cannot carry five steps.
    orange: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-400/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-400/20',
    // The only SOLID badge in the system. Tinted pills read as metadata, which
    // is right for a status — but the top of an escalation scale should not
    // read as metadata. Reserved for the worst band of a graded scale; do not
    // use it for ordinary bad states like "cancelled".
    critical: 'bg-red-600 text-white ring-red-700/40 dark:bg-red-700 dark:text-white dark:ring-red-500/40',
    info: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-400/20',
    neutral: 'bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-400/20',
    purple: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-400/20',
};

const dotClasses: Record<StatusTone, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    orange: 'bg-orange-500',
    danger: 'bg-red-500',
    critical: 'bg-white',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    purple: 'bg-violet-500',
};

/**
 * The canonical status vocabulary.
 *
 * Keys are normalised (lowercase, non-alphanumerics collapsed to underscore),
 * so 'Partially Paid', 'partially-paid' and 'PARTIALLY_PAID' all resolve to the
 * same entry. Numeric statuses used by the older tables are mapped too.
 */
const STATUS_MAP: Record<string, { tone: StatusTone; label: string }> = {
    // --- lifecycle: documents ---
    draft: { tone: 'neutral', label: 'Draft' },
    open: { tone: 'info', label: 'Open' },
    sent: { tone: 'info', label: 'Sent' },
    viewed: { tone: 'info', label: 'Viewed' },
    submitted: { tone: 'info', label: 'Submitted' },
    processing: { tone: 'info', label: 'Processing' },
    in_progress: { tone: 'info', label: 'In Progress' },

    // --- lifecycle: settled ---
    paid: { tone: 'success', label: 'Paid' },
    fully_paid: { tone: 'success', label: 'Fully Paid' },
    partially_paid: { tone: 'warning', label: 'Partially Paid' },
    partial: { tone: 'warning', label: 'Partial' },
    unpaid: { tone: 'danger', label: 'Unpaid' },
    overdue: { tone: 'danger', label: 'Overdue' },
    due: { tone: 'warning', label: 'Due' },
    refunded: { tone: 'purple', label: 'Refunded' },
    credited: { tone: 'purple', label: 'Credited' },

    // --- lifecycle: approval ---
    pending: { tone: 'warning', label: 'Pending' },
    awaiting_approval: { tone: 'warning', label: 'Awaiting Approval' },
    approved: { tone: 'success', label: 'Approved' },
    rejected: { tone: 'danger', label: 'Rejected' },
    declined: { tone: 'danger', label: 'Declined' },

    // --- lifecycle: accounting ---
    posted: { tone: 'success', label: 'Posted' },
    unposted: { tone: 'neutral', label: 'Unposted' },
    reversed: { tone: 'purple', label: 'Reversed' },
    reconciled: { tone: 'success', label: 'Reconciled' },
    unreconciled: { tone: 'warning', label: 'Unreconciled' },
    finalized: { tone: 'success', label: 'Finalized' },
    closed: { tone: 'neutral', label: 'Closed' },

    // --- lifecycle: fulfilment ---
    ordered: { tone: 'info', label: 'Ordered' },
    delivered: { tone: 'success', label: 'Delivered' },
    shipped: { tone: 'info', label: 'Shipped' },
    received: { tone: 'success', label: 'Received' },
    returned: { tone: 'purple', label: 'Returned' },
    converted: { tone: 'success', label: 'Converted' },

    // --- lifecycle: terminal ---
    cancelled: { tone: 'danger', label: 'Cancelled' },
    canceled: { tone: 'danger', label: 'Cancelled' },
    void: { tone: 'danger', label: 'Void' },
    expired: { tone: 'danger', label: 'Expired' },
    failed: { tone: 'danger', label: 'Failed' },
    archived: { tone: 'neutral', label: 'Archived' },

    // --- generic on/off ---
    active: { tone: 'success', label: 'Active' },
    inactive: { tone: 'neutral', label: 'Inactive' },
    enabled: { tone: 'success', label: 'Enabled' },
    disabled: { tone: 'neutral', label: 'Disabled' },
    published: { tone: 'success', label: 'Published' },
    unpublished: { tone: 'neutral', label: 'Unpublished' },
    verified: { tone: 'success', label: 'Verified' },
    unverified: { tone: 'warning', label: 'Unverified' },

    // --- stock ---
    in_stock: { tone: 'success', label: 'In Stock' },
    low_stock: { tone: 'warning', label: 'Low Stock' },
    out_of_stock: { tone: 'danger', label: 'Out of Stock' },

    // --- support / tasks ---
    new: { tone: 'info', label: 'New' },
    on_hold: { tone: 'warning', label: 'On Hold' },
    resolved: { tone: 'success', label: 'Resolved' },
    reopened: { tone: 'warning', label: 'Reopened' },
    completed: { tone: 'success', label: 'Completed' },
    todo: { tone: 'neutral', label: 'To Do' },

    // --- debt ageing bands (see CustomerController::debtStatus) ---
    // Keyed separately from 'warning'/'critical' priority values above so a
    // debt band can never be confused with a ticket priority.
    normal: { tone: 'success', label: 'Normal' },
    risk: { tone: 'orange', label: 'Risk' },
    high_risk: { tone: 'danger', label: 'High Risk' },

    // --- priority (shares the vocabulary deliberately) ---
    low: { tone: 'neutral', label: 'Low' },
    medium: { tone: 'info', label: 'Medium' },
    high: { tone: 'warning', label: 'High' },
    urgent: { tone: 'danger', label: 'Urgent' },
    critical: { tone: 'critical', label: 'Critical' },
};

/** Normalise any incoming status into a map key. */
export const normalizeStatus = (status: string | number | null | undefined): string =>
    String(status ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s\-/]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

/** Look up the tone for a status without rendering. Useful for charts and rows. */
export const statusTone = (status: string | number | null | undefined): StatusTone =>
    STATUS_MAP[normalizeStatus(status)]?.tone ?? 'neutral';

/** Human label for a status, before translation. */
export const statusLabel = (status: string | number | null | undefined): string => {
    const key = normalizeStatus(status);
    if (STATUS_MAP[key]) return STATUS_MAP[key].label;
    // Unknown status: title-case it rather than showing a raw enum value.
    return key
        .split('_')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

type Props = {
    status: string | number | null | undefined;
    /** Override the mapped label. Pass an untranslated string; it is translated here. */
    label?: string;
    /** Override the mapped tone. */
    tone?: StatusTone;
    /** Show the leading dot. Default true — it carries meaning for colour-blind users. */
    dot?: boolean;
    size?: 'sm' | 'md';
    className?: string;
};

export function StatusBadge({
    status,
    label,
    tone,
    dot = true,
    size = 'sm',
    className,
}: Props) {
    const { t } = useTranslation();

    if (status === null || status === undefined || status === '') return null;

    const resolvedTone = tone ?? statusTone(status);
    const resolvedLabel = label ?? statusLabel(status);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md font-medium ring-1 ring-inset whitespace-nowrap',
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[13px]',
                toneClasses[resolvedTone],
                className,
            )}
        >
            {dot && (
                <span
                    className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[resolvedTone])}
                    aria-hidden="true"
                />
            )}
            {t(resolvedLabel)}
        </span>
    );
}

/**
 * Register extra statuses at runtime, for module-specific vocabularies that do
 * not belong in the core map. Call once from a module's entry file.
 *
 *   registerStatuses({ awaiting_shipment: { tone: 'info', label: 'Awaiting Shipment' } });
 */
export function registerStatuses(
    entries: Record<string, { tone: StatusTone; label: string }>,
): void {
    Object.entries(entries).forEach(([key, value]) => {
        STATUS_MAP[normalizeStatus(key)] = value;
    });
}
