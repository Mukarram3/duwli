// packages/workdo/Account/src/Resources/js/Pages/CustomerPayments/Index.tsx
import { useState, useEffect } from 'react';
import { PageActionBar } from '@/components/page-action-bar';
import { getRelatedActions } from '@/utils/page-actions';
import { RowActions } from '@/components/row-actions';
import {
    EntityCell, ReferenceCell, TextCell, DateCell, MoneyCell,
    StatusBadge, EmptyState,
} from '@/components/duwli';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { actionRoute } from '@/components/page-action-bar';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog } from "@/components/ui/dialog";
import { Eye, Trash2, CheckCircle, Plus, CreditCard, X, FileDown, Wallet, Printer, Ban, Filter, RotateCcw} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { formatCurrency, formatDate } from '@/utils/helpers';
import NoRecordsFound from '@/components/no-records-found';
import Create from './Create';
import View from './View';
import { CustomerPaymentsIndexProps, CustomerPaymentModalState, CustomerPayment } from './types';

interface CustomerPaymentFilters {
    search: string;
    customer_id: string;
    status: string;
    date_range: string;
    /** Receipt number or the customer's own reference. */
    reference: string;
    /** Allocation state: unused | partially_used | used. Derived, not stored. */
    kind: string;
    bank_account_id: string;
    date_from: string;
    date_to: string;
    min_amount: string;
    max_amount: string;
    fiscal_year: string;
    fiscal_period: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { payments, customers, bankAccounts, filters: initialFilters, auth, fiscalYears, prefill } = usePage<any>().props;

    /*
     * Arriving from the Payment icon on a sales invoice: the controller has
     * already resolved the invoice into a prefill payload, so open the create
     * form straight away rather than making the user click New as well.
     *
     * Runs once on mount. Re-opening on every render would trap the user in a
     * dialog they cannot close.
     */
    useEffect(() => {
        if (prefill) {
            setModalState({ isOpen: true, mode: 'add', data: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const can = (permission: string) => Boolean(auth.user?.permissions?.includes(permission));
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CustomerPaymentFilters>({
        search: initialFilters?.search || '',
        customer_id: initialFilters?.customer_id || '',
        status: initialFilters?.status || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })()
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || 'created_at');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);
    const [modalState, setModalState] = useState<CustomerPaymentModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<CustomerPayment | null>(null);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.customer-payments.destroy',
        defaultMessage: t('Are you sure you want to delete this payment?')
    });

    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'pending': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800';
            case 'cleared': return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
            default: return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
        }
    };

    const handleFilter = () => {
        const filterParams = {...filters};

        // Convert date_range to date_from and date_to for backend
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('account.customer-payments.index'), {...filterParams, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('account.customer-payments.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            search: '', customer_id: '', status: '', date_range: '',
            reference: '', kind: '', bank_account_id: '',
            date_from: '', date_to: '', min_amount: '', max_amount: '',
            fiscal_year: '', fiscal_period: '',
        });
        router.get(route('account.customer-payments.index'), {per_page: perPage, view: viewMode});
    };

    const handleStatusUpdate = (paymentId: number, status: string) => {
        router.patch(route('account.customer-payments.update-status', paymentId), { status });
    };

    const openModal = (mode: 'add', data: CustomerPayment | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            // Column order follows the reference: Contact first — it is what a
            // user scans for.
            key: 'customer',
            header: t('Contact'),
            render: (value: any) => (
                <EntityCell name={value?.name} secondary={value?.email} />
            ),
        },
        {
            key: 'payment_number',
            header: t('Reference'),
            sortable: true,
            render: (value: string, payment: any) => (
                <ReferenceCell value={value} secondary={payment.reference_number} />
            ),
        },
        {
            key: 'kind',
            header: t('Kind'),
            // Derived from the allocations — see the controller.
            render: (_: any, payment: any) => (
                <StatusBadge
                    status={payment.kind || 'unused'}
                    label={
                        payment.kind === 'used' ? 'Used'
                        : payment.kind === 'partially_used' ? 'Partially Used'
                        : 'Unused'
                    }
                    tone={
                        payment.kind === 'used' ? 'success'
                        : payment.kind === 'partially_used' ? 'warning'
                        : 'neutral'
                    }
                />
            ),
        },
        {
            key: 'bank_account',
            header: t('Account'),
            render: (value: any) => <TextCell value={value?.account_name} />,
        },
        {
            key: 'notes',
            header: t('Description'),
            render: (value: any) => (
                <span className="line-clamp-2 max-w-[240px] text-sm">
                    <TextCell value={value} />
                </span>
            ),
        },
        {
            key: 'payment_date',
            header: t('Date'),
            sortable: true,
            render: (value: string) => <DateCell value={value} />,
        },
        {
            key: 'payment_amount',
            header: t('Amount'),
            sortable: true,
            className: 'text-end',
            render: (value: number) => <MoneyCell value={value} bold />,
        },
        {
            key: 'unallocated_amount',
            header: t('Unallocated Amount'),
            className: 'text-end',
            render: (_: any, payment: any) => (
                // Money received but not yet matched to an invoice. Coloured
                // only when there is some — that is the actionable case.
                <MoneyCell
                    value={payment.unallocated_amount}
                    className={
                        Number(payment.unallocated_amount) > 0
                            ? 'font-semibold text-amber-600 dark:text-amber-400'
                            : undefined
                    }
                />
            ),
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string) => <StatusBadge status={value} />,
        },
        {
            key: 'actions',
            header: t('Actions'),
            className: 'text-end',
            /*
             * Same icon set on every row. Actions the user lacks PERMISSION for
             * are removed; actions merely unavailable FOR THIS ROW are greyed
             * out with the reason in the tooltip.
             *
             * The previous version hid everything conditionally, so one row
             * showed four icons and the next showed one — and the user could
             * not tell whether an action was forbidden or simply not applicable
             * yet. Those are different messages.
             */
            render: (_: any, payment: any) => {
                const isPending = payment.status === 'pending';
                const isCleared = payment.status === 'cleared';
                const isCancelled = payment.status === 'cancelled';

                return (
                    <RowActions
                        className="justify-end"
                        actions={[
                            {
                                label: t('View'),
                                icon: Eye,
                                onClick: () => setViewingItem(payment),
                                className: 'text-green-600 hover:text-green-700',
                                permitted: can('view-customer-payments'),
                            },
                            {
                                label: t('Mark as Cleared'),
                                icon: CheckCircle,
                                onClick: () => handleStatusUpdate(payment.id, 'cleared'),
                                className: 'text-blue-600 hover:text-blue-700',
                                permitted: can('cleared-customer-payments'),
                                available: isPending,
                                disabledReason: isCleared
                                    ? t('Already cleared')
                                    : t('Cancelled payments cannot be cleared'),
                            },
                            {
                                label: t('Download'),
                                icon: FileDown,
                                onClick: () => { window.location.href = route('account.customer-payments.export', { id: payment.id }); },
                                className: 'text-slate-600 hover:text-slate-700',
                                permitted: can('manage-customer-payments'),
                            },
                            {
                                label: t('Print'),
                                icon: Printer,
                                onClick: () => window.print(),
                                className: 'text-slate-600 hover:text-slate-700',
                                permitted: can('manage-customer-payments'),
                            },
                            {
                                label: t('Cancel Payment'),
                                icon: Ban,
                                onClick: () => handleStatusUpdate(payment.id, 'cancelled'),
                                className: 'text-amber-600 hover:text-amber-700',
                                permitted: can('cleared-customer-payments'),
                                available: !isCancelled,
                                disabledReason: t('Already cancelled'),
                            },
                            {
                                label: t('Delete'),
                                icon: Trash2,
                                onClick: () => openDeleteDialog(payment.id),
                                className: 'text-destructive hover:text-destructive',
                                permitted: can('delete-customer-payments'),
                                available: isPending,
                                // Once cleared the ledger refers to this row;
                                // removing it would orphan the journal entry.
                                disabledReason: t('Cleared payments cannot be deleted — cancel them instead'),
                            },
                        ]}
                    />
                );
            },
        },
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Accounting'), url: route('account.index')},
                {label: t('Customer Payments')}
            ]}
            pageTitle={t('Manage Customer Payments')}
            pageActions={
                <PageActionBar
                    actions={[
                        {
                            label: t('New Customer Receipt'),
                            onClick: () => openModal('add'),
                            icon: Plus,
                            variant: 'primary',
                            permission: 'create-customer-payments',
                        },
                        ...getRelatedActions('account.customer-payments.index', t),
                        {
                            /*
                             * All Receipts — the combined customer + vendor
                             * view. It belongs HERE rather than as a
                             * cross-link, because it is a wider view of this
                             * same subject, not a jump to a different one.
                             */
                            label: t('All Receipts'),
                            href: actionRoute('account.vendor-payments.all-receipts'),
                            icon: Wallet,
                            variant: 'outline',
                            permission: 'manage-customer-payments',
                        },
                        {
                            /*
                             * Export. The vendor side has had this since the
                             * module was written; the customer side never did,
                             * which is why the two screens offered different
                             * actions. Route and controller method added.
                             */
                            label: t('Export'),
                            href: actionRoute('account.customer-payments.export'),
                            icon: FileDown,
                            variant: 'outline',
                            external: true,
                            permission: 'manage-customer-payments',
                        },
                    ]}
                    permissions={auth.user?.permissions}
                    maxVisible={5}
                />
            }
        >
            <Head title={t('Customer Payments')} />

            <Card className="shadow-sm">
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value) => setFilters({...filters, search: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search payments...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="account.customer-payments.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="account.customer-payments.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer_id, filters.status, filters.date_range].filter(Boolean).length;
                                    return activeFilters > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {activeFilters}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/*
                  FULL FILTER PANEL, as the reference lays it out.
                  Every control maps to a query parameter the controller
                  resolves in SQL, so a filtered list paginates correctly and
                  the record count matches the rows shown.
                */}
                {showFilters && (
                    <CardContent className="border-b bg-muted/30 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <Label className="mb-1.5 block text-xs">{t('Reference')}</Label>
                                <Input
                                    value={filters.reference || ''}
                                    onChange={(e) => setFilters({ ...filters, reference: e.target.value })}
                                    placeholder={t('Receipt or reference no.')}
                                />
                            </div>

                            <div>
                                <Label className="mb-1.5 block text-xs">{t('Kind')}</Label>
                                {/* Allocation state, derived from the receipt's
                                    applications — see the controller. */}
                                <Select value={filters.kind || 'all'}
                                    onValueChange={(v) => setFilters({ ...filters, kind: v === 'all' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder={t('Any')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('Any')}</SelectItem>
                                        <SelectItem value="unused">{t('Unused')}</SelectItem>
                                        <SelectItem value="partially_used">{t('Partially Used')}</SelectItem>
                                        <SelectItem value="used">{t('Used')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-1.5 block text-xs">{t('Status')}</Label>
                                <Select value={filters.status || 'all'}
                                    onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder={t('Any')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('Any')}</SelectItem>
                                        <SelectItem value="pending">{t('Pending')}</SelectItem>
                                        <SelectItem value="cleared">{t('Cleared')}</SelectItem>
                                        <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-1.5 block text-xs">{t('Payment Account')}</Label>
                                <Select value={filters.bank_account_id || 'all'}
                                    onValueChange={(v) => setFilters({ ...filters, bank_account_id: v === 'all' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder={t('Any')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('Any')}</SelectItem>
                                        {bankAccounts.map((account: any) => (
                                            <SelectItem key={account.id} value={String(account.id)}>
                                                {account.account_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-1.5 block text-xs">{t('Contact Name or Ref. No.')}</Label>
                                <Input
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    placeholder={t('Search')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="mb-1.5 block text-xs">{t('Min Amount')}</Label>
                                    <Input type="number" step="any" value={filters.min_amount || ''}
                                        onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="mb-1.5 block text-xs">{t('Max Amount')}</Label>
                                    <Input type="number" step="any" value={filters.max_amount || ''}
                                        onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="mb-1.5 block text-xs">{t('From')}</Label>
                                    <Input type="date" value={filters.date_from || ''}
                                        onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="mb-1.5 block text-xs">{t('To')}</Label>
                                    <Input type="date" value={filters.date_to || ''}
                                        onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="mb-1.5 block text-xs">{t('Fiscal Year')}</Label>
                                    {/* Only years that actually have receipts. An
                                        empty year in a picker is a dead end. */}
                                    <Select value={filters.fiscal_year || 'all'}
                                        onValueChange={(v) => setFilters({ ...filters, fiscal_year: v === 'all' ? '' : v })}>
                                        <SelectTrigger><SelectValue placeholder={t('Any')} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('Any')}</SelectItem>
                                            {(fiscalYears || []).map((year: any) => (
                                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="mb-1.5 block text-xs">{t('Fiscal Period')}</Label>
                                    <Select value={filters.fiscal_period || 'all'}
                                        onValueChange={(v) => setFilters({ ...filters, fiscal_period: v === 'all' ? '' : v })}>
                                        <SelectTrigger><SelectValue placeholder={t('Any')} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('Any')}</SelectItem>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                                <SelectItem key={month} value={String(month)}>
                                                    {new Date(2000, month - 1, 1).toLocaleString(undefined, { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm" className="gap-1.5">
                                    <Filter className="h-3.5 w-3.5" />
                                    {t('Filter')}
                                </Button>
                                <Button variant="outline" onClick={clearFilters} size="sm" className="gap-1.5">
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    {t('Reset')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={payments.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={CreditCard}
                                            title={t('No payments found')}
                                            description={t('Get started by creating your first customer payment.')}
                                            hasFilters={!!(filters.search || filters.customer_id || filters.status || filters.date_range)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-customer-payments"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Payment')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-6">
                            {payments.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
                                    {payments.data.map((payment) => (
                                        <Card key={payment.id} className="border border-gray-200 flex flex-col">
                                            <div className="p-4 flex-1">
                                                <div className="mb-3">
                                                    {auth.user?.permissions?.includes('view-customer-payments') ? (
                                                        <h3 className="font-semibold text-base text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => setViewingItem(payment)}>{payment.payment_number}</h3>
                                                    ) : (
                                                        <h3 className="font-semibold text-base text-gray-900">{payment.payment_number}</h3>
                                                    )}
                                                </div>

                                                <div className="space-y-3 mb-3">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">{t('Customer')}</p>
                                                        <p className="text-sm text-gray-900 truncate font-medium">{payment.customer?.name}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1">{t('Date')}</p>
                                                            <p className="text-xs text-gray-900">{formatDate(payment.payment_date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1 text-end">{t('Bank Account')}</p>
                                                            <p className="text-xs text-gray-900 text-end">{payment.bank_account?.account_name || '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-semibold text-gray-900">{t('Amount')}</span>
                                                            <span className="text-lg font-bold text-green-600">{formatCurrency(parseFloat(payment.payment_amount.toString()))}</span>
                                                        </div>
                                                    </div>
                                                    {payment.notes && (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1">{t('Notes')}</p>
                                                            <p className="text-xs text-gray-900 line-clamp-2">{payment.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between p-3 border-t bg-gray-50/50">
                                                <span className={`px-2 py-1 rounded-full text-sm ${
                                                    payment.status === 'cleared' ? 'bg-green-100 text-green-800' :
                                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {t(payment.status)}
                                                </span>
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        {payment.status === 'pending' && auth.user?.permissions?.includes('cleared-customer-payments') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStatusUpdate(payment.id, 'cleared')}
                                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Mark as Cleared')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {payment.status === 'pending' && auth.user?.permissions?.includes('cleared-customer-payments') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStatusUpdate(payment.id, 'cancelled')}
                                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Cancel Payment')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('view-customer-payments') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setViewingItem(payment)}
                                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('View')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {payment.status === 'pending' && auth.user?.permissions?.includes('delete-customer-payments') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openDeleteDialog(payment.id)}
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Delete')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={CreditCard}
                                    title={t('No payments found')}
                                    description={t('Get started by creating your first customer payment.')}
                                    hasFilters={!!(filters.search || filters.customer_id || filters.status || filters.date_range)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-customer-payments"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Payment')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={{...payments, ...payments.meta}}
                        routeName="account.customer-payments.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create
                        customers={customers}
                        bankAccounts={bankAccounts}
                        onSuccess={closeModal}
                        prefill={prefill}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View payment={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Payment')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
