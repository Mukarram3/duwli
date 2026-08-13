import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Trash2, Plus } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { getImagePath } from '@/utils/helpers';
import { Deal } from '../../types';
import Create from './Create';

interface ProductsProps {
    deal: Deal;
    availableProducts: any[];
    onRegisterAddHandler?: (handler: () => void) => void;
}

export default function Index({ deal, availableProducts, onRegisterAddHandler }: ProductsProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [availableProductsState, setAvailableProductsState] = useState<{ value: string; label: string }[]>([]);
    const [productDetails, setProductDetails] = useState<{ [key: string]: { name: string; image?: string; sku?: string } }>({});
    const [deleteState, setDeleteState] = useState<{ isOpen: boolean; productId: string | null; message: string }>({
        isOpen: false, productId: null, message: '',
    });

    useEffect(() => {
        if (availableProducts.length > 0) {
            const details: { [key: string]: { name: string; image?: string; sku?: string } } = {};
            availableProducts.forEach((p: any) => {
                details[p.id] = { name: p.name, image: p.image, sku: p.sku };
            });
            setProductDetails(details);
        }
    }, [availableProducts]);

    const openCreateDialog = () => {
        setAvailableProductsState(availableProducts.map((p: any) => ({ value: p.id.toString(), label: p.name })));
        setCreateOpen(true);
    };

    useEffect(() => {
        onRegisterAddHandler?.(openCreateDialog);
    }, []);

    const openDeleteDialog = (productId: string) => {
        setDeleteState({ isOpen: true, productId, message: t('Are you sure you want to delete this product?') });
    };

    const confirmDelete = () => {
        if (deleteState.productId) {
            router.delete(route('lead.deals.remove-product', { deal: deal.id, product: deleteState.productId }));
            setDeleteState({ isOpen: false, productId: null, message: '' });
        }
    };

    const productData = deal.products
        ? [...new Set((Array.isArray(deal.products) ? deal.products : String(deal.products).split(',')).filter(Boolean).map((id: any) => id.toString().trim()))]
            .map((productId: string) => ({
                id: productId,
                name: productDetails[productId]?.name || '',
                image: productDetails[productId]?.image,
                sku: productDetails[productId]?.sku
            }))
        : [];

    return (
        <>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Products')}</h3>
                {auth?.user?.permissions?.includes('create-deal-products') && (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={openCreateDialog}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Add Product')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {productData.length === 0 ? (
                <NoRecordsFound
                    icon={Package}
                    title={t('No Products added')}
                    description={t('Get started by adding products to this deal.')}
                    createPermission="create-deal-products"
                    onCreateClick={openCreateDialog}
                    createButtonText={t('Add Products')}
                    className="h-auto"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto scrollbar-thin ltr:pr-1 rtl:pl-1">
                    {productData.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-muted border flex items-center justify-center flex-shrink-0">
                                    {product.image ? (
                                        <a
                                            href={getImagePath(product.image)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full h-full block"
                                        >
                                            <img
                                                src={getImagePath(product.image)}
                                                alt={product.name}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                                            />
                                        </a>
                                    ) : (
                                        <Package className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground truncate">
                                        {product.name || `Product #${product.id}`}
                                    </h4>
                                    {product.sku && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            SKU: {product.sku}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {auth?.user?.permissions?.includes('delete-deal-products') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(product.id)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateKey(k => k + 1); setCreateOpen(open); }}>
                <Create key={createKey} dealId={deal.id} availableProducts={availableProductsState} onSuccess={() => setCreateOpen(false)} />
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={(open) => { if (!open) setDeleteState({ isOpen: false, productId: null, message: '' }); }}
                title={t('Delete Product')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </>
    );
}
