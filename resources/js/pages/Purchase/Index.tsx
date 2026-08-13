import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit as EditIcon, Trash2, Eye, FileText, Receipt, Download, User as UserIcon, Building2, TrendingDown } from "lucide-react";
import { getImagePath } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { getStatusBadgeClasses } from './utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import NoRecordsFound from '@/components/no-records-found';
import { PurchaseInvoice, PurchaseFilters } from './types';

interface PurchaseIndexProps {
    invoices: {
        data: PurchaseInvoice[];
        links: any[];
        meta: any;
    };
    vendors: Array<{id: number; name: string; email: string}>;
    warehouses: Array<{id: number; name: string; address: string}>;
    products: Array<{id: number; name: string; price: number; tax_rate?: number}>;
    auth: any;
    [key: string]: any;
}

export default function Index() {
    const { t } = useTranslation();
    const { invoices, vendors, warehouses, products, auth } = usePage<PurchaseIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<PurchaseFilters>({
        search: urlParams.get('search') || '',
        vendor_id: urlParams.get('vendor_id') || '',
        warehouse_id: urlParams.get('warehouse_id') || '',
        status: urlParams.get('status') || '',
        date_range: urlParams.get('date_range') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    // Component for signature buttons
    const SignatureButtons = ({ invoice }: { invoice: PurchaseInvoice }) => {
        const signatureButtons = usePageButtons('signatureBtn', { invoice });
        return (
            <>
                {signatureButtons.map((button) => (
                    <div key={button.id}>{button.component}</div>
                ))}
            </>
        );
    };

    const pageButtons = usePageButtons('purchaseBtn', 'Purchase data');
    const spreadsheetButtons = usePageButtons('spreadsheetBtn', { module: 'Purchase', sub_module: 'Purchase' });
    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Purchase Invoice', settingKey: 'GoogleDrive Purchase Invoice' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Purchase Invoice', settingKey: 'OneDrive Purchase Invoice' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'purchase-invoices.destroy',
        defaultMessage: t('Are you sure you want to delete this purchase invoice?')
    });

    const handleFilter = () => {
        router.get(route('purchase-invoices.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('purchase-invoices.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', vendor_id: '', warehouse_id: '', status: '', date_range: '' });
        router.get(route('purchase-invoices.index'), {per_page: perPage, view: viewMode});
    };

    const tableColumns = [
        {
            key: 'invoice_number',
            header: t('Invoice Number'),
            sortable: true,
            render: (value: string, invoice: PurchaseInvoice) =>
                auth.user?.permissions?.includes('view-purchase-invoices') ? (
                    <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                        onClick={() => router.get(route('purchase-invoices.show', invoice.id))}
                    >
                        {value}
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                        {value}
                    </span>
                )
        },
        {
            key: 'vendor',
            header: t('Vendor'),
            render: (value: any, invoice: PurchaseInvoice) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                        {invoice.vendor?.avatar ? (
                            <img src={getImagePath(invoice.vendor.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-5 h-5 text-indigo-400" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm text-gray-900">{invoice.vendor?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground truncate">{invoice.vendor?.email || ''}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'invoice_date',
            header: t('Invoice Date'),
            sortable: true,
            render: (value: string) => <span className="text-gray-600 text-sm">{formatDate(value)}</span>
        },
        {
            key: 'due_date',
            header: t('Due Date'),
            sortable: true,
            render: (value: string, invoice: PurchaseInvoice) => {
                const isOverdue = invoice.display_status === 'overdue';
                return (
                    <div>
                        <span className={isOverdue ? 'text-red-600 font-medium text-sm' : 'text-gray-600 text-sm'}>
                            {formatDate(value)}
                        </span>
                        {isOverdue && (
                            <div className="text-xs text-red-600 font-medium mt-0.5">{t('Overdue')}</div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'subtotal',
            header: t('Subtotal'),
            sortable: true,
            render: (value: number) => <span className="text-gray-700 text-sm">{formatCurrency(value)}</span>
        },
        {
            key: 'tax_amount',
            header: t('Tax'),
            sortable: true,
            render: (value: number) => <span className="text-gray-600 text-sm">{formatCurrency(value)}</span>
        },
        {
            key: 'total_amount',
            header: t('Total Amount'),
            sortable: true,
            render: (value: number) => <span className="font-semibold text-gray-900 text-sm">{formatCurrency(value)}</span>
        },
        {
            key: 'balance_amount',
            header: t('Balance'),
            sortable: true,
            render: (value: number) => (
                <span className={`font-semibold text-sm ${value > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(value)}
                </span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string) => (
                <span className={getStatusBadgeClasses(value)}>
                    {t(value.charAt(0).toUpperCase() + value.slice(1))}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-purchase-invoices', 'edit-purchase-invoices', 'delete-purchase-invoices', 'post-purchase-invoices', 'print-purchase-invoices'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, invoice: PurchaseInvoice) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        <SignatureButtons invoice={invoice} />
                        {auth.user?.permissions?.includes('print-purchase-invoices') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('purchase-invoices.print', invoice.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-purchase-invoices') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('purchase-invoices.show', invoice.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {invoice.status === 'draft' && (
                            <>
                                {auth.user?.permissions?.includes('post-purchase-invoices') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => router.post(route('purchase-invoices.post', invoice.id))} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Post invoice to finalize and create journal entries')}</p></TooltipContent>
                                    </Tooltip>
                                )}
                                {auth.user?.permissions?.includes('edit-purchase-invoices') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => router.visit(route('purchase-invoices.edit', invoice.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                <EditIcon className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                    </Tooltip>
                                )}
                                {auth.user?.permissions?.includes('delete-purchase-invoices') && (
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
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Purchase Invoices')}]}
            pageTitle={t('Manage Purchase Invoices')}
            pageDescription={t('Manage and track your purchase invoices, payments, and balances.')}
            pageActions={
                <div className="flex gap-2">
                    {googleDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {oneDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    <TooltipProvider>
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {spreadsheetButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-purchase-invoices') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('purchase-invoices.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Purchase Invoices')} />

            <Card className="shadow-sm">
                {/* Search & Controls */}
                <CardContent className="p-4 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value) => setFilters({...filters, search: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by invoice number...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="purchase-invoices.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="purchase-invoices.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.vendor_id, filters.warehouse_id, filters.status, filters.date_range].filter(Boolean).length;
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

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {auth.user?.permissions?.includes('manage-users') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Vendor')}</label>
                                    <Select value={filters.vendor_id} onValueChange={(value) => setFilters({...filters, vendor_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by vendor')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vendors.map((vendor) => (
                                                <SelectItem key={vendor.id} value={vendor.id.toString()}>{vendor.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {auth.user?.permissions?.includes('manage-warehouses') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Warehouse')}</label>
                                    <Select value={filters.warehouse_id} onValueChange={(value) => setFilters({...filters, warehouse_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by warehouse')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((warehouse) => (
                                                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">{t('Draft')}</SelectItem>
                                        <SelectItem value="posted">{t('Posted')}</SelectItem>
                                        <SelectItem value="partial">{t('Partial')}</SelectItem>
                                        <SelectItem value="paid">{t('Paid')}</SelectItem>
                                        <SelectItem value="overdue">{t('Overdue')}</SelectItem>
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
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Receipt}
                                            title={t('No purchase invoices found')}
                                            description={t('Get started by creating your first purchase invoice.')}
                                            hasFilters={!!(filters.search || filters.vendor_id || filters.status)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-purchase-invoices"
                                            onCreateClick={() => router.visit(route('purchase-invoices.create'))}
                                            createButtonText={t('Create Purchase Invoice')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {invoices.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {invoices.data.map((invoice) => (
                                        <Card key={invoice.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-indigo-300">
                                            {/* Card Header — Avatar + Vendor Name + Email */}
                                            <div className="p-4 bg-gradient-to-r from-indigo-50/60 to-transparent border-b flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                                                        {invoice.vendor?.avatar ? (
                                                            <img src={getImagePath(invoice.vendor.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Building2 className="w-6 h-6 text-indigo-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{invoice.vendor?.name || '-'}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{invoice.vendor?.email || ''}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <CardContent className="p-4 flex-1 space-y-3">
                                                {/* Invoice Number + Status */}
                                                <div className="flex items-center justify-between gap-2">
                                                    {auth.user?.permissions?.includes('view-purchase-invoices') ? (
                                                        <span
                                                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-indigo-900"
                                                            onClick={() => router.get(route('purchase-invoices.show', invoice.id))}
                                                        >
                                                            {invoice.invoice_number}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800">
                                                            {invoice.invoice_number}
                                                        </span>
                                                    )}
                                                    <span className={`${getStatusBadgeClasses(invoice.status)} flex-shrink-0 text-xs`}>
                                                        {t(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1))}
                                                    </span>
                                                </div>

                                                {/* Dates */}
                                                <div className="grid grid-cols-2 gap-3 h-[52px]">
                                                    <div className="flex flex-col">
                                                        <p className="text-xs text-muted-foreground mb-1">{t('Invoice Date')}</p>
                                                        <p className="text-xs font-medium text-gray-800">{formatDate(invoice.invoice_date)}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right">
                                                        <p className="text-xs text-muted-foreground mb-1">{t('Due Date')}</p>
                                                        <p className={`text-xs font-medium ${invoice.display_status === 'overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                                                            {formatDate(invoice.due_date)}
                                                        </p>
                                                        {invoice.display_status === 'overdue' && (
                                                            <span className="inline-flex items-center rounded bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-600/20 dark:ring-rose-800/50 mt-1">
                                                                {t('Overdue')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Financials */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">{t('Subtotal')}</span>
                                                        <span className="text-xs font-medium text-gray-700">{formatCurrency(invoice.subtotal)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">{t('Tax')}</span>
                                                        <span className="text-xs font-medium text-gray-700">{formatCurrency(invoice.tax_amount)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                                            <TrendingDown className="w-3.5 h-3.5 text-indigo-500" />
                                                            {t('Total')}
                                                        </span>
                                                        <span className="text-sm font-bold text-indigo-700">{formatCurrency(invoice.total_amount)}</span>
                                                    </div>
                                                    {/* Payment progress bar */}
                                                    {invoice.total_amount > 0 && (
                                                        <div className="pt-0.5">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-muted-foreground">{t('Balance Due')}</span>
                                                                <span className={`text-xs font-semibold ${invoice.balance_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                                    {formatCurrency(invoice.balance_amount)}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${
                                                                        invoice.balance_amount === 0 ? 'bg-green-500' : 'bg-orange-400'
                                                                    }`}
                                                                    style={{ width: `${Math.min(100, Math.round(((invoice.total_amount - invoice.balance_amount) / invoice.total_amount) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>

                                            <Separator />

                                            {/* Card Footer */}
                                            <CardFooter className="p-2 flex items-center justify-between bg-gray-50/50">
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        <SignatureButtons invoice={invoice} />
                                                        {auth.user?.permissions?.includes('print-purchase-invoices') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('purchase-invoices.print', invoice.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('view-purchase-invoices') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('purchase-invoices.show', invoice.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
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
                                                        {invoice.status === 'draft' && (
                                                            <>
                                                                {auth.user?.permissions?.includes('post-purchase-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => router.post(route('purchase-invoices.post', invoice.id))} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                                                                <FileText className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Post invoice to finalize and create journal entries')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('edit-purchase-invoices') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => router.visit(route('purchase-invoices.edit', invoice.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                                <EditIcon className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('delete-purchase-invoices') && (
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
                                <NoRecordsFound
                                    icon={Receipt}
                                    title={t('No purchase invoices found')}
                                    description={t('Get started by creating your first purchase invoice.')}
                                    hasFilters={!!(filters.search || filters.vendor_id || filters.status)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-purchase-invoices"
                                    onCreateClick={() => router.visit(route('purchase-invoices.create'))}
                                    createButtonText={t('Create Purchase Invoice')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={{...invoices, ...invoices.meta}}
                        routeName="purchase-invoices.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Purchase Invoice')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
