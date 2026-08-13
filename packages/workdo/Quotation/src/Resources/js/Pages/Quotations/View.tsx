import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Quotation } from './types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatCurrency, formatDate, getImagePath, getCompanySetting } from '@/utils/helpers';
import { getStatusBadgeClasses } from './utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Building2, User, FileText, Calculator, Download, Clock, Package, RefreshCw, Info, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BadgeUI from '@/components/badge-ui';

interface ViewProps {
    quotation: Quotation;
    auth: any;
    [key: string]: any;
}

export default function View() {
    const { t } = useTranslation();
    const { quotation, auth } = usePage<ViewProps>().props;

    const downloadPDF = () => {
        const printUrl = route('quotations.print', quotation.id) + '?download=pdf';
        window.open(printUrl, '_blank');
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Quotations'), url: route('quotations.index')},
                {label: t('Quotation Details')}
            ]}
            pageTitle={`${t('Quotation')} #${quotation.quotation_number}`}
            pageDescription={t('View details, items, status, and actions for this sales quotation.')}
            backUrl={route('quotations.index')}
        >
            <Head title={`${t('Quotation')} #${quotation.quotation_number}`} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Left Column - Main Details, Items & Notes */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Quotation Address Details Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Billing & Addresses')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: Company Address (Billed From) */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold tracking-wider text-muted-foreground">{t('Billed From')}</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="font-semibold text-foreground text-base">
                                            {getCompanySetting('company_name') || t('Your Company')}
                                        </div>
                                        {getCompanySetting('company_address') && (
                                            <div className="text-muted-foreground">{getCompanySetting('company_address')}</div>
                                        )}
                                        {(getCompanySetting('company_city') || getCompanySetting('company_state') || getCompanySetting('company_zipcode')) && (
                                            <div className="text-muted-foreground">
                                                {getCompanySetting('company_city')}{getCompanySetting('company_state') && `, ${getCompanySetting('company_state')}`} {getCompanySetting('company_zipcode')}
                                            </div>
                                        )}
                                        {getCompanySetting('company_country') && (
                                            <div className="text-muted-foreground">{getCompanySetting('company_country')}</div>
                                        )}
                                        {getCompanySetting('company_telephone') && (
                                            <div className="text-muted-foreground">{t('Phone')}: {getCompanySetting('company_telephone')}</div>
                                        )}
                                        {getCompanySetting('company_email') && (
                                            <div className="text-muted-foreground">{t('Email')}: {getCompanySetting('company_email')}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Customer / Billing Address & Shipping Address (Billed To) */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold tracking-wider text-muted-foreground">{t('Billed To')}</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-semibold text-foreground text-base">{quotation.customer?.name}</div>
                                            <div className="text-muted-foreground">{quotation.customer?.email}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/50">
                                        {quotation.customer_details?.billing_address && (
                                            <div className="space-y-1">
                                                <div className="font-bold text-xs capitalize tracking-wider text-muted-foreground">{t('Billing Address')}</div>
                                                <div className="text-xs text-foreground/80 space-y-0.5">
                                                    <div>{quotation.customer_details.billing_address.name}</div>
                                                    <div>{quotation.customer_details.billing_address.address_line_1}</div>
                                                    <div>{quotation.customer_details.billing_address.city}, {quotation.customer_details.billing_address.state} {quotation.customer_details.billing_address.zip_code}</div>
                                                </div>
                                            </div>
                                        )}

                                        {quotation.customer_details?.shipping_address && (
                                            <div className="space-y-1">
                                                <div className="font-bold text-xs capitalize tracking-wider text-muted-foreground">{t('Shipping Address')}</div>
                                                <div className="text-xs text-foreground/80 space-y-0.5">
                                                    <div>{quotation.customer_details.shipping_address.name}</div>
                                                    <div>{quotation.customer_details.shipping_address.address_line_1}</div>
                                                    <div>{quotation.customer_details.shipping_address.city}, {quotation.customer_details.shipping_address.state} {quotation.customer_details.shipping_address.zip_code}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quotation Items Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Quotation Items')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/10">
                                            <th className="px-6 py-4 text-start font-semibold text-foreground capitalize tracking-wider text-xs">{t('Product')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-24">{t('Qty')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Unit Price')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Discount')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-44">{t('Tax')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {quotation.items?.map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                                                            {item.product?.image ? (
                                                                <img
                                                                    src={getImagePath(item.product.image)}
                                                                    alt={item.product.name}
                                                                    className="w-full h-full object-cover"
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
                                                                <p className="text-xs text-muted-foreground mt-1.5 max-w-md break-words">{item.product.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-end font-medium text-foreground">{item.quantity}</td>
                                                <td className="px-6 py-4 text-end font-medium text-foreground">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-6 py-4 text-end">
                                                    {item.discount_percentage > 0 ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                                                                {item.discount_percentage}%
                                                            </span>
                                                            <div className="text-xs text-muted-foreground font-medium">
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
                                                                {formatCurrency(item.tax_amount)}
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 border-t border-border flex justify-end">
                                <div className="w-full sm:w-80 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">{t('Subtotal')}</span>
                                        <span className="font-semibold text-foreground">{formatCurrency(quotation.subtotal)}</span>
                                    </div>
                                    {quotation.discount_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Discount')}</span>
                                            <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(quotation.discount_amount)}</span>
                                        </div>
                                    )}
                                    {quotation.tax_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Tax')}</span>
                                            <span className="font-semibold text-foreground">{formatCurrency(quotation.tax_amount)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-foreground">{t('Total Amount')}</span>
                                        <span className="font-bold text-2xl text-primary">{formatCurrency(quotation.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    {quotation.notes && (
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Additional Notes')}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground break-words whitespace-pre-line leading-relaxed">
                                    {quotation.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Summary & Quick Actions sidebar */}
                <div className="space-y-6 lg:sticky lg:top-6 self-start">
                    {/* Status & Quick Actions Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <FileText className="h-5 w-5" />
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
                                <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Total Amount')}</span>
                                <div className="text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(quotation.total_amount)}</div>
                                <div className="pt-2">
                                    <BadgeUI className={getStatusBadgeClasses(quotation.status) + " capitalize"}>
                                        {t(quotation.status)}
                                    </BadgeUI>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                {auth.user?.permissions?.includes('print-quotations') && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center gap-2 hover:bg-muted/30 transition-all font-semibold rounded-lg shadow-sm border border-border"
                                        onClick={downloadPDF}
                                    >
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                        <span>{t('Download PDF')}</span>
                                    </Button>
                                )}

                                {!quotation.converted_to_invoice && auth.user?.permissions?.includes('convert-to-invoice-quotations') && quotation.status === 'accepted' && (
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                                                    onClick={() => router.post(route('quotations.convert-to-invoice', quotation.id), {}, {
                                                        onSuccess: () => {
                                                            router.reload();
                                                        }
                                                    })}
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                    <span>{t('Convert to Invoice')}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" align="center" className="max-w-[240px] text-center p-2 text-xs">
                                                <p>{t('Convert to Invoice')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {quotation.converted_to_invoice && (
                                    <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 w-full shadow-sm">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>{t('Converted to Invoice')}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Information Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Customer Info')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 text-primary overflow-hidden flex items-center justify-center text-sm capitalize shadow-sm">
                                    {quotation.customer?.avatar ? (
                                        <img
                                            src={getImagePath(quotation.customer.avatar)}
                                            alt={quotation.customer.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${quotation.customer?.avatar ? 'hidden' : ''} font-bold`}>
                                        {quotation.customer?.name ? quotation.customer.name.charAt(0) : '?'}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-foreground truncate">{quotation.customer?.name || t('Guest Customer')}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{quotation.customer?.email || t('No email address')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quotation Details Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Quotation Details')}
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
                                    <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Quotation Date')}</span>
                                    <span className="text-sm font-medium text-foreground">{formatDate(quotation.quotation_date)}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Due Date')}</span>
                                    <span className="text-sm font-medium text-foreground">{formatDate(quotation.due_date)}</span>
                                </div>
                            </div>

                            {quotation.warehouse && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Warehouse')}</span>
                                        <span className="text-sm font-medium text-foreground">{quotation.warehouse.name}</span>
                                    </div>
                                </div>
                            )}

                            {quotation.payment_terms && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Terms')}</span>
                                        <span className="text-sm font-medium text-foreground">{quotation.payment_terms}</span>
                                    </div>
                                </div>
                            )}

                            {quotation.revision_number > 1 && (
                                <>
                                    <Separator className="bg-border/50" />
                                    <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 p-2 rounded-lg">
                                        <Info className="h-4 w-4" />
                                        <span>
                                            {t('Revision')} v{quotation.revision_number}
                                            {quotation.parent_quotation_id && ` (${t('Revision of')} #${quotation.parent_quotation?.quotation_number})`}
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}