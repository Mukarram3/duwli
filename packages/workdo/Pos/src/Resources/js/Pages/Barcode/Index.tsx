import { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, QrCode, Package, Search, Warehouse as WarehouseIcon, Tag, DollarSign, CheckSquare } from 'lucide-react';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { DataTable } from "@/components/ui/data-table";
import NoRecordsFound from '@/components/no-records-found';
import JsBarcode from 'jsbarcode';

interface Warehouse {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    image?: string | null;
}

interface IndexProps {
    warehouses: Warehouse[];
}

export default function Index() {
    const { t } = useTranslation();
    const { props: pageProps } = usePage<any>();
    const { warehouses } = pageProps;

    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const barcodeField = 'sku';
    const [productCopies, setProductCopies] = useState<{ [key: number]: number }>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [barcodeDataUrls, setBarcodeDataUrls] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        if (warehouses.length > 0 && !selectedWarehouse) {
            setSelectedWarehouse(warehouses[0].id.toString());
        }
    }, [warehouses]);

    useEffect(() => {
        if (selectedWarehouse) {
            fetch(`${route('pos.products')}?warehouse_id=${selectedWarehouse}`)
                .then(response => response.json())
                .then(data => {
                    setProducts(data);
                    setTimeout(() => generateBarcodes(data), 100);
                })
                .catch(error => console.error('Error:', error));
        }
    }, [selectedWarehouse]);

    const generateBarcodes = useCallback((productList: Product[]) => {
        const newBarcodeUrls: { [key: number]: string } = {};

        productList.forEach(product => {
            try {
                if (product.sku) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 400;
                    canvas.height = 150;
                    JsBarcode(canvas, product.sku, {
                        format: "CODE128",
                        width: 4,
                        height: 80,
                        displayValue: false,
                        margin: 10,
                        background: "#ffffff",
                        lineColor: "#000000"
                    });
                    newBarcodeUrls[product.id] = canvas.toDataURL('image/png', 1.0);
                }
            } catch (error) {
                console.error('Barcode generation failed:', error);
            }
        });

        setBarcodeDataUrls(newBarcodeUrls);
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            generateBarcodes(products);
        }
    }, [products, generateBarcodes]);

    const handleProductSelect = (productId: number, checked: boolean) => {
        if (checked) {
            setSelectedProducts([...selectedProducts, productId]);
            setProductCopies({ ...productCopies, [productId]: 1 });
        } else {
            setSelectedProducts(selectedProducts.filter(id => id !== productId));
            const newCopies = { ...productCopies };
            delete newCopies[productId];
            setProductCopies(newCopies);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const productIds = filteredProducts.map(p => p.id);
            setSelectedProducts(productIds);
            const newCopies: { [key: number]: number } = {};
            productIds.forEach(id => newCopies[id] = 1);
            setProductCopies(newCopies);
        } else {
            setSelectedProducts([]);
            setProductCopies({});
        }
    };

    const handleDownloadBarcodes = () => {
        if (selectedProducts.length === 0) return;

        const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
        const params = new URLSearchParams({
            products: JSON.stringify(selectedProductsData),
            copies: JSON.stringify(productCopies),
            field: barcodeField
        });

        const printUrl = route('pos.barcode.print', 'bulk') + '?' + params.toString() + '&download=pdf';
        window.open(printUrl, '_blank');
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (filteredProducts.length > 0) {
            generateBarcodes(filteredProducts);
        }
    }, [filteredProducts, generateBarcodes]);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('POS'), url: route('pos.index') },
                { label: t('Product Barcode') }
            ]}
            pageTitle={t('Manage Product Barcode')}
            pageDescription={t('Generate and print barcode labels for your inventory items by warehouse.')}
            pageActions={null}
        >
            <Head title={t('Product Barcode')} />

            <div className="space-y-4">
                {/* Controls Card */}
                <Card className="shadow-sm dark:border-gray-700">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* Warehouse */}
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block dark:text-gray-300">
                                    <span className="flex items-center gap-1.5">
                                        <WarehouseIcon className="h-3.5 w-3.5 text-orange-500" />
                                        {t('Warehouse')}
                                    </span>
                                </Label>
                                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Select Warehouse')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(warehouse => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search */}
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block dark:text-gray-300">
                                    <span className="flex items-center gap-1.5">
                                        <Search className="h-3.5 w-3.5 text-gray-400" />
                                        {t('Search Products')}
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('Search by name or SKU...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Stats + Download */}
                            <div className="md:col-span-2 flex items-end justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    {selectedWarehouse && (
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                <Package className="h-3.5 w-3.5" />
                                                {filteredProducts.length} {t('Products')}
                                            </span>
                                            {selectedProducts.length > 0 && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800 text-xs font-semibold">
                                                    <CheckSquare className="h-3.5 w-3.5" />
                                                    {selectedProducts.length} {t('Selected')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {selectedProducts.length > 0 && (
                                    <Button
                                        onClick={handleDownloadBarcodes}
                                        size="sm"
                                        className="gap-2 flex-shrink-0"
                                    >
                                        <Download className="h-4 w-4" />
                                        {t('Download PDF')} ({selectedProducts.length})
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table Card */}
                <Card className="shadow-sm dark:border-gray-700">
                    <CardHeader className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center dark:bg-primary/20">
                                    <QrCode className="h-4 w-4 text-primary" />
                                </div>
                                {t('Available Products')}
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {selectedWarehouse ? (
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <div className="min-w-[800px]">
                                    {filteredProducts.length > 0 ? (
                                        <DataTable
                                            data={filteredProducts}
                                            columns={[
                                                {
                                                    key: 'select',
                                                    header: (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    ),
                                                    render: (_: any, product: Product) => (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProducts.includes(product.id)}
                                                            onChange={() => handleProductSelect(product.id, !selectedProducts.includes(product.id))}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    )
                                                },
                                                {
                                                    key: 'name',
                                                    header: t('Product Name'),
                                                    render: (value: string, product: Product) => {
                                                        const imageUrl = product.image ? getImagePath(product.image, pageProps) : '';
                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0 dark:bg-gray-700 dark:border-gray-600">
                                                                    {product.image ? (
                                                                        <img
                                                                            src={imageUrl}
                                                                            alt={value}
                                                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-205"
                                                                            onClick={() => window.open(imageUrl, '_blank')}
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement;
                                                                                target.style.display = 'none';
                                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                                if (fallback) fallback.classList.remove('hidden');
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <Package className={`h-5 w-5 text-gray-400 ${product.image ? 'hidden' : ''}`} />
                                                                </div>
                                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{value}</span>
                                                            </div>
                                                        );
                                                    }
                                                },
                                                {
                                                    key: 'sku',
                                                    header: t('SKU'),
                                                    render: (value: string) => (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                                                            <Tag className="h-3 w-3" />
                                                            {value}
                                                        </span>
                                                    )
                                                },
                                                {
                                                    key: 'price',
                                                    header: t('Price'),
                                                    render: (value: number) => (
                                                        <span className="font-semibold text-sm text-green-700 dark:text-green-400">
                                                            {formatCurrency(value || 0)}
                                                        </span>
                                                    )
                                                },
                                                {
                                                    key: 'barcode',
                                                    header: t('Barcode'),
                                                    render: (_: any, product: Product) => (
                                                        barcodeDataUrls[product.id] ? (
                                                            <div className="bg-white border border-gray-200 rounded-lg p-2 inline-block dark:bg-gray-800 dark:border-gray-600">
                                                                <img
                                                                    src={barcodeDataUrls[product.id]}
                                                                    alt="Barcode"
                                                                    className="h-16 w-44 object-contain"
                                                                    style={{ imageRendering: 'crisp-edges' }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-16 w-44 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                                                <span className="text-xs text-muted-foreground">{t('Generating...')}</span>
                                                            </div>
                                                        )
                                                    )
                                                },
                                                {
                                                    key: 'copies',
                                                    header: t('Copies'),
                                                    render: (_: any, product: Product) => (
                                                        <div className="flex justify-center">
                                                            {selectedProducts.includes(product.id) ? (
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    max="50"
                                                                    value={productCopies[product.id] || 1}
                                                                    onChange={(e) => {
                                                                        setProductCopies({ ...productCopies, [product.id]: Number(e.target.value) || 1 });
                                                                    }}
                                                                    className="w-16 h-8 text-center font-semibold"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                                                            )}
                                                        </div>
                                                    )
                                                }
                                            ]}
                                            className="rounded-none"
                                            emptyState={
                                                <NoRecordsFound
                                                    icon={Package}
                                                    title={t('No products found')}
                                                    description={t('Try adjusting your search terms or add products to this warehouse.')}
                                                    hasFilters={!!searchTerm}
                                                    onClearFilters={() => setSearchTerm('')}
                                                    className="h-auto py-8"
                                                />
                                            }
                                        />
                                    ) : (
                                        <NoRecordsFound
                                            icon={Package}
                                            title={searchTerm ? t('No products found') : t('No products available')}
                                            description={searchTerm ? t('Try adjusting your search terms') : t('Add products to this warehouse to generate barcodes')}
                                            hasFilters={!!searchTerm}
                                            onClearFilters={() => setSearchTerm('')}
                                            className="h-auto py-8"
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-6">
                                <div className="w-20 h-20 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-5 shadow-sm">
                                    <QrCode className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{t('Select a Warehouse')}</h3>
                                <p className="text-sm text-muted-foreground text-center max-w-sm">
                                    {t('Choose a warehouse from the dropdown above to view available products and generate barcodes')}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
