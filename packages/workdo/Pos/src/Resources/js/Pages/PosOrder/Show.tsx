import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, getCompanySetting, getImagePath } from '@/utils/helpers';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { CalendarDays, Building2, User, FileText, Calculator, Download, Package } from 'lucide-react';

interface PosItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    product: {
        id: number;
        name: string;
        sku?: string;
        description?: string;
        image?: string | null;
    };
    taxes?: Array<{
        id: number;
        tax_name: string;
        rate: number;
    }>;
}

interface PosSale {
    id: number;
    sale_number: string;
    customer_id?: number;
    customer?: {
        name: string;
        email?: string;
        phone?: string;
        avatar?: string | null;
        mobile_no?: string | null;
    };
    customer_details?: {
        id: number;
        billing_address?: {
            name?: string;
            address_line_1?: string;
            city?: string;
            state?: string;
            zip_code?: string;
        } | null;
        shipping_address?: {
            name?: string;
            address_line_1?: string;
            city?: string;
            state?: string;
            zip_code?: string;
        } | null;
    } | null;
    warehouse?: {
        name: string;
    };
    tax_amount?: number;
    pos_date: string;
    status?: string;
    created_at: string;
    items: PosItem[];
    notes?: string;
    subtotal?: number;
    discount_amount?: number;
    total_amount?: number;
}

interface ShowProps {
    sale: PosSale;
}

export default function Show() {
    const { t } = useTranslation();
    const { sale } = usePage<ShowProps>().props;

    const downloadPDF = () => {
        const printUrl = route('pos-orders.print', sale.id) + '?download=pdf';
        window.open(printUrl, '_blank');
    };

    const getStatusBadgeClasses = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 capitalize';
            case 'pending':
                return 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 capitalize';
            case 'cancelled':
                return 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 capitalize';
            default:
                return 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 capitalize';
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('POS Orders'), url: route('pos.orders')},
                {label: t('POS Sale Details')}
            ]}
            pageTitle={`${t('POS Sale')} ${sale.sale_number}`}
            pageDescription={t('View details, items, totals, and download actions for this POS sale.')}
            backUrl={route('pos.orders')}
        >
            <Head title={`${t('POS Sale')} ${sale.sale_number}`} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Left Column - Addresses, Items & Notes */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Billing & Addresses Card */}
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
                                    <h3 className="text-xs font-bold tracking-wider text-muted-foreground capitalize">{t('Billed From')}</h3>
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

                                {/* Right Side: Customer Details (Billed To) */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold tracking-wider text-muted-foreground capitalize">{t('Billed To')}</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-semibold text-foreground text-base">{sale.customer?.name || t('Walk-in Customer')}</div>
                                            <div className="text-muted-foreground">{sale.customer?.email || '-'}</div>
                                            {(sale.customer?.phone || sale.customer?.mobile_no) && (
                                                <div className="text-muted-foreground">{t('Phone')}: {sale.customer.phone || sale.customer.mobile_no}</div>
                                            )}
                                        </div>
                                    </div>

                                    {sale.customer_details && (sale.customer_details.billing_address || sale.customer_details.shipping_address) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/50">
                                            {sale.customer_details.billing_address && (
                                                <div className="space-y-1">
                                                    <div className="font-bold text-xs capitalize tracking-wider text-muted-foreground">{t('Billing Address')}</div>
                                                    <div className="text-xs text-foreground/80 space-y-0.5">
                                                        {sale.customer_details.billing_address.name && <div>{sale.customer_details.billing_address.name}</div>}
                                                        {sale.customer_details.billing_address.address_line_1 && <div>{sale.customer_details.billing_address.address_line_1}</div>}
                                                        {(sale.customer_details.billing_address.city || sale.customer_details.billing_address.state || sale.customer_details.billing_address.zip_code) && (
                                                            <div>
                                                                {sale.customer_details.billing_address.city}
                                                                {sale.customer_details.billing_address.state && `, ${sale.customer_details.billing_address.state}`}
                                                                {sale.customer_details.billing_address.zip_code && ` ${sale.customer_details.billing_address.zip_code}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {sale.customer_details.shipping_address && (
                                                <div className="space-y-1">
                                                    <div className="font-bold text-xs capitalize tracking-wider text-muted-foreground">{t('Shipping Address')}</div>
                                                    <div className="text-xs text-foreground/80 space-y-0.5">
                                                        {sale.customer_details.shipping_address.name && <div>{sale.customer_details.shipping_address.name}</div>}
                                                        {sale.customer_details.shipping_address.address_line_1 && <div>{sale.customer_details.shipping_address.address_line_1}</div>}
                                                        {(sale.customer_details.shipping_address.city || sale.customer_details.shipping_address.state || sale.customer_details.shipping_address.zip_code) && (
                                                            <div>
                                                                {sale.customer_details.shipping_address.city}
                                                                {sale.customer_details.shipping_address.state && `, ${sale.customer_details.shipping_address.state}`}
                                                                {sale.customer_details.shipping_address.zip_code && ` ${sale.customer_details.shipping_address.zip_code}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-border/50 space-y-1">
                                        <div className="font-bold text-xs capitalize tracking-wider text-muted-foreground">{t('Warehouse')}</div>
                                        <div className="text-sm text-foreground/80">
                                            {sale.warehouse?.name || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sale Items Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Sale Items')}
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
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-44">{t('Tax')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Tax Amount')}</th>
                                            <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {sale.items?.map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                                                            {item.product?.image ? (
                                                                <a
                                                                    href={getImagePath(item.product.image)}
                                                                    target="_blank"
                                                                    rel="noreferrer noopener"
                                                                    className="w-full h-full block cursor-pointer hover:opacity-80 transition-opacity"
                                                                >
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
                                                                </a>
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
                                                <td className="px-6 py-4 text-end font-medium text-foreground">{formatCurrency(item.price)}</td>
                                                <td className="px-6 py-4 text-end">
                                                    {item.taxes && item.taxes.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {item.taxes.map((tax, taxIndex) => (
                                                                <div key={taxIndex} className="text-xs text-foreground font-medium">
                                                                    {tax.tax_name} <span className="text-muted-foreground">({tax.rate}%)</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-end">
                                                    {item.tax_amount > 0 ? (
                                                        <span className="text-xs text-foreground font-medium">
                                                            {formatCurrency(item.tax_amount)}
                                                        </span>
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
                                        <span className="font-semibold text-foreground">{formatCurrency(sale.subtotal || 0)}</span>
                                    </div>
                                    {sale.discount_amount && sale.discount_amount > 0 ? (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Discount')}</span>
                                            <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(sale.discount_amount)}</span>
                                        </div>
                                    ) : null}
                                    {sale.tax_amount && sale.tax_amount > 0 ? (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Tax')}</span>
                                            <span className="font-semibold text-foreground">{formatCurrency(sale.tax_amount)}</span>
                                        </div>
                                    ) : null}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-foreground">{t('Total Amount')}</span>
                                        <span className="font-bold text-lg text-foreground">{formatCurrency(sale.total_amount || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    {sale.notes && (
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
                                    {sale.notes}
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
                                <div className="text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(sale.total_amount || 0)}</div>
                                <div className="pt-2">
                                    <span className={getStatusBadgeClasses(sale.status || 'completed')}>
                                        {t(sale.status || 'completed')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-center gap-2 bg-primary/10 text-primary hover:!bg-primary/10 hover:!text-primary transition-all font-semibold rounded-lg shadow-sm border border-primary/20"
                                    onClick={downloadPDF}
                                >
                                    <Download className="h-4 w-4" />
                                    <span>{t('Download PDF')}</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info Card */}
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
                                    {sale.customer?.avatar ? (
                                        <img
                                            src={getImagePath(sale.customer.avatar)}
                                            alt={sale.customer.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${sale.customer?.avatar ? 'hidden' : ''} font-bold`}>
                                        {sale.customer?.name ? sale.customer.name.charAt(0) : 'W'}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-foreground truncate">{sale.customer?.name || t('Walk-in Customer')}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{sale.customer?.email || t('No email address')}</p>
                                    {(sale.customer?.phone || sale.customer?.mobile_no) && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{sale.customer.phone || sale.customer.mobile_no}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* POS Sale Details Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('POS Sale Details')}
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
                                    <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Sale Date')}</span>
                                    <span className="text-sm font-medium text-foreground">{formatDate(sale.created_at)}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Warehouse')}</span>
                                    <span className="text-sm font-medium text-foreground">{sale.warehouse?.name || '-'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}