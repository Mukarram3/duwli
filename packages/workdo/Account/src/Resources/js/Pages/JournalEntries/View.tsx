// packages/workdo/Account/src/Resources/js/Pages/JournalEntries/View.tsx
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageActionBar, actionRoute, type PageAction } from '@/components/page-action-bar';
import { Check, Undo2, Pencil, Lock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { PageProps } from '@/types';

const statusStyles: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    posted: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    reversed: 'bg-slate-200 text-slate-700 hover:bg-slate-200',
};

export default function View({ journalEntry }: any) {
    const { t } = useTranslation();
    const { auth } = usePage<PageProps>().props as any;

    const isManual = journalEntry.entry_type === 'manual';
    const isDraft = journalEntry.status === 'draft';
    const isPosted = journalEntry.status === 'posted';

    const actions: PageAction[] = [];

    if (isManual && isDraft) {
        actions.push({
            label: t('Edit'),
            href: actionRoute('account.journal-entries.edit', journalEntry.id),
            icon: Pencil,
            variant: 'outline',
            permission: 'edit-journal-entries',
        });
        actions.push({
            label: t('Post Entry'),
            onClick: () => router.post(route('account.journal-entries.post', journalEntry.id)),
            icon: Check,
            permission: 'post-journal-entries',
        });
    }

    if (isManual && isPosted) {
        actions.push({
            label: t('Reverse Entry'),
            onClick: () => router.post(route('account.journal-entries.reverse', journalEntry.id)),
            icon: Undo2,
            variant: 'outline',
            permission: 'post-journal-entries',
        });
    }

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Journal Entries'), url: route('account.journal-entries.index') },
                { label: journalEntry.journal_number },
            ]}
            pageTitle={journalEntry.journal_number}
            pageDescription={journalEntry.description}
            backUrl={route('account.journal-entries.index')}
            pageActions={<PageActionBar actions={actions} permissions={auth.user?.permissions} />}
        >
            <Head title={journalEntry.journal_number} />

            <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/30 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardTitle className="text-base">{t('Entry Detail')}</CardTitle>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{formatDate(journalEntry.journal_date)}</span>
                            {!isManual && (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                    <Lock className="h-3 w-3" />
                                    {t('Automatic')}
                                </span>
                            )}
                            <Badge variant="secondary" className={statusStyles[journalEntry.status]}>
                                {t(journalEntry.status.charAt(0).toUpperCase() + journalEntry.status.slice(1))}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3 font-medium">{t('Account')}</th>
                                <th className="px-4 py-3 font-medium">{t('Line Description')}</th>
                                <th className="px-4 py-3 text-right font-medium">{t('Debit')}</th>
                                <th className="px-4 py-3 text-right font-medium">{t('Credit')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journalEntry.items.map((item: any) => (
                                <tr key={item.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {item.account?.account_code}
                                        </span>{' '}
                                        {item.account?.account_name}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{item.description || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        {Number(item.debit_amount) > 0 ? formatCurrency(item.debit_amount) : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {Number(item.credit_amount) > 0 ? formatCurrency(item.credit_amount) : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t bg-muted/30 font-semibold">
                            <tr>
                                <td className="px-4 py-3" colSpan={2}>
                                    {t('Totals')}
                                </td>
                                <td className="px-4 py-3 text-right">{formatCurrency(journalEntry.total_debit)}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(journalEntry.total_credit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>

            {journalEntry.status === 'reversed' && (
                <p className="mt-4 text-sm text-muted-foreground">
                    {t('This entry has been reversed. Account balances no longer reflect it.')}
                </p>
            )}
        </AuthenticatedLayout>
    );
}
