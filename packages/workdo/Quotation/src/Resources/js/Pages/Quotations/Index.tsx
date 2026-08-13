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
import { Plus, Edit as EditIcon, Trash2, Eye, FileText, Receipt, Download, Send, Check, X, RefreshCw, Copy, PlusCircle, User as UserIcon } from "lucide-react";
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
import BadgeUI from '@/components/badge-ui';
import { Quotation, QuotationFilters } from './types';

interface QuotationIndexProps {
    quotations: {
        data: Quotation[];
        links: any[];
        meta: any;
    };
    customers: Array<{ id: number; name: string; email: string }>;
    auth: any;
    [key: string]: any;
}

export default function Index() {
    const { t } = useTranslation();
    const { quotations, customers, auth } = usePage<QuotationIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<QuotationFilters>({
        search: urlParams.get('search') || '',
        customer_id: urlParams.get('customer_id') || '',
        status: urlParams.get('status') || '',
        date_range: urlParams.get('date_range') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('quotationBtn', 'Quotation data');
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Quotation', settingKey: 'Dropbox Quotation' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'quotations.destroy',
        defaultMessage: t('Are you sure you want to delete this quotation?')
    });

    const [duplicateState, setDuplicateState] = useState({ isOpen: false, quotationId: null });

    const openDuplicateDialog = (quotationId: number) => {
        setDuplicateState({ isOpen: true, quotationId });
    };

    const closeDuplicateDialog = () => {
        setDuplicateState({ isOpen: false, quotationId: null });
    };

    const confirmDuplicate = () => {
        if (duplicateState.quotationId) {
            router.post(route('quotations.duplicate', duplicateState.quotationId));
        }
        closeDuplicateDialog();
    };

    const [convertState, setConvertState] = useState({ isOpen: false, quotationId: null });

    const openConvertDialog = (quotationId: number) => {
        setConvertState({ isOpen: true, quotationId });
    };

    const closeConvertDialog = () => {
        setConvertState({ isOpen: false, quotationId: null });
    };

    const confirmConvert = () => {
        if (convertState.quotationId) {
            router.post(route('quotations.convert-to-invoice', convertState.quotationId));
        }
        closeConvertDialog();
    };

    const handleFilter = () => {
        router.get(route('quotations.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('quotations.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', customer_id: '', status: '', date_range: '' });
        router.get(route('quotations.index'), { per_page: perPage, view: viewMode });
    };

    const tableColumns = [
        {
            key: 'quotation_number',
            header: t('Quotation Number'),
            sortable: true,
            render: (value: string, quotation: Quotation) =>
                auth.user?.permissions?.includes('view-quotations') ? (
                    <div className="flex items-center gap-1.5">
                        <span
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                            onClick={() => router.get(route('quotations.show', quotation.id))}
                        >
                            {value}
                        </span>
                        {quotation.revision_number > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                v{quotation.revision_number}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                            {value}
                        </span>
                        {quotation.revision_number > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                v{quotation.revision_number}
                            </span>
                        )}
                    </div>
                )
        },
        {
            key: 'customer',
            header: t('Customer'),
            render: (value: any, quotation: Quotation) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                        {quotation.customer?.avatar ? (
                            <img src={getImagePath(quotation.customer.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm">{quotation.customer?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground truncate">{quotation.customer?.email || ''}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'quotation_date',
            header: t('Quotation Date'),
            sortable: true,
            render: (value: string) => <span className="text-gray-600 text-sm">{formatDate(value)}</span>
        },
        {
            key: 'due_date',
            header: t('Due Date'),
            sortable: true,
            render: (value: string) => {
                const isExpired = new Date(value) < new Date();
                return (
                    <div>
                        <span className={isExpired ? 'text-red-600 font-medium text-sm' : 'text-gray-600 text-sm'}>
                            {formatDate(value)}
                        </span>
                        {isExpired && (
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
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string) => (
                <BadgeUI className={getStatusBadgeClasses(value)}>
                    {t(value.charAt(0).toUpperCase() + value.slice(1))}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-quotations', 'edit-quotations', 'delete-quotations', 'sent-quotations', 'print-quotations'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, quotation: Quotation) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('print-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('quotations.print', quotation.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {quotation.status === 'draft' && auth.user?.permissions?.includes('sent-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.sent', quotation.id))} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Sent Quotation')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {quotation.status === 'sent' && auth.user?.permissions?.includes('approve-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.approve', quotation.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Approve')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {quotation.status === 'sent' && auth.user?.permissions?.includes('reject-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.reject', quotation.id))} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Reject')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {quotation.converted_to_invoice ? (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-invoices.show', quotation.invoice_id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Receipt className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View Sales Invoice')}</p></TooltipContent>
                            </Tooltip>
                        ) : (
                            auth.user?.permissions?.includes('convert-to-invoice-quotations') && quotation.status === 'accepted' && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openConvertDialog(quotation.id)} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Convert to Invoice')}</p></TooltipContent>
                                </Tooltip>
                            )
                        )}
                        {auth.user?.permissions?.includes('duplicate-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDuplicateDialog(quotation.id)} className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Duplicate')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {quotation.status !== 'draft' && auth.user?.permissions?.includes('create-quotations-revision') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.create-revision', quotation.id))} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create Version')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('quotations.show', quotation.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {quotation.status === 'draft' && auth.user?.permissions?.includes('edit-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('quotations.edit', quotation.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {quotation.status === 'draft' && auth.user?.permissions?.includes('delete-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(quotation.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Quotations') }]}
            pageTitle={t('Manage Quotations')}
            pageDescription={t('Manage and track your sales quotations, status, and values.')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {dropboxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-quotations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('quotations.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Quotations')} />

            <Card className="shadow-sm">
                {/* Search & Controls */}
                <CardContent className="p-4 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by quotation number...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="quotations.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="quotations.index"
                                filters={{ ...filters, view: viewMode }}
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

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {auth.user?.permissions?.includes('manage-users') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Customer')}</label>
                                    <Select value={filters.customer_id} onValueChange={(value) => setFilters({ ...filters, customer_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by customer')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">{t('Draft')}</SelectItem>
                                        <SelectItem value="sent">{t('Sent')}</SelectItem>
                                        <SelectItem value="accepted">{t('Accepted')}</SelectItem>
                                        <SelectItem value="rejected">{t('rejected')}</SelectItem>
                                        <SelectItem value="expired">{t('Overdue')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Date Range')}</label>
                                <DateRangePicker
                                    value={filters.date_range}
                                    onChange={(value) => setFilters({ ...filters, date_range: value })}
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
                                    data={quotations.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Receipt}
                                            title={t('No quotations found')}
                                            description={t('Get started by creating your first quotation.')}
                                            hasFilters={!!(filters.search || filters.customer_id || filters.status)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-quotations"
                                            onCreateClick={() => router.visit(route('quotations.create'))}
                                            createButtonText={t('Create Quotation')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {quotations.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {quotations.data.map((quotation) => (
                                        <Card key={quotation.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden">
                                            {/* Card Header — Avatar + Name + Email */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                                                        {quotation.customer?.avatar ? (
                                                            <img src={getImagePath(quotation.customer.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon className="w-6 h-6 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{quotation.customer?.name || '-'}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{quotation.customer?.email || ''}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <CardContent className="p-4 flex-1 space-y-3">
                                                {/* Quotation Number + Revision + Status */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {auth.user?.permissions?.includes('view-quotations') ? (
                                                            <span
                                                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                                                                onClick={() => router.get(route('quotations.show', quotation.id))}
                                                            >
                                                                {quotation.quotation_number}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                                                                {quotation.quotation_number}
                                                            </span>
                                                        )}
                                                        {quotation.revision_number > 1 && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                v{quotation.revision_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <BadgeUI className={`${getStatusBadgeClasses(quotation.status)} flex-shrink-0`}>
                                                        {t(quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1))}
                                                    </BadgeUI>
                                                </div>

                                                {/* Dates */}
                                                <div className="grid grid-cols-2 gap-3 h-[52px]">
                                                    <div className="flex flex-col">
                                                        <p className="text-xs text-muted-foreground mb-1">{t('Quotation Date')}</p>
                                                        <p className="text-xs font-medium text-gray-800">{formatDate(quotation.quotation_date)}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right">
                                                        <p className="text-xs text-muted-foreground mb-1">{t('Due Date')}</p>
                                                        <p className={`text-xs font-medium ${new Date(quotation.due_date) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                                                            {formatDate(quotation.due_date)}
                                                        </p>
                                                        {new Date(quotation.due_date) < new Date() && (
                                                            <div className="text-xs text-red-600 font-medium mt-0.5">
                                                                {t('Overdue')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Financials */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">{t('Subtotal')}</span>
                                                        <span className="text-xs font-medium text-gray-700">{formatCurrency(quotation.subtotal)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">{t('Tax')}</span>
                                                        <span className="text-xs font-medium text-gray-700">{formatCurrency(quotation.tax_amount)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-gray-900">{t('Total')}</span>
                                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(quotation.total_amount)}</span>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <Separator />

                                            {/* Card Footer — Actions */}
                                            <CardFooter className="p-2 flex items-center justify-between bg-gray-50/50">
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        {auth.user?.permissions?.includes('print-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('quotations.print', quotation.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('view-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('quotations.show', quotation.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
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
                                                        {quotation.status === 'draft' && auth.user?.permissions?.includes('sent-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.sent', quotation.id))} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                                                        <Send className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Sent Quotation')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {quotation.status === 'sent' && auth.user?.permissions?.includes('approve-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.approve', quotation.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Approve')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {quotation.status === 'sent' && auth.user?.permissions?.includes('reject-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.reject', quotation.id))} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Reject')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {quotation.converted_to_invoice ? (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-invoices.show', quotation.invoice_id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                        <Receipt className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('View Sales Invoice')}</p></TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            auth.user?.permissions?.includes('convert-to-invoice-quotations') && quotation.status === 'accepted' && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => openConvertDialog(quotation.id)} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                                                            <RefreshCw className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Convert to Invoice')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )
                                                        )}
                                                        {auth.user?.permissions?.includes('duplicate-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.duplicate', quotation.id))} className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700">
                                                                        <Copy className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Duplicate')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {quotation.status !== 'draft' && auth.user?.permissions?.includes('create-quotations-revision') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('quotations.create-revision', quotation.id))} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                                                        <PlusCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Create Version')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {quotation.status === 'draft' && auth.user?.permissions?.includes('edit-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('quotations.edit', quotation.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                        <EditIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {quotation.status === 'draft' && auth.user?.permissions?.includes('delete-quotations') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(quotation.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                            </Tooltip>
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
                                    title={t('No quotations found')}
                                    description={t('Get started by creating your first quotation.')}
                                    hasFilters={!!(filters.search || filters.customer_id || filters.status)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-quotations"
                                    onCreateClick={() => router.visit(route('quotations.create'))}
                                    createButtonText={t('Create Quotation')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={{ ...quotations, ...quotations.meta }}
                        routeName="quotations.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Quotation')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            <ConfirmationDialog
                open={convertState.isOpen}
                onOpenChange={closeConvertDialog}
                title={t('Convert to Invoice')}
                message={t('Are you sure you want to convert this quotation to invoice?')}
                confirmText={t('Convert')}
                onConfirm={confirmConvert}
            />

            <ConfirmationDialog
                open={duplicateState.isOpen}
                onOpenChange={closeDuplicateDialog}
                title={t('Duplicate Quotation')}
                message={t('Are you sure you want to duplicate this quotation?')}
                confirmText={t('Duplicate')}
                onConfirm={confirmDuplicate}
            />
        </AuthenticatedLayout>
    );
}
