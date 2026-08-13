import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, FileCheck as FileCheckIcon, Download, Play, User as UserIcon, LayoutGrid, CheckCircle2, Clock, Calendar, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Create from './Create';
import EditAcknowledgment from './Edit';
import View from './View';
import StatusModal from './StatusModal';
import NoRecordsFound from '@/components/no-records-found';
import { Acknowledgment, AcknowledgmentsIndexProps, AcknowledgmentFilters, AcknowledgmentModalState } from './types';
import { formatDate, getImagePath, downloadFile } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<AcknowledgmentsIndexProps>().props;
    const { acknowledgments, auth, users, hrmdocuments, stats, imageUrlPrefix } = pageProps;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<AcknowledgmentFilters>({
        acknowledgment_note: urlParams.get('acknowledgment_note') || '',
        employee_id: urlParams.get('employee_id') || '',
        document_id: urlParams.get('document_id') || '',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<AcknowledgmentModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Acknowledgment | null>(null);
    const [statusModalItem, setStatusModalItem] = useState<Acknowledgment | null>(null);

    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.acknowledgments.destroy',
        defaultMessage: t('Are you sure you want to delete this acknowledgment?')
    });

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'acknowledged':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
            case 'pending':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';
        }
    };

    const handleFilter = () => {
        router.get(route('hrm.acknowledgments.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (statusKey: string) => {
        const newFilters = { ...filters, status: statusKey };
        setFilters(newFilters);
        router.get(route('hrm.acknowledgments.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.acknowledgments.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            acknowledgment_note: '',
            employee_id: '',
            document_id: '',
            status: '',
        });
        router.get(route('hrm.acknowledgments.index'), { per_page: perPage });
    };

    const openModal = (mode: 'add' | 'edit', data: Acknowledgment | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const statusTabs = [
        { key: '', label: t('All'), icon: LayoutGrid, count: (stats as any)?.total ?? acknowledgments?.total ?? 0 },
        { key: 'pending', label: t('Pending'), icon: Clock, count: (stats as any)?.pending ?? 0 },
        { key: 'acknowledged', label: t('Acknowledged'), icon: CheckCircle2, count: (stats as any)?.acknowledged ?? 0 },
    ];

    const tableColumns = [
        {
            key: 'employee.name',
            header: t('Employee Name'),
            sortable: false,
            render: (_: any, row: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                        {row.employee?.avatar ? (
                            <img
                                src={getImagePath(row.employee.avatar)}
                                alt={row.employee.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{row.employee?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground">{row.employee?.email || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'document.title',
            header: t('Document'),
            sortable: false,
            render: (_: any, row: any) => (
                <div className="flex items-center gap-2 py-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{row.document?.title || <span className="text-gray-400 font-medium">-</span>}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const statusText = value === 'pending' ? 'Pending' : value === 'acknowledged' ? 'Acknowledged' : value;
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(value)}`}>
                        {t(statusText?.charAt(0).toUpperCase() + statusText?.slice(1) || 'Unknown')}
                    </span>
                );
            }
        },
        {
            key: 'acknowledged_at',
            header: t('Acknowledged At'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : <div className="text-center w-full text-gray-400 dark:text-gray-500 font-medium">-</div>
        },
        {
            key: 'assignedBy.name',
            header: t('Assigned By'),
            sortable: false,
            render: (_: any, row: any) => {
                const user = row.assignedBy || row.assigned_by;
                if (!user || !user.name) {
                    return <div className="text-center w-full text-gray-400 dark:text-gray-500 font-medium">-</div>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                            {user.avatar ? (
                                <img
                                    src={getImagePath(user.avatar)}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    </div>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-acknowledgments', 'manage-acknowledgment-status', 'download-acknowledgment', 'edit-acknowledgments', 'delete-acknowledgments'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-center [&>div]:justify-center',
            render: (_: any, ackItem: Acknowledgment) => (
                <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-acknowledgment-status') && ackItem.status !== 'acknowledged' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setStatusModalItem(ackItem)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Update Status')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('download-acknowledgment') && ackItem.document?.document && ackItem.status === 'acknowledged' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `${imageUrlPrefix}/${ackItem.document?.document}`;
                                            link.download = ackItem.document?.document.split('/').pop() || 'download';
                                            link.click();
                                        }}
                                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Download')}</p></TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('view-acknowledgments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(ackItem)} className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('edit-acknowledgments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', ackItem)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-acknowledgments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(ackItem.id)}
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
                { label: t('Acknowledgments') }
            ]}
            pageTitle={t('Manage Acknowledgments')}
            pageDescription={t('Track employee document acknowledgments, assign mandatory forms, and monitor compliance status.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-acknowledgments') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    {t('Create')}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Create Acknowledgment')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            }
        >
            <Head title={t('Acknowledgments')} />

            {/* Main Content Card */}
            <Card className="shadow-sm border border-gray-200 dark:border-zinc-800">
                {/* Search & Controls Header */}
                <CardContent className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.acknowledgment_note}
                                onChange={(value) => setFilters({ ...filters, acknowledgment_note: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by employee, document...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="hrm.acknowledgments.index"
                                filters={{ ...filters }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.employee_id, filters.document_id].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Interactive Status Tabs */}
                <div className="flex items-center gap-2 px-6 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto bg-gray-50/50 dark:bg-zinc-900/50">
                    {statusTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = (filters.status || '') === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
                                <span>{tab.label}</span>
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 dark:bg-zinc-900/90 border-b border-gray-200 dark:border-zinc-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {auth.user?.permissions?.includes('manage-employees') && (
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-2">{t('Employee')}</label>
                                    <Select value={filters.employee_id} onValueChange={(value) => setFilters({ ...filters, employee_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by Employee')} />
                                        </SelectTrigger>
                                        <SelectContent searchable={true}>
                                            {users?.map((item: any) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-2">{t('Document')}</label>
                                <Select value={filters.document_id} onValueChange={(value) => setFilters({ ...filters, document_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Document')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        {hrmdocuments?.map((item: any) => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                {item.title}
                                            </SelectItem>
                                        ))}
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

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                            <DataTable
                                data={acknowledgments?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={FileCheckIcon}
                                        title={t('No Acknowledgments found')}
                                        description={t('Get started by creating your first Acknowledgment.')}
                                        hasFilters={!!(filters.acknowledgment_note || filters.employee_id || filters.document_id || filters.status)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-acknowledgments"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Acknowledgment')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30">
                    <Pagination
                        data={acknowledgments || { data: [], links: [], meta: {} }}
                        routeName="hrm.acknowledgments.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditAcknowledgment
                        acknowledgment={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View acknowledgment={viewingItem} />}
            </Dialog>

            <StatusModal
                acknowledgment={statusModalItem}
                onClose={() => setStatusModalItem(null)}
            />

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Acknowledgment')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}