// packages/workdo/DoubleEntry/src/Resources/js/Pages/ProfitLoss/Print.tsx
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ReportLayout } from '@/components/duwli/document';
import {
    Statement,
    StatementSection,
    StatementRow,
    StatementTotal,
    StatementResult,
    StatementEmpty,
    StatementSpacer,
} from '@/components/duwli';

/**
 * PROFIT & LOSS — PRINT
 * ----------------------------------------------------------------------------
 * Same vertical statement as the screen, on the shared ReportLayout.
 *
 * The vertical form is what makes this print correctly. The previous
 * two-column layout had to be squeezed to fit A4 portrait, and when the account
 * list grew past a page the two columns broke independently — revenue
 * continuing on page 2 while expenses had already finished, with no way to tell
 * which total belonged to which. A single column flows down and across pages
 * with its section headings repeating, and every subtotal stays with the lines
 * it sums.
 */

interface Account {
    id: number;
    account_code: string;
    account_name: string;
    balance: number;
}

interface ProfitLossData {
    revenue: Account[];
    expenses: Account[];
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    from_date: string;
    to_date: string;
}

interface Props {
    profitLoss: ProfitLossData;
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<Props>().props;
    const { profitLoss } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const margin =
        profitLoss.total_revenue > 0
            ? (profitLoss.net_profit / profitLoss.total_revenue) * 100
            : null;

    return (
        <>
            <Head title={t('Profit & Loss')} />

            <ReportLayout
                title="Statement of Profit or Loss"
                subtitle="Revenue and expenses for the period."
                filename={`profit-loss-${profitLoss.from_date}-to-${profitLoss.to_date}`}
                backUrl={route('double-entry.profit-loss.index')}
                filters={[
                    {
                        label: 'Period',
                        value: `${date(profitLoss.from_date)} — ${date(profitLoss.to_date)}`,
                    },
                ]}
                summary={[
                    { label: 'Total Revenue', value: money(profitLoss.total_revenue) },
                    { label: 'Total Expenses', value: money(profitLoss.total_expenses) },
                    {
                        label: profitLoss.net_profit >= 0 ? 'Net Profit' : 'Net Loss',
                        value: money(Math.abs(profitLoss.net_profit)),
                        emphasis: true,
                        // A loss is flagged, not just coloured — on a printed
                        // statement colour may not survive a black-and-white
                        // printer or a photocopy.
                        warn: profitLoss.net_profit < 0,
                    },
                    ...(margin !== null
                        ? [{ label: 'Net Margin', value: `${margin.toFixed(1)}%` }]
                        : []),
                ]}
            >
                <Statement className="max-w-none">
                    <StatementSection label="Revenue" />
                    {profitLoss.revenue.length > 0 ? (
                        profitLoss.revenue.map((account) => (
                            <StatementRow
                                key={account.id}
                                code={account.account_code}
                                label={account.account_name}
                                value={account.balance}
                            />
                        ))
                    ) : (
                        <StatementEmpty label="No revenue recorded in this period." />
                    )}
                    <StatementTotal label="Total Revenue" value={profitLoss.total_revenue} />

                    <StatementSpacer />

                    <StatementSection label="Expenses" />
                    {profitLoss.expenses.length > 0 ? (
                        profitLoss.expenses.map((account) => (
                            <StatementRow
                                key={account.id}
                                code={account.account_code}
                                label={account.account_name}
                                value={account.balance}
                            />
                        ))
                    ) : (
                        <StatementEmpty label="No expenses recorded in this period." />
                    )}
                    <StatementTotal label="Total Expenses" value={profitLoss.total_expenses} />

                    <StatementSpacer />

                    <StatementResult
                        label={profitLoss.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
                        value={profitLoss.net_profit}
                        signed
                    />
                </Statement>
            </ReportLayout>
        </>
    );
}
