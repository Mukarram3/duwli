import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Trash2, Plus } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { getImagePath } from '@/utils/helpers';
import { Lead } from '../../types';
import Create from './Create';

interface ProductsProps {
    lead: Lead;
}

export default function Index({ lead }: ProductsProps) {
    const { t } = useTranslation();
    const { auth, productItems } = usePage<any>().props;
    const productItemsList: { id: number; name: string; image?: string; sku?: string }[] = productItems || [];
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [availableProducts, setAvailableProducts] = useState<{ value: string; label: string }[]>([]);
    const [deleteState, setDeleteState] = useState<{ isOpen: boolean; productId: string | null; message: string }>({
        isOpen: false, productId: null, message: '',
    });

    const openCreateDialog = async () => {
        try {
            const res = await fetch(route('lead.leads.available-products', lead.id));
            const products = await res.json();
            setAvailableProducts(products.map((p: any) => ({ value: p.id.toString(), label: p.name })));
        } catch {}
        setCreateOpen(true);
    };

    const openDeleteDialog = (productId: string) => {
        setDeleteState({ isOpen: true, productId, message: t('Are you sure you want to delete this product?') });
    };

    const confirmDelete = () => {
        if (deleteState.productId) {
            router.delete(route('lead.leads.remove-product', { lead: lead.id, product: deleteState.productId }));
            setDeleteState({ isOpen: false, productId: null, message: '' });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Products')}</h3>
                {auth?.user?.permissions?.includes('create-lead-products') && (
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

            {productItemsList.length === 0 ? (
                <NoRecordsFound
                    icon={Package}
                    title={t('No Products')}
                    description={t('Get started by adding products to this lead.')}
                    createPermission="create-lead-products"
                    onCreateClick={openCreateDialog}
                    createButtonText={t('Add Products')}
                    className="h-auto"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto scrollbar-thin ltr:pr-1 rtl:pl-1">
                    {productItemsList.map((product) => (
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
                                        {product.name}
                                    </h4>
                                    {product.sku && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            SKU: {product.sku}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {auth?.user?.permissions?.includes('delete-lead-products') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(product.id.toString())}
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
                <Create key={createKey} leadId={lead.id} availableProducts={availableProducts} onSuccess={() => setCreateOpen(false)} />
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
