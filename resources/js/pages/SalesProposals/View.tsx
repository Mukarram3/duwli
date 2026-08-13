import React from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BadgeUI from '@/components/badge-ui';
import { 
    CalendarDays, 
    Building2, 
    User, 
    FileText, 
    Calculator, 
    Download, 
    RefreshCw, 
    Clock, 
    FileCheck, 
    Send, 
    Check, 
    X,
    ExternalLink,
    Receipt,
    ArrowLeft,
    Package
} from 'lucide-react';

interface SalesProposal {
    id: number;
    proposal_number: string;
    proposal_date: string;
    due_date: string;
    customer: { id: number; name: string; email: string; avatar?: string };
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    status: string;
    converted_to_invoice: boolean;
    invoice_id?: number;
    notes?: string;
    payment_terms?: string;
    warehouse?: { id: number; name: string };
    items?: Array<{
        id: number;
        product_id: number;
        quantity: number;
        unit_price: number;
        discount_percentage: number;
        discount_amount: number;
        tax_percentage: number;
        tax_amount: number;
        total_amount: number;
        product?: {
            id: number;
            name: string;
            sku?: string;
            description?: string;
            image?: string;
        };
        taxes?: Array<{
            id: number;
            tax_name: string;
            tax_rate: number;
        }>;
    }>;
}

interface ViewProps {
    proposal: SalesProposal;
    auth: any;
    [key: string]: any;
}

export default function View() {
    const { t } = useTranslation();
    const { proposal, auth } = usePage<ViewProps>().props;

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'draft':
                return 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
            case 'sent':
                return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800';
            case 'accepted':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800';
            case 'expired':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
        }
    };

    const isOverdue = new Date(proposal.due_date) < new Date() && !['accepted', 'rejected'].includes(proposal.status?.toLowerCase());

    const handleAction = (routeUrl: string) => {
        router.post(routeUrl, {}, {
            onSuccess: () => {
                router.reload();
            }
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Sales Proposal'), url: route('sales-proposals.index')},
                {label: t('Sales Proposal Details')}
            ]}
            pageTitle={`${t('Sales Proposal')} #${proposal.proposal_number}`}
            pageDescription={t('View details, items, and conversion options for this sales proposal.')}
            backUrl={route('sales-proposals.index')}
        >
            <Head title={`${t('Sales Proposal')} #${proposal.proposal_number}`} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Left Column - Main Details, Items & Notes */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Proposal Details Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Proposal Details')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                            <CalendarDays className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Proposal Date')}</span>
                                            <span className="text-sm font-medium text-foreground">{formatDate(proposal.proposal_date)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                            <CalendarDays className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Due Date')}</span>
                                            <span className={`text-sm font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold' : 'text-foreground'}`}>
                                                {formatDate(proposal.due_date)}
                                                {isOverdue && <span className="ms-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900/60">{t('Overdue')}</span>}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Warehouse')}</span>
                                            <span className="text-sm font-medium text-foreground">{proposal.warehouse?.name || '-'}</span>
                                        </div>
                                    </div>

                                    {proposal.payment_terms && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Terms')}</span>
                                                <span className="text-sm font-medium text-foreground">{proposal.payment_terms}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Proposal Items Table Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Proposal Items')}
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
                                        {proposal.items?.map((item, index) => (
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
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 border border-rose-100 dark:border-rose-900">
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
                                        <span className="font-semibold text-foreground">{formatCurrency(proposal.subtotal)}</span>
                                    </div>
                                    {proposal.discount_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Discount')}</span>
                                            <span className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-400">-{formatCurrency(proposal.discount_amount)}</span>
                                        </div>
                                    )}
                                    {proposal.tax_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Tax')}</span>
                                            <span className="font-semibold text-foreground">{formatCurrency(proposal.tax_amount)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-foreground">{t('Total Amount')}</span>
                                        <span className="font-bold text-2xl text-primary">{formatCurrency(proposal.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    {proposal.notes && (
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
                                    {proposal.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Summary & Action sidebar */}
                <div className="space-y-6 lg:sticky lg:top-6 self-start">
                    {/* Status & Quick Actions Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Receipt className="h-5 w-5" />
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
                                <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Proposal Total')}</span>
                                <div className="text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(proposal.total_amount)}</div>
                                <div className="pt-2">
                                    <BadgeUI className={getStatusStyles(proposal.status)}>
                                        {proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1)}
                                    </BadgeUI>
                                </div>
                            </div>

                            {proposal.converted_to_invoice && (
                                <div className="p-4 rounded-xl border border-emerald-250 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                                    <div className="flex items-start gap-2.5">
                                        <FileCheck className="h-5 w-5 mt-0.5 text-emerald-600 dark:text-emerald-450 flex-shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold capitalize tracking-wider">{t('Converted to Invoice')}</p>
                                            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">{t('This proposal has been successfully converted into an invoice.')}</p>
                                            {proposal.invoice_id && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0 h-auto text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold underline inline-flex items-center gap-1"
                                                    onClick={() => router.get(route('sales-invoices.show', proposal.invoice_id))}
                                                >
                                                    <span>{t('Go to Invoice')}</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2.5">
                                {auth.user?.permissions?.includes('print-sales-proposals') && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center gap-2 hover:bg-muted/30 transition-all font-semibold rounded-lg shadow-sm border border-border"
                                        onClick={() => window.open(route('sales-proposals.print', proposal.id) + '?download=pdf', '_blank')}
                                    >
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                        <span>{t('Download PDF')}</span>
                                    </Button>
                                )}

                                {auth.user?.permissions?.includes('sent-sales-proposals') && proposal.status === 'draft' && (
                                    <Button
                                        className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={() => handleAction(route('sales-proposals.sent', proposal.id))}
                                    >
                                        <Send className="h-4 w-4" />
                                        <span>{t('Mark as Sent')}</span>
                                    </Button>
                                )}

                                {auth.user?.permissions?.includes('accept-sales-proposals') && proposal.status === 'sent' && (
                                    <Button
                                        className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                                        onClick={() => handleAction(route('sales-proposals.accept', proposal.id))}
                                    >
                                        <Check className="h-4 w-4" />
                                        <span>{t('Accept Proposal')}</span>
                                    </Button>
                                )}

                                {auth.user?.permissions?.includes('reject-sales-proposals') && proposal.status === 'sent' && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-955 text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-400"
                                        onClick={() => handleAction(route('sales-proposals.reject', proposal.id))}
                                    >
                                        <X className="h-4 w-4" />
                                        <span>{t('Reject Proposal')}</span>
                                    </Button>
                                )}

                                {auth.user?.permissions?.includes('convert-sales-proposals') && proposal.status === 'accepted' && !proposal.converted_to_invoice && (
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                                                    onClick={() => handleAction(route('sales-proposals.convert-to-invoice', proposal.id))}
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                    <span>{t('Convert to Invoice')}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" align="center" className="max-w-[240px] text-center p-2 text-xs">
                                                <p>{t('Convert this proposal to an invoice')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
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
                                    {proposal.customer?.avatar ? (
                                        <img
                                            src={getImagePath(proposal.customer.avatar)}
                                            alt={proposal.customer.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${proposal.customer?.avatar ? 'hidden' : ''} font-bold`}>
                                        {proposal.customer?.name ? proposal.customer.name.charAt(0) : '?'}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-foreground truncate">{proposal.customer?.name || t('Guest Customer')}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{proposal.customer?.email || t('No email address')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}