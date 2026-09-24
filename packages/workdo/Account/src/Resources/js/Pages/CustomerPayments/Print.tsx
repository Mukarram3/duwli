// packages/workdo/Account/src/Resources/js/Pages/CustomerPayments/Print.tsx
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { CalendarDays, MapPin, Phone, FileText, PenLine, User } from 'lucide-react';

/**
 * RECEIPT VOUCHER — PRINT DOCUMENT
 * =============================================================================
 * A standalone page, NOT a modal over the list. That is the whole fix: the old
 * Print action called window.print() on the payments screen, so the browser
 * printed the sidebar, the filters, the table and the buttons — everything
 * except a voucher.
 *
 * This route renders the voucher alone. There is no layout, no navigation and
 * nothing marked no-print, because there is nothing else on the page to hide.
 *
 * BILINGUAL BY COLUMN, NOT BY TRANSLATION. Arabic labels sit right, English
 * left, and the value runs between them — the standard Gulf voucher layout.
 * Both labels are always present regardless of the interface language, because
 * the document is read by people who may not share the operator's language.
 *
 * `?print=1` opens the browser print dialog on load, which is also the "Save as
 * PDF" path — so Print, Preview and Save as PDF all produce this same document
 * rather than three different outputs.
 */

type Props = {
    payment: {
        payment_number: string;
        payment_date: string;
        amount: string;
        currency: string;
        amount_words_en: string;
        amount_words_ar: string;
        customer_name: string;
        reference_number: string | null;
        bank_account: string | null;
        notes: string | null;
        received_by: string | null;
    };
    company: {
        name: string;
        name_ar: string | null;
        address: string | null;
        phone: string | null;
        vat_number: string | null;
        logo: string | null;
    };
};

/** Label pair: English on the left, Arabic on the right, value between. */
function Field({
    en, ar, children, minHeight,
}: { en: string; ar: string; children?: React.ReactNode; minHeight?: string }) {
    return (
        <div className="flex items-stretch gap-2">
            <div className="flex w-[150px] shrink-0 items-center rounded bg-[#eaf2fb] px-3 py-2 text-[12px] font-bold text-[#0b2e5c]">
                {en}
            </div>
            <div
                className="flex flex-1 items-start rounded border border-[#bcd4ee] bg-white px-3 py-2 text-[13px] text-[#111]"
                style={{ minHeight: minHeight ?? '34px' }}
            >
                {children}
            </div>
            <div
                dir="rtl"
                className="flex w-[150px] shrink-0 items-center justify-end rounded bg-[#eaf2fb] px-3 py-2 text-[13px] font-bold text-[#0b2e5c]"
            >
                {ar}
            </div>
        </div>
    );
}

export default function Print({ payment, company }: Props) {
    useEffect(() => {
        // Only when asked. Opening the dialog on a plain visit would make the
        // page impossible to read on screen.
        if (new URLSearchParams(window.location.search).get('print') === '1') {
            // One frame, so the fonts and logo are painted before the dialog
            // snapshots the page.
            const id = window.setTimeout(() => window.print(), 300);
            return () => window.clearTimeout(id);
        }
    }, []);

    return (
        <>
            <Head title={`${'سند قبض'} ${payment.payment_number}`} />

            {/*
              Print rules are inline rather than in the shared stylesheet so
              this document is self-contained — it prints correctly even if the
              app's CSS fails to load, which is exactly when someone is trying
              to get a voucher out.
            */}
            <style>{`
                @page { size: A4 landscape; margin: 10mm; }
                @media print {
                    html, body { background: #fff !important; }
                    .voucher-sheet { box-shadow: none !important; margin: 0 !important; }
                }
                body { background: #f1f5f9; }
            `}</style>

            <div className="flex min-h-screen items-start justify-center p-6 print:p-0">
                <div className="voucher-sheet relative w-full max-w-[1000px] overflow-hidden rounded-xl bg-white shadow-lg print:rounded-none print:shadow-none">
                    {/* Decorative wave, top and bottom, as in the reference. */}
                    <div className="h-3 bg-gradient-to-r from-[#0b3f8f] via-[#2f7fd6] to-[#0b3f8f]" />

                    <div className="px-8 py-5">
                        {/* ── letterhead ── */}
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex items-center gap-3">
                                {company.logo && (
                                    <img src={company.logo} alt="" className="h-14 w-auto object-contain" />
                                )}
                                <div>
                                    {company.name_ar && (
                                        <p dir="rtl" className="text-[20px] font-bold leading-tight text-[#0b2e5c]">
                                            {company.name_ar}
                                        </p>
                                    )}
                                    <p className="text-[15px] font-semibold text-[#0b2e5c]">{company.name}</p>
                                </div>
                            </div>

                            <div className="space-y-1 text-[11px] text-[#0b2e5c]">
                                {company.address && (
                                    <p className="flex items-center justify-end gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-[#2f7fd6]" />
                                        {company.address}
                                    </p>
                                )}
                                {company.phone && (
                                    <p className="ltr-text flex items-center justify-end gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-[#2f7fd6]" />
                                        {company.phone}
                                    </p>
                                )}
                                {company.vat_number && (
                                    <p className="ltr-text flex items-center justify-end gap-1.5 tabular-nums">
                                        <FileText className="h-3.5 w-3.5 text-[#2f7fd6]" />
                                        Group VAT No: {company.vat_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── title + date ── */}
                        <div className="mt-4 flex items-stretch justify-between gap-4">
                            <div className="flex-1" />
                            <div className="rounded-lg bg-[#eaf2fb] px-10 py-2 text-center">
                                <p dir="rtl" className="text-[22px] font-bold leading-tight text-[#0b2e5c]">سند قبض</p>
                                <p className="text-[14px] font-bold tracking-wide text-[#0b2e5c]">RECEIPT VOUCHER</p>
                            </div>
                            <div className="flex flex-1 items-center justify-end gap-2 rounded-lg bg-[#eaf2fb] px-3 py-2">
                                <CalendarDays className="h-5 w-5 shrink-0 text-[#2f7fd6]" />
                                <div className="text-[11px] font-bold leading-tight text-[#0b2e5c]">
                                    <p dir="rtl">التاريخ</p>
                                    <p>Date</p>
                                </div>
                                <div className="ltr-text min-w-[120px] rounded border border-[#bcd4ee] bg-white px-3 py-1 text-center text-[13px] tabular-nums">
                                    {payment.payment_date}
                                </div>
                            </div>
                        </div>

                        {/* ── fields ── */}
                        <div className="mt-4 space-y-2">
                            <Field en="No." ar="رقم السند">
                                <span className="ltr-text tabular-nums font-semibold">{payment.payment_number}</span>
                            </Field>

                            <Field en="Received from Mr." ar="استلمت من السيد">
                                {payment.customer_name}
                            </Field>

                            <Field en="Amount" ar="مبلغ وقدره">
                                <span className="flex w-full items-center justify-between gap-3">
                                    <span className="ltr-text tabular-nums text-[15px] font-bold">{payment.amount}</span>
                                    <span className="rounded bg-[#eaf2fb] px-2 py-0.5 text-[11px] font-bold text-[#0b2e5c]">
                                        {payment.currency}
                                    </span>
                                </span>
                            </Field>

                            {/*
                              Words in BOTH languages, stacked. On a voucher the
                              words are the controlling statement of the amount —
                              they cannot be altered by adding a digit — so both
                              readers need their own.
                            */}
                            <Field en="In words" ar="وذلك مقابل" minHeight="52px">
                                <span className="flex w-full flex-col gap-0.5">
                                    <span dir="rtl" className="text-[12px] font-semibold">{payment.amount_words_ar}</span>
                                    <span className="text-[11px] text-[#444]">{payment.amount_words_en}</span>
                                </span>
                            </Field>

                            <Field en="Cash / Cheque No." ar="نقداً / شيك رقم">
                                <span className="flex w-full items-center justify-between gap-3">
                                    <span>{payment.bank_account || '—'}</span>
                                    {payment.reference_number && (
                                        <span className="ltr-text tabular-nums text-[12px] text-[#444]">
                                            {payment.reference_number}
                                        </span>
                                    )}
                                </span>
                            </Field>

                            {payment.notes && (
                                <Field en="Notes" ar="ملاحظات" minHeight="40px">
                                    {payment.notes}
                                </Field>
                            )}
                        </div>

                        {/* ── signatures ── */}
                        <div className="mt-5 grid grid-cols-2 gap-6 rounded-lg bg-[#eaf2fb] p-4">
                            <div>
                                <div className="mb-2 flex items-center justify-center gap-2 text-[#0b2e5c]">
                                    <PenLine className="h-4 w-4 text-[#2f7fd6]" />
                                    <div className="text-[11px] font-bold leading-tight">
                                        <p dir="rtl">التوقيع</p>
                                        <p>Signature</p>
                                    </div>
                                </div>
                                <div className="h-10 rounded border border-[#bcd4ee] bg-white" />
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-center gap-2 text-[#0b2e5c]">
                                    <User className="h-4 w-4 text-[#2f7fd6]" />
                                    <div className="text-[11px] font-bold leading-tight">
                                        <p dir="rtl">المستلم</p>
                                        <p>Received by</p>
                                    </div>
                                </div>
                                <div className="flex h-10 items-center justify-center rounded border border-[#bcd4ee] bg-white px-3 text-[12px]">
                                    {payment.received_by || ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-4 bg-gradient-to-r from-[#0b3f8f] via-[#2f7fd6] to-[#0b3f8f]" />
                </div>
            </div>
        </>
    );
}
