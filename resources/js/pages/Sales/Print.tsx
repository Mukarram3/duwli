// resources/js/pages/Sales/Print.tsx
import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { formatCurrency, formatDate } from '@/utils/helpers';

/**
 * ELECTRONIC TAX INVOICE — ZATCA PRINT TEMPLATE
 * =============================================================================
 * Standalone document. No layout, no navigation, nothing marked no-print —
 * there is nothing else on the page to hide, which is what keeps the print
 * area restricted to the invoice.
 *
 * DIRECTION FOLLOWS THE INTERFACE LANGUAGE. Arabic renders the whole document
 * right-to-left — table columns, panels and totals all mirror — exactly as in
 * the Arabic reference. It is one template, not two: two templates drift, and
 * a tax document that says different things in each language is a real problem
 * rather than a cosmetic one.
 *
 * WHAT ZATCA REQUIRES AND THIS CARRIES
 *   - "Tax Invoice" title in Arabic
 *   - Seller name, VAT number and commercial registration
 *   - Buyer name and VAT number
 *   - Issue date AND time
 *   - Line-level tax, taxable amount and the tax rate
 *   - Total excluding tax, total tax, total including tax
 *   - The TLV QR code
 *   - The total in words
 */

type Seller = {
    name: string; vat_number: string | null; cr_number: string | null;
    street: string | null; city: string | null; district: string | null;
    postal_code: string | null; building_no: string | null; country: string | null;
    logo: string | null; iban: string | null;
};

export default function Print() {
    const { t, i18n } = useTranslation();
    const pageProps = usePage<any>().props;
    const { invoice, qrPayload, amountWords, seller } = pageProps as {
        invoice: any; qrPayload: string; amountWords: { en: string; ar: string }; seller: Seller;
    };

    const isRtl = i18n.language === 'ar' || document.documentElement.dir === 'rtl';
    const [qrImage, setQrImage] = useState<string>('');

    useEffect(() => {
        if (!qrPayload) return;
        // Rendered to a data URI so the QR survives Save-as-PDF and printing;
        // a canvas would come out blank in some print pipelines.
        QRCode.toDataURL(qrPayload, { margin: 0, width: 240, errorCorrectionLevel: 'M' })
            .then(setQrImage)
            .catch(() => setQrImage(''));
    }, [qrPayload]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            // Wait for the QR image; printing before it resolves produces an
            // invoice with an empty QR box, which fails verification.
            const id = window.setTimeout(() => window.print(), qrImage ? 400 : 900);
            return () => window.clearTimeout(id);
        }
    }, [qrImage]);

    const money = (v: any) => formatCurrency(Number(v ?? 0), pageProps);
    const plain = (v: any) => Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const items = invoice.items ?? [];
    const taxRate = items[0]?.tax_percentage ?? 15;
    const words = isRtl ? amountWords?.ar : amountWords?.en;

    /** Address rows, shown in both panels. */
    const AddressGrid = ({ p }: { p: any }) => (
        <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-[9px]">
            {[
                [t('Street Name'), p.street],
                [t('City'), p.city],
                [t('District / Area'), p.district],
                [t('Postal Code'), p.postal_code],
                [t('Building No.'), p.building_no],
                [t('Country'), p.country],
            ].map(([label, value]) => (
                <div key={label as string} className="flex items-baseline justify-between gap-2">
                    <span className="text-[#6b7280]">{label}</span>
                    <span className="min-w-[40px] border-b border-dotted border-[#cbd5e1] text-end font-medium">
                        {value || ''}
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <Head title={`${t('Electronic Tax Invoice')} ${invoice.invoice_number}`} />

            {/* Self-contained print rules: the document must print correctly
                even if the app stylesheet fails to load. */}
            <style>{`
                @page { size: A4 portrait; margin: 12mm; }
                @media print {
                    html, body { background: #fff !important; }
                    .inv-sheet { box-shadow: none !important; margin: 0 !important; }
                    thead { display: table-header-group; }
                    tr { break-inside: avoid; }
                }
                body { background: #f1f5f9; }
            `}</style>

            <div dir={isRtl ? 'rtl' : 'ltr'} className="flex min-h-screen justify-center p-6 print:p-0">
                <div className="inv-sheet w-full max-w-[210mm] bg-white p-8 shadow-lg print:shadow-none">

                    {/* ── title + seller ── */}
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-[22px] font-bold leading-tight text-[#0f172a]">
                                {t('Electronic Tax Invoice')}
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest text-[#6b7280]">
                                {t('Tax Invoice')}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="rounded bg-[#15604a] px-3 py-1 text-[11px] font-bold text-white">
                                    {invoice.invoice_number}
                                </span>
                                <span className="rounded bg-[#eaf3ef] px-3 py-1 text-[11px] font-semibold text-[#15604a]">
                                    {t('Tax')} {plain(taxRate)}%
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-end">
                            <div>
                                <p className="text-[14px] font-bold text-[#0f172a]">{seller?.name}</p>
                                <p className="text-[9px] text-[#6b7280]">
                                    {t('VAT Number')}: {seller?.vat_number || '—'}
                                    {seller?.cr_number && <> &nbsp;•&nbsp; {t('Commercial Registration')}: {seller.cr_number}</>}
                                </p>
                            </div>
                            {seller?.logo
                                ? <img src={seller.logo} alt="" className="h-12 w-12 rounded object-contain" />
                                : <div className="h-12 w-12 rounded bg-[#15604a]" />}
                        </div>
                    </div>

                    <div className="mt-3 h-[3px] bg-[#15604a]" />

                    {/* ── meta strip ── */}
                    <div className="mt-4 grid grid-cols-4 rounded border border-[#e2e8f0] bg-[#f8fafc]">
                        {[
                            [t('Invoice Number'), invoice.invoice_number],
                            [t('Issue Date & Time'), `${formatDate(invoice.invoice_date, pageProps)}${invoice.created_at ? ' — ' + new Date(invoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`],
                            [t('Purchase Order Ref.'), invoice.reference || '—'],
                            [t('Currency'), pageProps?.settings?.defualt_currency || 'SAR'],
                        ].map(([label, value], i) => (
                            <div key={i} className={`px-3 py-2 ${i > 0 ? 'border-s border-[#e2e8f0]' : ''}`}>
                                <p className="text-[9px] text-[#6b7280]">{label}</p>
                                <p className="text-[11px] font-bold text-[#0f172a]">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── supplier / buyer ── */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded border border-[#e2e8f0] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#15604a]">
                                {t('Supplier Details')}
                            </p>
                            <p className="mt-1 text-[13px] font-bold text-[#0f172a]">{seller?.name}</p>
                            <AddressGrid p={seller ?? {}} />
                            <div className="mt-2 space-y-1 border-t border-[#e2e8f0] pt-2 text-[9px]">
                                <div className="flex justify-between"><span className="text-[#6b7280]">{t('VAT Number')}</span><span className="font-medium">{seller?.vat_number || '—'}</span></div>
                                <div className="flex justify-between"><span className="text-[#6b7280]">{t('Commercial Registration')}</span><span className="font-medium">{seller?.cr_number || '—'}</span></div>
                            </div>
                        </div>

                        <div className="rounded border border-[#e2e8f0] bg-[#f6faf8] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#15604a]">{t('Bill To')}</p>
                            <p className="mt-1 text-[13px] font-bold text-[#0f172a]">
                                {invoice.customer?.name || invoice.customerDetails?.company_name || '—'}
                            </p>
                            <AddressGrid p={{
                                street: invoice.customerDetails?.billing_address?.address,
                                city: invoice.customerDetails?.billing_address?.city,
                                district: invoice.customerDetails?.billing_address?.state,
                                postal_code: invoice.customerDetails?.billing_address?.zip_code,
                                building_no: null,
                                country: invoice.customerDetails?.billing_address?.country,
                            }} />
                            <div className="mt-2 space-y-1 border-t border-[#e2e8f0] pt-2 text-[9px]">
                                <div className="flex justify-between">
                                    <span className="text-[#6b7280]">{t('VAT Number')}</span>
                                    <span className="font-medium">{invoice.customerDetails?.tax_number || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── items ── */}
                    <table className="mt-4 w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="bg-[#15604a] text-white">
                                <th className="w-8 px-2 py-2 text-start font-semibold">#</th>
                                <th className="px-2 py-2 text-start font-semibold">{t('Description')}</th>
                                <th className="w-14 px-2 py-2 text-end font-semibold">{t('Qty')}</th>
                                <th className="w-20 px-2 py-2 text-end font-semibold">{t('Unit Price')}</th>
                                <th className="w-20 px-2 py-2 text-end font-semibold">{t('Discount')}</th>
                                <th className="w-24 px-2 py-2 text-end font-semibold">{t('Amount')}</th>
                                <th className="w-20 px-2 py-2 text-end font-semibold">{t('Tax')} {plain(taxRate)}%</th>
                                <th className="w-24 px-2 py-2 text-end font-semibold">{t('Total')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((line: any, i: number) => (
                                <tr key={i} className="border-b border-[#e2e8f0]">
                                    <td className="px-2 py-2 text-[#6b7280]">{i + 1}</td>
                                    <td className="px-2 py-2">{line.product?.name || line.description || '—'}</td>
                                    <td className="px-2 py-2 text-end tabular-nums">{plain(line.quantity)}</td>
                                    <td className="px-2 py-2 text-end tabular-nums">{plain(line.unit_price)}</td>
                                    <td className="px-2 py-2 text-end tabular-nums">{plain(line.discount_amount)}</td>
                                    <td className="px-2 py-2 text-end tabular-nums">
                                        {plain((line.quantity * line.unit_price) - (line.discount_amount ?? 0))}
                                    </td>
                                    <td className="px-2 py-2 text-end tabular-nums">{plain(line.tax_amount)}</td>
                                    <td className="px-2 py-2 text-end font-semibold tabular-nums">{plain(line.total_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-1 flex justify-between text-[9px] text-[#6b7280]">
                        <span>{t('Items')}: {items.length}</span>
                        <span>{t('All amounts in')} {pageProps?.settings?.defualt_currency || 'SAR'}</span>
                    </div>

                    {/* ── QR + totals ── */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 rounded border border-[#e2e8f0] p-4">
                            {qrImage
                                ? <img src={qrImage} alt="" className="h-[110px] w-[110px]" />
                                : <div className="h-[110px] w-[110px] bg-[#f1f5f9]" />}
                            <div>
                                <p className="text-[11px] font-bold text-[#0f172a]">{t('E-Invoice QR Code')}</p>
                                <p className="text-[9px] text-[#6b7280]">{t('Scan to verify')}</p>
                                <span className="mt-1 inline-block rounded border border-[#e2e8f0] px-2 py-0.5 text-[8px] text-[#6b7280]">
                                    TLV · Base64
                                </span>
                            </div>
                        </div>

                        <div className="rounded border border-[#e2e8f0]">
                            {[
                                [t('Subtotal Before Tax'), invoice.total_before_vat ?? invoice.subtotal],
                                [t('Discount'), invoice.discount_amount],
                                [`${t('Tax')} ${plain(taxRate)}%`, invoice.tax_amount],
                            ].map(([label, value], i) => (
                                <div key={i} className="flex justify-between border-b border-[#e2e8f0] px-3 py-2 text-[10px]">
                                    <span className="text-[#475569]">{label}</span>
                                    <span className="font-semibold tabular-nums">{money(value)}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between bg-[#15604a] px-3 py-2.5 text-white">
                                <span className="text-[11px] font-bold">{t('Total Amount Due')}</span>
                                <span className="text-[15px] font-bold tabular-nums">{money(invoice.total_amount)}</span>
                            </div>
                            {/* The words are the controlling statement of the
                                amount on a tax document — they cannot be altered
                                by adding a digit. */}
                            <div className="px-3 py-2 text-[9px] leading-relaxed">
                                <span className="font-bold text-[#15604a]">{t('Amount in Words')}: </span>
                                {words}
                            </div>
                        </div>
                    </div>

                    {/* ── payment ── */}
                    <div className="mt-4 rounded border border-[#e2e8f0]">
                        <div className="flex justify-between border-b border-[#e2e8f0] px-3 py-2">
                            <span className="text-[10px] font-bold text-[#15604a]">{t('Payment Details')}</span>
                            <span className="text-[9px] text-[#6b7280]">{t('Update when payment is received')}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            {[
                                [t('Payment Date'), invoice.paid_amount > 0 ? formatDate(invoice.updated_at, pageProps) : '__/__/____'],
                                [t('Payment Document No.'), '______'],
                                [t('Amount Paid'), money(invoice.paid_amount)],
                            ].map(([label, value], i) => (
                                <div key={i} className={`px-3 py-2 ${i > 0 ? 'border-s border-[#e2e8f0]' : ''}`}>
                                    <p className="text-[9px] text-[#6b7280]">{label}</p>
                                    <p className="text-[11px] font-bold tabular-nums">{value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                            <span className="text-[11px] font-bold text-[#15604a]">{t('Remaining Amount')}</span>
                            <span className="text-[13px] font-bold tabular-nums text-[#15604a]">
                                {money(invoice.balance_amount)}
                            </span>
                        </div>
                    </div>

                    {/* ── footer ── */}
                    <div className="mt-6 flex items-end justify-between border-t-2 border-[#c9a227] pt-3">
                        <div className="text-[9px]">
                            {invoice.payment_terms && (
                                <p><span className="font-bold">{t('Payment Terms')}</span>: {invoice.payment_terms}</p>
                            )}
                            {seller?.iban && (
                                <p className="ltr-text"><span className="font-bold">{t('Payment Details')}</span>: IBAN {seller.iban}</p>
                            )}
                        </div>
                        <div className="text-end">
                            <p className="text-[12px] font-bold text-[#15604a]">{t('Thank you for your business')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
