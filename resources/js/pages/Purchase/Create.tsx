import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useFormFields } from '@/hooks/useFormFields';
import { PurchaseInvoiceItem } from './types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import InvoiceItemsTable from './components/InvoiceItemsTable';
import { useTaxCalculator } from './components/TaxCalculator';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSection, FormRow, COMPACT_FIELDS } from '@/components/duwli';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputError } from '@/components/ui/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Package, CheckCircle2, Clock, FileText, Calculator, Plus, Settings, CreditCard} from 'lucide-react';

interface CreateProps {
    vendors: Array<{id: number; name: string; email: string}>;
    products: Array<{id: number; name: string; sku: string; purchase_price: number; unit: string; type: string; taxes: Array<{id: number; tax_name: string; rate: number}>}>;
    warehouses: Array<{id: number; name: string; address: string}>;
    modules?: {recurringinvoicebill?: boolean};
    [key: string]: any;
}

export default function Create() {
    const { t } = useTranslation();
    const { vendors, products, warehouses, modules, duplicate = null } = usePage<CreateProps>().props;

    /*
     * COPIED FROM AN EXISTING BILL.
     *
     * `duplicate` is set only when Copy was clicked. The form is SEEDED with
     * it, never submitted — dates, invoice number, status and payment history
     * are deliberately not carried over, so this is a new draft the user
     * reviews and saves.
     */
    const { data, setData, post, processing, errors } = useForm({
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        vendor_id: duplicate?.vendor_id ?? '',
        warehouse_id: duplicate?.warehouse_id ?? '',
        payment_terms: duplicate?.payment_terms ?? '',
        notes: duplicate?.notes ?? '',
        sync_to_google_calendar: false,
        items: (duplicate?.items?.length ? duplicate.items : [{
            product_id: 0,
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
            discount_amount: 0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 0
        }]) as PurchaseInvoiceItem[]
    });

    const calendarFields = useFormFields('createCalendarSyncField', data, setData, errors, 'create', t, 'Purchase');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('purchase-invoices.store'));
    };

    const totals = useTaxCalculator(data.items);

    // Recurring fields hook
    const recurringFields = useFormFields('purchaseInvoiceCreateFields', data, setData, errors, 'create');

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Purchase'), url: route('purchase-invoices.index')},
                {label: t('Create Purchase Invoice')}
            ]}
            pageTitle={t('Create Purchase Invoice')}
            pageDescription={t('Create a new purchase invoice by entering the vendor details, items, and terms.')}
            backUrl={route('purchase-invoices.index')}
        >
            <Head title={t('Create Purchase Invoice')} />

            <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        {/* Left Column - Main Details, Items, and Integrations */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                                <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold text-foreground">
                                                {t('Purchase Invoice Details')}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                {/*
                                  COMPACT ENTRY LAYOUT — the same
                                  FormSection/FormRow pair the Sales invoice
                                  uses, so both forms share one set of
                                  measurements instead of each defining its own.
                                */}
                                <CardContent className={cn('p-0', COMPACT_FIELDS)}>
                                    <FormSection title={t('Invoice Details')} icon={FileText}>
                                        <FormRow label={t('Vendor')} required htmlFor="vendor_id">
                                            <Select value={data.vendor_id} onValueChange={(value) => setData('vendor_id', value)}>
                                                <SelectTrigger id="vendor_id">
                                                    <SelectValue placeholder={t('Select vendor')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vendors.map((vendor: any) => (
                                                        <SelectItem key={vendor.id} value={String(vendor.id)}>
                                                            {vendor.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.vendor_id} />
                                        </FormRow>

                                        <FormRow label={t('Warehouse')} required htmlFor="warehouse_id">
                                            <Select value={data.warehouse_id} onValueChange={(value) => setData('warehouse_id', value)}>
                                                <SelectTrigger id="warehouse_id">
                                                    <SelectValue placeholder={t('Select warehouse')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.map((w: any) => (
                                                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.warehouse_id} />
                                        </FormRow>
                                    </FormSection>

                                    <FormSection title={t('Dates')} icon={CalendarDays}>
                                        <FormRow label={t('Invoice Date')} required htmlFor="invoice_date">
                                            <DatePicker
                                                className="h-8"
                                                id="invoice_date"
                                                value={data.invoice_date}
                                                onChange={(value) => setData('invoice_date', value)}
                                            />
                                            <InputError message={errors.invoice_date} />
                                        </FormRow>

                                        <FormRow label={t('Due Date')} required htmlFor="due_date">
                                            <DatePicker
                                                className="h-8"
                                                id="due_date"
                                                value={data.due_date}
                                                onChange={(value) => setData('due_date', value)}
                                            />
                                            <InputError message={errors.due_date} />
                                        </FormRow>
                                    </FormSection>

                                    <FormSection title={t('Delivery & Payment')} icon={CreditCard}>
                                        <FormRow label={t('Payment Terms')} htmlFor="payment_terms">
                                            <Input
                                                id="payment_terms"
                                                value={data.payment_terms}
                                                onChange={(e) => setData('payment_terms', e.target.value)}
                                                placeholder={t('e.g., Net 30')}
                                            />
                                            <InputError message={errors.payment_terms} />
                                        </FormRow>

                                        <FormRow label={t('Notes')} htmlFor="notes" wide>
                                            <Textarea
                                                id="notes"
                                                rows={2}
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder={t('Additional notes')}
                                            />
                                            <InputError message={errors.notes} />
                                        </FormRow>

                                        {calendarFields}
                                    </FormSection>
                                </CardContent>
                            </Card>

                            {/* Additional Settings / Plugins Integrations */}
                            {(modules?.recurringinvoicebill || calendarFields.length > 0) && (
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
                                        {/* Recurring Purchase Invoice */}
                                        {modules?.recurringinvoicebill && recurringFields.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-foreground">{t('Recurring Invoice settings')}</h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {recurringFields.map((field) => (
                                                        <div key={field.id}>{field.component}</div>
                                                    ))}
                                                </div>
                                                {calendarFields.length > 0 && <Separator className="my-4" />}
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
                                                    {t('Purchase Invoice Items')}
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
                                        products={products}
                                        showAddButton={false}
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
                                        className="w-full py-3 mt-4 border border-dashed border-primary/30 dark:border-primary/50 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary/10 hover:border-primary/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
                                    <span>{t('Create Purchase Invoice')}</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
