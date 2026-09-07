// packages/workdo/DoubleEntry/src/Resources/js/Pages/Reports/Print/CashFlow.tsx
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
    StatementSpacer,
} from '@/components/duwli';

/**
 * CASH FLOW STATEMENT — PRINT
 * ----------------------------------------------------------------------------
 * Rebuilt as a vertical statement on the shared ReportLayout.
 *
 * A cash flow statement is the clearest case for the vertical form: it is
 * arithmetic from top to bottom. Opening cash, plus three activity totals,
 * equals closing cash. Any layout that does not run down a single column
 * hides the one thing the statement is for.
 *
 * Negative activity totals print in parentheses rather than with a minus sign,
 * per accounting convention — a minus is easy to miss at the end of a column,
 * and an outflow shown as a positive number is a serious misreading.
 */

interface CashFlowData {
    beginning_cash: number;
    operating: number;
    investing: number;
    financing: number;
    net_cash_flow: number;
    ending_cash: number;
}

interface PrintProps {
    data: CashFlowData;
    filters: { from_date: string; to_date: string };
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<PrintProps>().props;
    const { data, filters } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    return (
        <>
            <Head title={t('Cash Flow Statement')} />

            <ReportLayout
                title="Statement of Cash Flows"
                subtitle="Movement in cash and cash equivalents for the period."
                filename={`cash-flow-${filters.from_date}-to-${filters.to_date}`}
                backUrl={route('double-entry.reports.cash-flow')}
                filters={[
                    { label: 'Period', value: `${date(filters.from_date)} — ${date(filters.to_date)}` },
                ]}
                summary={[
                    { label: 'Opening Cash', value: money(data.beginning_cash) },
                    { label: 'Net Movement', value: money(data.net_cash_flow) },
                    { label: 'Closing Cash', value: money(data.ending_cash), emphasis: true },
                ]}
            >
                <Statement className="max-w-none">
                    <StatementSection label="Opening Balance" />
                    <StatementRow
                        label={t('Cash and cash equivalents at start of period')}
                        value={data.beginning_cash}
                    />

                    <StatementSpacer />

                    <StatementSection label="Cash Flows by Activity" />
                    <StatementRow
                        label={t('Net cash from operating activities')}
                        value={Math.abs(data.operating)}
                        negative={data.operating < 0}
                    />
                    <StatementRow
                        label={t('Net cash from investing activities')}
                        value={Math.abs(data.investing)}
                        negative={data.investing < 0}
                    />
                    <StatementRow
                        label={t('Net cash from financing activities')}
                        value={Math.abs(data.financing)}
                        negative={data.financing < 0}
                    />
                    <StatementTotal
                        label="Net Increase / (Decrease) in Cash"
                        value={Math.abs(data.net_cash_flow)}
                        negative={data.net_cash_flow < 0}
                    />

                    <StatementSpacer />

                    <StatementResult
                        label="Cash and Cash Equivalents at End of Period"
                        value={data.ending_cash}
                    />
                </Statement>
            </ReportLayout>
        </>
    );
}
