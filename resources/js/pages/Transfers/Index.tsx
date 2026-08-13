import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Trash2, ArrowRightLeft, Package, Warehouse as WarehouseIcon, CalendarDays, Image } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import NoRecordsFound from '@/components/no-records-found';
import Create from './create';
import { Transfer as TransferType, TransfersIndexProps, TransferFilters, TransferModalState } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';

interface Warehouse {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { transfers, warehouses, products, auth } = usePage<TransfersIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<TransferFilters>({
        product_name: urlParams.get('product_name') || '',
        from_warehouse: urlParams.get('from_warehouse') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [showFilters, setShowFilters] = useState(false);
    const [modalState, setModalState] = useState<TransferModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'transfers.destroy',
        defaultMessage: t('Are you sure you want to delete this transfer?')
    });

    const handleFilter = () => {
        router.get(route('transfers.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('transfers.index'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ product_name: '', from_warehouse: '' });
        router.get(route('transfers.index'), {per_page: perPage});
    };

    const openModal = (mode: 'add', data: TransferType | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'product.name',
            header: t('Product'),
            sortable: true,
            className: 'w-[280px]',
            render: (value: any, transfer: TransferType) => {
                const imageUrl = transfer.product.image ? getImagePath(transfer.product.image) : '';
                return (
                    <div className="flex items-center gap-3">
                        {imageUrl ? (
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <img
                                    src={imageUrl}
                                    alt={transfer.product.name}
                                    className="w-12 h-12 object-cover rounded-md border hover:scale-110 transition-transform cursor-pointer"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.classList.remove('hidden');
                                    }}
                                />
                                <div className="hidden w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                                    <Image className="w-6 h-6 text-gray-400" />
                                </div>
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-violet-50 rounded-md border border-violet-100 flex items-center justify-center flex-shrink-0 dark:bg-violet-900/20 dark:border-violet-800">
                                <Package className="h-5 w-5 text-violet-500" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{transfer.product.name}</p>
                            {transfer.product.sku && (
                                <p className="text-xs text-muted-foreground truncate">{transfer.product.sku}</p>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'from_warehouse.name',
            header: t('From Warehouse'),
            render: (value: any, transfer: TransferType) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 dark:bg-orange-900/20 dark:border-orange-800">
                        <WarehouseIcon className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{transfer.from_warehouse.name}</p>
                        {transfer.from_warehouse.email && (
                            <p className="text-xs text-muted-foreground">{transfer.from_warehouse.email}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'to_warehouse.name',
            header: t('To Warehouse'),
            render: (value: any, transfer: TransferType) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 dark:bg-emerald-900/20 dark:border-emerald-800">
                        <WarehouseIcon className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{transfer.to_warehouse.name}</p>
                        {transfer.to_warehouse.email && (
                            <p className="text-xs text-muted-foreground">{transfer.to_warehouse.email}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'quantity',
            header: t('Quantity'),
            sortable: true,
            render: (value: number) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800">
                    {Math.floor(value) || 0}
                </span>
            )
        },
        {
            key: 'date',
            header: t('Date'),
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {value ? formatDate(value) : '-'}
                    </span>
                </div>
            )
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, transfer: TransferType) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                {auth.user?.permissions?.includes('delete-transfers') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(transfer.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Transfers')}]}
            pageTitle={t('Manage Transfers')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                {auth.user?.permissions?.includes('create-transfers') && (
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Create')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Transfers')} />

            <Card className="shadow-sm dark:border-gray-700">
                {/* Search & Controls */}
                <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.product_name}
                                onChange={(value) => setFilters({...filters, product_name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search transfers...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <PerPageSelector
                                routeName="transfers.index"
                                filters={filters}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {filters.from_warehouse && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                        1
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 border-b dark:bg-blue-950/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('From Warehouse')}</label>
                                <Select value={filters.from_warehouse} onValueChange={(value) => setFilters({...filters, from_warehouse: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by warehouse')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
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

                {/* Table */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                            <DataTable
                                data={transfers.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={ArrowRightLeft}
                                        title={t('No transfers found')}
                                        description={t('Get started by creating your first transfer.')}
                                        hasFilters={!!(filters.product_name || filters.from_warehouse)}
                                        onClearFilters={clearFilters}
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Transfer')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Pagination */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                    <Pagination
                        data={transfers}
                        routeName="transfers.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Transfer')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
