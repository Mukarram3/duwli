import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Warehouse as WarehouseIcon, MapPin, Phone, Mail, Building2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import Create from './create';
import EditWarehouse from './edit';
import NoRecordsFound from '@/components/no-records-found';
import { Warehouse, WarehousesIndexProps, WarehouseFilters, WarehouseModalState } from './types';

export default function Index() {
    const { t } = useTranslation();
    const { warehouses, auth } = usePage<WarehousesIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<WarehouseFilters>({
        name: urlParams.get('name') || '',
        city: urlParams.get('city') || '',
        is_active: urlParams.get('is_active') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    /**
    * * If you want to remove the grid view then remove the viewMode from routes and filters.
    */
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<WarehouseModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showFilters, setShowFilters] = useState(false);

    // Add hook here
    const pageButtons = usePageButtons('warehouseBtn','Test data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'warehouses.destroy',
        defaultMessage: t('Are you sure you want to delete this warehouse?')
    });

    const handleFilter = () => {
        router.get(route('warehouses.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('warehouses.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', city: '', is_active: '' });
        router.get(route('warehouses.index'), {per_page: perPage, view: viewMode});
    };

    const openModal = (mode: 'add' | 'edit', data: Warehouse | null = null) => {
        setModalState({
            isOpen: true,
            mode,
            data
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name'),
            sortable: true,
            render: (value: string, warehouse: Warehouse) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 dark:from-primary/30 dark:to-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{value}</p>
                        {warehouse.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{warehouse.email}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'address',
            header: t('Address'),
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 dark:bg-orange-900/20 dark:border-orange-800">
                        <MapPin className="h-3 w-3 text-orange-500" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{value || '-'}</span>
                </div>
            )
        },
        {
            key: 'city',
            header: t('City'),
            sortable: true,
            render: (value: string) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{value || '-'}</span>
        },
        {
            key: 'zip_code',
            header: t('Zip Code'),
            render: (value: string) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'phone',
            header: t('Phone'),
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 dark:bg-blue-900/20 dark:border-blue-800">
                        <Phone className="h-3 w-3 text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{value || '-'}</span>
                </div>
            )
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: true,
            render: (value: boolean) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                    value
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800'
                        : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800'
                }`}>
                    {value ? t('Active') : t('Inactive')}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-warehouses', 'delete-warehouses'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, warehouse: Warehouse) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-warehouses') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', warehouse)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-warehouses') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(warehouse.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
            breadcrumbs={[{label: t('Warehouses')}]}
            pageTitle={t('Manage Warehouses')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('create-warehouses') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
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
            <Head title={t('Warehouses')} />

            <Card className="shadow-sm dark:border-gray-700">
                {/* Search & Controls */}
                <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({...filters, name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search warehouses...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="warehouses.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="warehouses.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.city, filters.is_active].filter(Boolean).length;
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
                    <CardContent className="p-4 bg-blue-50/30 border-b dark:bg-blue-950/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('City')}</label>
                                <Input
                                    placeholder={t('Filter by city')}
                                    value={filters.city}
                                    onChange={(e) => setFilters({...filters, city: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('Status')}</label>
                                <Select value={filters.is_active} onValueChange={(value) => setFilters({...filters, is_active: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">{t('Active')}</SelectItem>
                                        <SelectItem value="0">{t('Inactive')}</SelectItem>
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
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={warehouses.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={WarehouseIcon}
                                            title={t('No warehouses found')}
                                            description={t('Get started by creating your first warehouse.')}
                                            hasFilters={!!(filters.name || filters.city || filters.is_active)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-warehouses"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Warehouse')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {warehouses.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {warehouses.data.map((warehouse) => (
                                        <Card key={warehouse.id} className="p-0 flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden border-0 ring-1 ring-gray-200 hover:ring-primary/40 dark:ring-gray-700 dark:hover:ring-primary/50 group">
                                            {/* Card Header — Large icon + name + location */}
                                            <div className="px-5 pt-5 pb-4 flex-shrink-0">
                                                <div className="flex items-start justify-between gap-2 mb-4">
                                                    {/* Big warehouse icon */}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                                        warehouse.is_active
                                                            ? 'bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/10'
                                                            : 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800'
                                                    }`}>
                                                        <Building2 className={`h-7 w-7 ${warehouse.is_active ? 'text-primary' : 'text-gray-400'}`} />
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
                                                        warehouse.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800'
                                                            : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800'
                                                    }`}>
                                                        {warehouse.is_active ? t('Active') : t('Inactive')}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-base text-gray-900 truncate dark:text-gray-100 mb-1">{warehouse.name}</h3>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 text-primary/60 flex-shrink-0" />
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {[warehouse.city, warehouse.zip_code].filter(Boolean).join(', ') || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Card Body — contact details */}
                                            <CardContent className="px-5 py-4 flex-1 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 dark:bg-orange-900/20 dark:border-orange-800">
                                                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-muted-foreground mb-0.5">{t('Address')}</p>
                                                        <p className="text-xs font-medium text-gray-800 truncate dark:text-gray-200" title={warehouse.address}>{warehouse.address || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 dark:bg-blue-900/20 dark:border-blue-800">
                                                        <Phone className="h-3.5 w-3.5 text-blue-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-muted-foreground mb-0.5">{t('Phone')}</p>
                                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{warehouse.phone || '-'}</p>
                                                    </div>
                                                </div>
                                                {warehouse.email && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 dark:bg-purple-900/20 dark:border-purple-800">
                                                            <Mail className="h-3.5 w-3.5 text-purple-500" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground mb-0.5">{t('Email')}</p>
                                                            <p className="text-xs font-medium text-gray-800 truncate dark:text-gray-200">{warehouse.email}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>

                                            <Separator />

                                            {/* Card Footer — Actions */}
                                            <CardFooter className="px-4 py-2.5 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                                <p className="text-xs text-muted-foreground">{t('Warehouse')}</p>
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        {auth.user?.permissions?.includes('edit-warehouses') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', warehouse)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('delete-warehouses') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(warehouse.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20">
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
                                    icon={WarehouseIcon}
                                    title={t('No warehouses found')}
                                    description={t('Get started by creating your first warehouse.')}
                                    hasFilters={!!(filters.name || filters.city || filters.is_active)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-warehouses"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Warehouse')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                    <Pagination
                        data={warehouses}
                        routeName="warehouses.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditWarehouse
                        data={modalState.data}
                        warehouse={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Warehouse')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
