// packages/workdo/DoubleEntry/src/Resources/js/Pages/BalanceSheets/Print.tsx
import React from 'react';
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
import { BalanceSheetViewProps } from './types';

/**
 * BALANCE SHEET — PRINT
 * ----------------------------------------------------------------------------
 * Rebuilt as a vertical statement on the shared ReportLayout.
 *
 * The previous print laid Equity and Liabilities down one side and Assets down
 * the other. Beyond being the wrong presentation for a published statement,
 * that layout could not show the thing a balance sheet exists to demonstrate:
 * that assets equal liabilities plus equity. The two columns had separate
 * totals with nothing tying them together, so the reader had to add two
 * numbers by hand to check the sheet balanced.
 *
 * The vertical form ends with that comparison explicitly, and flags it when it
 * fails.
 */

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<BalanceSheetViewProps>().props;
    const { balanceSheet, groupedItems } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const sectionTotal = (section: any) =>
        section
            ? Object.values(section)
                  .flat()
                  .reduce((sum: number, item: any) => sum + parseFloat(item.amount.toString()), 0)
            : 0;

    const totalAssets = sectionTotal(groupedItems.assets);
    const totalLiabilities = sectionTotal(groupedItems.liabilities);
    const totalEquity = sectionTotal(groupedItems.equity);

    const difference = totalAssets - (totalLiabilities + totalEquity);
    const balanced = Math.abs(difference) < 0.005;

    /** One section rendered as an indented, subtotalled statement block. */
    const renderSection = (section: any, heading: string, total: number, emptyText: string) => (
        <>
            <StatementSection label={heading} />
            {section && Object.keys(section).length > 0 ? (
                Object.entries(section).map(([subSection, items]: [string, any]) => {
                    const subTotal = items.reduce(
                        (sum: number, item: any) => sum + parseFloat(item.amount.toString()),
                        0,
                    );
                    return (
                        <React.Fragment key={subSection}>
                            <tr>
                                <td colSpan={2} className="pb-1 pt-3 ps-4 text-[10pt] font-semibold capitalize">
                                    {t(subSection.replace(/_/g, ' '))}
                                </td>
                            </tr>
                            {items.map((item: any) => (
                                <StatementRow
                                    key={item.id}
                                    depth={2}
                                    code={item.account?.account_code}
                                    label={item.account?.account_name || t('Unnamed account')}
                                    value={item.amount}
                                />
                            ))}
                            <StatementTotal
                                label={`${t('Total')} ${t(subSection.replace(/_/g, ' '))}`}
                                value={subTotal}
                            />
                        </React.Fragment>
                    );
                })
            ) : (
                <StatementEmpty label={emptyText} />
            )}
            <StatementResult label={`${t('Total')} ${t(heading)}`} value={total} />
        </>
    );

    return (
        <>
            <Head title={t('Balance Sheet')} />

            <ReportLayout
                title="Statement of Financial Position"
                subtitle="Assets, liabilities and equity as at the reporting date."
                filename={`balance-sheet-${balanceSheet.balance_sheet_date}`}
                backUrl={route('double-entry.balance-sheets.show', balanceSheet.id)}
                filters={[
                    { label: 'As at', value: date(balanceSheet.balance_sheet_date) },
                    { label: 'Financial Year', value: balanceSheet.financial_year },
                ]}
                summary={[
                    { label: 'Total Assets', value: money(totalAssets) },
                    { label: 'Total Liabilities', value: money(totalLiabilities) },
                    { label: 'Total Equity', value: money(totalEquity) },
                    {
                        // The question a balance sheet exists to answer.
                        label: balanced ? 'Balanced' : 'Out of Balance',
                        value: balanced ? t('Yes') : money(Math.abs(difference)),
                        emphasis: true,
                        warn: !balanced,
                    },
                ]}
            >
                <Statement className="max-w-none">
                    {renderSection(
                        groupedItems.assets,
                        'Assets',
                        totalAssets,
                        'No asset accounts on this balance sheet.',
                    )}

                    <StatementSpacer />

                    {renderSection(
                        groupedItems.liabilities,
                        'Liabilities',
                        totalLiabilities,
                        'No liability accounts on this balance sheet.',
                    )}

                    <StatementSpacer />

                    {renderSection(
                        groupedItems.equity,
                        'Equity',
                        totalEquity,
                        'No equity accounts on this balance sheet.',
                    )}

                    <StatementSpacer />

                    {/*
                      The closing proof. A balance sheet that does not state
                      Assets = Liabilities + Equity has not finished its job —
                      the previous two-column print left the reader to add the
                      two sides together themselves.
                    */}
                    <StatementTotal
                        label="Total Liabilities and Equity"
                        value={totalLiabilities + totalEquity}
                    />
                    <StatementResult label="Total Assets" value={totalAssets} />
                </Statement>

                {!balanced && (
                    <p className="doc-no-break mt-4 border border-[#ef1e1e] bg-[#fef4f4] px-3 py-2 text-[9.5pt] text-[#ef1e1e]">
                        {t('This balance sheet does not balance. Assets differ from liabilities plus equity by')}{' '}
                        {money(Math.abs(difference))}.{' '}
                        {t('Review the underlying journal entries before relying on this statement.')}
                    </p>
                )}
            </ReportLayout>
        </>
    );
}
