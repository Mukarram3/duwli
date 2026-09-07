// packages/workdo/DoubleEntry/src/Resources/js/Pages/Reports/Print/AccountBalance.tsx
import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ReportLayout } from '@/components/duwli/document';

/**
 * ACCOUNT BALANCE REPORT — PRINT
 * ----------------------------------------------------------------------------
 * Grouped table, on the shared report shell.
 *
 * This report groups accounts by type (assets, liabilities, income, expenses)
 * with a subtotal per group. That structure is why it uses a hand-built table
 * rather than DocumentTable: the group heading rows and subtotals are
 * interleaved with the data rows, which DocumentTable's flat row model does not
 * express.
 *
 * The `.doc-table` class is still applied by hand, because that is what carries
 * the repeating-header rule from print.css. A grouped balance report across a
 * full chart of accounts runs long, and losing the column headings on page 2
 * is exactly the defect this batch exists to fix.
 */

interface AccountBalanceItem {
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
    net_balance: number;
}

interface AccountBalanceGroup {
    accounts: AccountBalanceItem[];
    subtotal_debit: number;
    subtotal_credit: number;
    subtotal_net: number;
}

interface AccountBalanceData {
    grouped: Record<string, AccountBalanceGroup>;
    totals: { debit: number; credit: number; net: number };
    as_of_date: string;
}

interface PrintProps {
    data: AccountBalanceData;
    filters: { as_of_date: string };
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<PrintProps>().props;
    const { data, filters } = pageProps;

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const groups = Object.entries(data.grouped || {});
    const accountCount = groups.reduce((sum, [, group]) => sum + group.accounts.length, 0);

    const difference = Number(data.totals.debit) - Number(data.totals.credit);
    const balanced = Math.abs(difference) < 0.005;

    return (
        <>
            <Head title={t('Account Balance Report')} />

            <ReportLayout
                title="Account Balances"
                subtitle="Closing balance of every ledger account, grouped by account type."
                filename={`account-balances-${filters.as_of_date}`}
                backUrl={route('double-entry.reports.account-balance')}
                filters={[
                    { label: 'As at', value: date(filters.as_of_date) },
                    { label: 'Accounts', value: accountCount },
                ]}
                summary={[
                    { label: 'Total Debit', value: money(data.totals.debit) },
                    { label: 'Total Credit', value: money(data.totals.credit) },
                    {
                        label: balanced ? 'Balanced' : 'Out of Balance',
                        value: balanced ? t('Yes') : money(Math.abs(difference)),
                        emphasis: true,
                        warn: !balanced,
                    },
                ]}
            >
                <table className="doc-table">
                    <thead>
                        <tr>
                            <th style={{ width: '28mm' }}>{t('Code')}</th>
                            <th>{t('Account Name')}</th>
                            <th className="doc-num" style={{ width: '32mm' }}>{t('Debit')}</th>
                            <th className="doc-num" style={{ width: '32mm' }}>{t('Credit')}</th>
                            <th className="doc-num" style={{ width: '32mm' }}>{t('Balance')}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {groups.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-6 text-center text-[9.5pt] text-[#5d6772]">
                                    {t('No accounts have a balance at this date.')}
                                </td>
                            </tr>
                        ) : (
                            groups.map(([groupName, group]) => (
                                <React.Fragment key={groupName}>
                                    <tr className="doc-keep-with-next">
                                        <td colSpan={5} className="pt-4 text-[9pt] font-semibold uppercase tracking-wide text-[#5d6772]">
                                            {t(groupName.replace(/_/g, ' '))}
                                        </td>
                                    </tr>

                                    {group.accounts.map((account) => (
                                        <tr key={`${groupName}-${account.account_code}`}>
                                            <td className="tabular-nums">{account.account_code}</td>
                                            <td>{account.account_name}</td>
                                            <td className="doc-num">
                                                {Number(account.debit) > 0 ? money(account.debit) : '—'}
                                            </td>
                                            <td className="doc-num">
                                                {Number(account.credit) > 0 ? money(account.credit) : '—'}
                                            </td>
                                            <td className="doc-num font-medium">
                                                {money(account.net_balance)}
                                            </td>
                                        </tr>
                                    ))}

                                    <tr className="doc-no-break">
                                        <td colSpan={2} className="border-t border-[#051321] py-2 font-semibold">
                                            {t('Total')} {t(groupName.replace(/_/g, ' '))}
                                        </td>
                                        <td className="doc-num border-t border-[#051321] py-2 font-semibold">
                                            {money(group.subtotal_debit)}
                                        </td>
                                        <td className="doc-num border-t border-[#051321] py-2 font-semibold">
                                            {money(group.subtotal_credit)}
                                        </td>
                                        <td className="doc-num border-t border-[#051321] py-2 font-semibold">
                                            {money(group.subtotal_net)}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>

                    <tfoot>
                        <tr className="doc-no-break">
                            <td colSpan={2} className="border-y-[3px] border-double border-[#051321] py-3 font-bold">
                                {t('Grand Total')}
                            </td>
                            <td className="doc-num border-y-[3px] border-double border-[#051321] py-3 font-bold">
                                {money(data.totals.debit)}
                            </td>
                            <td className="doc-num border-y-[3px] border-double border-[#051321] py-3 font-bold">
                                {money(data.totals.credit)}
                            </td>
                            <td className="doc-num border-y-[3px] border-double border-[#051321] py-3 font-bold">
                                {money(data.totals.net)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {!balanced && (
                    <p className="doc-no-break mt-4 border border-[#ef1e1e] bg-[#fef4f4] px-3 py-2 text-[9.5pt] text-[#ef1e1e]">
                        {t('Total debits do not equal total credits. Review the journal entries for this period before relying on this report.')}
                    </p>
                )}
            </ReportLayout>
        </>
    );
}
