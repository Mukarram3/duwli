import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useFormFields } from '@/hooks/useFormFields';
import { SalesInvoiceItem } from './types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import InvoiceItemsTable from './components/InvoiceItemsTable';
import { useTaxCalculator } from './components/TaxCalculator';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputError } from '@/components/ui/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Package, CheckCircle2, Clock, FileText, Calculator, Plus, Settings } from 'lucide-react';

interface CreateProps {
    customers: Array<{id: number; name: string; email: string}>;
    warehouses: Array<{id: number; name: string; address: string}>;
    modules?: {recurringinvoicebill?: boolean};
    [key: string]: any;
}

export default function Create() {
    const { t } = useTranslation();
    const { customers, warehouses, modules } = usePage<CreateProps>().props;
    const [availableProducts, setAvailableProducts] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        customer_id: '',
        warehouse_id: '',
        type: 'product',
        payment_terms: '',
        notes: '',
        sync_to_google_calendar: false,
        items: [{
            product_id: 0,
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
            discount_amount: 0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 0
        }] as SalesInvoiceItem[]
    });

    const calendarFields = useFormFields('createCalendarSyncField', data, setData, errors, 'create', t, 'Sales');

    const handleWarehouseChange = async (warehouseId: string) => {
        setData('warehouse_id', warehouseId);

        if (warehouseId) {
            try {
                const response = await fetch(route('sales-invoices.warehouse.products') + `?warehouse_id=${warehouseId}`);
                const warehouseProducts = await response.json();
                setAvailableProducts(warehouseProducts);
            } catch (error) {
                console.error('Failed to fetch warehouse products:', error);
                setAvailableProducts([]);
            }
        } else {
            setAvailableProducts([]);
        }

        // Reset items when warehouse changes
        setData('items', [{
            product_id: 0,
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
            discount_amount: 0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 0
        }]);
    };

    const handleTypeChange = async (type: string) => {
        setData('type', type);

        if (type === 'service') {
            try {
                const response = await fetch(route('sales-invoices.services'));
                const services = await response.json();
                setAvailableProducts(services);
            } catch (error) {
                setAvailableProducts([]);
            }
        } else {
            setAvailableProducts([]);
            setData('warehouse_id', '');
        }

        // Reset items when type changes
        setData('items', [{
            product_id: 0,
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
            discount_amount: 0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 0
        }]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales-invoices.store'));
    };

    const totals = useTaxCalculator(data.items);

    // Recurring fields hook
    const recurringFields = useFormFields('salesInvoiceCreateFields', data, setData, errors, 'create');

    // Commission plan fields hook
    const commissionFields = useFormFields('commissionPlanBtn', data, setData, errors, 'create');

    // Sage fields hook
    const sageFields = useFormFields('salesInvoiceFields', data, setData, errors, 'create', t);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Sales Invoice'), url: route('sales-invoices.index')},
                {label: t('Create Sales Invoice')}
            ]}
            pageTitle={t('Create Sales Invoice')}
            pageDescription={t('Create a new sales invoice by entering the customer details, items, and terms.')}
            backUrl={route('sales-invoices.index')}
        >
            <Head title={t('Create Sales Invoice')} />

            <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        {/* Left Column - Main Details, Items, and Integrations */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <CalendarDays className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold text-foreground">
                                                    {t('Sales Invoice Details')}
                                                </CardTitle>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border/50">
                                            <RadioGroup value={data.type} onValueChange={handleTypeChange} className="flex gap-4">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer hover:bg-card/50 transition-colors">
                                                    <RadioGroupItem value="product" id="type-product" />
                                                    <Label htmlFor="type-product" className="cursor-pointer font-medium text-xs text-foreground select-none">{t('Product Wise')}</Label>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer hover:bg-card/50 transition-colors">
                                                    <RadioGroupItem value="service" id="type-service" />
                                                    <Label htmlFor="type-service" className="cursor-pointer font-medium text-xs text-foreground select-none">{t('Service Wise')}</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="invoice_date" required className="text-sm font-medium text-foreground">
                                                {t('Invoice Date')}
                                            </Label>
                                            <DatePicker
                                                id="invoice_date"
                                                value={data.invoice_date}
                                                onChange={(value) => setData('invoice_date', value)}
                                                required
                                            />
                                            <InputError message={errors.invoice_date} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="due_date" required className="text-sm font-medium text-foreground">
                                                {t('Due Date')}
                                            </Label>
                                            <DatePicker
                                                id="due_date"
                                                value={data.due_date}
                                                onChange={(value) => setData('due_date', value)}
                                                required
                                            />
                                            <InputError message={errors.due_date} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="customer_id" required className="text-sm font-medium text-foreground">
                                                {t('Customer')}
                                            </Label>
                                            <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Select Customer')} />
                                                </SelectTrigger>
                                                <SelectContent searchable>
                                                    {customers.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                                            {customer.name} - {customer.email}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.customer_id} />
                                        </div>

                                        {data.type === 'product' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="warehouse_id" required className="text-sm font-medium text-foreground">
                                                    {t('Warehouse')}
                                                </Label>
                                                <Select value={data.warehouse_id} onValueChange={handleWarehouseChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Warehouse')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {warehouses.map((warehouse) => (
                                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                                {warehouse.name} - {warehouse.address}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.warehouse_id} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="payment_terms" className="text-sm font-medium text-foreground">
                                                {t('Payment Terms')}
                                            </Label>
                                            <Input
                                                id="payment_terms"
                                                value={data.payment_terms}
                                                onChange={(e) => setData('payment_terms', e.target.value)}
                                                placeholder={t('e.g., Net 30')}
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                                                {t('Notes')}
                                            </Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                rows={2}
                                                placeholder={t('Additional notes...')}
                                                className="w-full resize-none"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Settings / Plugins Integrations */}
                            {(modules?.recurringinvoicebill || commissionFields.length > 0 || calendarFields.length > 0 || sageFields.length > 0) && (
                                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                    <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <Settings className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold text-foreground">
                                                    {t('Additional Integration Settings')}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        {/* Recurring Sales Invoice */}
                                        {modules?.recurringinvoicebill && recurringFields.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-foreground">{t('Recurring Invoice settings')}</h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {recurringFields.map((field) => (
                                                        <div key={field.id}>{field.component}</div>
                                                    ))}
                                                </div>
                                                <Separator className="my-4" />
                                            </div>
                                        )}

                                        {/* Commission Plan Fields */}
                                        {commissionFields.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-foreground">{t('Commission Plan settings')}</h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {commissionFields.map((field) => (
                                                        <div key={field.id}>{field.component}</div>
                                                    ))}
                                                </div>
                                                <Separator className="my-4" />
                                            </div>
                                        )}

                                        {/* Calendar Sync Field */}
                                        {calendarFields.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 gap-4">
                                                    {calendarFields.map((field) => (
                                                        <div key={field.id}>{field.component}</div>
                                                    ))}
                                                </div>
                                                {sageFields.length > 0 && <Separator className="my-4" />}
                                            </div>
                                        )}

                                        {/* Sage Fields */}
                                        {sageFields.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-foreground">{t('Sage integration settings')}</h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {sageFields.map((field) => (
                                                        <div key={field.id}>{field.component}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Items Card */}
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold text-foreground">
                                                    {t('Sales Invoice Items')}
                                                </CardTitle>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                const newItem = {
                                                    product_id: 0,
                                                    quantity: 1,
                                                    unit_price: 0,
                                                    discount_percentage: 0,
                                                    discount_amount: 0,
                                                    tax_percentage: 0,
                                                    tax_amount: 0,
                                                    total_amount: 0
                                                };
                                                setData('items', [...data.items, newItem]);
                                            }}
                                            variant="default"
                                            size="sm"
                                            className="rounded-lg flex items-center gap-1.5"
                                        >
                                            <Plus className="h-4 w-4" /> {t('Add Item')}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <InvoiceItemsTable
                                        items={data.items}
                                        onChange={(items) => setData('items', items)}
                                        errors={errors}
                                        products={availableProducts}
                                        showAddButton={false}
                                        invoiceType={data.type}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newItem = {
                                                product_id: 0,
                                                quantity: 1,
                                                unit_price: 0,
                                                discount_percentage: 0,
                                                discount_amount: 0,
                                                tax_percentage: 0,
                                                tax_amount: 0,
                                                total_amount: 0
                                            };
                                            setData('items', [...data.items, newItem]);
                                        }}
                                        className="w-full py-3 mt-4 border border-dashed border-primary/30 dark:border-primary/50 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary/25 hover:border-primary/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Plus className="h-4 w-4" /> {t('Add another item')}
                                    </button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Summary & Preview Cards */}
                        <div className="space-y-6 lg:sticky lg:top-6 self-start">
                            {/* Invoice Summary Card */}
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <Calculator className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold text-foreground">
                                                {t('Invoice Summary')}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{t('Subtotal')}</span>
                                        <span className="font-medium text-foreground">{formatCurrency(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{t('Discount')}</span>
                                        <span className="font-medium text-red-600">-{formatCurrency(totals.discountAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{t('Tax')}</span>
                                        <span className="font-medium text-foreground">{formatCurrency(totals.taxAmount)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-bold text-foreground text-sm">{t('Total')}</span>
                                        <span className="font-bold text-2xl text-primary">{formatCurrency(totals.total)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Terms Card */}
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold text-foreground">
                                                {t('Payment Terms')}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {data.payment_terms ? (
                                        <p className="text-xs text-muted-foreground break-words whitespace-pre-line">
                                            {data.payment_terms}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">
                                            {t('No payment terms specified.')}
                                        </p>
                                    )}
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
                                    {data.notes ? (
                                        <p className="text-xs text-muted-foreground break-words whitespace-pre-line">
                                            {data.notes}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">
                                            {t('No additional notes.')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Actions and Footer */}
                    <div className="flex justify-between items-center border-t border-border/60 pt-6 mt-6">
                        {data.items.length > 0 ? (
                            <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                <span>
                                    {data.items.length} {data.items.length === 1 ? t('item added') : t('items added')}
                                </span>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                {t('No items added yet')}
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="rounded-lg shadow-sm"
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || data.items.length === 0}
                                className="rounded-lg shadow-sm flex items-center justify-center min-w-[140px]"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-foreground mr-2"></div>
                                        <span>{t('Creating...')}</span>
                                    </>
                                ) : (
                                    <span>{t('Create Invoice')}</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

