import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, ArrowRightLeft, Play, User as UserIcon, Calendar, CheckCircle2, Clock, XCircle, RefreshCw, Ban, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Create from './Create';
import EditEmployeeTransfer from './Edit';
import View from './View';
import StatusModal from './StatusModal';
import NoRecordsFound from '@/components/no-records-found';
import { EmployeeTransfer, EmployeeTransfersIndexProps, EmployeeTransferFilters, EmployeeTransferModalState } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<EmployeeTransfersIndexProps>().props;
    const { employeetransfers, auth, employees, stats } = pageProps;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState<EmployeeTransferFilters>({
        search: urlParams.get('search') || '',
        employee_id: urlParams.get('employee_id') || 'all',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [activeTab, setActiveTab] = useState(urlParams.get('status') || 'all');

    const [modalState, setModalState] = useState<EmployeeTransferModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<EmployeeTransfer | null>(null);
    const [statusModalItem, setStatusModalItem] = useState<EmployeeTransfer | null>(null);

    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.employee-transfers.destroy',
        defaultMessage: t('Are you sure you want to delete this employee transfer?')
    });

    const handleFilter = () => {
        router.get(route('hrm.employee-transfers.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const newStatus = tab === 'all' ? '' : tab;
        setFilters(prev => ({ ...prev, status: newStatus }));
        router.get(route('hrm.employee-transfers.index'), {
            search: filters.search,
            employee_id: filters.employee_id,
            status: newStatus,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
        }, { preserveState: true, replace: true });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.employee-transfers.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            employee_id: 'all',
            status: '',
        });
        setActiveTab('all');
        router.get(route('hrm.employee-transfers.index'), { per_page: perPage });
    };

    const openModal = (mode: 'add' | 'edit', data: EmployeeTransfer | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    // Custom Page Buttons Hook
    const pageButtons = usePageButtons({
        moduleName: 'hrm',
        pageName: 'employee-transfers',
        customButtons: []
    });

    const getStatusBadge = (status: string) => {
        const normalized = status?.toLowerCase() || '';
        switch (normalized) {
            case 'approved':
                return (
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                        {t('Approved')}
                    </span>
                );
            case 'in progress':
                return (
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                        {t('In Progress')}
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
                        {t('Rejected')}
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20">
                        {t('Cancelled')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                        {t('Pending')}
                    </span>
                );
        }
    };

    const tableColumns = [
        {
            key: 'employee.name',
            header: t('Employee Name'),
            sortable: false,
            render: (_: any, row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                        {row.employee?.avatar ? (
                            <img src={getImagePath(row.employee.avatar)} alt={row.employee.name} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{row.employee?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground">{row.employee?.email || ''}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'transfer_path',
            header: t('Transfer Path'),
            sortable: false,
            render: (_: any, row: any) => {
                const fromBranch = row.from_branch?.branch_name || '-';
                const toBranch = row.to_branch?.branch_name || '-';
                return (
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                            {fromBranch}
                        </span>
                        <ArrowRightLeft className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                            {toBranch}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => getStatusBadge(value || 'pending')
        },
        {
            key: 'effective_date',
            header: t('Effective Date'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        {
            key: 'approved_by',
            header: t('Approved By'),
            sortable: false,
            render: (_: any, row: any) => (
                row.approved_by?.name ? (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                            {row.approved_by.avatar ? (
                                <img src={getImagePath(row.approved_by.avatar)} alt={row.approved_by.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {row.approved_by.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">-</span>
                )
            )
        },
        {
            key: 'document',
            header: t('Document'),
            sortable: false,
            className: 'text-center [&>div]:justify-center',
            render: (_: any, employeetransfer: EmployeeTransfer) => (
                employeetransfer.document ? (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = getImagePath(employeetransfer.document);
                                        link.download = employeetransfer.document?.split('/').pop() || 'transfer-document';
                                        link.click();
                                    }}
                                    className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Download Document')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">-</span>
                )
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-employee-transfers', 'manage-employee-transfers-status', 'edit-employee-transfers', 'delete-employee-transfers'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-center [&>div]:justify-center',
            render: (_: any, employeetransfer: EmployeeTransfer) => (
                <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-employee-transfers-status') && !['approved', 'rejected', 'cancelled'].includes(employeetransfer.status?.toLowerCase()) && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setStatusModalItem(employeetransfer)}
                                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                    >
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Status')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-employee-transfers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewingItem(employeetransfer)}
                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-employee-transfers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal('edit', employeetransfer)}
                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-employee-transfers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(employeetransfer.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Employee Transfers') }
            ]}
            pageTitle={t('Manage Employee Transfers')}
            pageDescription={t('Track and manage employee transfers, location changes, and departmental shifts.')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-employee-transfers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Employee Transfers')} />

            <Card className="shadow-sm border-gray-200 dark:border-zinc-800">
                {/* Search & Controls Header */}
                <CardContent className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by employee name or reason...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <PerPageSelector
                                routeName="hrm.employee-transfers.index"
                                filters={{ ...filters, sort: sortField, direction: sortDirection }}
                            />
                            <FilterButton
                                showFilters={showFilters}
                                onToggle={() => setShowFilters(!showFilters)}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Status Tabs Bar */}
                <CardContent className="px-4 py-0 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all', label: t('All'), icon: ArrowRightLeft, count: stats?.total ?? 0 },
                            { key: 'pending', label: t('Pending'), icon: Clock, count: stats?.pending ?? 0 },
                            { key: 'approved', label: t('Approved'), icon: CheckCircle2, count: stats?.approved ?? 0 },
                            { key: 'in progress', label: t('In Progress'), icon: RefreshCw, count: stats?.in_progress ?? 0 },
                            { key: 'rejected', label: t('Rejected'), icon: XCircle, count: stats?.rejected ?? 0 },
                            { key: 'cancelled', label: t('Cancelled'), icon: Ban, count: stats?.cancelled ?? 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${activeTab === tab.key
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>

                {/* Advanced Filters Drawer */}
                {showFilters && (
                    <CardContent className="p-4 bg-gray-50/80 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {auth.user?.permissions?.includes('manage-employees') && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 capitalize tracking-wider">
                                        {t('Employee')}
                                    </label>
                                    <Select value={filters.employee_id} onValueChange={(value) => setFilters({ ...filters, employee_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('All Employees')} />
                                        </SelectTrigger>
                                        <SelectContent searchable={true}>
                                            <SelectItem value="all">{t('All Employees')}</SelectItem>
                                            {employees?.map((employee: any) => (
                                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                                    {employee.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                            <DataTable
                                data={employeetransfers?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={ArrowRightLeft}
                                        title={t('No Employee Transfers found')}
                                        description={t('Get started by creating your first Employee Transfer.')}
                                        hasFilters={!!(filters.search || (filters.employee_id !== 'all' && filters.employee_id) || filters.status)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-employee-transfers"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Employee Transfer')}
                                        className="h-auto py-12"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30">
                    <Pagination
                        data={employeetransfers || { data: [], links: [], meta: {} }}
                        routeName="hrm.employee-transfers.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditEmployeeTransfer
                        employeetransfer={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View employeetransfer={viewingItem} />}
            </Dialog>

            <StatusModal
                employeeTransfer={statusModalItem}
                onClose={() => setStatusModalItem(null)}
            />

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Employee Transfer')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}