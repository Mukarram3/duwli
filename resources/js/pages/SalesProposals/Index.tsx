import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, FileText, Eye, Trash2, RefreshCw, Edit as EditIcon, Download, Send, Check, X, Receipt, User as UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from "@/components/ui/list-grid-toggle";
import { PerPageSelector } from "@/components/ui/per-page-selector";
import { FilterButton } from '@/components/ui/filter-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import NoRecordsFound from '@/components/no-records-found';
import { Pagination } from "@/components/ui/pagination";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { usePageButtons } from '@/hooks/usePageButtons';
import BadgeUI from '@/components/badge-ui';

interface SalesProposal {
    id: number;
    proposal_number: string;
    proposal_date: string;
    due_date: string;
    customer: { id: number; name: string; email: string; avatar?: string | null };
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    status: string;
    display_status: string;
    converted_to_invoice: boolean;
    invoice_id?: number;
    created_at: string;
}

interface ProposalFilters {
    search: string;
    status: string;
    customer_id: string;
    date_range: string;
    date_from?: string;
    date_to?: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { proposals, auth, customers } = usePage<{
        proposals: { data: SalesProposal[]; [key: string]: any };
        auth: { user: { permissions: string[] } };
        customers: { id: number; name: string; email: string }[];
    }>().props;

    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState<ProposalFilters>({
        search: urlParams.get('search') || '',
        status: urlParams.get('status') || '',
        customer_id: urlParams.get('customer_id') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })()
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);
    const [convertState, setConvertState] = useState({ isOpen: false, proposalId: null as number | null });

    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Proposal', settingKey: 'GoogleDrive Proposal' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Proposal', settingKey: 'OneDrive Proposal' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'sales-proposals.destroy',
        defaultMessage: 'Are you sure you want to delete this sales proposal?'
    });

    const getProposalStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'draft': return 'bg-gray-50 text-gray-700 ring-gray-650/15 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
            case 'sent': return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800';
            case 'accepted': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-450 dark:ring-emerald-800';
            case 'rejected': return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-450 dark:ring-rose-800';
            case 'expired': return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-450 dark:ring-amber-800';
            default: return 'bg-gray-50 text-gray-700 ring-gray-650/15 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
        }
    };

    const handleFilter = () => {
        const filterParams = { ...filters };
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete (filterParams as any).date_range;
        router.get(route('sales-proposals.index'), {...filterParams, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('sales-proposals.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', status: '', customer_id: '', date_range: '' });
        router.get(route('sales-proposals.index'), {per_page: perPage, view: viewMode});
    };

    const openConvertDialog = (proposalId: number) => {
        setConvertState({ isOpen: true, proposalId });
    };

    const closeConvertDialog = () => {
        setConvertState({ isOpen: false, proposalId: null });
    };

    const confirmConvert = () => {
        if (convertState.proposalId) {
            router.post(route('sales-proposals.convert-to-invoice', convertState.proposalId));
            closeConvertDialog();
        }
    };

    const tableColumns = [
        {
            key: 'proposal_number',
            header: t('Proposal Number'),
            sortable: true,
            render: (value: string, proposal: SalesProposal) =>
                auth.user?.permissions?.includes('view-sales-proposals') ? (
                    <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                        onClick={() => router.get(route('sales-proposals.show', proposal.id))}
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
            key: 'customer.name',
            header: t('Customer'),
            sortable: true,
            render: (_: any, item: SalesProposal) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                        {item.customer?.avatar ? (
                            <img src={getImagePath(item.customer.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm">{item.customer?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground truncate">{item.customer?.email || ''}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'proposal_date',
            header: t('Proposal Date'),
            sortable: true,
            render: (value: string) => <span className="text-gray-600 text-sm">{formatDate(value)}</span>
        },
        {
            key: 'due_date',
            header: t('Due Date'),
            sortable: true,
            render: (value: string, proposal: SalesProposal) => {
                const isOverdue = proposal.display_status === 'overdue';
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
            key: 'balance',
            header: t('Balance'),
            sortable: true,
            render: (_: any, item: SalesProposal) => (
                <span className="font-semibold text-sm text-gray-700">{formatCurrency(item.total_amount)}</span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string) => (
                <BadgeUI className={getProposalStatusColor(value)}>
                    {value?.charAt(0).toUpperCase() + value?.slice(1)}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['print-sales-proposals','sent-sales-proposals','accept-sales-proposals','view-sales-proposals', 'edit-sales-proposals', 'delete-sales-proposals', 'convert-sales-proposals'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, item: SalesProposal) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('print-sales-proposals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('sales-proposals.print', item.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('sent-sales-proposals') && item.status === 'draft' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-proposals.sent', item.id))} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Send Proposal')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('accept-sales-proposals') && item.status === 'sent' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-proposals.accept', item.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Accept Proposal')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('reject-sales-proposals') && item.status === 'sent' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-proposals.reject', item.id))} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Reject Proposal')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {item.converted_to_invoice ? (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-invoices.show', item.invoice_id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Receipt className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View Invoice')}</p></TooltipContent>
                            </Tooltip>
                        ) : (
                            auth.user?.permissions?.includes('convert-sales-proposals') && item.status === 'accepted' && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openConvertDialog(item.id)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Convert to Invoice')}</p></TooltipContent>
                                </Tooltip>
                            )
                        )}
                        {auth.user?.permissions?.includes('view-sales-proposals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-proposals.show', item.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {item.status === 'draft' && auth.user?.permissions?.includes('edit-sales-proposals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('sales-proposals.edit', item.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {item.status === 'draft' && auth.user?.permissions?.includes('delete-sales-proposals') && !item.converted_to_invoice && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(item.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
        <TooltipProvider>
            <AuthenticatedLayout
                breadcrumbs={[{label: t('Sales Proposals')}]}
                pageTitle={t('Manage Proposal')}
                pageDescription={t('Manage and track your sales proposals, statuses, and values.')}
                pageActions={
                    <div className="flex gap-2">
                        {googleDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-sales-proposals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('sales-proposals.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                }
            >
                <Head title="Sales Proposals" />

                <Card className="shadow-sm">
                    {/* Search & Controls */}
                    <CardContent className="p-4 border-b bg-gray-50/50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-md">
                                <SearchInput
                                    value={filters.search}
                                    onChange={(value) => setFilters({...filters, search: value})}
                                    onSearch={handleFilter}
                                    placeholder={t('Search proposals...')}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ListGridToggle
                                    currentView={viewMode}
                                    routeName="sales-proposals.index"
                                    filters={{...filters, per_page: perPage}}
                                />
                                <PerPageSelector
                                    routeName="sales-proposals.index"
                                    filters={{...filters, view: viewMode}}
                                />
                                <div className="relative">
                                    <FilterButton
                                        showFilters={showFilters}
                                        onToggle={() => setShowFilters(!showFilters)}
                                    />
                                    {(() => {
                                        const activeFilters = [filters.customer_id, filters.date_range, filters.status].filter(Boolean).length;
                                        return activeFilters > 0 ? (
                                            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                                {activeFilters}
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <CardContent className="p-4 bg-blue-50/30 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:grid-cols-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Customer')}</label>
                                    <Select value={filters.customer_id} onValueChange={(value) => setFilters({...filters, customer_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('All Customers')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers?.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                    <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('All Status')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">{t('Draft')}</SelectItem>
                                            <SelectItem value="sent">{t('Sent')}</SelectItem>
                                            <SelectItem value="accepted">{t('Accepted')}</SelectItem>
                                            <SelectItem value="rejected">{t('Rejected')}</SelectItem>
                                            <SelectItem value="expired">{t('Expired')}</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                <div className="min-w-[1000px]">
                                    <DataTable
                                        data={proposals?.data || []}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="rounded-none"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={FileText}
                                                title="No sales proposals found"
                                                description="Get started by creating your first sales proposal."
                                                hasFilters={!!(filters.search || filters.status || filters.customer_id || filters.date_range)}
                                                onClearFilters={clearFilters}
                                                createPermission="create-sales-proposals"
                                                onCreateClick={() => router.visit(route('sales-proposals.create'))}
                                                createButtonText="Create Sales Proposal"
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-auto max-h-[70vh] p-4">
                                {proposals?.data?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                        {proposals.data.map((proposal) => (
                                            <Card key={proposal.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden">
                                                {/* Card Header — Avatar + Name + Email */}
                                                <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b flex-shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                                                            {proposal.customer?.avatar ? (
                                                                <img src={getImagePath(proposal.customer.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserIcon className="w-6 h-6 text-primary" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-sm text-gray-900 truncate">{proposal.customer?.name || '-'}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{proposal.customer?.email || ''}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <CardContent className="p-4 flex-1 space-y-3">
                                                    {/* Proposal Number + Status */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        {auth.user?.permissions?.includes('view-sales-proposals') ? (
                                                            <span
                                                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                                                                onClick={() => router.get(route('sales-proposals.show', proposal.id))}
                                                            >
                                                                {proposal.proposal_number}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                                                                {proposal.proposal_number}
                                                            </span>
                                                        )}
                                                        <BadgeUI className={`flex-shrink-0 ${getProposalStatusColor(proposal.status)}`}>
                                                            {proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1)}
                                                        </BadgeUI>
                                                    </div>

                                                    {/* Dates */}
                                                    <div className="grid grid-cols-2 gap-3 h-[52px]">
                                                        <div className="flex flex-col">
                                                            <p className="text-xs text-muted-foreground mb-1">{t('Proposal Date')}</p>
                                                            <p className="text-xs font-medium text-gray-800">{formatDate(proposal.proposal_date)}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end text-right">
                                                            <p className="text-xs text-muted-foreground mb-1">{t('Due Date')}</p>
                                                            <p className={`text-xs font-medium ${proposal.display_status === 'overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                                                                {formatDate(proposal.due_date)}
                                                            </p>
                                                            {proposal.display_status === 'overdue' && (
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
                                                            <span className="text-xs font-medium text-gray-700">{formatCurrency(proposal.subtotal)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">{t('Tax')}</span>
                                                            <span className="text-xs font-medium text-gray-700">{formatCurrency(proposal.tax_amount)}</span>
                                                        </div>
                                                        <Separator />
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-semibold text-gray-900">{t('Total')}</span>
                                                            <span className="text-sm font-bold text-gray-900">{formatCurrency(proposal.total_amount)}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>

                                                <Separator />

                                                {/* Card Footer — Actions */}
                                                <CardFooter className="p-2 flex items-center justify-between bg-gray-50/50">
                                                    <div className="flex gap-1">
                                                        <TooltipProvider>
                                                            {auth.user?.permissions?.includes('print-sales-proposals') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => window.open(route('sales-proposals.print', proposal.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                                                            <Download className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Download PDF')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('view-sales-proposals') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-proposals.show', proposal.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
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
                                                            {auth.user?.permissions?.includes('sent-sales-proposals') && proposal.status === 'draft' && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-proposals.sent', proposal.id))} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                                                            <Send className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Send Proposal')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('accept-sales-proposals') && proposal.status === 'sent' && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-proposals.accept', proposal.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Accept Proposal')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('reject-sales-proposals') && proposal.status === 'sent' && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.post(route('sales-proposals.reject', proposal.id))} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Reject Proposal')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {proposal.converted_to_invoice ? (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.get(route('sales-invoices.show', proposal.invoice_id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                            <Receipt className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('View Invoice')}</p></TooltipContent>
                                                                </Tooltip>
                                                            ) : (
                                                                auth.user?.permissions?.includes('convert-sales-proposals') && proposal.status === 'accepted' && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openConvertDialog(proposal.id)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                                                                <RefreshCw className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>{t('Convert to Invoice')}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )
                                                            )}
                                                            {proposal.status === 'draft' && auth.user?.permissions?.includes('edit-sales-proposals') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.visit(route('sales-proposals.edit', proposal.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                            <EditIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {proposal.status === 'draft' && auth.user?.permissions?.includes('delete-sales-proposals') && !proposal.converted_to_invoice && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(proposal.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
                                        icon={FileText}
                                        title="No sales proposals found"
                                        description="Get started by creating your first sales proposal."
                                        hasFilters={!!(filters.search || filters.status || filters.customer_id || filters.date_range)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-sales-proposals"
                                        onCreateClick={() => router.visit(route('sales-proposals.create'))}
                                        createButtonText="Create Sales Proposal"
                                    />
                                )}
                            </div>
                        )}
                    </CardContent>

                    {/* Pagination */}
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                        <Pagination
                            data={{...proposals, ...proposals.meta}}
                            routeName="sales-proposals.index"
                            filters={{...filters, per_page: perPage, view: viewMode}}
                        />
                    </CardContent>
                </Card>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Proposal')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />

                <ConfirmationDialog
                    open={convertState.isOpen}
                    onOpenChange={closeConvertDialog}
                    title={t('Convert to Invoice')}
                    message={t('Are you sure you want to convert this proposal to an invoice?')}
                    confirmText={t('Convert')}
                    onConfirm={confirmConvert}
                />

            </AuthenticatedLayout>
        </TooltipProvider>
    );
}
