// packages/workdo/DoubleEntry/src/Resources/js/Pages/Reports/Print/ExpenseReport.tsx
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ReportLayout, DocumentTable, type DocumentColumn } from '@/components/duwli/document';

/**
 * EXPENSE REPORT — PRINT
 * ----------------------------------------------------------------------------
 * Tabular, on the shared report shell.
 *
 * One addition beyond the shell: a SHARE OF TOTAL column. An expense report
 * without proportions answers "what did we spend" but not "where did it go",
 * and the second question is the reason anyone opens this report. Computing it
 * on the client costs nothing — the totals are already here.
 */

interface ExpenseItem {
    account_code: string;
    account_name: string;
    amount: number;
}

interface ExpenseReportData {
    expenses: ExpenseItem[];
    total_expenses: number;
}

interface PrintProps {
    data: ExpenseReportData;
    filters: { from_date: string; to_date: string };
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<PrintProps>().props;
    const { data, filters } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const total = Number(data.total_expenses) || 0;

    const columns: DocumentColumn[] = [
        { key: 'code', header: 'Account Code', width: '30mm' },
        { key: 'name', header: 'Account Name' },
        { key: 'amount', header: 'Amount', align: 'end', width: '36mm' },
        { key: 'share', header: 'Share', align: 'end', width: '22mm' },
    ];

    // Largest first: an expense report is read to find the big items.
    const rows = [...data.expenses].sort((a, b) => Number(b.amount) - Number(a.amount));

    return (
        <>
            <Head title={t('Expense Report')} />

            <ReportLayout
                title="Expense Report"
                subtitle="Expenses by account for the period."
                filename={`expense-report-${filters.from_date}-to-${filters.to_date}`}
                backUrl={route('double-entry.reports.expense-report')}
                filters={[
                    { label: 'Period', value: `${date(filters.from_date)} — ${date(filters.to_date)}` },
                    { label: 'Accounts', value: data.expenses.length },
                ]}
                summary={[
                    { label: 'Total Expenses', value: money(total), emphasis: true },
                    {
                        label: 'Largest Account',
                        value: rows.length > 0 ? rows[0].account_name : '—',
                    },
                ]}
            >
                <DocumentTable
                    columns={columns}
                    rows={rows}
                    emptyText="No expenses were recorded in this period."
                    render={(row: ExpenseItem, column) => {
                        switch (column.key) {
                            case 'code':
                                return <span className="tabular-nums">{row.account_code}</span>;
                            case 'name':
                                return row.account_name;
                            case 'amount':
                                return money(row.amount);
                            case 'share':
                                return total > 0
                                    ? `${((Number(row.amount) / total) * 100).toFixed(1)}%`
                                    : '—';
                            default:
                                return null;
                        }
                    }}
                    footer={
                        <tr>
                            <td colSpan={2} className="pt-3 font-bold">
                                {t('Total Expenses')}
                            </td>
                            <td className="doc-num pt-3 font-bold">{money(total)}</td>
                            <td className="doc-num pt-3 font-bold">{total > 0 ? '100.0%' : '—'}</td>
                        </tr>
                    }
                />
            </ReportLayout>
        </>
    );
}
