// packages/workdo/Account/src/Resources/js/Pages/JournalEntries/Index.tsx
import { useState } from 'react';
import ImportDialog from '@/components/import-dialog';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { Pagination } from '@/components/ui/pagination';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import NoRecordsFound from '@/components/no-records-found';
import { PageActionBar, actionRoute, type PageAction } from '@/components/page-action-bar';
import { Eye, Plus, Check, Undo2, Lock, BookOpen, Upload } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { PageProps } from '@/types';

type JournalEntry = {
    id: number;
    journal_number: string;
    journal_date: string;
    entry_type: 'manual' | 'automatic';
    reference_type: string;
    description: string;
    total_debit: string;
    total_credit: string;
    status: 'draft' | 'posted' | 'reversed';
    items_count: number;
};

const statusStyles: Record<JournalEntry['status'], string> = {
    draft: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    posted: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    reversed: 'bg-slate-200 text-slate-700 hover:bg-slate-200',
};

export default function Index({ journalEntries, filters: initialFilters }: any) {
    const { t } = useTranslation();
    const { auth } = usePage<PageProps>().props as any;
    const [filters, setFilters] = useState(initialFilters || {});
    const [importOpen, setImportOpen] = useState(false);

    const applyFilters = (next: Record<string, any>) => {
        const merged = { ...filters, ...next };
        setFilters(merged);
        router.get(route('account.journal-entries.index'), merged, {
            preserveState: true,
            replace: true,
        });
    };

    const actions: PageAction[] = [
        {
            label: t('New Journal Entry'),
            href: actionRoute('account.journal-entries.create'),
            icon: Plus,
            permission: 'create-journal-entries',
        },
        {
            // Bulk entry of journal vouchers from a spreadsheet — the way
            // opening balances and month-end adjustments actually arrive.
            label: t('Import'),
            onClick: () => setImportOpen(true),
            icon: Upload,
            variant: 'primary',
            permission: 'create-journal-entries',
        },
        {
            label: t('Chart of Accounts'),
            href: actionRoute('account.chart-of-accounts.index'),
            variant: 'outline',
            permission: 'manage-chart-of-accounts',
        },
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Journal Entries') }]}
            pageTitle={t('Journal Entries')}
            pageDescription={t('Manual adjustments and the automatic entries raised by your transactions.')}
            pageActions={<PageActionBar actions={actions} permissions={auth.user?.permissions} />}
        >
            <Head title={t('Journal Entries')} />

            <Card className="shadow-sm">
                <CardContent className="border-b bg-gray-50/50 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-[220px] flex-1">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value: string) => setFilters({ ...filters, search: value })}
                                onSearch={() => applyFilters({})}
                                placeholder={t('Search by number or description...')}
                            />
                        </div>

                        <Select
                            value={filters.entry_type || 'all'}
                            onValueChange={(value) => applyFilters({ entry_type: value === 'all' ? '' : value })}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder={t('All Types')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Types')}</SelectItem>
                                <SelectItem value="manual">{t('Manual')}</SelectItem>
                                <SelectItem value="automatic">{t('Automatic')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => applyFilters({ status: value === 'all' ? '' : value })}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder={t('All Statuses')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                <SelectItem value="draft">{t('Draft')}</SelectItem>
                                <SelectItem value="posted">{t('Posted')}</SelectItem>
                                <SelectItem value="reversed">{t('Reversed')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>

                <CardContent className="p-0">
                    {journalEntries.data.length === 0 ? (
                        <NoRecordsFound
                            icon={BookOpen}
                            title={t('No journal entries yet')}
                            description={t('Create a manual entry to record an adjustment, accrual or opening balance.')}
                            hasFilters={!!(filters.search || filters.status || filters.entry_type)}
                            onClearFilters={() => applyFilters({ search: '', status: '', entry_type: '' })}
                            createPermission="create-journal-entries"
                            createButtonText={t('New Journal Entry')}
                            onCreateClick={() => router.get(route('account.journal-entries.create'))}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">{t('Number')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Date')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Description')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Type')}</th>
                                        <th className="px-4 py-3 text-right font-medium">{t('Debit')}</th>
                                        <th className="px-4 py-3 text-right font-medium">{t('Credit')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Status')}</th>
                                        <th className="px-4 py-3 text-right font-medium">{t('Action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalEntries.data.map((entry: JournalEntry) => (
                                        <tr key={entry.id} className="border-t hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-xs">{entry.journal_number}</td>
                                            <td className="px-4 py-3">{formatDate(entry.journal_date)}</td>
                                            <td className="max-w-xs truncate px-4 py-3">{entry.description}</td>
                                            <td className="px-4 py-3">
                                                {entry.entry_type === 'manual' ? (
                                                    <span className="text-muted-foreground">{t('Manual')}</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                        <Lock className="h-3 w-3" />
                                                        {t('Automatic')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(entry.total_debit)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(entry.total_credit)}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className={statusStyles[entry.status]}>
                                                    {t(entry.status.charAt(0).toUpperCase() + entry.status.slice(1))}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {entry.status === 'draft' &&
                                                        entry.entry_type === 'manual' &&
                                                        auth.user?.permissions?.includes('post-journal-entries') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title={t('Post')}
                                                                className="h-8 w-8 p-0 text-emerald-600"
                                                                onClick={() =>
                                                                    router.post(
                                                                        route('account.journal-entries.post', entry.id),
                                                                    )
                                                                }
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    {entry.status === 'posted' &&
                                                        entry.entry_type === 'manual' &&
                                                        auth.user?.permissions?.includes('post-journal-entries') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title={t('Reverse')}
                                                                className="h-8 w-8 p-0 text-amber-600"
                                                                onClick={() =>
                                                                    router.post(
                                                                        route(
                                                                            'account.journal-entries.reverse',
                                                                            entry.id,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <Undo2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title={t('View')}
                                                        className="h-8 w-8 p-0 text-green-600"
                                                        onClick={() =>
                                                            router.get(route('account.journal-entries.show', entry.id))
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t p-4">
                    <PerPageSelector
                        routeName="account.journal-entries.index"
                        filters={filters}
                    />
                    <Pagination
                        data={{ ...journalEntries, ...journalEntries.meta }}
                        routeName="account.journal-entries.index"
                        filters={filters}
                    />
                </CardFooter>
            </Card>
            <ImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                importRoute="account.journal-entries.import"
                templateRoute="account.journal-entries.import.template"
                title={t('Import Journal Entries')}
            />
        </AuthenticatedLayout>
    );
}
