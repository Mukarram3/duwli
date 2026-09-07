// packages/workdo/DoubleEntry/src/Resources/js/Pages/Reports/Print/JournalEntry.tsx
import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ReportLayout } from '@/components/duwli/document';

/**
 * JOURNAL ENTRY REPORT — PRINT
 * ----------------------------------------------------------------------------
 * A list of journal vouchers, each with its own line items and totals.
 *
 * Hand-built table rather than DocumentTable: the structure is nested — entries
 * containing lines — which a flat row model cannot express. The `.doc-table`
 * class is applied by hand so the column headings still repeat across pages,
 * and each entry block is marked `doc-no-break` so a voucher is never split
 * between two pages. A journal entry cut in half is unusable as evidence: the
 * debits appear on one page and the credits on another, and nobody can verify
 * it balances.
 *
 * Each entry is also checked individually. An entry whose debits do not equal
 * its credits is flagged inline — that is a data-integrity failure, and this
 * report is where an accountant would go looking for it.
 */

interface JournalEntryItem {
    account_code: string;
    account_name: string;
    description: string;
    debit: number;
    credit: number;
}

interface JournalEntryData {
    id: number;
    journal_number: string;
    date: string;
    reference_type: string;
    description: string;
    total_debit: number;
    total_credit: number;
    status: string;
    items: JournalEntryItem[];
}

interface PrintProps {
    data: JournalEntryData[];
    filters: { from_date: string; to_date: string };
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<PrintProps>().props;
    const { data, filters } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const entries = data || [];
    const grandDebit = entries.reduce((sum, e) => sum + Number(e.total_debit || 0), 0);
    const grandCredit = entries.reduce((sum, e) => sum + Number(e.total_credit || 0), 0);
    const unbalanced = entries.filter(
        (e) => Math.abs(Number(e.total_debit) - Number(e.total_credit)) >= 0.005,
    ).length;

    return (
        <>
            <Head title={t('Journal Entries')} />

            <ReportLayout
                title="Journal Entry Report"
                subtitle="Every journal voucher posted in the period, with its line detail."
                filename={`journal-entries-${filters.from_date}-to-${filters.to_date}`}
                backUrl={route('double-entry.reports.journal-entry')}
                filters={[
                    { label: 'Period', value: `${date(filters.from_date)} — ${date(filters.to_date)}` },
                    { label: 'Entries', value: entries.length },
                ]}
                summary={[
                    { label: 'Total Debit', value: money(grandDebit) },
                    { label: 'Total Credit', value: money(grandCredit) },
                    {
                        label: unbalanced === 0 ? 'All Entries Balance' : 'Unbalanced Entries',
                        value: unbalanced === 0 ? t('Yes') : String(unbalanced),
                        emphasis: true,
                        warn: unbalanced > 0,
                    },
                ]}
            >
                {entries.length === 0 ? (
                    <p className="py-8 text-center text-[9.5pt] text-[#5d6772]">
                        {t('No journal entries were posted in this period.')}
                    </p>
                ) : (
                    entries.map((entry) => {
                        const entryUnbalanced =
                            Math.abs(Number(entry.total_debit) - Number(entry.total_credit)) >= 0.005;

                        return (
                            <section key={entry.id} className="doc-no-break mb-6">
                                <header className="mb-1 flex items-baseline justify-between gap-6 border-b border-[#051321] pb-1">
                                    <span className="font-semibold tabular-nums">
                                        {entry.journal_number}
                                        {entry.reference_type && (
                                            <span className="ms-3 text-[9pt] font-normal text-[#5d6772]">
                                                {entry.reference_type}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-[9.5pt] tabular-nums">{date(entry.date)}</span>
                                </header>

                                {entry.description && (
                                    <p className="mb-1 text-[9pt] text-[#5d6772]">{entry.description}</p>
                                )}

                                <table className="doc-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '26mm' }}>{t('Code')}</th>
                                            <th>{t('Account')}</th>
                                            <th className="doc-num" style={{ width: '32mm' }}>{t('Debit')}</th>
                                            <th className="doc-num" style={{ width: '32mm' }}>{t('Credit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entry.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="tabular-nums">{item.account_code}</td>
                                                <td>
                                                    {item.account_name}
                                                    {item.description && (
                                                        <span className="block text-[8.5pt] text-[#5d6772]">
                                                            {item.description}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="doc-num">
                                                    {Number(item.debit) > 0 ? money(item.debit) : '—'}
                                                </td>
                                                <td className="doc-num">
                                                    {Number(item.credit) > 0 ? money(item.credit) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={2} className="border-t border-[#051321] py-1.5 font-semibold">
                                                {t('Total')}
                                            </td>
                                            <td className="doc-num border-t border-[#051321] py-1.5 font-semibold">
                                                {money(entry.total_debit)}
                                            </td>
                                            <td
                                                className={`doc-num border-t border-[#051321] py-1.5 font-semibold${
                                                    entryUnbalanced ? ' text-[#ef1e1e]' : ''
                                                }`}
                                            >
                                                {money(entry.total_credit)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {entryUnbalanced && (
                                    <p className="mt-1 text-[8.5pt] text-[#ef1e1e]">
                                        {t('Debits do not equal credits on this entry.')}
                                    </p>
                                )}
                            </section>
                        );
                    })
                )}
            </ReportLayout>
        </>
    );
}
