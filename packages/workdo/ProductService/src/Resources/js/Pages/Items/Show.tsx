import { Head, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Package, 
    Image as ImageIcon, 
    Tag, 
    Layers, 
    DollarSign, 
    Boxes, 
    Warehouse, 
    Scale, 
    Percent, 
    FileText 
} from "lucide-react";
import { formatCurrency, getImagePath } from "@/utils/helpers";
import { ImageSlider } from "@/components/ui/image-slider";

interface ShowItemPageProps {
    item: {
        id: number;
        name: string;
        sku?: string;
        description?: string;
        sale_price?: number;
        purchase_price?: number;
        quantity?: number;
        total_quantity?: number;
        type: string;
        image?: string;
        images?: string[] | string;
        gallery?: string[];
        additional_images?: string[];
        warehouse_stocks?: Array<{
            warehouse_name: string;
            quantity: number;
        }>;
        category?: {
            id: number;
            name: string;
        };
        unit_relation?: {
            id: number;
            unit_name: string;
        };
        taxes?: Array<{
            id: number;
            tax_name: string;
            rate: number;
        }>;
        created_at: string;
    };
}

export default function Show() {
    const { t } = useTranslation();
    const { item } = usePage<ShowItemPageProps>().props;
    const videoHubButtons = usePageButtons('itemShowButtons', { item });
    let imageUrl = getImagePath(item.image);

    const getTypeBadge = (type: string) => {
        const map: Record<string, string> = {
            product: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/30',
            service: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-500/30',
            part: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-500/30',
        };
        return map[type] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Items'), url: route('product-service.items.index')},
                {label: t('Item Details')}
            ]}
            pageTitle={t('Item Details')}
            backUrl={route('product-service.items.index')}
            pageActions={
                videoHubButtons && videoHubButtons.length > 0 && (
                    <div className="flex items-center gap-2">
                        {videoHubButtons.map((button, index) => (
                            <div key={button.id || index}>{button.component}</div>
                        ))}
                    </div>
                )
            }
        >
            <Head title={t('Item Details')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Media & Gallery */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-xl">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-bold tracking-wide text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                {t('Product Image')}
                            </h3>
                            <div className="relative aspect-square max-h-[350px] mx-auto bg-gradient-to-br from-slate-50 via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-955 flex items-center justify-center overflow-hidden rounded-xl border dark:border-gray-800">
                                {item.image ? (
                                    <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-contain p-4 cursor-pointer hover:scale-105 transition-transform duration-500"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                                        <Package className="h-20 w-20 stroke-[1.2] text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm mt-3 font-semibold text-gray-400 dark:text-gray-500">{t('No Image Available')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Images Slider */}
                    {(() => {
                        const additionalImages = item.images ?
                            (typeof item.images === 'string' ? JSON.parse(item.images) : item.images).filter(Boolean) : [];
                        const fullPathImages = additionalImages.map(img => getImagePath(img));

                        return additionalImages.length > 0 && (
                            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-xl">
                                <CardContent className="p-6">
                                    <h3 className="text-sm font-bold tracking-wide text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        {t('Additional Images')}
                                    </h3>
                                    <div className="overflow-hidden rounded-xl border dark:border-gray-800 p-2 bg-gray-50/50 dark:bg-gray-955">
                                        <ImageSlider
                                            images={fullPathImages}
                                            className="w-full"
                                            aspectRatio="square"
                                            showZoom={true}
                                            showDownload={true}
                                            autoPlay={additionalImages.length > 1}
                                            autoPlayInterval={5000}
                                            onImageClick={(index) => {
                                                window.open(fullPathImages[index], '_blank');
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}
                </div>

                {/* Right Column: Information & Properties */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Card 1: Title, Category & Stat Grid */}
                    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                        <CardContent className="p-6 md:p-8 space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${getTypeBadge(item.type)}`}>
                                        {t(item.type)}
                                    </span>
                                    {item.category && (
                                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-855">
                                            <Layers className="h-3 w-3" />
                                            {item.category.name}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                    {item.name}
                                </h2>
                                {item.sku && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                        <Tag className="h-4 w-4" />
                                        {t('SKU')}: <span className="font-semibold text-gray-700 dark:text-gray-300">{item.sku}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 border border-green-200 dark:border-green-900/60">
                                    <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-bold text-xs tracking-wide">
                                        <DollarSign className="h-4 w-4" />
                                        {t('Sale Price')}
                                    </div>
                                    <p className="text-2xl font-black text-green-800 dark:text-green-300 mt-2">
                                        {item.sale_price ? formatCurrency(item.sale_price) : '—'}
                                    </p>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900/60">
                                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs tracking-wide">
                                        <DollarSign className="h-4 w-4" />
                                        {t('Purchase Price')}
                                    </div>
                                    <p className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-2">
                                        {item.purchase_price ? formatCurrency(item.purchase_price) : '—'}
                                    </p>
                                </div>

                                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4 border border-orange-200 dark:border-orange-900/60">
                                    <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold text-xs tracking-wide">
                                        <Boxes className="h-4 w-4" />
                                        {t('Total Stock')}
                                    </div>
                                    <p className="text-2xl font-black text-orange-800 dark:text-orange-300 mt-2">
                                        {Math.floor(item.total_quantity) || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Warehouse Stock Allocation */}
                    {item.warehouse_stocks && item.warehouse_stocks.length > 0 && (
                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <h4 className="text-xs font-bold tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                    <Warehouse className="h-4 w-4" />
                                    {t('Warehouse Stock Allocation')}
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
                                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {item.warehouse_stocks.map((stock, index) => (
                                            <div key={index} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{stock.warehouse_name}</span>
                                                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-primary/10 text-primary ring-primary/20">
                                                    {Math.floor(stock.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Card 3: Specifications (Unit & Taxes) */}
                    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                        <Scale className="h-3.5 w-3.5" />
                                        {t('Unit of Measurement')}
                                    </span>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                        {item.unit_relation?.unit_name || '—'}
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                        <Percent className="h-3.5 w-3.5" />
                                        {t('Taxes')}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {item.taxes && item.taxes.length > 0 ? (
                                            item.taxes.map((tax) => (
                                                <span key={tax.id} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800">
                                                    {tax.tax_name} ({tax.rate}%)
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">—</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Description */}
                    {item.description && (
                        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <h4 className="text-xs font-bold tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('Short Description')}
                                </h4>
                                <p className="text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-medium bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800/50">
                                    {item.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
