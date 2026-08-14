import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Wrench, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { FilterButton } from "@/components/ui/filter-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatCurrency } from '@/utils/helpers';

import Create from './Create';
import EditAssetMaintenance from './Edit';
import ViewAssetMaintenance from './View';
import NoRecordsFound from '@/components/no-records-found';
import { AssetMaintenance, AssetMaintenanceIndexProps, AssetMaintenanceModalState } from './types';

interface MaintenanceFilters {
    title: string;
    maintenance_type: string;
    status: string;
    priority: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { maintenances, auth } = usePage<AssetMaintenanceIndexProps>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState<MaintenanceFilters>({
        title: urlParams.get('title') || '',
        maintenance_type: urlParams.get('maintenance_type') || 'all',
        status: urlParams.get('status') || 'all',
        priority: urlParams.get('priority') || 'all'
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const [modalState, setModalState] = useState<AssetMaintenanceModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'assets.asset-maintenance.destroy',
        defaultMessage: t('Are you sure you want to delete this maintenance record?')
    });

    const handleFilter = () => {
        router.get(route('assets.asset-maintenance.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('assets.asset-maintenance.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ title: '', maintenance_type: 'all', status: 'all', priority: 'all' });
        router.get(route('assets.asset-maintenance.index'), { per_page: perPage, view: viewMode });
    };

    const openModal = (mode: 'add' | 'edit' | 'view', data: AssetMaintenance | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            scheduled: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-red-100 text-red-800',
            critical: 'bg-red-100 text-red-800'
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            sortable: true
        },
        {
            key: 'asset.name',
            header: t('Asset'),
            render: (_: any, maintenance: AssetMaintenance) => maintenance.asset?.name || '-'
        },
        {
            key: 'maintenance_type',
            header: t('Type'),
            render: (_: any, maintenance: AssetMaintenance) => (
                <span className="capitalize">{maintenance.maintenance_type}</span>
            )
        },
        {
            key: 'scheduled_date',
            header: t('Scheduled Date'),
            render: (_: any, maintenance: AssetMaintenance) => formatDate(maintenance.scheduled_date)
        },
        {
            key: 'status',
            header: t('Status'),
            render: (_: any, maintenance: AssetMaintenance) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(maintenance.status)}`}>
                    {t(maintenance.status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
            )
        },
        {
            key: 'priority',
            header: t('Priority'),
            render: (_: any, maintenance: AssetMaintenance) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(maintenance.priority)}`}>
                    {t(maintenance.priority).charAt(0).toUpperCase() + t(maintenance.priority).slice(1)}
                </span>
            )
        },
        {
            key: 'cost',
            header: t('Cost'),
            render: (_: any, maintenance: AssetMaintenance) => maintenance.cost ? formatCurrency(maintenance.cost) : '-'
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-asset-maintenance', 'edit-asset-maintenance', 'delete-asset-maintenance'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, maintenance: AssetMaintenance) => (
                <div className="flex gap-1">
                    {auth.user?.permissions?.includes('view-asset-maintenance') && (
                        <Tooltip key={`view-${maintenance.id}`} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => openModal('view', maintenance)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('View')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {auth.user?.permissions?.includes('edit-asset-maintenance') && (
                        <Tooltip key={`edit-${maintenance.id}`} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => openModal('edit', maintenance)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Edit')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {auth.user?.permissions?.includes('delete-asset-maintenance') && (
                        <Tooltip key={`delete-${maintenance.id}`} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(maintenance.id)}
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
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Assets') },
                { label: t('Maintenance') }
            ]}
            pageTitle={t('Manage Maintenance')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-asset-maintenance') && (
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
            }
        >
            <Head title={t('Maintenance')} />

            <Card className="shadow-sm">
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.title}
                                onChange={(value) => setFilters({ ...filters, title: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search maintenance...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="assets.asset-maintenance.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="assets.asset-maintenance.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.maintenance_type !== 'all' ? filters.maintenance_type : '', filters.status !== 'all' ? filters.status : '', filters.priority !== 'all' ? filters.priority : ''].filter(Boolean).length;
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
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Type')}</label>
                                <Select value={filters.maintenance_type} onValueChange={(value) => setFilters({...filters, maintenance_type: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Types')}</SelectItem>
                                        <SelectItem value="preventive">{t('Preventive')}</SelectItem>
                                        <SelectItem value="corrective">{t('Corrective')}</SelectItem>
                                        <SelectItem value="emergency">{t('Emergency')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                        <SelectItem value="scheduled">{t('Scheduled')}</SelectItem>
                                        <SelectItem value="in_progress">{t('In Progress')}</SelectItem>
                                        <SelectItem value="completed">{t('Completed')}</SelectItem>
                                        <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Priority')}</label>
                                <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by priority')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Priorities')}</SelectItem>
                                        <SelectItem value="low">{t('Low')}</SelectItem>
                                        <SelectItem value="medium">{t('Medium')}</SelectItem>
                                        <SelectItem value="high">{t('High')}</SelectItem>
                                        <SelectItem value="critical">{t('Critical')}</SelectItem>
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

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={maintenances.data || maintenances}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Wrench}
                                            title={t('No maintenance records found')}
                                            description={t('Get started by creating your first maintenance record.')}
                                            hasFilters={!!(filters.title)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-asset-maintenance"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Maintenance')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-6">
                            {(maintenances?.data || maintenances)?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {(maintenances?.data || maintenances)?.map((maintenance: AssetMaintenance) => (
                                        <Card key={maintenance.id} className="p-0 hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full min-w-0">
                                            {/* Header */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Wrench className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-sm text-gray-900">{maintenance.title}</h3>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="p-4 flex-1 min-h-0">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">{t('Asset')}</p>
                                                        <p className="font-medium text-xs">{maintenance.asset?.name || '-'}</p>
                                                    </div>
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide text-end">{t('Type')}</p>
                                                        <p className="font-medium text-xs capitalize text-end">{maintenance.maintenance_type}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">{t('Status')}</p>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadge(maintenance.status)}`}>
                                                             {t(maintenance.status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs min-w-0 text-end">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide text-end">{t('Priority')}</p>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getPriorityBadge(maintenance.priority)}`}>
                                                            {t(maintenance.priority.charAt(0).toUpperCase() + maintenance.priority.slice(1))}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">{t('Scheduled')}:</span>
                                                            <span className="font-medium">{formatDate(maintenance.scheduled_date)}</span>
                                                        </div>
                                                        {maintenance.completed_date && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">{t('Completed')}:</span>
                                                                <span className="font-medium">{formatDate(maintenance.completed_date)}</span>
                                                            </div>
                                                        )}
                                                        {maintenance.cost && (
                                                            <div className="flex justify-between border-t pt-2 mt-2">
                                                                <span className="text-gray-600 font-medium">{t('Cost')}:</span>
                                                                <span className="font-bold text-green-600">{formatCurrency(maintenance.cost)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Footer */}
                                            <div className="flex justify-end gap-2 p-3 border-t bg-gray-50/50 flex-shrink-0 mt-auto">
                                                <TooltipProvider>
                                                    {auth.user?.permissions?.includes('view-asset-maintenance') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => openModal('view', maintenance)} className="h-9 w-9 p-0 text-green-600 hover:text-green-700">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('edit-asset-maintenance') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => openModal('edit', maintenance)} className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-asset-maintenance') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog(maintenance.id)}
                                                                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </TooltipProvider>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={Wrench}
                                    title={t('No maintenance records found')}
                                    description={t('Get started by creating your first maintenance record.')}
                                    hasFilters={!!(filters.title)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-asset-maintenance"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Maintenance')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {maintenances.data && (
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                        <Pagination
                            data={maintenances}
                            routeName="assets.asset-maintenance.index"
                            filters={{ ...filters, per_page: perPage, view: viewMode }}
                        />
                    </CardContent>
                )}
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditAssetMaintenance
                        maintenance={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
                {modalState.mode === 'view' && modalState.data && (
                    <ViewAssetMaintenance
                        maintenance={modalState.data}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Maintenance')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
