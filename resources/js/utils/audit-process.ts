// resources/js/utils/audit-process.ts
import { router } from '@inertiajs/react';

/**
 * Adds documents to the audit process queue.
 *
 * One helper for every document type: the server resolves the short type key
 * against a whitelist, so the browser never sends a model class name.
 *
 * Passing no ids sends the whole current filter selection is NOT supported on
 * purpose — an auditor should choose what they are reviewing, not sweep in
 * whatever happened to be on screen.
 */
export type AuditableType =
    | 'debit_note'
    | 'credit_note'
    | 'journal_entry'
    | 'sales_invoice'
    | 'purchase_invoice';

const resolve = (name: string): string | undefined => {
    try {
        const fn = (window as any).route;
        return typeof fn === 'function' ? fn(name) : undefined;
    } catch {
        return undefined;
    }
};

/** True when the audit routes are deployed. */
export const auditProcessAvailable = (): boolean =>
    !!resolve('account.audit-process.store');

export const addToAuditProcess = (
    type: AuditableType,
    ids: Array<number | string>,
    note?: string,
): void => {
    const target = resolve('account.audit-process.store');
    if (!target || ids.length === 0) return;

    router.post(
        target,
        { type, ids, note: note || null },
        { preserveScroll: true, preserveState: true },
    );
};
