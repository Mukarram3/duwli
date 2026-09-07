// resources/js/pages/Sales/Index.tsx
import { useState } from 'react';
import { RowActions } from '@/components/row-actions';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Plus, Edit as EditIcon, Trash2, Eye, FileText, Receipt, Download, Printer,
    Replace, FileSpreadsheet, Wallet, AlertCircle, CheckCircle2,
    CreditCard, User as UserIcon,
} from "lucide-react";
import { getImagePath } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { PageActionBar, actionRoute, type PageAction } from '@/components/page-action-bar';
import {
    KpiStrip, FilterBar, EmptyState, StatusBadge,
    MoneyCell, DateCell, EntityCell, ReferenceCell,
    type ActiveFilter,
} from '@/components/duwli';
import { Label } from '@/components/ui/label';
import { SalesInvoice, SalesFilters } from './types';

interface SalesIndexProps {
    invoices: {
        data: SalesInvoice[];
        links: any[];
        meta: any;
    };
    customers: Array<{ id: number; name: string; email: string }>;
    warehouses: Array<{ id: number; name: string; address: string }>;
    auth: any;
    [key: string]: any;
}

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<SalesIndexProps>().props;
    const { invoices, customers, warehouses, auth, stats } = pageProps as any;
    const can = (permission: string) => Boolean(auth.user?.permissions?.includes(permission));
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<SalesFilters>({
        search: urlParams.get('search') || '',
        customer_id: urlParams.get('customer_id') || '',
        warehouse_id: urlParams.get('warehouse_id') || '',
        status: urlParams.get('status') || '',
        date_range: urlParams.get('date_range') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');

    // Component for invoice action buttons
    const InvoiceActionButtons = ({ invoice }: { invoice: SalesInvoice }) => {
        const eInvoiceButtons = usePageButtons('invoiceActionButtons', { invoice_id: invoice.id, auth });
        return (
            <>
                {eInvoiceButtons.map((button) => (
                    <div key={button.id}>{button.component}</div>
                ))}
            </>
        );
    };

    // Component for signature buttons
    const SignatureButtons = ({ invoice }: { invoice: SalesInvoice }) => {
        const signatureButtons = usePageButtons('signatureBtn', { invoice });
        return (
            <>
                {signatureButtons.map((button) => (
                    <div key={button.id}>{button.component}</div>
                ))}
            </>
        );
    };

    const pageButtons = usePageButtons('salesBtn', 'Sales data');
    const spreadsheetButtons = usePageButtons('spreadsheetBtn', { module: 'Sales', sub_module: 'Salesaccount' });
    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Sales Invoice', settingKey: 'GoogleDrive Sales Invoice' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Sales Invoice', settingKey: 'OneDrive Sales Invoice' });

    // Qoyod-style action bar. Related destinations sit on the page they belong
    // to rather than taking their own sidebar rows. Entries whose route does
    // not resolve (package not installed) are dropped automatically.
    const invoiceActions: PageAction[] = [
        {
            label: t('Manage Receipts'),
            href: actionRoute('account.customer-payments.index'),
            icon: Receipt,
            variant: 'primary',
            permission: 'manage-customer-payments',
        },
        {
            label: t('Manage Credit Notes'),
            href: actionRoute('account.credit-notes.index'),
            icon: FileText,
            variant: 'primary',
            permission: 'manage-credit-notes',
        },
        {
            label: t('New Invoice'),
            href: actionRoute('sales-invoices.create'),
            icon: Plus,
            variant: 'primary',
            permission: 'create-sales-invoices',
        },
        {
            label: t('Invoice Returns'),
            href: actionRoute('sales-returns.index'),
            icon: Replace,
            variant: 'outline',
            permission: 'manage-sales-return-invoices',
        },
    ];

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'sales-invoices.destroy',
        defaultMessage: t('Are you sure you want to delete this sales invoice?')
    });

    const handleFilter = () => {
        router.get(route('sales-invoices.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('sales-invoices.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', customer_id: '', warehouse_id: '', status: '', date_range: '' });
        router.get(route('sales-invoices.index'), { per_page: perPage, view: viewMode });
    };

    /**
     * One filter removed at a time from the chip row. The cleared value is
     * passed into the visit explicitly — setState has not flushed at this point.
     */
    const removeFilter = (key: string) => {
        const next = { ...filters, [key]: '' } as SalesFilters;
        setFilters(next);
        router.get(route('sales-invoices.index'), {
            ...next, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode
        }, { preserveState: true, replace: true });
    };

    const customerName = (id: string) =>
        customers.find((c: any) => c.id.toString() === id)?.name || id;
    const warehouseName = (id: string) =>
        warehouses.find((w: any) => w.id.toString() === id)?.name || id;

    /** Chips describing what is currently filtering the table. */
    const activeFilters: ActiveFilter[] = ([
        { key: 'customer_id', label: 'Customer', value: filters.customer_id ? customerName(filters.customer_id) : '' },
        { key: 'warehouse_id', label: 'Warehouse', value: filters.warehouse_id ? warehouseName(filters.warehouse_id) : '' },
        { key: 'status', label: 'Status', value: filters.status ? t(filters.status) : '' },
        { key: 'date_range', label: 'Period', value: filters.date_range || '' },
    ] as ActiveFilter[]).filter((f) => Boolean(f.value));

    const hasAnyFilter = Boolean(
        filters.search || filters.customer_id || filters.warehouse_id || filters.status || filters.date_range
    );

    /**
     * Empty state. Split by cause: a filtered list offers a way OUT of the
     * filter, an untouched list offers a way to create the first record.
     * Offering "Create" on a filtered list is how duplicate invoices get made.
     */
    const emptyBlock = hasAnyFilter ? (
        <EmptyState variant="filtered" onClearFilters={clearFilters} />
    ) : (
        <EmptyState
            variant="empty"
            icon={Receipt}
            title="No sales invoices yet"
            description="Create your first invoice to start billing customers."
            createPermission="create-sales-invoices"
            createLabel="New Invoice"
            onCreate={() => router.visit(route('sales-invoices.create'))}
        />
    );

    const tableColumns = [
        {
            key: 'invoice_number',
            header: t('Invoice Number'),
            sortable: true,
            render: (value: string, invoice: SalesInvoice) => (
                <ReferenceCell
                    value={value}
                    href={can('view-sales-invoices') ? route('sales-invoices.show', invoice.id) : undefined}
                />
            )
        },
        {
            key: 'customer',
            header: t('Customer'),
            render: (value: any, invoice: SalesInvoice) => (
                // Email moved out to its own column below. Stacked under the
                // name it shifted position with the length of each name, so
                // scanning a column of addresses meant reading every row.
                <EntityCell
                    name={invoice.customer?.name}
                    image={invoice.customer?.avatar}
                />
            )
        },
        {
            key: 'customer_email',
            header: t('Email'),
            render: (value: any, invoice: SalesInvoice) =>
                invoice.customer?.email ? (
                    // Latin-isolated so an Arabic screen does not reorder the
                    // address, and linked because the common next action on an
                    // unpaid invoice is to email the customer about it.
                    <a
                        href={`mailto:${invoice.customer.email}`}
                        className="ltr-text truncate text-primary hover:underline"
                    >
                        {invoice.customer.email}
                    </a>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )
        },
        {
            key: 'invoice_date',
            header: t('Invoice Date'),
            sortable: true,
            render: (value: string) => <DateCell value={value} />
        },
        {
            key: 'due_date',
            header: t('Due Date'),
            sortable: true,
            render: (value: string, invoice: SalesInvoice) => (
                <DateCell
                    value={value}
                    overdue={invoice.display_status === 'overdue'}
                    caption={invoice.display_status === 'overdue' ? t('Overdue') : undefined}
                />
            )
        },

        {
            key: 'total_amount',
            header: t('Total Amount'),
            sortable: true,
            render: (value: number) => <MoneyCell value={value} bold />
        },
        {
            key: 'balance_amount',
            header: t('Balance'),
            sortable: true,
            render: (value: number) => (
                // A balance of zero means settled, so it is muted rather than
                // coloured — the eye should be drawn to what is still owed.
                <MoneyCell
                    value={value}
                    bold={Number(value) > 0}
                    className={Number(value) > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
                />
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string, invoice: SalesInvoice) => (
                // display_status promotes an unpaid, past-due invoice to
                // "overdue" — the status the user actually needs to see.
                <StatusBadge status={invoice.display_status || value} />
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-sales-invoices', 'edit-sales-invoices', 'delete-sales-invoices', 'post-sales-invoices', 'print-sales-invoices'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, invoice: SalesInvoice) => {
                const isDraft = invoice.status === 'draft';
                const notDraft = t('Only draft invoices can be changed. This invoice is :status.', { status: t(invoice.status) });

                return (
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <SignatureButtons invoice={invoice} />
                            <InvoiceActionButtons invoice={invoice} />
                        </TooltipProvider>

                        {/*
                          Same icons on every row. Post/Edit/Delete are shown
                          greyed out once an invoice is posted rather than
                          disappearing, so the column stays readable.
                        */}
                        <RowActions
                            actions={[
                                {
                                    label: t('View'),
                                    icon: Eye,
                                    className: 'text-green-600 hover:text-green-700',
                                    permitted: auth.user?.permissions?.includes('view-sales-invoices'),
                                    onClick: () => router.get(route('sales-invoices.show', invoice.id)),
                                },
                                {
                                    /*
                                     * Record Payment. Sits second because on an
                                     * unpaid invoice it is the action the user
                                     * most often wants, and it was previously
                                     * only reachable by leaving this screen and
                                     * finding the customer manually.
                                     *
                                     * There is no "new payment for invoice X"
                                     * route — payments are raised from the
                                     * payments screen — so this opens that
                                     * screen already filtered to this customer.
                                     *
                                     * Hidden on a draft (nothing is owed until
                                     * it is posted) and greyed out once the
                                     * balance reaches zero, with the reason
                                     * shown rather than the icon vanishing.
                                     */
                                    label: t('Record Payment'),
                                    icon: CreditCard,
                                    className: 'text-emerald-600 hover:text-emerald-700',
                                    permitted: auth.user?.permissions?.includes('create-customer-payments'),
                                    available: !isDraft && Number(invoice.balance_amount) > 0,
                                    disabledReason: isDraft
                                        ? t('Post the invoice before recording a payment')
                                        : t('Invoice is fully paid'),
                                    onClick: () => router.visit(
                                        route('account.customer-payments.index', {
                                            customer_id: invoice.customer_id,
                                        })
                                    ),
                                },
                                {
                                    label: t('Print'),
                                    icon: Printer,
                                    className: 'text-slate-600 hover:text-slate-700',
                                    permitted: auth.user?.permissions?.includes('print-sales-invoices'),
                                    // ?print=1 opens the document and fires the
                                    // browser print dialog, which yields real
                                    // vector text. Plain ?download=pdf below
                                    // rasterises — kept only for the legacy
                                    // "Download PDF" action.
                                    onClick: () => window.open(route('sales-invoices.print', invoice.id) + '?print=1', '_blank'),
                                },
                                {
                                    label: t('Download PDF'),
                                    icon: Download,
                                    className: 'text-orange-600 hover:text-orange-700',
                                    permitted: auth.user?.permissions?.includes('print-sales-invoices'),
                                    onClick: () => window.open(route('sales-invoices.print', invoice.id) + '?download=pdf', '_blank'),
                                },
                                {
                                    label: t('Post invoice to finalize and create journal entries'),
                                    icon: FileText,
                                    className: 'text-purple-600 hover:text-purple-700',
                                    permitted: auth.user?.permissions?.includes('post-sales-invoices'),
                                    available: isDraft,
                                    disabledReason: t('Already posted'),
                                    onClick: () => router.post(route('sales-invoices.post', invoice.id)),
                                },
                                {
                                    label: t('Edit'),
                                    icon: EditIcon,
                                    className: 'text-blue-600 hover:text-blue-700',
                                    permitted: auth.user?.permissions?.includes('edit-sales-invoices'),
                                    available: isDraft,
                                    disabledReason: notDraft,
                                    onClick: () => router.visit(route('sales-invoices.edit', invoice.id)),
                                },
                                {
                                    label: t('Delete'),
                                    icon: Trash2,
                                    className: 'text-destructive hover:text-destructive',
                                    permitted: auth.user?.permissions?.includes('delete-sales-invoices'),
                                    available: isDraft,
                                    disabledReason: notDraft,
                                    onClick: () => openDeleteDialog(invoice.id),
                                },
                            ]}
                        />
                    </div>
                );
            }
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Sales Invoices') }]}
            pageTitle={t('Sales Invoices')}
            pageDescription={t('Manage and track your sales invoices, payments, and balances.')}
            pageIcon={FileSpreadsheet}
            pageCount={invoices.meta?.total ?? invoices.total}
            pageActions={
                <PageActionBar
                    actions={invoiceActions}
                    permissions={auth.user?.permissions}
                    maxVisible={4}
                >
                    <TooltipProvider>
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {spreadsheetButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {googleDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>
                </PageActionBar>
            }
        >
            <Head title={t('Sales Invoices')} />

            {/*
              Receivables at a glance. These describe the whole invoice book,
              not the filtered page, so they stay stable as the user filters
              beneath them. Overdue and Draft drill through to this same list
              with the matching status applied.
            */}
            {stats && (
                <KpiStrip
                    items={[
                        {
                            label: 'Outstanding',
                            value: formatCurrency(stats.outstanding, pageProps),
                            caption: `${stats.outstandingCount} ${t('open invoices')}`,
                            icon: Wallet,
                            tone: 'gradient',
                        },
                        {
                            label: 'Overdue',
                            value: formatCurrency(stats.overdue, pageProps),
                            caption: `${stats.overdueCount} ${t('past due')}`,
                            icon: AlertCircle,
                            tone: 'danger',
                            href: route('sales-invoices.index', { status: 'overdue' }),
                        },
                        {
                            label: 'Collected This Month',
                            value: formatCurrency(stats.collectedThisMonth, pageProps),
                            icon: CheckCircle2,
                            tone: 'success',
                        },
                        {
                            label: 'Drafts',
                            value: String(stats.drafts),
                            caption: 'Not yet posted',
                            icon: FileText,
                            tone: stats.drafts > 0 ? 'warning' : 'plain',
                            href: route('sales-invoices.index', { status: 'draft' }),
                        },
                    ]}
                />
            )}

            <Card className="shadow-sm">
                {/* Search, filters and the chips showing what is applied */}
                <CardContent className="border-b bg-muted/30 p-4">
                    <FilterBar
                        className="mb-0"
                        search={filters.search || ''}
                        onSearchChange={(value) => setFilters({ ...filters, search: value })}
                        searchPlaceholder="Search by invoice number..."
                        activeFilters={activeFilters}
                        onRemoveFilter={removeFilter}
                        onClearAll={clearFilters}
                        popoverWidth="w-96"
                        trailing={
                            <>
                                <ListGridToggle
                                    currentView={viewMode}
                                    routeName="sales-invoices.index"
                                    filters={{ ...filters, per_page: perPage }}
                                />
                                <PerPageSelector
                                    routeName="sales-invoices.index"
                                    filters={{ ...filters, view: viewMode }}
                                />
                            </>
                        }
                    >
                        {can('manage-users') && (
                            <div className="space-y-1.5">
                                <Label>{t('Customer')}</Label>
                                <Select
                                    value={filters.customer_id}
                                    onValueChange={(value) => setFilters({ ...filters, customer_id: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder={t('Filter by customer')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((customer: any) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {can('manage-warehouses') && (
                            <div className="space-y-1.5">
                                <Label>{t('Warehouse')}</Label>
                                <Select
                                    value={filters.warehouse_id}
                                    onValueChange={(value) => setFilters({ ...filters, warehouse_id: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder={t('Filter by warehouse')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse: any) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>{t('Status')}</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value })}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={t('Filter by status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">{t('Draft')}</SelectItem>
                                    <SelectItem value="posted">{t('Posted')}</SelectItem>
                                    <SelectItem value="paid">{t('Paid')}</SelectItem>
                                    <SelectItem value="overdue">{t('Overdue')}</SelectItem>
                                    <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('Date Range')}</Label>
                            <DateRangePicker
                                value={filters.date_range}
                                onChange={(value) => setFilters({ ...filters, date_range: value })}
                                placeholder={t('Select date range')}
                            />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1" onClick={handleFilter}>{t('Apply')}</Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={clearFilters}>{t('Clear')}</Button>
                        </div>
                    </FilterBar>
                </CardContent>

                {/* List / Grid Content */}
                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={invoices.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={emptyBlock}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {invoices.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {invoices.data.map((invoice) => (
                                        <Card key={invoice.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden">
                                            {/* Card Header — Avatar + Name + Email */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                                                        {invoice.customer?.avatar ? (
                                                            <img src={getImagePath(invoice.customer.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon className="w-6 h-6 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{invoice.customer?.name || '-'}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{invoice.customer?.email || ''}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <CardContent className="p-4 flex-1 space-y-3">
                                                {/* Invoice Number + Status */}
                                                <div className="flex items-center justify-between gap-2">
                                                    {auth.user?.permissions?.includes('view-sales-invoices') ? (
                                                        <span
                                                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                                                            onClick={() => router.get(route('sales-invoices.show', invoice.id))}
                                                        >
                                                            {invoice.invoice_number}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                                                            {invoice.invoice_number}
                                                        </span>
                                                    )}
                                                    <StatusBadge status={invoice.display_status || invoice.status} />
                                                </div>
                                                {/* Dates */}
                                                <div className="grid grid-cols-2 gap-3 h-[52px]">
                                                    <div className="flex flex-col">
                                                        <p className="text-xs text-muted-foreground mb-1">{t('Invoice Date')}</p>
                                                        <p className="text-xs font-medium text-gray-800">{formatDate(invoice.invoice_date)}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end text-end">
                                                        <p className="text-xs text-muted-foreground mb-1">{t('Due Date')}</p>
                                                        <p className={`text-xs font-medium ${invoice.display_status === 'overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                                                            {formatDate(invoice.due_date)}
                                                        </p>
                                                        {invoice.display_status === 'overdue' && (
                                                            <div className="text-xs text-red-600 font-medium mt-0.5">
                                                                {t('Overdue')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Financials */}
                                                <div className="space-y-1.5">
                                                    {/* Subtotal and Tax removed here too, to match
                                                        the table. Both remain on the invoice detail
                                                        and on the printed document, where the
                                                        breakdown is what the reader needs. */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-gray-900">{t('Total')}</span>
                                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">{t('Balance Due')}</span>
                                                        <span className={`text-xs font-semibold ${invoice.balance_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                            {formatCurrency(invoice.balance_amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <Separator />

                                            {/* Card Footer */}
                                            <CardFooter className="p-2 flex items-center justify-between bg-gray-50/50">
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        <SignatureButtons invoice={invoice} />
                                                        {auth.user?.permissions?.includes('print-sales-invoices') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('sales-invoices.print', invoice.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('view-sales-invoices') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-invoices.show', invoice.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        <InvoiceActionButtons invoice={invoice} />
                                                        {invoice.status === 'draft' && (
                                                            <>
                                                                {auth.user?.permissions?.includes('post-sales-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-invoices.post', invoice.id))} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                                                                <FileText className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Post invoice to finalize and create journal entries')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('edit-sales-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => router.visit(route('sales-invoices.edit', invoice.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                                <EditIcon className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('delete-sales-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(invoice.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                emptyBlock
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={{ ...invoices, ...invoices.meta }}
                        routeName="sales-invoices.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Sales Invoice')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
