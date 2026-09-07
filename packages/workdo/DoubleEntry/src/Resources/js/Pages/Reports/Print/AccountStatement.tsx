// packages/workdo/DoubleEntry/src/Resources/js/Pages/Reports/Print/AccountStatement.tsx
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ReportLayout, DocumentTable, type DocumentColumn } from '@/components/duwli/document';

/**
 * ACCOUNT STATEMENT — PRINT
 * ----------------------------------------------------------------------------
 * Tabular, on the shared report shell.
 *
 * An account statement is more likely than any other report here to be SENT to
 * someone outside the company, so two things matter more than usual:
 *
 *   - The account it covers and the period it covers must be printed on every
 *     copy. ReportLayout puts both in the header as structured filters.
 *   - The opening balance must be visible, because a running balance column is
 *     meaningless without it. It is the first row of the table rather than a
 *     box above it, so it survives onto page 2.
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

interface AccountStatementData {
    opening_balance: number;
    transactions: Transaction[];
    closing_balance: number;
}

interface Account {
    account_code: string;
    account_name: string;
}

interface PrintProps {
    data: AccountStatementData;
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
        { key: 'date', header: 'Date', width: '28mm' },
        { key: 'description', header: 'Description' },
        { key: 'debit', header: 'Debit', align: 'end', width: '32mm' },
        { key: 'credit', header: 'Credit', align: 'end', width: '32mm' },
        { key: 'balance', header: 'Balance', align: 'end', width: '34mm' },
    ];

    // The opening balance is prepended as a row so the running balance column
    // has a visible starting point on every page.
    const rows = [
        {
            id: -1,
            date: filters.from_date,
            description: t('Opening balance'),
            reference_type: '',
            debit: 0,
            credit: 0,
            balance: data.opening_balance,
            __opening: true,
        } as any,
        ...data.transactions,
    ];

    return (
        <>
            <Head title={t('Account Statement')} />

            <ReportLayout
                title="Account Statement"
                subtitle="Opening balance, movements and closing balance for the period."
                filename={`account-statement-${filters.from_date}-to-${filters.to_date}`}
                backUrl={route('double-entry.reports.account-statement')}
                filters={[
                    {
                        label: 'Account',
                        value: selectedAccount
                            ? `${selectedAccount.account_code} — ${selectedAccount.account_name}`
                            : t('All accounts'),
                    },
                    { label: 'Period', value: `${date(filters.from_date)} — ${date(filters.to_date)}` },
                ]}
                summary={[
                    { label: 'Opening Balance', value: money(data.opening_balance) },
                    { label: 'Movements', value: data.transactions.length },
                    { label: 'Closing Balance', value: money(data.closing_balance), emphasis: true },
                ]}
            >
                <DocumentTable
                    columns={columns}
                    rows={rows}
                    emptyText="No movements on this account in the period."
                    render={(tx: any, column) => {
                        const opening = tx.__opening;
                        switch (column.key) {
                            case 'date':
                                return date(tx.date);
                            case 'description':
                                return (
                                    <span className={opening ? 'font-medium' : undefined}>
                                        {tx.description || '—'}
                                        {!opening && tx.reference_type && (
                                            <span className="ms-2 text-[8.5pt] text-[#5d6772]">
                                                {tx.reference_type}
                                            </span>
                                        )}
                                    </span>
                                );
                            case 'debit':
                                return !opening && Number(tx.debit) > 0 ? money(tx.debit) : '—';
                            case 'credit':
                                return !opening && Number(tx.credit) > 0 ? money(tx.credit) : '—';
                            case 'balance':
                                return <span className="font-medium">{money(tx.balance)}</span>;
                            default:
                                return null;
                        }
                    }}
                    footer={
                        <tr>
                            <td colSpan={4} className="pt-3 font-bold">
                                {t('Closing Balance')}
                            </td>
                            <td className="doc-num pt-3 font-bold">{money(data.closing_balance)}</td>
                        </tr>
                    }
                />
            </ReportLayout>
        </>
    );
}
