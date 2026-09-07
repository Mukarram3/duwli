// packages/workdo/DoubleEntry/src/Resources/js/Pages/LedgerSummary/Print.tsx
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ReportLayout, DocumentTable, type DocumentColumn } from '@/components/duwli/document';

/**
 * LEDGER SUMMARY — PRINT
 * ----------------------------------------------------------------------------
 * Tabular, on the shared report shell. Landscape, because the row carries an
 * account, a journal reference and a description alongside both money columns —
 * squeezed into portrait the description truncates to uselessness.
 */

interface LedgerEntry {
    id: number;
    journal_date: string;
    reference_type: string;
    journal_description: string;
    description: string;
    debit_amount: number;
    credit_amount: number;
    account_code: string;
    account_name: string;
}

interface LedgerSummaryProps {
    entries: LedgerEntry[];
    selectedAccount: { account_code: string; account_name: string } | null;
    filters: { from_date: string; to_date: string };
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<LedgerSummaryProps>().props;
    const { entries, selectedAccount, filters } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const rows = entries || [];
    const totalDebit = rows.reduce((sum, e) => sum + Number(e.debit_amount || 0), 0);
    const totalCredit = rows.reduce((sum, e) => sum + Number(e.credit_amount || 0), 0);
    const difference = totalDebit - totalCredit;
    const balanced = Math.abs(difference) < 0.005;

    const columns: DocumentColumn[] = [
        { key: 'date', header: 'Date', width: '26mm' },
        { key: 'account', header: 'Account', width: '60mm' },
        { key: 'description', header: 'Description' },
        { key: 'reference', header: 'Reference', width: '30mm' },
        { key: 'debit', header: 'Debit', align: 'end', width: '30mm' },
        { key: 'credit', header: 'Credit', align: 'end', width: '30mm' },
    ];

    return (
        <>
            <Head title={t('Ledger Summary')} />

            <ReportLayout
                title="Ledger Summary"
                subtitle="All ledger movements for the period."
                size="a4-landscape"
                filename={`ledger-summary-${filters.from_date}-to-${filters.to_date}`}
                backUrl={route('double-entry.ledger-summary.index')}
                filters={[
                    {
                        label: 'Account',
                        value: selectedAccount
                            ? `${selectedAccount.account_code} — ${selectedAccount.account_name}`
                            : t('All accounts'),
                    },
                    { label: 'Period', value: `${date(filters.from_date)} — ${date(filters.to_date)}` },
                    { label: 'Entries', value: rows.length },
                ]}
                summary={[
                    { label: 'Total Debit', value: money(totalDebit) },
                    { label: 'Total Credit', value: money(totalCredit) },
                    {
                        label: balanced ? 'Balanced' : 'Out of Balance',
                        value: balanced ? t('Yes') : money(Math.abs(difference)),
                        emphasis: true,
                        warn: !balanced,
                    },
                ]}
            >
                <DocumentTable
                    columns={columns}
                    rows={rows}
                    emptyText="No ledger movements in this period."
                    render={(entry: LedgerEntry, column) => {
                        switch (column.key) {
                            case 'date':
                                return date(entry.journal_date);
                            case 'account':
                                return (
                                    <>
                                        <span className="tabular-nums text-[8.5pt] text-[#5d6772]">
                                            {entry.account_code}
                                        </span>{' '}
                                        {entry.account_name}
                                    </>
                                );
                            case 'description':
                                return entry.description || entry.journal_description || '—';
                            case 'reference':
                                return (
                                    <span className="text-[9pt] text-[#5d6772]">
                                        {entry.reference_type || '—'}
                                    </span>
                                );
                            case 'debit':
                                return Number(entry.debit_amount) > 0 ? money(entry.debit_amount) : '—';
                            case 'credit':
                                return Number(entry.credit_amount) > 0 ? money(entry.credit_amount) : '—';
                            default:
                                return null;
                        }
                    }}
                    footer={
                        <tr>
                            <td colSpan={4} className="pt-3 font-bold">
                                {t('Total')}
                            </td>
                            <td className="doc-num pt-3 font-bold">{money(totalDebit)}</td>
                            <td className="doc-num pt-3 font-bold">{money(totalCredit)}</td>
                        </tr>
                    }
                />

                {!balanced && (
                    <p className="doc-no-break mt-4 border border-[#ef1e1e] bg-[#fef4f4] px-3 py-2 text-[9.5pt] text-[#ef1e1e]">
                        {t('Total debits do not equal total credits for this selection. Review the underlying journal entries.')}
                    </p>
                )}
            </ReportLayout>
        </>
    );
}
