import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputError } from '@/components/ui/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarDays, Package, RotateCcw, Trash2, ShoppingCart, Calculator, FileText, ChevronRight } from 'lucide-react';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import { Separator } from '@/components/ui/separator';

interface SalesInvoice {
    id: number;
    invoice_number: string;
    customer: {
        id: number;
        name: string;
    };
    warehouse?: {
        id: number;
        name: string;
    };
    items: Array<{
        id: number;
        product: {
            id: number;
            name: string;
            sku?: string;
            image?: string;
        };
        quantity: number;
        available_quantity?: number;
        unit_price: number;
        discount_percentage?: number;
        discount_amount?: number;
        tax_percentage?: number;
        tax_amount?: number;
        taxes?: Array<{tax_name: string; tax_rate: number}>;
    }>;
}

interface CreateProps {
    invoices: SalesInvoice[];
    warehouses: Array<{id: number; name: string}>;
    [key: string]: any;
}

export default function Create() {
    const { t } = useTranslation();
    const { invoices, warehouses } = usePage<CreateProps>().props;

    const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
    const [returnItems, setReturnItems] = useState<Array<{
        product_id: number;
        original_invoice_item_id: number;
        return_quantity: number;
        unit_price: number;
        reason: string;
        total_amount: number;
    }>>([]);

    const { data, setData, post, processing, errors } = useForm({
        return_date: new Date().toISOString().split('T')[0],
        customer_id: '',
        warehouse_id: '',
        original_invoice_id: '',
        reason: 'defective',
        notes: '',
        items: [] as any[]
    });

    const handleInvoiceSelect = (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id.toString() === invoiceId);
        if (invoice) {
            setSelectedInvoice(invoice);
            setData({
                ...data,
                customer_id: invoice.customer.id.toString(),
                warehouse_id: invoice.warehouse?.id?.toString() || '',
                original_invoice_id: invoiceId
            });
            setReturnItems([]);
        }
    };

    const addReturnItem = (productId: number, originalInvoiceItemId: number, maxQuantity: number, unitPrice: number) => {
        const existingItem = returnItems.find(item => item.original_invoice_item_id === originalInvoiceItemId);
        if (!existingItem) {
            const originalItem = selectedInvoice?.items.find(i => i.id === originalInvoiceItemId);
            const lineTotal = 1 * unitPrice;
            const discountAmount = (lineTotal * (originalItem?.discount_percentage || 0)) / 100;
            const afterDiscount = lineTotal - discountAmount;
            const taxAmount = (afterDiscount * (originalItem?.tax_percentage || 0)) / 100;
            const totalAmount = afterDiscount + taxAmount;

            const newItem = {
                product_id: productId,
                original_invoice_item_id: originalInvoiceItemId,
                return_quantity: 1,
                unit_price: unitPrice,
                reason: '',
                total_amount: totalAmount
            };
            setReturnItems([...returnItems, newItem]);
        }
    };

    const updateReturnItem = (originalInvoiceItemId: number, field: string, value: any) => {
        setReturnItems(returnItems.map(item => {
            if (item.original_invoice_item_id === originalInvoiceItemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'return_quantity' || field === 'unit_price') {
                    const originalItem = selectedInvoice?.items.find(i => i.id === originalInvoiceItemId);
                    const lineTotal = updatedItem.return_quantity * updatedItem.unit_price;
                    const discountAmount = (lineTotal * (originalItem?.discount_percentage || 0)) / 100;
                    const afterDiscount = lineTotal - discountAmount;
                    const taxAmount = (afterDiscount * (originalItem?.tax_percentage || 0)) / 100;
                    updatedItem.total_amount = afterDiscount + taxAmount;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const removeReturnItem = (originalInvoiceItemId: number) => {
        setReturnItems(returnItems.filter(item => item.original_invoice_item_id !== originalInvoiceItemId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales-returns.store'));
    };

    // Update form data when returnItems change
    React.useEffect(() => {
        setData('items', returnItems);
    }, [returnItems]);

    const totals = {
        subtotal: returnItems.reduce((sum, item) => {
            return sum + (item.return_quantity * item.unit_price);
        }, 0),
        discountAmount: returnItems.reduce((sum, item) => {
            const originalItem = selectedInvoice?.items.find(i => i.id === item.original_invoice_item_id);
            const lineTotal = item.return_quantity * item.unit_price;
            const discount = (lineTotal * (originalItem?.discount_percentage || 0)) / 100;
            return sum + discount;
        }, 0),
        taxAmount: returnItems.reduce((sum, item) => {
            const originalItem = selectedInvoice?.items.find(i => i.id === item.original_invoice_item_id);
            const lineTotal = item.return_quantity * item.unit_price;
            const discount = (lineTotal * (originalItem?.discount_percentage || 0)) / 100;
            const afterDiscount = lineTotal - discount;
            const tax = (afterDiscount * (originalItem?.tax_percentage || 0)) / 100;
            return sum + tax;
        }, 0),
        total: returnItems.reduce((sum, item) => sum + item.total_amount, 0)
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Sales Returns'), url: route('sales-returns.index')},
                {label: t('Create Sales Return')}
            ]}
            pageTitle={t('Create Sales Return')}
            pageDescription={t('Initiate a sales return from a previously posted invoice. Select invoice, specify quantities to return, warehouse, and reasons.')}
            backUrl={route('sales-returns.index')}
        >
            <Head title={t('Create Sales Return')} />

            <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        {/* Left Column - Form Details, Available Items & Return Items */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Return Details */}
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                    <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <span>{t('Sales Return Details')}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="return_date" required className="text-xs font-bold capitalize tracking-wider text-muted-foreground">
                                                {t('Return Date')}
                                            </Label>
                                            <DatePicker
                                                id="return_date"
                                                value={data.return_date}
                                                onChange={(value) => setData('return_date', value)}
                                                required
                                            />
                                            <InputError message={errors.return_date} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="original_invoice_id" required className="text-xs font-bold capitalize tracking-wider text-muted-foreground">
                                                {t('Original Invoice')}
                                            </Label>
                                            <Select value={data.original_invoice_id} onValueChange={handleInvoiceSelect}>
                                                <SelectTrigger className="bg-card">
                                                    <SelectValue placeholder={t('Select Invoice')} />
                                                </SelectTrigger>
                                                <SelectContent searchable>
                                                    {invoices.map((invoice) => (
                                                        <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                                            {invoice.invoice_number} - {invoice.customer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.original_invoice_id} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="warehouse_id" required className="text-xs font-bold capitalize tracking-wider text-muted-foreground">
                                                {t('Warehouse')}
                                            </Label>
                                            <Select value={data.warehouse_id} onValueChange={(value) => setData('warehouse_id', value)}>
                                                <SelectTrigger className="bg-card">
                                                    <SelectValue placeholder={t('Select Warehouse')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.map((warehouse) => (
                                                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                            {warehouse.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.warehouse_id} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="reason" required className="text-xs font-bold capitalize tracking-wider text-muted-foreground">
                                                {t('Return Reason')}
                                            </Label>
                                            <Select value={data.reason} onValueChange={(value) => setData('reason', value)}>
                                                <SelectTrigger className="bg-card">
                                                    <SelectValue placeholder={t('Select Reason')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="defective">{t('Defective')}</SelectItem>
                                                    <SelectItem value="wrong_item">{t('Wrong Item')}</SelectItem>
                                                    <SelectItem value="damaged">{t('Damaged')}</SelectItem>
                                                    <SelectItem value="excess_quantity">{t('Excess Quantity')}</SelectItem>
                                                    <SelectItem value="other">{t('Other')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.reason} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Available Items */}
                            {selectedInvoice && (
                                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                    <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                        <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <span>{t('Available Items from Invoice')}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border bg-muted/10">
                                                        <th className="px-6 py-4 text-start font-semibold text-foreground capitalize tracking-wider text-xs">{t('Product')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Available Qty')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Unit Price')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Discount')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-44">{t('Tax')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Total')}</th>
                                                        <th className="px-6 py-4 text-center font-semibold text-foreground capitalize tracking-wider text-xs w-32">{t('Action')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {selectedInvoice.items.map((item) => (
                                                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center text-primary">
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
                                                                        <div className="font-semibold text-foreground truncate">{item.product.name}</div>
                                                                        {item.product.sku && (
                                                                            <div className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border/80 capitalize tracking-wider">
                                                                                SKU: {item.product.sku}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-end">
                                                                <span className={`font-semibold ${((item.available_quantity !== undefined ? item.available_quantity : item.quantity) || 0) <= 0 ? 'text-rose-600' : 'text-foreground'}`}>
                                                                    {item.available_quantity !== undefined ? item.available_quantity : item.quantity}
                                                                </span>
                                                                {((item.available_quantity !== undefined ? item.available_quantity : item.quantity) || 0) <= 0 && (
                                                                    <div className="text-[10px] text-rose-500 font-bold capitalize tracking-wider mt-1">{t('No items available')}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-end font-medium text-foreground">
                                                                {formatCurrency(item.unit_price)}
                                                            </td>
                                                            <td className="px-6 py-4 text-end">
                                                                {(item.discount_percentage || 0) > 0 ? (
                                                                    <div className="space-y-0.5">
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                                                                            {item.discount_percentage || 0}%
                                                                        </span>
                                                                        <div className="text-xs text-muted-foreground font-medium">
                                                                            ({formatCurrency(item.discount_amount || 0)})
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
                                                                            {formatCurrency(item.tax_amount || 0)}
                                                                        </div>
                                                                    </div>
                                                                ) : (item.tax_percentage || 0) > 0 ? (
                                                                    <div className="space-y-0.5">
                                                                        <span className="text-xs text-foreground font-medium">{item.tax_percentage || 0}%</span>
                                                                        <div className="text-xs text-muted-foreground font-semibold">
                                                                            ({formatCurrency(item.tax_amount || 0)})
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-end font-semibold text-foreground">
                                                                {formatCurrency((() => {
                                                                    const qty = item.available_quantity !== undefined ? item.available_quantity : item.quantity;
                                                                    const lineTotal = qty * item.unit_price;
                                                                    const discountAmount = (lineTotal * (item.discount_percentage || 0)) / 100;
                                                                    const afterDiscount = lineTotal - discountAmount;
                                                                    const taxAmount = (afterDiscount * (item.tax_percentage || 0)) / 100;
                                                                    return afterDiscount + taxAmount;
                                                                })())}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => addReturnItem(item.product.id, item.id, item.available_quantity !== undefined ? item.available_quantity : item.quantity, item.unit_price)}
                                                                    disabled={returnItems.some(ri => ri.original_invoice_item_id === item.id) || (item.available_quantity !== undefined ? item.available_quantity : item.quantity || 0) <= 0}
                                                                    size="sm"
                                                                    className="rounded-lg shadow-sm font-semibold"
                                                                >
                                                                    {returnItems.some(ri => ri.original_invoice_item_id === item.id) ? t('Added') : t('Add to Return')}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Return Items */}
                            {returnItems.length > 0 && (
                                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                    <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                        <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <RotateCcw className="h-5 w-5" />
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
                                                        <th className="px-6 py-4 text-start font-semibold text-foreground capitalize tracking-wider text-xs w-28">{t('Return Qty')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Unit Price')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Discount')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-44">{t('Tax')}</th>
                                                        <th className="px-6 py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Total')}</th>
                                                        <th className="px-6 py-4 text-start font-semibold text-foreground capitalize tracking-wider text-xs w-48">{t('Reason')}</th>
                                                        <th className="px-6 py-4 text-center font-semibold text-foreground capitalize tracking-wider text-xs w-20">{t('Action')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {returnItems.map((item) => {
                                                        const originalItem = selectedInvoice?.items.find(i => i.id === item.original_invoice_item_id);
                                                        return (
                                                            <tr key={item.original_invoice_item_id} className="hover:bg-muted/10 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center text-primary">
                                                                            {originalItem?.product?.image ? (
                                                                                <img
                                                                                    src={getImagePath(originalItem.product.image)}
                                                                                    alt={originalItem.product.name}
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => {
                                                                                        const target = e.target as HTMLImageElement;
                                                                                        target.style.display = 'none';
                                                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                                                        if (fallback) fallback.classList.remove('hidden');
                                                                                    }}
                                                                                />
                                                                            ) : null}
                                                                            <div className={`${originalItem?.product?.image ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                                                                <Package className="h-5 w-5 text-muted-foreground/45" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-semibold text-foreground truncate">{originalItem?.product.name}</p>
                                                                            {originalItem?.product.sku && (
                                                                                <div className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border/80 capitalize tracking-wider">
                                                                                    SKU: {originalItem.product.sku}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max={originalItem?.available_quantity !== undefined ? originalItem.available_quantity : originalItem?.quantity}
                                                                        value={item.return_quantity}
                                                                        onChange={(e) => updateReturnItem(item.original_invoice_item_id, 'return_quantity', parseInt(e.target.value) || 1)}
                                                                        className="w-20 text-sm font-semibold bg-card border-border shadow-sm rounded-lg"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 text-end font-medium text-foreground">
                                                                    {formatCurrency(item.unit_price)}
                                                                </td>
                                                                <td className="px-6 py-4 text-end">
                                                                    {(originalItem?.discount_percentage || 0) > 0 ? (
                                                                        <div className="space-y-0.5">
                                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                                                                                {originalItem?.discount_percentage || 0}%
                                                                            </span>
                                                                            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                                                                -{formatCurrency((item.return_quantity * item.unit_price * (originalItem?.discount_percentage || 0)) / 100)}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-end">
                                                                    {originalItem?.taxes && originalItem.taxes.length > 0 ? (
                                                                        <div className="space-y-1">
                                                                            {originalItem.taxes.map((tax, taxIndex) => (
                                                                                <div key={taxIndex} className="text-xs text-foreground font-medium">
                                                                                    {tax.tax_name} <span className="text-muted-foreground">({tax.tax_rate}%)</span>
                                                                                </div>
                                                                            ))}
                                                                            <div className="text-xs text-muted-foreground font-semibold">
                                                                                {formatCurrency((() => {
                                                                                    const lineTotal = item.return_quantity * item.unit_price;
                                                                                    const discount = (lineTotal * (originalItem?.discount_percentage || 0)) / 100;
                                                                                    const afterDiscount = lineTotal - discount;
                                                                                    return (afterDiscount * (originalItem?.tax_percentage || 0)) / 100;
                                                                                })())}
                                                                            </div>
                                                                        </div>
                                                                    ) : (originalItem?.tax_percentage || 0) > 0 ? (
                                                                        <div className="space-y-0.5">
                                                                            <span className="text-xs text-foreground font-medium">{originalItem?.tax_percentage || 0}%</span>
                                                                            <div className="text-xs text-muted-foreground font-semibold">
                                                                                {formatCurrency((() => {
                                                                                    const lineTotal = item.return_quantity * item.unit_price;
                                                                                    const discount = (lineTotal * (originalItem?.discount_percentage || 0)) / 100;
                                                                                    const afterDiscount = lineTotal - discount;
                                                                                    return (afterDiscount * (originalItem?.tax_percentage || 0)) / 100;
                                                                                })())}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-end font-semibold text-foreground">
                                                                    {formatCurrency(item.total_amount)}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <Input
                                                                        value={item.reason}
                                                                        onChange={(e) => updateReturnItem(item.original_invoice_item_id, 'reason', e.target.value)}
                                                                        placeholder={t('Reason for return...')}
                                                                        className="text-sm bg-card border-border shadow-sm rounded-lg"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeReturnItem(item.original_invoice_item_id)}
                                                                        className="text-destructive hover:text-destructive hover:bg-destructive/5 h-8 w-8 p-0"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column - Summary & Additional Info (Notes) sidebar */}
                        <div className="space-y-6 lg:sticky lg:top-6 self-start">
                            {/* Return Summary Card */}
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <Calculator className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold text-foreground">
                                                {t('Return Summary')}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">{t('Subtotal')}</span>
                                        <span className="font-semibold text-foreground">{formatCurrency(totals.subtotal)}</span>
                                    </div>
                                    {totals.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Discount')}</span>
                                            <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(totals.discountAmount)}</span>
                                        </div>
                                    )}
                                    {totals.taxAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Tax')}</span>
                                            <span className="font-semibold text-foreground">{formatCurrency(totals.taxAmount)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2 bg-border/50" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-foreground">{t('Total Amount')}</span>
                                        <span className="font-bold text-lg text-primary">{formatCurrency(totals.total)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Notes Card */}
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
                                    <div className="space-y-1.5">
                                        <Label htmlFor="notes" className="text-xs font-bold capitalize tracking-wider text-muted-foreground">
                                            {t('Notes')}
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={4}
                                            placeholder={t('Additional notes...')}
                                            className="bg-card resize-none text-sm border-border shadow-sm rounded-lg"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Form Actions Card */}
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardContent className="p-6 space-y-4">
                                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4 text-primary" />
                                        <span>{returnItems.length} {t('items selected for return')}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            type="submit"
                                            disabled={processing || returnItems.length === 0}
                                            className="w-full font-semibold rounded-lg shadow-sm"
                                        >
                                            {processing ? t('Creating...') : t('Create Return')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.history.back()}
                                            className="w-full font-semibold rounded-lg shadow-sm"
                                        >
                                            {t('Cancel')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}