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
import { Plus, Edit, Trash2, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { FilterButton } from "@/components/ui/filter-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { formatDate, formatCurrency } from '@/utils/helpers';

import Create from './Create';
import EditAssetDepreciation from './Edit';
import NoRecordsFound from '@/components/no-records-found';
import { AssetDepreciation, AssetDepreciationIndexProps, AssetDepreciationModalState } from './types';

interface DepreciationFilters {
    asset_name: string;
    depreciation_method: string;
    start_date: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { depreciations, auth } = usePage<AssetDepreciationIndexProps>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState<DepreciationFilters>({
        asset_name: urlParams.get('asset_name') || '',
        depreciation_method: urlParams.get('depreciation_method') || 'all',
        start_date: urlParams.get('start_date') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const [modalState, setModalState] = useState<AssetDepreciationModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'assets.asset-depreciation.destroy',
        defaultMessage: t('Are you sure you want to delete this depreciation record?')
    });

    const handleFilter = () => {
        router.get(route('assets.asset-depreciation.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('assets.asset-depreciation.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ asset_name: '', depreciation_method: 'all', start_date: '' });
        router.get(route('assets.asset-depreciation.index'), { per_page: perPage, view: viewMode });
    };

    const openModal = (mode: 'add' | 'edit', data: AssetDepreciation | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'asset.name',
            header: t('Asset'),
            render: (_: any, depreciation: AssetDepreciation) => depreciation.asset?.name || '-'
        },
        {
            key: 'depreciation_method',
            header: t('Method'),
            render: (_: any, depreciation: AssetDepreciation) => (
                <span className="capitalize">{depreciation.depreciation_method.replace(/_/g, ' ')}</span>
            )
        },
        {
            key: 'useful_life_years',
            header: t('Useful Life'),
            render: (_: any, depreciation: AssetDepreciation) => `${depreciation.useful_life_years} ${t('years')}`
        },
        {
            key: 'salvage_value',
            header: t('Salvage Value'),
            render: (_: any, depreciation: AssetDepreciation) => formatCurrency(depreciation.salvage_value || 0)
        },
        {
            key: 'annual_depreciation',
            header: t('Annual Depreciation'),
            render: (_: any, depreciation: AssetDepreciation) => formatCurrency(depreciation.annual_depreciation)
        },
        {
            key: 'accumulated_depreciation',
            header: t('Accumulated'),
            render: (_: any, depreciation: AssetDepreciation) => formatCurrency(depreciation.accumulated_depreciation || 0)
        },
        {
            key: 'book_value',
            header: t('Book Value'),
            render: (_: any, depreciation: AssetDepreciation) => formatCurrency(depreciation.book_value)
        },
        {
            key: 'depreciation_start_date',
            header: t('Start Date'),
            render: (_: any, depreciation: AssetDepreciation) => formatDate(depreciation.depreciation_start_date)
        },
        {
            key: 'is_fully_depreciated',
            header: t('Status'),
            render: (_: any, depreciation: AssetDepreciation) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    depreciation.is_fully_depreciated ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                    {depreciation.is_fully_depreciated ? t('Fully Depreciated') : t('Active')}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-asset-depreciation', 'delete-asset-depreciation'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, depreciation: AssetDepreciation) => (
                <div className="flex gap-1">
                    {auth.user?.permissions?.includes('edit-asset-depreciation') && (
                        <Tooltip key={`edit-${depreciation.id}`} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => openModal('edit', depreciation)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Edit')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {auth.user?.permissions?.includes('delete-asset-depreciation') && (
                        <Tooltip key={`delete-${depreciation.id}`} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(depreciation.id)}
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
                { label: t('Depreciation') }
            ]}
            pageTitle={t('Manage Depreciation')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-asset-depreciation') && (
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
            <Head title={t('Depreciation')} />

            <Card className="shadow-sm">
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.asset_name}
                                onChange={(value) => setFilters({ ...filters, asset_name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by asset name...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="assets.asset-depreciation.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="assets.asset-depreciation.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.depreciation_method !== 'all' ? filters.depreciation_method : '', filters.start_date].filter(Boolean).length;
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Method')}</label>
                                <Select value={filters.depreciation_method} onValueChange={(value) => setFilters({...filters, depreciation_method: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by method')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Methods')}</SelectItem>
                                        <SelectItem value="straight_line">{t('Straight Line')}</SelectItem>
                                        <SelectItem value="declining_balance">{t('Declining Balance')}</SelectItem>
                                        <SelectItem value="sum_of_years">{t('Sum Of Years')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Start Date')}</label>
                                <DatePicker
                                    value={filters.start_date}
                                    onChange={(value) => setFilters({...filters, start_date: value || ''})}
                                    placeholder={t('Select date')}
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
                                    data={depreciations.data || depreciations}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={TrendingDown}
                                            title={t('No depreciation records found')}
                                            description={t('Get started by creating your first depreciation record.')}
                                            hasFilters={!!(filters.asset_name)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-asset-depreciation"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Depreciation')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {(depreciations?.data || depreciations)?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {(depreciations?.data || depreciations)?.map((depreciation: AssetDepreciation) => (
                                        <Card key={depreciation.id} className="p-0 hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full min-w-0">
                                            {/* Header */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <TrendingDown className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-sm text-gray-900">{depreciation.asset?.name}</h3>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="p-4 flex-1 min-h-0">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">{t('Method')}</p>
                                                        <p className="font-medium text-xs capitalize">{depreciation.depreciation_method.replace(/_/g, ' ')}</p>
                                                    </div>
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide text-end">{t('Useful Life')}</p>
                                                        <p className="font-medium text-xs text-end">{depreciation.useful_life_years} {t('years')}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">{t('Start Date')}</p>
                                                        <p className="font-medium text-xs">{formatDate(depreciation.depreciation_start_date)}</p>
                                                    </div>
                                                    <div className="text-xs min-w-0 text-end">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide text-end">{t('Status')}</p>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                                            depreciation.is_fully_depreciated ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {depreciation.is_fully_depreciated ? t('Fully Depreciated') : t('Active')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">{t('Salvage Value')}:</span>
                                                            <span className="font-medium">{formatCurrency(depreciation.salvage_value || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">{t('Annual Depreciation')}:</span>
                                                            <span className="font-medium text-red-600">{formatCurrency(depreciation.annual_depreciation)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">{t('Accumulated')}:</span>
                                                            <span className="font-medium text-orange-600">{formatCurrency(depreciation.accumulated_depreciation || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2 mt-2">
                                                            <span className="text-gray-600 font-medium">{t('Book Value')}:</span>
                                                            <span className="font-bold text-green-600">{formatCurrency(depreciation.book_value)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Footer */}
                                            <div className="flex justify-end gap-2 p-3 border-t bg-gray-50/50 flex-shrink-0 mt-auto">
                                                <TooltipProvider>
                                                    {auth.user?.permissions?.includes('edit-asset-depreciation') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => openModal('edit', depreciation)} className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-asset-depreciation') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog(depreciation.id)}
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
                                    icon={TrendingDown}
                                    title={t('No depreciation records found')}
                                    description={t('Get started by creating your first depreciation record.')}
                                    hasFilters={!!(filters.asset_name)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-asset-depreciation"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Depreciation')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {depreciations.data && (
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                        <Pagination
                            data={depreciations}
                            routeName="assets.asset-depreciation.index"
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
                    <EditAssetDepreciation
                        depreciation={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Depreciation')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
