import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from '@/components/ui/pagination';
import { Eye, ShoppingCart, User as UserIcon, Warehouse as WarehouseIcon, Package } from 'lucide-react';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import NoRecordsFound from '@/components/no-records-found';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageButtons } from '@/hooks/usePageButtons';

interface PosSale {
    id: number;
    sale_number: string;
    customer_id?: number;
    customer?: {
        name: string;
        email: string;
        avatar?: string | null;
    };
    warehouse?: {
        name: string;
        email?: string | null;
    };
    tax_amount: number;
    pos_date: string;
    created_at: string;
    items_count: number;
    items?: Array<{
        total_amount: number;
    }>;
}

interface IndexProps {
    sales: {
        data: PosSale[];
        links: any[];
        meta: any;
    };
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Index() {
    const { t } = useTranslation();
    const { sales, auth } = usePage<IndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        search: urlParams.get('search') || '',
        customer: urlParams.get('customer') || '',
        warehouse: urlParams.get('warehouse') || ''
    });
    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('googleDriveBtn', { module: 'POS Order', settingKey: 'GoogleDrive POS Order' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'POS Order', settingKey: 'OneDrive POS Order' });

    const handleFilter = () => {
        router.get(route('pos.orders'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', customer: '', warehouse: '' });
        router.get(route('pos.orders'), {per_page: perPage, view: viewMode});
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('pos.orders'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const tableColumns = [
        {
            key: 'sale_number',
            header: t('Sale Number'),
            sortable: true,
            render: (value: string, sale: PosSale) =>
                auth.user?.permissions?.includes('view-pos-orders') ? (
                    <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                        onClick={() => router.get(route('pos.show', sale.id))}
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
            key: 'customer',
            header: t('Customer'),
            render: (_: any, sale: PosSale) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0 dark:bg-gray-700 dark:border-gray-600">
                        {sale.customer?.avatar ? (
                            <img src={getImagePath(sale.customer.avatar)} alt={sale.customer.name} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {sale.customer?.name || t('Walk-in Customer')}
                        </span>
                        {sale.customer?.email && (
                            <span className="text-xs text-muted-foreground truncate">{sale.customer.email}</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'warehouse',
            header: t('Warehouse'),
            render: (_: any, sale: PosSale) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 dark:bg-orange-900/20 dark:border-orange-800">
                        <WarehouseIcon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {sale.warehouse?.name || '-'}
                        </span>
                        {sale.warehouse?.email && (
                            <span className="text-xs text-muted-foreground truncate">{sale.warehouse.email}</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'items_count',
            header: t('Items'),
            sortable: false,
            render: (value: number) => (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600">
                    <Package className="h-3 w-3" />
                    {value || 0}
                </span>
            )
        },
        {
            key: 'total',
            header: t('Total'),
            sortable: false,
            render: (_: any, sale: PosSale) => (
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(sale.total || 0)}
                </span>
            )
        },
        ...(auth.user?.permissions?.includes('view-pos-orders') ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, sale: PosSale) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.get(route('pos.show', sale.id))}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('View')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('POS'), url: route('pos.index') },
                { label: t('POS Orders') }
            ]}
            pageTitle={t('POS Orders')}
            pageDescription={t('Manage and view details of your POS sales, orders, and customer checkouts.')}
            pageActions={
                <div className="flex items-center gap-2">
                    {pageButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {oneDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                </div>
            }
        >
            <Head title={t('POS Orders')} />

            <Card className="shadow-sm dark:border-gray-700">
                {/* Search & Controls */}
                <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({...filters, search: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by order number, customer, warehouse...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <PerPageSelector
                                routeName="pos.orders"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer, filters.warehouse].filter(Boolean).length;
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
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('Customer')}</label>
                                <Input
                                    placeholder={t('Filter by customer')}
                                    value={filters.customer}
                                    onChange={(e) => setFilters({...filters, customer: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('Warehouse')}</label>
                                <Input
                                    placeholder={t('Filter by warehouse')}
                                    value={filters.warehouse}
                                    onChange={(e) => setFilters({...filters, warehouse: e.target.value})}
                                />
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
                                data={sales.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={ShoppingCart}
                                        title={t('No orders found')}
                                        description={t('Get started by creating your first POS order.')}
                                        hasFilters={!!(filters.search || filters.customer || filters.warehouse)}
                                        onClearFilters={clearFilters}
                                        createPermission="manage-pos"
                                        onCreateClick={() => router.visit(route('pos.create'))}
                                        createButtonText={t('Create Order')}
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
                        data={sales}
                        routeName="pos.orders"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
