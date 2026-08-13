import { useState, useMemo, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Package, Edit, Trash2, Eye, Image, Download, Tag, Layers, ShoppingCart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import NoRecordsFound from '@/components/no-records-found';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import { Item, ItemsIndexProps, ItemFilters } from './types';
import { usePageButtons } from '@/hooks/usePageButtons';

export default function Index() {
    const { t } = useTranslation();
    const { items, categories, auth } = usePage<ItemsIndexProps>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    // Item types same as Create page
    const itemTypes = ['product', 'service', 'part'];

    const [filters, setFilters] = useState<ItemFilters>({
        name: urlParams.get('name') || '',
        type: urlParams.get('type') || '',
        category_id: urlParams.get('category_id') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('googleDriveBtn', { module: 'Products', settingKey: 'GoogleDrive Products' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Products', settingKey: 'OneDrive Products' });
    const hubspotButtons = usePageButtons('hubspotBtn', { module: 'Products', settingKey: 'HubSpot Products' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Product & Service Products', settingKey: 'Dropbox Product & Service Products' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'product-service.items.destroy',
        defaultMessage: t('Are you sure you want to delete this item?')
    });

    const handleFilter = () => {
        router.get(route('product-service.items.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('product-service.items.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', type: '', category_id: '' });
        router.get(route('product-service.items.index'), {per_page: perPage, view: viewMode});
    };

    const getTypeBadge = (type: string) => {
        const map: Record<string, string> = {
            product: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/30',
            service: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-500/30',
            part: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-500/30',
        };
        return map[type] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
    };

    const renderImage = (value: string, size: 'sm' | 'lg' = 'sm') => {
        const cls = size === 'sm' ? 'w-12 h-12 rounded-lg' : 'w-full h-full';
        if (!value) {
            return (
                <div className={`${size === 'sm' ? 'w-12 h-12 rounded-lg' : 'w-full h-full flex items-center justify-center'} bg-gray-100 border dark:bg-gray-700 dark:border-gray-600 flex items-center justify-center`}>
                    <Package className={`${size === 'sm' ? 'w-5 h-5' : 'w-12 h-12'} text-gray-300 dark:text-gray-500`} />
                </div>
            );
        }
        const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
        const url = getImagePath(value);
        return isImg ? (
            <div className={`relative ${size === 'sm' ? 'w-12 h-12' : 'w-full h-full'}`}>
                <img
                    src={url}
                    alt="Image"
                    className={`${cls} object-cover border shadow-sm hover:scale-110 transition-transform duration-300 cursor-pointer`}
                    onClick={() => window.open(url, '_blank')}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                    }}
                />
                <div className={`hidden ${size === 'sm' ? 'w-12 h-12 rounded-lg' : 'w-full h-full'} bg-gray-100 border flex items-center justify-center dark:bg-gray-700`}>
                    <Package className={`${size === 'sm' ? 'w-5 h-5' : 'w-12 h-12'} text-gray-400`} />
                </div>
            </div>
        ) : (
            <div
                className={`${size === 'sm' ? 'w-12 h-12 rounded-lg' : 'w-full h-full'} bg-gray-100 border dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = value.split('/').pop() || 'file';
                    link.click();
                }}
            >
                <Download className={`${size === 'sm' ? 'w-5 h-5' : 'w-8 h-8'} text-gray-600 dark:text-gray-400`} />
            </div>
        );
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Product'),
            sortable: true,
            render: (value: string, item: Item) => (
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg">
                        {renderImage(item.image, 'sm')}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{value}</p>
                        {item.sku && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Tag className="h-3 w-3 flex-shrink-0" />{item.sku}
                            </p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'sale_price',
            header: t('Sale Price'),
            sortable: true,
            render: (value: number) => (
                <span className="font-semibold text-sm text-green-700 dark:text-green-400">
                    {value ? formatCurrency(value) : <span className="text-gray-400">—</span>}
                </span>
            )
        },
        {
            key: 'purchase_price',
            header: t('Purchase Price'),
            sortable: true,
            render: (value: number) => (
                <span className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                    {value ? formatCurrency(value) : <span className="text-gray-400">—</span>}
                </span>
            )
        },
        {
            key: 'category_id',
            header: t('Category'),
            render: (value: number, item: Item) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.category?.name || '-'}</span>
            )
        },
        {
            key: 'unit',
            header: t('Unit'),
            render: (value: string, item: Item) => (
                item.unit_relation?.unit_name ? (
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800">
                        {item.unit_relation.unit_name}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                )
            )
        },
        {
            key: 'total_quantity',
            header: t('Quantity'),
            sortable: false,
            render: (value: number) => (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/30">
                    <ShoppingCart className="h-3 w-3" />
                    {Math.floor(value) || 0}
                </span>
            )
        },
        {
            key: 'type',
            header: t('Type'),
            sortable: true,
            render: (value: string) => (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${getTypeBadge(value)}`}>
                    {t(value)}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-product-service-item', 'edit-product-service-item', 'delete-product-service-item'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, item: Item) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.show', item.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.edit', item.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(item.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20">
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
                breadcrumbs={[
                    {label: t('Product & Service')},
                    {label: t('Items')}
                ]}
                pageTitle={t('Manage Items')}
                pageActions={
                    <div className="flex gap-2">
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {dropboxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {hubspotButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('manage-stock') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.visit(route('product-service.stock.index'))}>
                                        <Package className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Add Stock')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('product-service.items.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                }
            >
                <Head title={t('Items')} />

                <Card className="shadow-sm dark:border-gray-700">
                    {/* Search & Controls */}
                    <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-md">
                                <SearchInput
                                    value={filters.name}
                                    onChange={(value) => setFilters({...filters, name: value})}
                                    onSearch={handleFilter}
                                    placeholder={t('Search items...')}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ListGridToggle
                                    currentView={viewMode}
                                    routeName="product-service.items.index"
                                    filters={{...filters, per_page: perPage}}
                                />
                                <PerPageSelector
                                    routeName="product-service.items.index"
                                    filters={{...filters, view: viewMode}}
                                />
                                <div className="relative">
                                    <FilterButton
                                        showFilters={showFilters}
                                        onToggle={() => setShowFilters(!showFilters)}
                                    />
                                    {(() => {
                                        const activeFilters = [filters.type, filters.category_id].filter(Boolean).length;
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('Item Type')}</label>
                                    <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by item type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {itemTypes.map((type) => (
                                                <SelectItem key={type} value={type}>{t(type)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('Category')}</label>
                                    <Select value={filters.category_id} onValueChange={(value) => setFilters({...filters, category_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by category')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
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

                    {/* List / Grid Content */}
                    <CardContent className="p-0">
                        {viewMode === 'list' ? (
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <div className="min-w-[800px]">
                                    <DataTable
                                        data={items.data}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="rounded-none"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={Package}
                                                title={t('No items found')}
                                                description={t('Get started by creating your first item.')}
                                                hasFilters={!!(filters.name || filters.type || filters.category_id)}
                                                onClearFilters={clearFilters}
                                                createPermission="create-product-service-item"
                                                onCreateClick={() => router.visit(route('product-service.items.create'))}
                                                createButtonText={t('Create Item')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-auto max-h-[70vh] p-4">
                                {items.data.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                        {items.data.map((item) => (
                                            <Card key={item.id} className="p-0 flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden border-0 ring-1 ring-gray-200 hover:ring-primary/40 dark:ring-gray-700 dark:hover:ring-primary/50 group">
                                                {/* Product Image */}
                                                <div className="relative h-44 bg-gradient-to-br from-slate-100 via-gray-50 to-white dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 flex-shrink-0 overflow-hidden">
                                                    {item.image ? (
                                                        <>
                                                            <img
                                                                src={getImagePath(item.image)}
                                                                alt={item.name}
                                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    const fallback = target.nextElementSibling as HTMLElement;
                                                                    if (fallback) fallback.classList.remove('hidden');
                                                                }}
                                                            />
                                                            <div className="hidden w-full h-full flex items-center justify-center">
                                                                <div className="p-5 bg-white/70 dark:bg-gray-700/70 rounded-2xl backdrop-blur-sm shadow-sm">
                                                                    <Package className="h-12 w-12 text-gray-300 dark:text-gray-500" />
                                                                </div>
                                                            </div>
                                                            {/* Hover overlay — URL computed at render time, same as list view */}
                                                            <a
                                                                href={getImagePath(item.image)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10"
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-white/60">
                                                                    <Eye className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
                                                                </div>
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className="p-5 bg-white/70 dark:bg-gray-700/70 rounded-2xl backdrop-blur-sm shadow-sm">
                                                                <Package className="h-12 w-12 text-gray-300 dark:text-gray-500" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Name + SKU overlaid at bottom - removed, moved to card body */}
                                                </div>

                                                {/* Card Body */}
                                                <CardContent className="p-3 flex-1 space-y-2">
                                                    {/* Name + SKU */}
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{item.name}</h3>
                                                        {item.sku && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Tag className="h-3 w-3 flex-shrink-0" />{item.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {/* Type + Quantity row */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${getTypeBadge(item.type)}`}>
                                                            {t(item.type)}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/30">
                                                            <ShoppingCart className="h-3 w-3" />
                                                            {Math.floor(item.total_quantity) || 0}
                                                        </span>
                                                    </div>
                                                    {/* Prices */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center border border-green-100 dark:border-green-800">
                                                            <p className="text-xs text-muted-foreground">{t('Sale Price')}</p>
                                                            <p className="text-sm font-bold text-green-700 dark:text-green-400 truncate">
                                                                {item.sale_price ? formatCurrency(item.sale_price) : '—'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center border border-orange-100 dark:border-orange-800">
                                                            <p className="text-xs text-muted-foreground">{t('Purchase')}</p>
                                                            <p className="text-sm font-bold text-orange-600 dark:text-orange-400 truncate">
                                                                {item.purchase_price ? formatCurrency(item.purchase_price) : '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Category + Unit */}
                                                    <div className="flex items-center gap-1.5 flex-wrap min-h-[22px]">
                                                        {item.category && (
                                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800">
                                                                <Layers className="h-3 w-3 flex-shrink-0" />
                                                                {item.category.name}
                                                            </span>
                                                        )}
                                                        {item.unit_relation && (
                                                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800">
                                                                {item.unit_relation.unit_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardContent>

                                                <Separator />

                                                {/* Card Footer */}
                                                <CardFooter className="p-2 flex items-center justify-end gap-1 bg-gray-50/50 dark:bg-gray-800/50">
                                                    <div className="flex gap-1">
                                                        <TooltipProvider>
                                                            {auth.user?.permissions?.includes('view-product-service-item') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.show', item.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('edit-product-service-item') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.edit', item.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('delete-product-service-item') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(item.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20">
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
                                        icon={Package}
                                        title={t('No items found')}
                                        description={t('Get started by creating your first item.')}
                                        hasFilters={!!(filters.name || filters.type || filters.category_id)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-product-service-item"
                                        onCreateClick={() => router.visit(route('product-service.items.create'))}
                                        createButtonText={t('Create Item')}
                                        className="h-auto"
                                    />
                                )}
                            </div>
                        )}
                    </CardContent>

                    {/* Pagination Footer */}
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                        <Pagination
                            data={items}
                            routeName="product-service.items.index"
                            filters={{...filters, per_page: perPage, view: viewMode}}
                        />
                    </CardContent>
                </Card>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Item')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />

            </AuthenticatedLayout>
        </TooltipProvider>
    );
}
