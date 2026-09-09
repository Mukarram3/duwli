// packages/workdo/Account/src/Resources/js/Pages/JournalEntries/Index.tsx
import { useState } from 'react';
import ImportDialog from '@/components/import-dialog';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { PageActionBar, actionRoute, type PageAction } from '@/components/page-action-bar';
import {
    KpiStrip, FilterBar, EmptyState, StatusBadge,
    MoneyCell, DateCell, ReferenceCell, TextCell,
    type ActiveFilter,
} from '@/components/duwli';
import { RowActions } from '@/components/row-actions';
import {
    Eye, Plus, Check, Undo2, Lock, BookOpen, FileUp,
    FileEdit, Scale, AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
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

export default function Index({ journalEntries, filters: initialFilters, stats }: any) {
    const { t } = useTranslation();
    const pageProps = usePage<PageProps>().props as any;
    const { auth } = pageProps;
    const [filters, setFilters] = useState(initialFilters || {});
    const [importOpen, setImportOpen] = useState(false);

    const can = (permission: string) => Boolean(auth.user?.permissions?.includes(permission));

    const applyFilters = (next: Record<string, any>) => {
        const merged = { ...filters, ...next };
        setFilters(merged);
        router.get(route('account.journal-entries.index'), merged, {
            preserveState: true,
            replace: true,
        });
    };

    const clearAll = () =>
        applyFilters({ search: '', status: '', entry_type: '', date_from: '', date_to: '' });

    const typeLabels: Record<string, string> = { manual: 'Manual', automatic: 'Automatic' };

    /** Chips describing what is currently filtering the table. */
    const activeFilters: ActiveFilter[] = ([
        { key: 'status', label: 'Status', value: filters.status ? t(filters.status) : '' },
        { key: 'entry_type', label: 'Type', value: filters.entry_type ? t(typeLabels[filters.entry_type]) : '' },
        { key: 'date_from', label: 'From', value: filters.date_from || '' },
        { key: 'date_to', label: 'To', value: filters.date_to || '' },
    ] as ActiveFilter[]).filter((f) => Boolean(f.value));

    const hasAnyFilter =
        Boolean(filters.search || filters.status || filters.entry_type || filters.date_from || filters.date_to);

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
            icon: FileUp,
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

    /**
     * Row actions are the same on every row. Post and Reverse only apply to
     * manual entries in the right state — those are DISABLED with a reason
     * rather than hidden, so the action column has a constant shape and the
     * user learns why an entry cannot be posted instead of wondering where the
     * button went.
     */
    const rowActionsFor = (entry: JournalEntry) => [
        {
            label: t('Post'),
            icon: Check,
            onClick: () => router.post(route('account.journal-entries.post', entry.id)),
            className: 'text-emerald-600 hover:text-emerald-700',
            permitted: can('post-journal-entries'),
            available: entry.status === 'draft' && entry.entry_type === 'manual',
            disabledReason:
                entry.entry_type !== 'manual'
                    ? t('Automatic entries are posted by the system')
                    : t('Only draft entries can be posted'),
        },
        {
            label: t('Reverse'),
            icon: Undo2,
            onClick: () => router.post(route('account.journal-entries.reverse', entry.id)),
            className: 'text-amber-600 hover:text-amber-700',
            permitted: can('post-journal-entries'),
            available: entry.status === 'posted' && entry.entry_type === 'manual',
            disabledReason:
                entry.entry_type !== 'manual'
                    ? t('Automatic entries cannot be reversed manually')
                    : t('Only posted entries can be reversed'),
        },
        {
            label: t('View'),
            icon: Eye,
            onClick: () => router.get(route('account.journal-entries.show', entry.id)),
            className: 'text-green-600 hover:text-green-700',
        },
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Accounting'), url: route('account.index') }, { label: t('Journal Entries') }]}
            pageTitle={t('Journal Entries')}
            pageDescription={t('Manual adjustments and the automatic entries raised by your transactions.')}
            pageIcon={BookOpen}
            pageCount={journalEntries.total ?? journalEntries.meta?.total}
            onExportExcel={
                can('manage-journal-entries') && actionRoute('account.journal-entries.export')
                    ? () => { window.location.href = actionRoute('account.journal-entries.export') as string; }
                    : undefined
            }
            pageActions={<PageActionBar actions={actions} permissions={auth.user?.permissions} />}
        >
            <Head title={t('Journal Entries')} />

            {/*
              "Unbalanced" is the figure that matters on this screen. A posted
              entry whose debits do not equal its credits corrupts every report
              downstream, so it is surfaced here rather than discovered later in
              a trial balance. It should always read zero — when it does not,
              the card turns red.
            */}
            {stats && (
                <KpiStrip
                    items={[
                        {
                            label: 'Posted This Month',
                            value: formatCurrency(stats.postedValue, pageProps),
                            caption: `${stats.postedThisMonth} ${t('entries')}`,
                            icon: Scale,
                            tone: 'gradient',
                        },
                        {
                            label: 'Draft Entries',
                            value: String(stats.drafts),
                            caption: 'Awaiting posting',
                            icon: FileEdit,
                            tone: stats.drafts > 0 ? 'warning' : 'plain',
                            href: route('account.journal-entries.index', { status: 'draft' }),
                        },
                        {
                            label: 'Unbalanced',
                            value: String(stats.unbalanced),
                            caption: 'Posted entries that do not balance',
                            icon: AlertTriangle,
                            tone: stats.unbalanced > 0 ? 'danger' : 'success',
                        },
                        {
                            label: 'Total Entries',
                            value: String(stats.total),
                            icon: BookOpen,
                            tone: 'plain',
                        },
                    ]}
                />
            )}

            <Card className="shadow-sm">
                <CardContent className="border-b bg-muted/30 p-4">
                    <FilterBar
                        className="mb-0"
                        search={filters.search || ''}
                        onSearchChange={(value) => setFilters({ ...filters, search: value })}
                        searchPlaceholder="Search by number or description..."
                        activeFilters={activeFilters}
                        onRemoveFilter={(key) => applyFilters({ [key]: '' })}
                        onClearAll={clearAll}
                        trailing={
                            <>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => applyFilters({ status: value === 'all' ? '' : value })}
                                >
                                    <SelectTrigger className="h-9 w-40">
                                        <SelectValue placeholder={t('All Statuses')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                        <SelectItem value="draft">{t('Draft')}</SelectItem>
                                        <SelectItem value="posted">{t('Posted')}</SelectItem>
                                        <SelectItem value="reversed">{t('Reversed')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <PerPageSelector
                                    routeName="account.journal-entries.index"
                                    filters={filters}
                                />
                            </>
                        }
                    >
                        <div className="space-y-1.5">
                            <Label>{t('Entry Type')}</Label>
                            <Select
                                value={filters.entry_type || 'all'}
                                onValueChange={(value) => applyFilters({ entry_type: value === 'all' ? '' : value })}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={t('All Types')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('All Types')}</SelectItem>
                                    <SelectItem value="manual">{t('Manual')}</SelectItem>
                                    <SelectItem value="automatic">{t('Automatic')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label>{t('From')}</Label>
                                <Input
                                    type="date"
                                    className="h-9"
                                    value={filters.date_from || ''}
                                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('To')}</Label>
                                <Input
                                    type="date"
                                    className="h-9"
                                    value={filters.date_to || ''}
                                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button size="sm" className="w-full" onClick={() => applyFilters({})}>
                            {t('Apply')}
                        </Button>
                    </FilterBar>
                </CardContent>

                <CardContent className="p-0">
                    {journalEntries.data.length === 0 ? (
                        hasAnyFilter ? (
                            <EmptyState variant="filtered" onClearFilters={clearAll} />
                        ) : (
                            <EmptyState
                                variant="empty"
                                icon={BookOpen}
                                title="No journal entries yet"
                                description="Create a manual entry to record an adjustment, accrual or opening balance."
                                createPermission="create-journal-entries"
                                createLabel="New Journal Entry"
                                onCreate={() => router.get(route('account.journal-entries.create'))}
                            />
                        )
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-start">
                                    <tr>
                                        <th className="px-4 py-3 text-start font-medium">{t('Number')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('Date')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('Description')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('Type')}</th>
                                        <th className="px-4 py-3 text-end font-medium">{t('Debit')}</th>
                                        <th className="px-4 py-3 text-end font-medium">{t('Credit')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('Status')}</th>
                                        <th className="px-4 py-3 text-end font-medium">{t('Action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalEntries.data.map((entry: JournalEntry) => {
                                        // Flagged inline as well as in the KPI strip: the user needs
                                        // to know WHICH entry is broken, not just that one is.
                                        const unbalanced =
                                            entry.status === 'posted' &&
                                            Number(entry.total_debit) !== Number(entry.total_credit);

                                        return (
                                            <tr key={entry.id} className="border-t hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <ReferenceCell
                                                        value={entry.journal_number}
                                                        href={route('account.journal-entries.show', entry.id)}
                                                        secondary={`${entry.items_count} ${t('lines')}`}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <DateCell value={entry.journal_date} />
                                                </td>
                                                <td className="max-w-xs truncate px-4 py-3">
                                                    <TextCell value={entry.description} />
                                                </td>
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
                                                <td className="px-4 py-3">
                                                    <MoneyCell value={entry.total_debit} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <MoneyCell
                                                        value={entry.total_credit}
                                                        className={unbalanced ? 'text-red-600 dark:text-red-400' : undefined}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <StatusBadge status={entry.status} />
                                                        {unbalanced && (
                                                            <span title={t('Debits do not equal credits')}>
                                                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <RowActions className="justify-end" actions={rowActionsFor(entry)} />
                                                </td>
                                            </tr>
                                        );
                                    })}
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
