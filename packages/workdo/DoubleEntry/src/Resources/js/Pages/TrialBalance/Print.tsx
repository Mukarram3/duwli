// packages/workdo/DoubleEntry/src/Resources/js/Pages/TrialBalance/Print.tsx
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/utils/helpers';
import {
    ReportLayout,
    DocumentTable,
    type DocumentColumn,
} from '@/components/duwli/document';

/**
 * TRIAL BALANCE — PRINT
 * ----------------------------------------------------------------------------
 * Rebuilt on ReportLayout. Reference implementation for the other 11 report
 * print screens, which all follow this shape.
 *
 * WHAT THE SHELL FIXED HERE:
 *
 *   - Column headings REPEAT on every page. A trial balance is the longest
 *     report in the system — a real chart of accounts runs to several hundred
 *     lines — and previously every page after the first was four unlabelled
 *     columns of numbers. This is the single worst printing defect in the
 *     product and it affected exactly the report where it hurts most.
 *   - The period is printed in the header as a report FILTER. It was present
 *     before, but as ad-hoc text; making it a structured filter means every
 *     report prints its parameters the same way and a paper copy stays
 *     auditable once it leaves the screen.
 *   - The out-of-balance difference is now shown in the summary band and
 *     flagged red when non-zero. Previously the report printed `is_balanced`
 *     nowhere at all — a reader had to subtract the two totals by hand to
 *     discover the ledger did not balance, which is the one question a trial
 *     balance exists to answer.
 *   - Currency and dates now use the company's configured settings; the old
 *     version called the helpers without pageProps and silently fell back to
 *     defaults.
 */

interface TrialBalanceAccount {
    id: number;
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
}

interface TrialBalanceData {
    accounts: TrialBalanceAccount[];
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
    from_date: string;
    to_date: string;
}

interface TrialBalanceProps {
    trialBalance: TrialBalanceData;
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<TrialBalanceProps>().props;
    const { trialBalance } = pageProps;

    const money = (value: any) => formatCurrency(value ?? 0, pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    const difference = Number(trialBalance.total_debit) - Number(trialBalance.total_credit);
    const balanced = Math.abs(difference) < 0.005;

    const columns: DocumentColumn[] = [
        { key: 'code', header: 'Account Code', width: '28mm' },
        { key: 'name', header: 'Account Name' },
        { key: 'debit', header: 'Debit', align: 'end', width: '34mm' },
        { key: 'credit', header: 'Credit', align: 'end', width: '34mm' },
    ];

    return (
        <>
            <Head title={t('Trial Balance')} />

            <ReportLayout
                title="Trial Balance"
                subtitle="Closing debit and credit balance for every ledger account."
                filename={`trial-balance-${trialBalance.from_date}-to-${trialBalance.to_date}`}
                backUrl={route('double-entry.trial-balance.index')}
                filters={[
                    {
                        label: 'Period',
                        value: `${date(trialBalance.from_date)} — ${date(trialBalance.to_date)}`,
                    },
                    { label: 'Accounts', value: trialBalance.accounts.length },
                ]}
                summary={[
                    { label: 'Total Debit', value: money(trialBalance.total_debit) },
                    { label: 'Total Credit', value: money(trialBalance.total_credit) },
                    {
                        // The question this report exists to answer. It belongs
                        // at the top, not left for the reader to subtract.
                        label: balanced ? 'Balanced' : 'Out of Balance',
                        value: balanced ? t('Yes') : money(Math.abs(difference)),
                        emphasis: true,
                        warn: !balanced,
                    },
                ]}
            >
                <DocumentTable
                    columns={columns}
                    rows={trialBalance.accounts}
                    emptyText="No ledger accounts have activity in this period."
                    render={(account: TrialBalanceAccount, column) => {
                        switch (column.key) {
                            case 'code':
                                return <span className="tabular-nums">{account.account_code}</span>;
                            case 'name':
                                return account.account_name;
                            case 'debit':
                                // A dash rather than a zero: on a trial balance
                                // every account has a balance on ONE side only,
                                // and printing 0.00 in the other column doubles
                                // the number of figures the eye has to discard.
                                return Number(account.debit) > 0 ? money(account.debit) : '—';
                            case 'credit':
                                return Number(account.credit) > 0 ? money(account.credit) : '—';
                            default:
                                return null;
                        }
                    }}
                    footer={
                        <tr>
                            <td colSpan={2} className="pt-3 font-bold">
                                {t('Total')}
                            </td>
                            <td className="doc-num pt-3 font-bold">{money(trialBalance.total_debit)}</td>
                            <td className="doc-num pt-3 font-bold">{money(trialBalance.total_credit)}</td>
                        </tr>
                    }
                />

                {!balanced && (
                    <p className="doc-no-break mt-4 border border-[#ef1e1e] bg-[#fef4f4] px-3 py-2 text-[9.5pt] text-[#ef1e1e]">
                        {t('This trial balance does not balance. Review journal entries where debits do not equal credits before relying on any report derived from this period.')}
                    </p>
                )}
            </ReportLayout>
        </>
    );
}
