// packages/workdo/Account/src/Resources/js/Pages/VendorPayments/Index.tsx
import { useState } from 'react';
import { PageActionBar, actionRoute } from '@/components/page-action-bar';
import { getRelatedActions } from '@/utils/page-actions';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
    Plus, Eye, Trash2, CreditCard, CheckCircle, X, Layers, Download, FileDown,
    Printer, Ban,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { Input } from '@/components/ui/input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import Create from './Create';
import View from './View';
import {
    EntityCell, ReferenceCell, TextCell, DateCell, MoneyCell,
    StatusBadge, EmptyState, FilterBar, type ActiveFilter,
} from '@/components/duwli';
import { RowActions } from '@/components/row-actions';
import { Label } from '@/components/ui/label';
import { VendorPayment, VendorPaymentsIndexProps, VendorPaymentModalState } from './types';

interface VendorPaymentFilters {
    vendor_id: string;
    status: string;
    search: string;
    date_range: string;
    bank_account_id: string;
}
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { payments, vendors, bankAccounts, filters: initialFilters, auth } = usePage<VendorPaymentsIndexProps>().props;

    const can = (permission: string) => Boolean(auth.user?.permissions?.includes(permission));

    /** Payment being allocated / voided. Both drive their own dialog. */
    const [allocating, setAllocating] = useState<any>(null);
    const [voiding, setVoiding] = useState<any>(null);
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<VendorPaymentFilters>({
        vendor_id: initialFilters?.vendor_id || '',
        status: initialFilters?.status || '',
        search: initialFilters?.search || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })(),
        bank_account_id: initialFilters?.bank_account_id || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || 'created_at');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<VendorPaymentModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<VendorPayment | null>(null);
    const [showFilters, setShowFilters] = useState(false);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.vendor-payments.destroy',
        defaultMessage: t('Are you sure you want to delete this payment?')
    });

    const handleFilter = () => {
        const filterParams: any = {
            search: filters.search,
            vendor_id: filters.vendor_id,
            status: filters.status,
            bank_account_id: filters.bank_account_id,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        };

        // Convert date_range to date_from and date_to for backend
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }

        router.get(route('account.vendor-payments.index'), filterParams, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        const filterParams = { ...filters };

        // Convert date_range to date_from and date_to for backend
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('account.vendor-payments.index'), {...filterParams, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            vendor_id: '',
            status: '',
            search: '',
            date_range: '',
            bank_account_id: ''
        });
        router.get(route('account.vendor-payments.index'), {per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode});
    };

    const openModal = (mode: 'add', data: VendorPayment | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    /**
     * ACTIONS — availability driven by STATUS and PERMISSION together.
     *
     * The rules, and why:
     *
     *   View       always, with permission.
     *   Edit       pending only. A cleared payment has posted to the ledger;
     *              editing it would leave the journal disagreeing with the row.
     *   Allocate   only when there is something left to allocate. A fully
     *              applied payment offering "Allocate" wastes a click and
     *              implies capacity that does not exist.
     *   Download   always, with permission — a record of what was paid.
     *   Print      always. A payment voucher is a physical document.
     *   Delete     pending only. Once cleared, the ledger refers to this row
     *              and removing it would orphan the journal entry.
     *   Void       cleared only. This is the correct way to cancel a posted
     *              payment: it reverses the entries and KEEPS the history,
     *              where delete would erase it.
     *
     * Blocked actions are DISABLED WITH A REASON rather than hidden, so the
     * action column keeps a constant shape down the page and the user learns
     * why rather than wondering where the button went.
     */
    const rowActionsFor = (payment: any) => {
        const isPending = payment.status === 'pending';
        const isCleared = payment.status === 'cleared';
        const isCancelled = payment.status === 'cancelled';
        const unallocated = Number(payment.unallocated_amount ?? 0);

        return [
            {
                label: t('View'),
                icon: Eye,
                onClick: () => setViewingItem(payment),
                className: 'text-green-600 hover:text-green-700',
                permitted: can('view-vendor-payments'),
            },
            /*
             * EDIT is specified but NOT shipped.
             *
             * There is no edit form for a vendor payment — the module only has
             * Create and View, and no update route exists. A button that opens
             * nothing is worse than a missing one, because it gets reported as
             * a bug rather than as a gap.
             *
             * Building it is a small piece: an Edit component mirroring
             * Create, an update() method, and a route. Flagged in the handover.
             */
            {
                label: t('Allocate'),
                icon: Layers,
                onClick: () => setAllocating(payment),
                className: 'text-violet-600 hover:text-violet-700',
                permitted: can('cleared-vendor-payments'),
                available: !isCancelled && unallocated > 0,
                disabledReason: isCancelled
                    ? t('Payment is cancelled')
                    : t('Nothing left to allocate'),
            },
            {
                label: t('Download'),
                icon: FileDown,
                onClick: () => { window.location.href = route('account.vendor-payments.export', { id: payment.id }); },
                className: 'text-slate-600 hover:text-slate-700',
                permitted: can('manage-vendor-payments'),
            },
            {
                label: t('Print'),
                icon: Printer,
                onClick: () => window.print(),
                className: 'text-slate-600 hover:text-slate-700',
                permitted: can('manage-vendor-payments'),
            },
            {
                label: t('Void'),
                icon: Ban,
                onClick: () => setVoiding(payment),
                className: 'text-amber-600 hover:text-amber-700',
                permitted: can('cleared-vendor-payments'),
                available: isCleared,
                // Void exists precisely because delete is wrong once posted.
                available_reason: undefined,
                disabledReason: isCancelled
                    ? t('Already cancelled')
                    : t('Only cleared payments can be voided'),
            },
            {
                label: t('Delete'),
                icon: Trash2,
                onClick: () => openDeleteDialog(payment.id),
                className: 'text-destructive hover:text-destructive',
                permitted: can('delete-vendor-payments'),
                available: isPending,
                disabledReason: t('Posted payments cannot be deleted — void them instead'),
            },
        ];
    };

    const hasAnyFilter = Boolean(
        filters.search || filters.vendor_id || filters.status ||
        filters.date_range || filters.bank_account_id
    );

    /*
     * Split by cause: a filtered list offers a way OUT of the filter, an
     * untouched list offers a way to create the first record. Offering
     * "Create" on a filtered list is how duplicate payments get made.
     */
    const emptyBlock = hasAnyFilter ? (
        <EmptyState variant="filtered" onClearFilters={clearFilters} />
    ) : (
        <EmptyState
            variant="empty"
            icon={CreditCard}
            title="No vendor payments yet"
            description="Record your first payment to a supplier."
            createPermission="create-vendor-payments"
            createLabel="New Vendor Receipt"
            onCreate={() => openModal('add')}
        />
    );

    const tableColumns = [
        {
            key: 'vendor.name',
            header: t('Vendor'),
            render: (_: any, payment: any) => (
                <EntityCell name={payment.vendor?.name} secondary={payment.vendor?.email} />
            ),
        },
        {
            key: 'payment_number',
            header: t('Reference'),
            sortable: true,
            render: (value: string, payment: any) => (
                <ReferenceCell
                    value={value}
                    secondary={payment.reference_number}
                    href={can('view-vendor-payments') ? undefined : undefined}
                />
            ),
        },
        {
            key: 'kind',
            header: t('Kind'),
            // Derived from the allocations, not stored — see the controller.
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
            key: 'bankAccount.account_name',
            header: t('Account'),
            render: (_: any, payment: any) => (
                <TextCell value={payment.bank_account?.account_name} />
            ),
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
                // Money sitting unapplied is the actionable figure on this
                // screen, so it is coloured only when there is some.
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
            render: (_: any, payment: any) => (
                <RowActions className="justify-end" actions={rowActionsFor(payment)} />
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Accounting'), url: route('account.index')},
                {label: t('Vendor Payments')}
            ]}
            pageTitle={t('Manage Vendor Payments')}
            pageActions={
                <PageActionBar
                    actions={[
                        {
                            label: t('New Vendor Receipt'),
                            onClick: () => openModal('add'),
                            icon: Plus,
                            variant: 'primary',
                            permission: 'create-vendor-payments',
                        },
                        {
                            label: t('All Receipts'),
                            href: actionRoute('account.vendor-payments.all-receipts'),
                            icon: Layers,
                            variant: 'primary',
                            permission: 'manage-vendor-payments',
                        },
                        {
                            label: t('Export'),
                            href: actionRoute('account.vendor-payments.export'),
                            icon: FileDown,
                            variant: 'primary',
                            external: true,
                            permission: 'manage-vendor-payments',
                        },
                        ...getRelatedActions('account.vendor-payments.index', t),
                    ]}
                    permissions={auth.user?.permissions}
                    maxVisible={4}
                />
            }
        >
            <Head title={t('Vendor Payments')} />

            <Card className="shadow-sm">
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({...filters, search: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search payments...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="account.vendor-payments.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="account.vendor-payments.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const filtersToCheck = auth.user?.permissions?.includes('manage-users')
                                        ? [filters.vendor_id, filters.status, filters.date_range, filters.bank_account_id]
                                        : [filters.status, filters.date_range, filters.bank_account_id];
                                    const activeFilters = filtersToCheck.filter(f => f !== '').length;
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

                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {auth.user?.permissions?.includes('manage-users') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Vendor')}</label>
                                    <Select value={filters.vendor_id} onValueChange={(value) => setFilters({...filters, vendor_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by Vendor')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vendors?.map((vendor) => (
                                                <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                    {vendor.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {auth.user?.permissions?.includes('manage-bank-accounts') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Bank Account')}</label>
                                    <Select value={filters.bank_account_id} onValueChange={(value) => setFilters({...filters, bank_account_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by bank account')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts?.map((account) => (
                                                <SelectItem key={account.id} value={account.id.toString()}>
                                                    {account.account_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">{t('Pending')}</SelectItem>
                                        <SelectItem value="cleared">{t('Cleared')}</SelectItem>
                                        <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Date Range')}</label>
                                <DateRangePicker
                                    value={filters.date_range}
                                    onChange={(value) => setFilters({...filters, date_range: value})}
                                    placeholder={t('Select date range')}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={payments?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        emptyBlock
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-6">
                            {payments?.data && payments.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
                                    {payments.data.map((payment) => (
                                        <Card key={payment.id} className="border border-gray-200 flex flex-col">
                                            <div className="p-4 flex-1">
                                                <div className="mb-3">
                                                    {auth.user?.permissions?.includes('view-vendor-payments') ? (
                                                        <h3 className="font-semibold text-base text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => setViewingItem(payment)}>{payment.payment_number}</h3>
                                                    ) : (
                                                        <h3 className="font-semibold text-base text-gray-900">{payment.payment_number}</h3>
                                                    )}
                                                </div>

                                                <div className="space-y-3 mb-3">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">{t('Vendor')}</p>
                                                        <p className="text-sm text-gray-900 truncate font-medium">{payment.vendor?.name}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1">{t('Date')}</p>
                                                            <p className="text-xs text-gray-900">{formatDate(payment.payment_date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-1 text-end">{t('Bank Account')}</p>
                                                            <p className="text-xs text-gray-900 text-end">{payment.bank_account?.account_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-semibold text-gray-900">{t('Amount')}</span>
                                                            <span className="text-lg font-bold text-green-600">{formatCurrency(payment.payment_amount)}</span>
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
                                                        {payment.status === 'pending' && auth.user?.permissions?.includes('cleared-vendor-payments') && (
                                                            <>
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => router.post(route('account.vendor-payments.update-status', payment.id), { status: 'cleared' })}
                                                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                                                        >
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('Mark as Cleared')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => router.post(route('account.vendor-payments.update-status', payment.id), { status: 'cancelled' })}
                                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('Cancel Payment')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        {auth.user?.permissions?.includes('view-vendor-payments') && (
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
                                                        {payment.status === 'pending' && auth.user?.permissions?.includes('delete-vendor-payments') && (
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
                                emptyBlock
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={payments || { data: [], links: [], meta: {} }}
                        routeName="account.vendor-payments.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create
                        vendors={vendors}
                        bankAccounts={bankAccounts}
                        onSuccess={closeModal}
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
            {/*
              VOID confirmation.
              Worded to make the difference from Delete explicit: voiding
              reverses the ledger entries and KEEPS the record, where deleting
              would remove a row the journal still refers to.
            */}
            <ConfirmationDialog
                open={!!voiding}
                onOpenChange={() => setVoiding(null)}
                title={t('Void Payment')}
                message={
                    voiding
                        ? t('This reverses the accounting entries and puts the amounts back on the supplier bills. The payment record and its history are kept.')
                        : ''
                }
                confirmText={t('Void Payment')}
                onConfirm={() => {
                    if (!voiding) return;
                    router.post(route('account.vendor-payments.void', voiding.id), {}, {
                        onFinish: () => setVoiding(null),
                    });
                }}
                variant="destructive"
            />

            {/*
              ALLOCATE opens the existing View screen, which already shows the
              allocation breakdown. A dedicated allocation dialog is the next
              piece — flagged in the handover — but sending the user somewhere
              that shows the real figures beats a button that does nothing.
            */}
            <Dialog open={!!allocating} onOpenChange={() => setAllocating(null)}>
                {allocating && <View payment={allocating} />}
            </Dialog>
        </AuthenticatedLayout>
    );
}
