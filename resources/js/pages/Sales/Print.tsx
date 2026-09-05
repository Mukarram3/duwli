// resources/js/pages/Sales/Print.tsx
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, getCompanySetting } from '@/utils/helpers';
import {
    DocumentLayout,
    DocumentTable,
    type DocumentColumn,
    type DocumentStamp,
} from '@/components/duwli/document';
import { SalesInvoice } from './types';
import { usePageButtons } from '@/hooks/usePageButtons';

/**
 * SALES INVOICE — PRINT
 * ----------------------------------------------------------------------------
 * Rebuilt on DocumentLayout. This is the reference implementation for every
 * other printed document in the system; the remaining print screens follow the
 * same shape.
 *
 * WHAT THE SHELL FIXED HERE, versus the previous hand-rolled version:
 *
 *   - Column headings now REPEAT on page 2+ of a long invoice. Previously a
 *     40-line invoice printed page two as unlabelled numbers.
 *   - Line items and the totals block can no longer be split across a page
 *     break.
 *   - Print is now the primary action instead of the rasterised PDF download,
 *     so the default output is selectable vector text rather than a photograph
 *     of the invoice. See use-document-print.ts.
 *   - The company logo appears on the letterhead. It never did before, on any
 *     printed document.
 *   - A PAID / OVERDUE / CANCELLED stamp is printed on the face of the
 *     document, so status survives photocopying and forwarding.
 *   - Currency and date formatting now go through the company's configured
 *     settings. The old version called formatCurrency/formatDate without
 *     pageProps, which silently fell back to defaults — so a company using a
 *     comma decimal separator or a d/m/Y date got the wrong format on every
 *     printed invoice while the on-screen version was correct.
 */

interface PrintProps {
    invoice: SalesInvoice;
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const pageProps = usePage<PrintProps>().props;
    const { invoice } = pageProps;

    const signaturePrintButtons = usePageButtons('signaturePrintBtn', {
        invoice: invoice,
        invoiceType: 'sales',
    });

    const money = (value: any) => formatCurrency(value ?? 0, pageProps);
    const date = (value: any) => (value ? formatDate(value, pageProps) : '—');

    // Products need a quantity column; a service invoice does not, and an empty
    // Qty column down the page reads as missing data rather than N/A.
    const isProduct = invoice.type === 'product';

    const columns: DocumentColumn[] = [
        { key: 'item', header: 'Description' },
        ...(isProduct
            ? [{ key: 'qty', header: 'Qty', align: 'end' as const, width: '16mm' }]
            : []),
        { key: 'price', header: 'Unit Price', align: 'end', width: '26mm' },
        { key: 'discount', header: 'Discount', align: 'end', width: '24mm' },
        { key: 'tax', header: 'Tax', align: 'end', width: '26mm' },
        { key: 'total', header: 'Amount', align: 'end', width: '28mm' },
    ];

    /**
     * The stamp reflects what the reader needs to know at a glance when the
     * document arrives detached from the system.
     */
    const stamp: DocumentStamp | null =
        invoice.status === 'paid'
            ? 'paid'
            : invoice.status === 'cancelled'
              ? 'cancelled'
              : invoice.status === 'draft'
                ? 'draft'
                : invoice.display_status === 'overdue'
                  ? 'overdue'
                  : null;

    const billing = (invoice as any).customer_details?.billing_address;
    const shipping = (invoice as any).customer_details?.shipping_address;

    const totals = [
        { label: 'Subtotal', value: money(invoice.subtotal) },
        ...(Number(invoice.discount_amount) > 0
            ? [{ label: 'Discount', value: `-${money(invoice.discount_amount)}`, muted: true }]
            : []),
        ...(Number(invoice.tax_amount) > 0
            ? [{ label: 'Tax', value: money(invoice.tax_amount) }]
            : []),
        { label: 'Total', value: money(invoice.total_amount), grand: true },
        // Amount paid and balance only appear once something has been paid —
        // on an untouched invoice they would just restate the total twice.
        ...(Number((invoice as any).paid_amount) > 0
            ? [
                  { label: 'Amount Paid', value: `-${money((invoice as any).paid_amount)}`, muted: true },
                  { label: 'Balance Due', value: money((invoice as any).balance_amount), grand: true },
              ]
            : []),
    ];

    return (
        <>
            <Head title={`${t('Invoice')} ${invoice.invoice_number}`} />

            <DocumentLayout
                title="Tax Invoice"
                number={invoice.invoice_number}
                filename={`invoice-${invoice.invoice_number}`}
                theme="classic"
                stamp={stamp}
                backUrl={route('sales-invoices.show', invoice.id)}
                meta={[
                    { label: 'Invoice Date', value: date(invoice.invoice_date) },
                    { label: 'Due Date', value: date(invoice.due_date) },
                    ...(invoice.payment_terms
                        ? [{ label: 'Terms', value: invoice.payment_terms }]
                        : []),
                ]}
                parties={[
                    {
                        label: 'Bill To',
                        name: invoice.customer?.name,
                        email: invoice.customer?.email,
                        taxNumber: (invoice as any).customer_details?.tax_number,
                        address: billing,
                    },
                    {
                        label: 'Ship To',
                        name: shipping?.name || invoice.customer?.name,
                        address: shipping || billing,
                        fallback: 'Same as billing address',
                    },
                ]}
                totals={totals}
                notes={
                    <>
                        {invoice.payment_terms && (
                            <p>
                                <span className="font-semibold">{t('Payment Terms')}:</span>{' '}
                                {invoice.payment_terms}
                            </p>
                        )}
                        {(invoice as any).notes && (
                            <p className="mt-1 whitespace-pre-line">{(invoice as any).notes}</p>
                        )}
                        {getCompanySetting('registration_number', pageProps) && (
                            <p className="mt-2 text-[8.5pt] text-[#5d6772]">
                                {t('Please quote the invoice number on all correspondence.')}
                            </p>
                        )}
                    </>
                }
                signature={
                    signaturePrintButtons.length > 0 ? (
                        <>
                            {signaturePrintButtons.map((button) => (
                                <div key={button.id}>{button.component}</div>
                            ))}
                        </>
                    ) : (
                        <div className="w-56 text-center">
                            <div className="h-14" />
                            <div className="border-t border-[#aab0b6] pt-1 text-[9pt] text-[#5d6772]">
                                {t('Authorised Signature')}
                            </div>
                        </div>
                    )
                }
            >
                <DocumentTable
                    numbered
                    columns={columns}
                    rows={invoice.items || []}
                    emptyText="This invoice has no line items."
                    render={(item: any, column) => {
                        switch (column.key) {
                            case 'item':
                                return (
                                    <>
                                        <div className="font-medium">{item.product?.name}</div>
                                        {item.product?.sku && (
                                            <div className="text-[8.5pt] text-[#5d6772]">
                                                {t('SKU')}: {item.product.sku}
                                            </div>
                                        )}
                                        {item.description && (
                                            <div className="text-[8.5pt] text-[#5d6772]">
                                                {item.description}
                                            </div>
                                        )}
                                    </>
                                );

                            case 'qty':
                                return item.quantity;

                            case 'price':
                                return money(item.unit_price);

                            case 'discount':
                                return Number(item.discount_percentage) > 0 ? (
                                    <>
                                        <div>{item.discount_percentage}%</div>
                                        <div className="text-[8.5pt] text-[#5d6772]">
                                            -{money(item.discount_amount)}
                                        </div>
                                    </>
                                ) : (
                                    '—'
                                );

                            case 'tax':
                                if (item.taxes && item.taxes.length > 0) {
                                    return (
                                        <>
                                            {item.taxes.map((tax: any, i: number) => (
                                                <div key={i} className="text-[8.5pt] text-[#5d6772]">
                                                    {tax.tax_name} {tax.tax_rate}%
                                                </div>
                                            ))}
                                            <div>{money(item.tax_amount)}</div>
                                        </>
                                    );
                                }
                                return Number(item.tax_percentage) > 0 ? (
                                    <>
                                        <div className="text-[8.5pt] text-[#5d6772]">
                                            {item.tax_percentage}%
                                        </div>
                                        <div>{money(item.tax_amount)}</div>
                                    </>
                                ) : (
                                    '—'
                                );

                            case 'total':
                                return <span className="font-semibold">{money(item.total_amount)}</span>;

                            default:
                                return null;
                        }
                    }}
                />
            </DocumentLayout>
        </>
    );
}
