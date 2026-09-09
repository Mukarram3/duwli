// resources/js/pages/Sales/Create.tsx
import { useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { InputError } from '@/components/ui/input-error';
import { SectionCard } from '@/components/duwli';
import {
    FileSpreadsheet, Plus, Trash2, Save, CheckCircle2, User as UserIcon,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';

/**
 * SALES INVOICE ENTRY FORM
 * =============================================================================
 * Rebuilt for VAT and e-invoicing.
 *
 * TWO SAVE BUTTONS, TWO DIFFERENT OPERATIONS
 * They post the same payload with a different `mode`, and the backend branches
 * on it (StoreSalesInvoiceRequest and SalesInvoiceController@store):
 *
 *   Save as Draft    lenient validation, nothing posted, stays editable
 *   Save and Approve strict validation, journal entries raised, VAT reported,
 *                    locked to editing afterwards
 *
 * Approve is the filled button and carries a confirmation, because it is the
 * irreversible one.
 *
 * THE ARITHMETIC IS MIRRORED, NOT TRUSTED
 * Every figure here is recomputed on the server by VatCalculator before
 * anything is written. The client-side maths exists so totals update as the
 * user types — it is a preview, never the source of truth. A total that
 * arrives from a browser is an assertion; this one posts to a ledger.
 *
 * Both implementations follow the same four rules so they agree:
 *   1. discount comes off before VAT
 *   2. inclusive and exclusive prices are different arithmetic, per line
 *   3. rounding happens per line, then lines are summed
 *   4. categories Z, E and O carry no VAT whatever rate is entered
 */

type Product = {
    id: number;
    name: string;
    sku: string | null;
    description: string | null;
    sale_price: number;
    unit: string | null;
    tax_ids: number[] | null;
    type: string;
};

type Line = {
    product_id: string;
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    is_tax_inclusive: boolean;
    /** The number the user typed. Read as a % or a fixed amount per discount_type. */
    discount_value: string;
    discount_type: 'percent' | 'amount';
    /** Which row of the tax master this line uses. Drives rate AND category together. */
    tax_id: string;
    tax_percentage: string;
    tax_category_code: string;
    exemption_reason_code: string;
};

const emptyLine = (): Line => ({
    product_id: '',
    description: '',
    quantity: '1',
    unit: '',
    unit_price: '0',
    is_tax_inclusive: false,
    discount_value: '0',
    discount_type: 'percent',
    tax_id: '',
    tax_percentage: '0',
    tax_category_code: 'S',
    exemption_reason_code: '',
});

/** Mirrors VatCalculator::line(). Kept deliberately identical in structure. */
function costLine(line: Line) {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unit_price) || 0;
    const rate = parseFloat(line.tax_percentage) || 0;
    const discountValue = parseFloat(line.discount_value) || 0;

    const gross = qty * price;
    // A percentage and a fixed amount are both allowed. Either way the
    // discount can never exceed the line, or the net would go negative.
    const discount = Math.min(
        line.discount_type === 'amount' ? discountValue : gross * (discountValue / 100),
        gross,
    );
    const afterDiscount = gross - discount;

    let net: number;
    let vat: number;

    if (line.is_tax_inclusive && rate > 0) {
        net = afterDiscount / (1 + rate / 100);
        vat = afterDiscount - net;
    } else {
        net = afterDiscount;
        vat = net * (rate / 100);
    }

    if (['Z', 'E', 'O'].includes(line.tax_category_code)) {
        vat = 0;
    }

    const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    net = round(net);
    vat = round(vat);

    return { gross: round(gross), discount: round(discount), net, vat, total: round(net + vat) };
}

export default function Create() {
    const { t } = useTranslation();
    const pageProps = usePage<any>().props;
    const {
        customers = [], warehouses = [], products = [], taxes = [], units = [],
        vatCategories = [], paymentMeans = [], paymentTerms = [],
    } = pageProps;

    const money = (v: any) => formatCurrency(Number(v ?? 0), pageProps);
    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, processing, errors } = useForm<any>({
        mode: 'draft',
        customer_id: '',
        description: '',
        invoice_date: today,
        supply_date: today,
        due_date: '',
        payment_terms: '',
        payment_mean: '',
        reference: '',
        type: 'product',
        warehouse_id: '',
        location_id: '',
        notes: '',
        terms: '',
        items: [emptyLine()],
    });

    const [confirming, setConfirming] = useState(false);

    const setLine = (index: number, patch: Partial<Line>) => {
        const items = [...data.items];
        items[index] = { ...items[index], ...patch };
        setData('items', items);
    };

    /**
     * Choosing a product fills the rest of the line: description, unit, price
     * and its usual VAT rate. The description is pre-filled but stays editable
     * — the catalogue description is a starting point, not the final wording
     * for this particular sale.
     *
     * An existing description is NOT overwritten. Someone who has typed their
     * own line text and then corrects the product should not lose it.
     */
    const pickProduct = (index: number, productId: string) => {
        const product = products.find((p: Product) => String(p.id) === productId);
        if (!product) {
            setLine(index, { product_id: productId });
            return;
        }

        const current = data.items[index];
        const patch: Partial<Line> = {
            product_id: productId,
            unit_price: String(product.sale_price ?? 0),
        };

        if (!current.description) {
            patch.description = product.description || '';
        }
        if (product.unit) {
            patch.unit = product.unit;
        }

        // Pre-select the product's own tax if it has one and the line has not
        // already been set deliberately.
        if (!current.tax_id) {
            const ids = Array.isArray(product.tax_ids) ? product.tax_ids : [];
            const productTax = taxes.find((x: any) => ids.includes(x.id));
            if (productTax) {
                patch.tax_id = String(productTax.id);
                patch.tax_percentage = String(productTax.rate);
                patch.tax_category_code = productTax.category_code || 'S';
                patch.exemption_reason_code = productTax.exemption_reason_code || '';
            }
        }

        setLine(index, patch);
    };

    /**
     * ONE dropdown sets the rate and the category together.
     *
     * They were two separate columns; a user could pick "Exempt" and leave 15%,
     * or "Standard" at 0% — combinations the tax authority rejects. Selecting a
     * row from the tax master makes that impossible: the rate and its category
     * always travel as a pair, as they do in the master.
     */
    const pickTax = (index: number, taxId: string) => {
        const tax = taxes.find((x: any) => String(x.id) === taxId);
        if (!tax) return;
        setLine(index, {
            tax_id: taxId,
            tax_percentage: String(tax.rate),
            tax_category_code: tax.category_code || 'S',
            exemption_reason_code: tax.exemption_reason_code || '',
        });
    };

    const totals = useMemo(() => {
        let subtotal = 0, discount = 0, beforeVat = 0, vat = 0;
        const summary: Record<string, any> = {};

        data.items.forEach((line: Line) => {
            const c = costLine(line);
            subtotal += c.gross;
            discount += c.discount;
            beforeVat += c.net;
            vat += c.vat;

            // Grouped by category AND rate: two standard-rated lines at
            // different rates must not merge — the authority expects one
            // subtotal per rate.
            const key = `${line.tax_category_code}-${line.tax_percentage}`;
            if (!summary[key]) {
                summary[key] = {
                    code: line.tax_category_code,
                    label: vatCategories.find((c: any) => c.code === line.tax_category_code)?.label
                        || line.tax_category_code,
                    rate: parseFloat(line.tax_percentage) || 0,
                    taxable: 0,
                    tax: 0,
                };
            }
            summary[key].taxable += c.net;
            summary[key].tax += c.vat;
        });

        const order: Record<string, number> = { S: 0, Z: 1, E: 2, O: 3 };
        const rows = Object.values(summary).sort(
            (a: any, b: any) => (order[a.code] ?? 9) - (order[b.code] ?? 9) || b.rate - a.rate
        );

        return { subtotal, discount, beforeVat, vat, total: beforeVat + vat, rows };
    }, [data.items, vatCategories]);

    const submit = (mode: 'draft' | 'approve') => {
        /*
         * The line shape the FORM uses is not the shape the API takes.
         *
         * The form carries a single `discount_value` plus a type toggle,
         * because that is how a user thinks about a discount. The API takes
         * either discount_percentage or discount_amount, because that is what
         * VatCalculator branches on. Translating here keeps the API honest and
         * the form natural, instead of bending one to suit the other.
         *
         * `tax_id` is a form-only field — the rate and category it selected are
         * what the server stores, so historic invoices survive edits to the
         * tax master.
         */
        const items = data.items.map((line: Line) => ({
            product_id: line.product_id || null,
            description: line.description || null,
            quantity: line.quantity,
            unit: line.unit || null,
            unit_price: line.unit_price,
            is_tax_inclusive: line.is_tax_inclusive,
            discount_percentage: line.discount_type === 'percent' ? line.discount_value : 0,
            discount_amount: line.discount_type === 'amount' ? line.discount_value : 0,
            tax_percentage: line.tax_percentage,
            tax_category_code: line.tax_category_code,
            exemption_reason_code: line.exemption_reason_code || null,
        }));

        // setData is async, so the mode is merged in explicitly — relying on
        // state alone would post the previous mode on the first click.
        setData('mode', mode);
        post(route('sales-invoices.store'), {
            data: { ...data, mode, items },
            preserveScroll: true,
            onFinish: () => setConfirming(false),
        } as any);
    };

    const customer = customers.find((c: any) => String(c.id) === String(data.customer_id));

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Sales'), url: route('sales-invoices.index') },
                { label: t('New Invoice') },
            ]}
            pageTitle={t('New Invoice')}
            pageIcon={FileSpreadsheet}
            backUrl={route('sales-invoices.index')}
        >
            <Head title={t('New Invoice')} />

            <div className="grid gap-5 lg:grid-cols-3">
                <SectionCard title="Invoice Details" className="lg:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label>{t('Invoice Number')}</Label>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('This invoice number is generated automatically.')}
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="description">{t('Invoice Description')}</Label>
                            <Input id="description" value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder={t('What is this invoice for?')} />
                            <InputError message={errors.description} />
                        </div>

                        <div>
                            <Label>{t('Customer')} <span className="text-destructive">*</span></Label>
                            <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                                <SelectTrigger><SelectValue placeholder={t('Select customer')} /></SelectTrigger>
                                <SelectContent>
                                    {customers.map((c: any) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.customer_id} />
                        </div>

                        <div>
                            <Label>{t('Invoice Type')}</Label>
                            <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product">{t('Product')}</SelectItem>
                                    <SelectItem value="service">{t('Service')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="invoice_date">{t('Issue Date')}</Label>
                            <Input id="invoice_date" type="date" value={data.invoice_date}
                                onChange={(e) => setData('invoice_date', e.target.value)} />
                            <InputError message={errors.invoice_date} />
                        </div>

                        <div>
                            <Label htmlFor="supply_date">{t('Supply Date')}</Label>
                            <Input id="supply_date" type="date" value={data.supply_date}
                                onChange={(e) => setData('supply_date', e.target.value)} />
                            {/* Not cosmetic: VAT is accounted for on the supply
                                date, which can differ from the invoice date. */}
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t('The date VAT is accounted for.')}
                            </p>
                            <InputError message={errors.supply_date} />
                        </div>

                        <div>
                            <Label>{t('Payment Terms')}</Label>
                            <Select value={data.payment_terms} onValueChange={(v) => setData('payment_terms', v)}>
                                <SelectTrigger><SelectValue placeholder={t('Select payment term')} /></SelectTrigger>
                                <SelectContent>
                                    {paymentTerms.map((term: string) => (
                                        <SelectItem key={term} value={term}>{term}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="due_date">{t('Due Date')}</Label>
                            <Input id="due_date" type="date" value={data.due_date}
                                onChange={(e) => setData('due_date', e.target.value)} />
                            <InputError message={errors.due_date} />
                        </div>

                        <div>
                            <Label>{t('Location')}</Label>
                            <Select value={data.warehouse_id} onValueChange={(v) => setData('warehouse_id', v)}>
                                <SelectTrigger><SelectValue placeholder={t('Select location')} /></SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((w: any) => (
                                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.warehouse_id} />
                        </div>

                        <div>
                            <Label>{t('Payment Method')}</Label>
                            <Select value={data.payment_mean} onValueChange={(v) => setData('payment_mean', v)}>
                                <SelectTrigger><SelectValue placeholder={t('Nothing selected')} /></SelectTrigger>
                                <SelectContent>
                                    {paymentMeans.map((m: any) => (
                                        <SelectItem key={m.code} value={m.code}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.payment_mean} />
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="reference">{t('Reference')}</Label>
                            <Input id="reference" value={data.reference}
                                onChange={(e) => setData('reference', e.target.value)}
                                placeholder={t('Customer PO or external reference')} />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Customer Details" icon={UserIcon}>
                    {!customer ? (
                        <p className="text-sm text-muted-foreground">
                            {t('Select a customer to see their details.')}
                        </p>
                    ) : (
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">{t('Name')}</dt>
                                <dd className="truncate font-medium">{customer.name}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">{t('Email')}</dt>
                                <dd className="ltr-text truncate">{customer.email || '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">{t('Phone')}</dt>
                                <dd className="ltr-text">{customer.mobile_no || '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">{t('Tax Number')}</dt>
                                <dd className="ltr-text tabular-nums">{customer.tax_number || '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-3 border-t pt-2">
                                <dt className="text-muted-foreground">{t('Current Balance')}</dt>
                                <dd className="font-semibold tabular-nums">{money(customer.balance ?? 0)}</dd>
                            </div>
                        </dl>
                    )}
                </SectionCard>
            </div>

            <SectionCard
                title="Invoice Items"
                className="mt-5"
                flush
                action={
                    <Button variant="outline" size="sm" className="gap-1.5"
                        onClick={() => setData('items', [...data.items, emptyLine()])}>
                        <Plus className="h-3.5 w-3.5" />
                        {t('Add Line')}
                    </Button>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="w-10 px-2 py-2 text-start font-medium">#</th>
                                <th className="min-w-[160px] px-2 py-2 text-start font-medium">{t('Product / Service')}</th>
                                <th className="min-w-[140px] px-2 py-2 text-start font-medium">{t('Description')}</th>
                                <th className="w-20 px-2 py-2 text-end font-medium">{t('Qty')}</th>
                                <th className="w-20 px-2 py-2 text-start font-medium">{t('Unit')}</th>
                                <th className="w-28 px-2 py-2 text-end font-medium">{t('Unit Price')}</th>
                                <th className="w-16 px-2 py-2 text-center font-medium">{t('Incl.')}</th>
                                <th className="w-40 px-2 py-2 text-end font-medium">{t('Discount')}</th>
                                <th className="w-32 px-2 py-2 text-end font-medium">{t('Total Before VAT')}</th>
                                <th className="w-44 px-2 py-2 text-start font-medium">{t('VAT %')}</th>
                                <th className="w-28 px-2 py-2 text-end font-medium">{t('VAT Value')}</th>
                                <th className="w-32 px-2 py-2 text-end font-medium">{t('Amount')}</th>
                                <th className="w-10 px-2 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((line: Line, index: number) => {
                                const c = costLine(line);
                                const needsReason = ['Z', 'E', 'O'].includes(line.tax_category_code);

                                return (
                                    <tr key={index} className="border-t align-top">
                                        <td className="px-2 py-2 text-muted-foreground tabular-nums">{index + 1}</td>

                                        <td className="px-2 py-2">
                                            <Select value={line.product_id} onValueChange={(v) => pickProduct(index, v)}>
                                                <SelectTrigger className="h-9"><SelectValue placeholder={t('Select')} /></SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p: Product) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.name}{p.sku ? ` (${p.sku})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors[`items.${index}.product_id`]} />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input className="h-9" value={line.description}
                                                onChange={(e) => setLine(index, { description: e.target.value })} />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input className="h-9 text-end" type="number" min="0" step="any"
                                                value={line.quantity}
                                                onChange={(e) => setLine(index, { quantity: e.target.value })} />
                                            <InputError message={errors[`items.${index}.quantity`]} />
                                        </td>

                                        <td className="px-2 py-2">
                                            {/* A select, not free text. Free text produces
                                                "pcs", "PCS", "Pieces" and "piece" in one
                                                table, which cannot then be summed or
                                                reported on. */}
                                            <Select value={line.unit}
                                                onValueChange={(v) => setLine(index, { unit: v })}>
                                                <SelectTrigger className="h-9"><SelectValue placeholder={t('Unit')} /></SelectTrigger>
                                                <SelectContent>
                                                    {units.map((u: any) => (
                                                        <SelectItem key={u.id} value={u.unit_name}>{u.unit_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input className="h-9 text-end" type="number" min="0" step="any"
                                                value={line.unit_price}
                                                onChange={(e) => setLine(index, { unit_price: e.target.value })} />
                                        </td>

                                        <td className="px-2 py-2 text-center">
                                            {/* Per line, not per invoice: retail and service
                                                lines on one invoice often differ. */}
                                            <Checkbox checked={line.is_tax_inclusive}
                                                onCheckedChange={(v) => setLine(index, { is_tax_inclusive: Boolean(v) })} />
                                        </td>

                                        <td className="px-2 py-2">
                                            {/* Percentage or fixed amount. Trade discounts are
                                                quoted both ways and forcing one means the user
                                                does the conversion by hand. */}
                                            <div className="flex gap-1">
                                                <Input className="h-9 text-end" type="number" min="0" step="any"
                                                    value={line.discount_value}
                                                    onChange={(e) => setLine(index, { discount_value: e.target.value })} />
                                                <Select value={line.discount_type}
                                                    onValueChange={(v) => setLine(index, { discount_type: v as 'percent' | 'amount' })}>
                                                    <SelectTrigger className="h-9 w-16"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="percent">%</SelectItem>
                                                        <SelectItem value="amount">{t('Amt')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>

                                        <td className="px-2 py-2 text-end tabular-nums">{money(c.net)}</td>

                                        <td className="px-2 py-2">
                                            {/* ONE control for rate and category. As two
                                                separate fields a user could pick "Exempt" and
                                                leave 15%, or "Standard" at 0% — combinations
                                                the authority rejects. Selecting a row from the
                                                tax master makes that impossible. */}
                                            <Select value={line.tax_id} onValueChange={(v) => pickTax(index, v)}>
                                                <SelectTrigger className="h-9"><SelectValue placeholder={t('Select VAT')} /></SelectTrigger>
                                                <SelectContent>
                                                    {taxes.map((tax: any) => (
                                                        <SelectItem key={tax.id} value={String(tax.id)}>
                                                            {tax.category_code} {Number(tax.rate).toFixed(1)}% ({tax.tax_name})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {needsReason && (
                                                <Input className="mt-1 h-8 text-xs"
                                                    placeholder={t('Reason code')}
                                                    value={line.exemption_reason_code}
                                                    onChange={(e) => setLine(index, { exemption_reason_code: e.target.value })} />
                                            )}
                                            <InputError message={errors[`items.${index}.tax_percentage`]} />
                                            <InputError message={errors[`items.${index}.exemption_reason_code`]} />
                                        </td>

                                        <td className="px-2 py-2 text-end tabular-nums">{money(c.vat)}</td>
                                        <td className="px-2 py-2 text-end font-semibold tabular-nums">{money(c.total)}</td>

                                        <td className="px-2 py-2">
                                            <Button variant="ghost" size="sm"
                                                className="h-8 w-8 p-0 text-destructive"
                                                disabled={data.items.length === 1}
                                                onClick={() => setData('items',
                                                    data.items.filter((_: any, i: number) => i !== index))}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {typeof errors.items === 'string' && (
                    <div className="border-t p-3">
                        <InputError message={errors.items} />
                    </div>
                )}
            </SectionCard>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <SectionCard
                    title="VAT Summary"
                    description="Amounts separated by tax category, as required on the invoice."
                >
                    {totals.rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('Add a line to see the VAT breakdown.')}</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-2 text-start font-medium">{t('Category')}</th>
                                    <th className="py-2 text-end font-medium">{t('Rate')}</th>
                                    <th className="py-2 text-end font-medium">{t('Taxable Amount')}</th>
                                    <th className="py-2 text-end font-medium">{t('VAT')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {totals.rows.map((row: any) => (
                                    <tr key={`${row.code}-${row.rate}`} className="border-b last:border-0">
                                        <td className="py-1.5">
                                            <span className="font-medium">{row.code}</span>{' '}
                                            <span className="text-muted-foreground">{t(row.label)}</span>
                                        </td>
                                        <td className="py-1.5 text-end tabular-nums">{row.rate}%</td>
                                        <td className="py-1.5 text-end tabular-nums">{money(row.taxable)}</td>
                                        <td className="py-1.5 text-end tabular-nums">{money(row.tax)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </SectionCard>

                <SectionCard title="Totals">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('Subtotal')}</span>
                            <span className="tabular-nums">{money(totals.subtotal)}</span>
                        </div>
                        {totals.discount > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>{t('Discount')}</span>
                                <span className="tabular-nums">-{money(totals.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">{t('Total Before VAT')}</span>
                            <span className="tabular-nums">{money(totals.beforeVat)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('Total VAT')}</span>
                            <span className="tabular-nums">{money(totals.vat)}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-foreground pt-2 text-base font-bold">
                            <span>{t('Total After VAT')}</span>
                            <span className="tabular-nums">{money(totals.total)}</span>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <div className="mt-5 space-y-3">
                <details className="rounded-lg border bg-card p-4">
                    <summary className="cursor-pointer text-sm font-semibold">{t('Terms and Conditions')}</summary>
                    <Textarea className="mt-3" rows={3} value={data.terms}
                        onChange={(e) => setData('terms', e.target.value)} />
                </details>

                <details className="rounded-lg border bg-card p-4">
                    <summary className="cursor-pointer text-sm font-semibold">{t('Notes')}</summary>
                    <Textarea className="mt-3" rows={3} value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)} />
                </details>

                {/*
                  Receipts, Attachments and Additional Information appear in the
                  reference layout but have no backing store yet — no invoice
                  attachments table, no custom-field table. They are omitted
                  rather than shown as sections that silently discard whatever
                  is typed into them. Flagged in the handover.
                */}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" onClick={() => submit('draft')} disabled={processing} className="gap-1.5">
                    <Save className="h-4 w-4" />
                    {t('Save as Draft')}
                </Button>

                {!confirming ? (
                    <Button onClick={() => setConfirming(true)} disabled={processing} className="gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('Save and Approve')}
                    </Button>
                ) : (
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950/30">
                        {/* Approval posts to the ledger and cannot be undone by
                            editing — only by credit note. That deserves one
                            deliberate confirmation. */}
                        <span className="text-xs text-amber-800 dark:text-amber-400">
                            {t('This posts to the ledger and cannot be edited afterwards.')}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button size="sm" onClick={() => submit('approve')} disabled={processing}>
                            {processing ? t('Approving...') : t('Confirm and Approve')}
                        </Button>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
