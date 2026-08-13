import { useState, useMemo } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Package, Tag, Warehouse as WarehouseIcon, Hash, ShoppingCart, Download } from "lucide-react";
import { getImagePath } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Separator } from "@/components/ui/separator";
import NoRecordsFound from '@/components/no-records-found';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StockItem {
    id: number;
    name: string;
    sku: string;
    image?: string | null;
    total_quantity: number;
}

interface Warehouse {
    id: number;
    name: string;
}

interface StockIndexProps {
    stocks: {
        data: StockItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    warehouses: Warehouse[];
    auth: {
        user: {
            permissions: string[];
        };
    };
}

interface StockFilters {
    name: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { stocks, warehouses, auth } = usePage<StockIndexProps>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState<StockFilters>({
        name: urlParams.get('name') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        warehouse_id: '',
        quantity: ''
    });

    const renderImage = (value: string) => {
        if (!value) {
            return (
                <div className="w-12 h-12 rounded-lg bg-gray-100 border dark:bg-gray-700 dark:border-gray-600 flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                </div>
            );
        }
        const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
        const url = getImagePath(value);
        return isImg ? (
            <div className="relative w-12 h-12">
                <img
                    src={url}
                    alt="Image"
                    className="w-12 h-12 rounded-lg object-cover border shadow-sm hover:scale-110 transition-transform duration-300 cursor-pointer"
                    onClick={() => window.open(url, '_blank')}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                    }}
                />
                <div className="hidden w-12 h-12 rounded-lg bg-gray-100 border flex items-center justify-center dark:bg-gray-700">
                    <Package className="w-5 h-5 text-gray-400" />
                </div>
            </div>
        ) : (
            <div
                className="w-12 h-12 rounded-lg bg-gray-100 border dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = value.split('/').pop() || 'file';
                    link.click();
                }}
            >
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
        );
    };

    const handleFilter = () => {        router.get(route('product-service.stock.index'), {...filters, per_page: perPage}, {
            preserveState: true,
            replace: true
        });
    };

    const openModal = (item: StockItem) => {
        setSelectedItem(item);
        setData('product_id', item.id.toString());
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('product-service.stock.store'), {
            onSuccess: () => {
                closeModal();
            }
        });
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Product'),
            sortable: false,
            render: (value: string, item: StockItem) => (
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg">
                        {renderImage(item.image || '')}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{value}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Tag className="h-3 w-3 flex-shrink-0" />
                            {item.sku}
                        </p>
                    </div>
                </div>
            )
        },
        {
            key: 'sku',
            header: t('SKU'),
            sortable: false,
            render: (value: string) => (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                    {value}
                </span>
            )
        },
        {
            key: 'total_quantity',
            header: t('Quantity'),
            sortable: false,
            render: (value: number) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800">
                    <ShoppingCart className="h-3 w-3" />
                    {Math.floor(value) || 0}
                </span>
            )
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, item: StockItem) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    onClick={() => openModal(item)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Add Stock')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }
    ];

    return (
        <TooltipProvider>
            <AuthenticatedLayout
                breadcrumbs={[
                    {label: t('Product & Service'), url: route('product-service.items.index'), onClick: () => router.visit(route('product-service.items.index'))},
                    {label: t('Product Stock')}
                ]}
                pageTitle={t('Product Stock')}
                backUrl={route('product-service.items.index')}
            >
                <Head title={t('Product Stock')} />

                <Card className="shadow-sm dark:border-gray-700">
                    {/* Search & Controls */}
                    <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-md">
                                <SearchInput
                                    value={filters.name}
                                    onChange={(value) => setFilters({...filters, name: value})}
                                    onSearch={handleFilter}
                                    placeholder={t('Search by name...')}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <PerPageSelector
                                    routeName="product-service.stock.index"
                                    filters={filters}
                                />
                            </div>
                        </div>
                    </CardContent>

                    {/* Table */}
                    <CardContent className="p-0">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={stocks.data}
                                columns={tableColumns}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={Package}
                                        title={t('No stock found')}
                                        description={t('No product stock records available.')}
                                        hasFilters={!!filters.name}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </CardContent>

                    {/* Pagination */}
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                        <Pagination
                            data={stocks}
                            routeName="product-service.stock.index"
                            filters={{...filters, per_page: perPage}}
                        />
                    </CardContent>
                </Card>

            </AuthenticatedLayout>

            {/* Add Stock Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 dark:bg-primary/20">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold">{t('Add Stock')}</DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">{t('Add quantity to warehouse')}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <Separator />

                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                        {/* Product info — read only */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">{t('Product Name')}</p>
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{selectedItem?.name || ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{t('SKU')}</p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedItem?.sku || ''}</p>
                                </div>
                            </div>
                        </div>

                        {/* Warehouse */}
                        <div className="space-y-1.5">
                            <Label htmlFor="warehouse_id" className="text-sm font-medium flex items-center gap-1.5">
                                <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Warehouse')}
                            </Label>
                            <Select value={data.warehouse_id} onValueChange={(value) => setData('warehouse_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Select warehouse')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((warehouse) => (
                                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                            {warehouse.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.warehouse_id && <p className="text-xs text-red-600">{errors.warehouse_id}</p>}
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <Label htmlFor="quantity" className="text-sm font-medium flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Quantity')}
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                step="1"
                                value={data.quantity}
                                onChange={(e) => setData('quantity', e.target.value)}
                                placeholder={t('Enter quantity')}
                                className="text-center font-semibold text-lg h-11"
                            />
                            {errors.quantity && <p className="text-xs text-red-600">{errors.quantity}</p>}
                        </div>

                        <Separator />

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={closeModal}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="gap-2">
                                <Plus className="h-4 w-4" />
                                {processing ? t('Creating...') : t('Add Stock')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
