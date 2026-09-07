// packages/workdo/DoubleEntry/src/Resources/js/Pages/ProfitLoss/Index.tsx
import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { FileText, Search, Printer } from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/helpers';
import {
    KpiStrip,
    Statement,
    StatementSection,
    StatementRow,
    StatementTotal,
    StatementResult,
    StatementEmpty,
    StatementSpacer,
} from '@/components/duwli';

/**
 * PROFIT & LOSS STATEMENT
 * ----------------------------------------------------------------------------
 * Rebuilt as a VERTICAL statement.
 *
 * The previous layout put revenue in a left column and expenses in a right
 * column, each with its own total, and the net profit underneath both. That is
 * the T-account form — correct for a ledger, wrong for a published statement,
 * and it has two practical problems:
 *
 *   1. The net figure relates to neither column. A reader cannot see it being
 *      derived; it simply appears. In the vertical form the eye travels down
 *      the same column the arithmetic travels.
 *   2. Two columns do not fit A4. It forces either a cramped squeeze or
 *      landscape. One column flows down and across pages naturally.
 *
 * This matches IFRS presentation and Saudi/UAE practice.
 *
 * ALSO FIXED HERE
 *   - Expense account codes were rendered in GREEN — copied from the revenue
 *     block. Every expense code in the system displayed in the revenue colour.
 *   - formatCurrency was called without pageProps, so the company's configured
 *     decimal separator and currency symbol were ignored on this report while
 *     being correct elsewhere.
 *   - The print button went straight to ?download=pdf, which rasterises. It now
 *     opens the print dialog for real vector output.
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

interface ProfitLossProps {
    profitLoss: ProfitLossData;
    auth: { user: { permissions: string[] } };
    [key: string]: any;
}

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<ProfitLossProps>().props;
    const { profitLoss, auth } = pageProps;
    const urlParams = new URLSearchParams(window.location.search);

    const [fromDate, setFromDate] = useState(urlParams.get('from_date') || profitLoss.from_date);
    const [toDate, setToDate] = useState(urlParams.get('to_date') || profitLoss.to_date);

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const handleGenerate = () => {
        if (!fromDate || !toDate) return;
        router.get(
            route('double-entry.profit-loss.index'),
            { from_date: fromDate, to_date: toDate },
            { preserveState: true, replace: true },
        );
    };

    const openPrint = (download = false) => {
        const url =
            route('double-entry.profit-loss.print') +
            `?from_date=${fromDate}&to_date=${toDate}` +
            (download ? '&download=pdf' : '&print=1');
        window.open(url, '_blank');
    };

    // Margin is only meaningful against revenue. With no revenue it is not
    // "0%" — it is undefined, and printing 0% would state something false.
    const margin =
        profitLoss.total_revenue > 0
            ? (profitLoss.net_profit / profitLoss.total_revenue) * 100
            : null;

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Double Entry') }, { label: t('Profit & Loss') }]}
            pageTitle={t('Profit & Loss Statement')}
            pageDescription={`${date(profitLoss.from_date)} — ${date(profitLoss.to_date)}`}
            pageIcon={FileText}
            onPrint={
                auth.user?.permissions?.includes('print-profit-loss')
                    ? () => openPrint(false)
                    : undefined
            }
            onExportPdf={
                auth.user?.permissions?.includes('print-profit-loss')
                    ? () => openPrint(true)
                    : undefined
            }
        >
            <Head title={t('Profit & Loss')} />

            {/* --------------------------------------------------- controls */}
            <Card className="mb-5 shadow-sm">
                <CardContent className="flex flex-wrap items-end gap-3 p-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t('From Date')}</Label>
                        <DatePicker
                            value={fromDate}
                            onChange={(value) => setFromDate(value)}
                            placeholder={t('Select from date')}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t('To Date')}</Label>
                        <DatePicker
                            value={toDate}
                            onChange={(value) => setToDate(value)}
                            placeholder={t('Select to date')}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={!fromDate || !toDate} className="h-9 gap-1.5">
                        <Search className="h-4 w-4" />
                        {t('Generate')}
                    </Button>
                </CardContent>
            </Card>

            {/* --------------------------------------------------- headline */}
            <KpiStrip
                columns={4}
                items={[
                    {
                        label: profitLoss.net_profit >= 0 ? 'Net Profit' : 'Net Loss',
                        value: money(Math.abs(profitLoss.net_profit)),
                        icon: FileText,
                        tone: 'gradient',
                    },
                    { label: 'Total Revenue', value: money(profitLoss.total_revenue), tone: 'success' },
                    { label: 'Total Expenses', value: money(profitLoss.total_expenses), tone: 'danger' },
                    {
                        label: 'Net Margin',
                        value: margin === null ? '—' : `${margin.toFixed(1)}%`,
                        caption: margin === null ? 'No revenue in this period' : undefined,
                        tone: 'info',
                    },
                ]}
            />

            {/* -------------------------------------------------- statement */}
            <Card className="shadow-sm">
                <CardContent className="p-6 sm:p-8">
                    <header className="mb-6 text-center">
                        <h2 className="text-lg font-bold">{t('Statement of Profit or Loss')}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {t('For the period')} {date(profitLoss.from_date)} — {date(profitLoss.to_date)}
                        </p>
                    </header>

                    <Statement>
                        {/* ------------------------------------------ revenue */}
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

                        {/* ----------------------------------------- expenses */}
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

                        {/* ------------------------------------------- result */}
                        <StatementResult
                            label={profitLoss.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
                            value={profitLoss.net_profit}
                            signed
                        />
                    </Statement>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
