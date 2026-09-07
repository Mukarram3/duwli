// packages/workdo/DoubleEntry/src/Resources/js/Pages/Reports/Print/GeneralLedger.tsx
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ReportLayout, DocumentTable, type DocumentColumn } from '@/components/duwli/document';

/**
 * GENERAL LEDGER — PRINT
 * ----------------------------------------------------------------------------
 * Stays tabular — a ledger IS a table of movements, so the vertical statement
 * form does not apply here. What it gains from the shared shell is the thing it
 * needed most: REPEATING COLUMN HEADINGS.
 *
 * A general ledger for a single active account routinely runs to hundreds of
 * lines. Previously every page after the first printed six unlabelled columns
 * of dates and figures, with a running balance the reader could not identify.
 * `DocumentTable` carries the header-group rule that fixes it.
 *
 * The opening balance is printed as the first row rather than in a separate
 * box above the table. A running balance column is only meaningful if the
 * reader can see where it started, and on page 2 of a paper ledger a box on
 * page 1 is no help.
 */

interface Transaction {
    id: number;
    date: string;
    description: string;
    reference_type: string;
    debit: number;
    credit: number;
    balance: number;
}

interface GeneralLedgerData {
    opening_balance: number;
    transactions: Transaction[];
    closing_balance: number;
}

interface Account {
    account_code: string;
    account_name: string;
}

interface PrintProps {
    data: GeneralLedgerData;
    selectedAccount: Account | null;
    filters: { from_date: string; to_date: string };
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<PrintProps>().props;
    const { data, selectedAccount, filters } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const columns: DocumentColumn[] = [
        { key: 'date', header: 'Date', width: '26mm' },
        { key: 'description', header: 'Description' },
        { key: 'reference', header: 'Reference', width: '32mm' },
        { key: 'debit', header: 'Debit', align: 'end', width: '30mm' },
        { key: 'credit', header: 'Credit', align: 'end', width: '30mm' },
        { key: 'balance', header: 'Balance', align: 'end', width: '32mm' },
    ];

    const totalDebit = data.transactions.reduce((sum, tx) => sum + Number(tx.debit || 0), 0);
    const totalCredit = data.transactions.reduce((sum, tx) => sum + Number(tx.credit || 0), 0);

    return (
        <>
            <Head title={t('General Ledger')} />

            <ReportLayout
                title="General Ledger"
                subtitle="All movements posted to the account during the period."
                size="a4-landscape"
                filename={`general-ledger-${filters.from_date}-to-${filters.to_date}`}
                backUrl={route('double-entry.reports.general-ledger')}
                filters={[
                    {
                        label: 'Account',
                        value: selectedAccount
                            ? `${selectedAccount.account_code} — ${selectedAccount.account_name}`
                            : t('All accounts'),
                    },
                    { label: 'Period', value: `${date(filters.from_date)} — ${date(filters.to_date)}` },
                    { label: 'Entries', value: data.transactions.length },
                ]}
                summary={[
                    { label: 'Opening Balance', value: money(data.opening_balance) },
                    { label: 'Total Debit', value: money(totalDebit) },
                    { label: 'Total Credit', value: money(totalCredit) },
                    { label: 'Closing Balance', value: money(data.closing_balance), emphasis: true },
                ]}
            >
                <DocumentTable
                    columns={columns}
                    rows={data.transactions}
                    emptyText="No movements were posted to this account in the period."
                    render={(tx: Transaction, column) => {
                        switch (column.key) {
                            case 'date':
                                return date(tx.date);
                            case 'description':
                                return tx.description || '—';
                            case 'reference':
                                return (
                                    <span className="text-[9pt] text-[#5d6772]">
                                        {tx.reference_type || '—'}
                                    </span>
                                );
                            case 'debit':
                                // A dash, not 0.00 — every movement is on one
                                // side only, and printing zeroes in the other
                                // column doubles the figures the eye discards.
                                return Number(tx.debit) > 0 ? money(tx.debit) : '—';
                            case 'credit':
                                return Number(tx.credit) > 0 ? money(tx.credit) : '—';
                            case 'balance':
                                return <span className="font-medium">{money(tx.balance)}</span>;
                            default:
                                return null;
                        }
                    }}
                    footer={
                        <tr>
                            <td colSpan={3} className="pt-3 font-bold">
                                {t('Closing Balance')}
                            </td>
                            <td className="doc-num pt-3 font-bold">{money(totalDebit)}</td>
                            <td className="doc-num pt-3 font-bold">{money(totalCredit)}</td>
                            <td className="doc-num pt-3 font-bold">{money(data.closing_balance)}</td>
                        </tr>
                    }
                />
            </ReportLayout>
        </>
    );
}
