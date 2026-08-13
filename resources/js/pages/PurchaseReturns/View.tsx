import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { PurchaseReturn } from './types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatCurrency, formatDate, getImagePath, getCompanySetting } from '@/utils/helpers';
import { getStatusBadgeClasses } from './utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, CheckCircle, CalendarDays, Building2, User, Calculator, Package, Check, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ViewProps {
    return: PurchaseReturn;
    auth: any;
    [key: string]: any;
}

function View() {
    const { t } = useTranslation();
    const { props: pageProps } = usePage<ViewProps>();
    const { return: purchaseReturn, auth } = pageProps;

    const downloadPDF = () => {
        const printUrl = route('purchase-returns.print', purchaseReturn.id) + '?download=pdf';
        window.open(printUrl, '_blank');
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Purchase Returns'), url: route('purchase-returns.index')},
                {label: t('Purchase Return Details')}
            ]}
            pageTitle={`${t('Purchase Return')} #${purchaseReturn.return_number}`}
            pageDescription={t('View items returned, debit amount, approval state, and vendor address info.')}
            backUrl={route('purchase-returns.index')}
        >
            <Head title={`${t('Purchase Return')} #${purchaseReturn.return_number}`} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Left Column - Main Details, Items & Notes */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Billing & Addresses Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <span>{t('Billing & Shipping Addresses')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Company Address (From Company Setting) */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold capitalize tracking-wider text-muted-foreground">{t('Billed To')}</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="font-semibold text-foreground text-base">
                                            {getCompanySetting('company_name') || t('Your Company')}
                                        </div>
                                        {getCompanySetting('company_address') && (
                                            <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{getCompanySetting('company_address')}</div>
                                        )}
                                        {(getCompanySetting('company_city') || getCompanySetting('company_state') || getCompanySetting('company_zipcode')) && (
                                            <div className="text-muted-foreground">
                                                {getCompanySetting('company_city')}{getCompanySetting('company_state') && `, ${getCompanySetting('company_state')}`} {getCompanySetting('company_zipcode')}
                                            </div>
                                        )}
                                        {getCompanySetting('company_country') && (
                                            <div className="text-muted-foreground">{getCompanySetting('company_country')}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Vendor Details */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold capitalize tracking-wider text-muted-foreground">{t('Billed From')}</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-semibold text-foreground text-base">{purchaseReturn.vendor?.name}</div>
                                            <div className="text-muted-foreground">{purchaseReturn.vendor?.email}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/50">
                                        {/* Vendor Billing */}
                                        {purchaseReturn.vendor_details?.billing_address && (
                                            <div className="space-y-1">
                                                <div className="font-bold text-xs capitalize tracking-wider text-muted-foreground">{t('Billing Address')}</div>
                                                <div className="text-xs text-foreground/80 space-y-0.5">
                                                    <div>{purchaseReturn.vendor_details.billing_address.name}</div>
                                                    <div>{purchaseReturn.vendor_details.billing_address.address_line_1}</div>
                                                    <div>{purchaseReturn.vendor_details.billing_address.city}, {purchaseReturn.vendor_details.billing_address.state} {purchaseReturn.vendor_details.billing_address.zip_code}</div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Vendor Shipping */}
                                        {purchaseReturn.vendor_details?.shipping_address && (
                                            <div className="space-y-1">
                                                <div className="font-bold text-xs capitalize tracking-wider text-muted-foreground">{t('Shipping Address')}</div>
                                                <div className="text-xs text-foreground/80 space-y-0.5">
                                                    <div>{purchaseReturn.vendor_details.shipping_address.name}</div>
                                                    <div>{purchaseReturn.vendor_details.shipping_address.address_line_1}</div>
                                                    <div>{purchaseReturn.vendor_details.shipping_address.city}, {purchaseReturn.vendor_details.shipping_address.state} {purchaseReturn.vendor_details.shipping_address.zip_code}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Return Items Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Package className="h-5 w-5" />
                                </div>
                                <span>{t('Return Items')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/10">
                                            <th className="px-6 py-4 text-start font-semibold text-foreground capitalize tracking-wider text-xs">{t('Product')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-28">{t('Qty')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Unit Price')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Discount')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-44">{t('Tax')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {purchaseReturn.items?.map((item, index) => {
                                            const imageUrl = item.product?.image ? getImagePath(item.product.image, pageProps) : '';
                                            return (
                                                <tr key={index} className="hover:bg-muted/10 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center text-primary">
                                                                {item.product?.image ? (
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={item.product.name}
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
                                                                <div className={`${item.product?.image ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                                                    <Package className="h-5 w-5 text-muted-foreground/45" />
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-foreground truncate">{item.product?.name}</div>
                                                                {item.product?.sku && (
                                                                    <div className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border/80 capitalize tracking-wider">
                                                                        SKU: {item.product.sku}
                                                                    </div>
                                                                )}
                                                                {item.product?.description && (
                                                                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{item.product.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-end font-semibold text-foreground">
                                                        {item.return_quantity || item.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 text-end font-medium text-foreground">
                                                        {formatCurrency(item.unit_price)}
                                                    </td>
                                                    <td className="px-6 py-4 text-end">
                                                        {item.discount_percentage > 0 ? (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                                                                    {item.discount_percentage}%
                                                                </span>
                                                                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                                                    -{formatCurrency(item.discount_amount)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-end">
                                                        {item.taxes && item.taxes.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {item.taxes.map((tax, taxIndex) => (
                                                                    <div key={taxIndex} className="text-xs text-foreground font-medium">
                                                                        {tax.tax_name} <span className="text-muted-foreground">({tax.tax_rate}%)</span>
                                                                    </div>
                                                                ))}
                                                                <div className="text-xs text-muted-foreground font-semibold">
                                                                    {formatCurrency(item.tax_amount)}
                                                                </div>
                                                            </div>
                                                        ) : item.tax_percentage > 0 ? (
                                                            <div className="space-y-0.5">
                                                                <span className="text-xs text-foreground font-medium">{item.tax_percentage}%</span>
                                                                <div className="text-xs text-muted-foreground font-semibold">
                                                                    ({formatCurrency(item.tax_amount)})
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-end font-semibold text-foreground">
                                                        {formatCurrency(item.total_amount)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Return Summary */}
                            <div className="p-6 border-t border-border/50 flex justify-end">
                                <div className="w-80 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">{t('Subtotal')}</span>
                                        <span className="font-semibold text-foreground">{formatCurrency(purchaseReturn.subtotal)}</span>
                                    </div>
                                    {purchaseReturn.discount_amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Discount')}</span>
                                            <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(purchaseReturn.discount_amount)}</span>
                                        </div>
                                    )}
                                    {purchaseReturn.tax_amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Tax')}</span>
                                            <span className="font-semibold text-foreground">{formatCurrency(purchaseReturn.tax_amount)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2 bg-border/50" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-foreground">{t('Total Return Amount')}</span>
                                        <span className="font-bold text-lg text-primary">{formatCurrency(purchaseReturn.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    {purchaseReturn.notes && (
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Notes')}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{purchaseReturn.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Actions, Vendor & Return Info */}
                <div className="space-y-6 lg:sticky lg:top-6 self-start">
                    {/* Summary & Actions Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Summary & Actions')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1.5 text-center sm:text-start">
                                <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Total Return Amount')}</span>
                                <div className="text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(purchaseReturn.total_amount)}</div>
                                <div className="pt-2">
                                    <span className={getStatusBadgeClasses(purchaseReturn.status)}>
                                        {t(purchaseReturn.status.charAt(0).toUpperCase() + purchaseReturn.status.slice(1))}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                {auth.user?.permissions?.includes('print-purchase-returns') && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center gap-2 hover:bg-muted/30 transition-all font-semibold rounded-lg shadow-sm border border-border"
                                        onClick={downloadPDF}
                                    >
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                        <span>{t('Download PDF')}</span>
                                    </Button>
                                )}

                                {purchaseReturn.status === 'draft' && auth.user?.permissions?.includes('approve-purchase-returns-invoices') && (
                                    <Button
                                        className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                                        onClick={() => router.post(route('purchase-returns.approve', purchaseReturn.id), {}, {
                                            onSuccess: () => {
                                                router.reload();
                                            }
                                        })}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>{t('Approve Return')}</span>
                                    </Button>
                                )}

                                {purchaseReturn.status === 'approved' && auth.user?.permissions?.includes('complete-purchase-returns-invoices') && (
                                    <Button
                                        className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                                        onClick={() => router.post(route('purchase-returns.complete', purchaseReturn.id), {}, {
                                            onSuccess: () => {
                                                router.reload();
                                            }
                                        })}
                                    >
                                        <Check className="h-4 w-4" />
                                        <span>{t('Complete Return')}</span>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vendor Information Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Vendor Info')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 text-primary overflow-hidden flex items-center justify-center text-sm capitalize shadow-sm">
                                    {purchaseReturn.vendor?.avatar ? (
                                        <img
                                            src={getImagePath(purchaseReturn.vendor.avatar)}
                                            alt={purchaseReturn.vendor.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${purchaseReturn.vendor?.avatar ? 'hidden' : ''} font-bold`}>
                                        {purchaseReturn.vendor?.name ? purchaseReturn.vendor.name.charAt(0) : '?'}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-foreground truncate">{purchaseReturn.vendor?.name || t('Guest Vendor')}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{purchaseReturn.vendor?.email || t('No email address')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Return Details Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Return Details')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Return Date')}</span>
                                    <span className="text-sm font-medium text-foreground">{formatDate(purchaseReturn.return_date)}</span>
                                </div>
                            </div>

                            {purchaseReturn.warehouse?.name && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Warehouse')}</span>
                                        <span className="text-sm font-medium text-foreground">{purchaseReturn.warehouse.name}</span>
                                    </div>
                                </div>
                            )}

                            {purchaseReturn.originalInvoice?.invoice_number && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Original Invoice')}</span>
                                        {auth.user?.permissions?.includes('view-purchase-invoices') ? (
                                            <span
                                                onClick={() => router.get(route('purchase-invoices.show', purchaseReturn.originalInvoice?.id))}
                                                className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                                #{purchaseReturn.originalInvoice.invoice_number}
                                            </span>
                                        ) : (
                                            <span className="text-sm font-medium text-foreground">
                                                #{purchaseReturn.originalInvoice.invoice_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {purchaseReturn.reason && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Reason')}</span>
                                        <span className="text-sm font-medium text-foreground capitalize">{t(purchaseReturn.reason.replace('_', ' '))}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default View;