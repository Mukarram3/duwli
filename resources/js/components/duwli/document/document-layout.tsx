// resources/js/components/duwli/document/document-layout.tsx
import * as React from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { getCompanySetting, getImagePath, formatDate } from '@/utils/helpers';
import { useDocumentPrint } from './use-document-print';
import { cn } from '@/lib/utils';

/**
 * DUWLI DOCUMENT LAYOUT
 * ----------------------------------------------------------------------------
 * The shell every printed business document is built in: invoices, proforma
 * invoices, quotations, delivery challans, credit and debit notes, purchase
 * orders, receipts and customer statements.
 *
 * WHY THIS EXISTS
 * There are 12 print screens in the system and each one hand-rolls its own
 * letterhead, address block, totals ladder, footer and <style> tag. The result:
 * a quotation and an invoice from the same company do not look like they came
 * from the same company. Worse, every one of them repeats the same three
 * mistakes — no repeating table headers, no page numbers, and a totals block
 * that can be orphaned onto its own page.
 *
 * This component owns the anatomy so a document screen only supplies content:
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │ [logo]  Company                    INVOICE      │  letterhead
 *   │         address, tax no.           #INV-000124  │
 *   │                                    Date / Due   │
 *   ├─────────────────────────────────────────────────┤
 *   │ BILL TO              SHIP TO                    │  parties
 *   ├─────────────────────────────────────────────────┤
 *   │ line items (children)              ⟨PAID⟩       │  body + stamp
 *   │                                                 │
 *   │                          Subtotal      1,000.00 │  totals
 *   │                          Tax             150.00 │
 *   │                          TOTAL         1,150.00 │
 *   ├─────────────────────────────────────────────────┤
 *   │ Notes / Terms          [signature]              │  footnotes
 *   │ Company · Page 1                                │  footer
 *   └─────────────────────────────────────────────────┘
 *
 * Every part is optional. A delivery challan passes no totals; a receipt uses
 * the thermal size and no parties block.
 *
 * THEMES change letterhead treatment and table emphasis only — never geometry,
 * page breaks or field order, so a document says the same thing in every theme.
 */

export type DocumentTheme = 'classic' | 'modern' | 'minimal';
export type DocumentSize = 'a4' | 'a4-landscape' | 'thermal';
export type DocumentStamp = 'paid' | 'overdue' | 'cancelled' | 'draft';

export type PartyAddress = {
    name?: string | null;
    address_line_1?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zip_code?: string | null;
};

export type Party = {
    /** e.g. "Bill To". Untranslated. */
    label: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    taxNumber?: string | null;
    address?: PartyAddress | null;
    /** Shown when there is no name and no address. */
    fallback?: string;
};

export type MetaField = {
    /** e.g. "Invoice Date". Untranslated. */
    label: string;
    value: React.ReactNode;
};

type Props = {
    /** e.g. "Tax Invoice". Untranslated; rendered uppercase by the theme. */
    title: string;
    /** Document number, e.g. INV-000124. */
    number?: string;
    /** Date / due / reference pairs shown under the number. */
    meta?: MetaField[];

    /** Usually two: bill-to and ship-to. Pass one for a single-party document. */
    parties?: Party[];

    /** Totals ladder rows. The row flagged `grand` gets the emphasised style. */
    totals?: { label: string; value: React.ReactNode; grand?: boolean; muted?: boolean }[];

    /** Free text above the footer — payment terms, bank details, notes. */
    notes?: React.ReactNode;
    /** Signature block, or the module-injected signature buttons. */
    signature?: React.ReactNode;

    /** Diagonal stamp across the document. */
    stamp?: DocumentStamp | null;

    theme?: DocumentTheme;
    size?: DocumentSize;

    /** Filename stem for downloads, without extension. */
    filename?: string;
    /** Hides the on-screen toolbar (used when embedding in a preview). */
    hideToolbar?: boolean;
    /** Where the Back button goes. Omitted = no Back button. */
    backUrl?: string;

    /** The line-item table and anything else specific to this document. */
    children: React.ReactNode;
    className?: string;
};

function AddressBlock({ party }: { party: Party }) {
    const { t } = useTranslation();
    const a = party.address;

    const cityLine = [a?.city, a?.state].filter(Boolean).join(', ');
    const hasAny = party.name || party.email || party.phone || a?.address_line_1 || cityLine;

    return (
        <div>
            <div className="doc-label">{t(party.label)}</div>
            {!hasAny ? (
                <p className="text-[9.5pt] text-[#5d6772]">{t(party.fallback || '—')}</p>
            ) : (
                <div className="space-y-[1px] text-[9.5pt]">
                    {party.name && <p className="font-semibold">{party.name}</p>}
                    {a?.name && a.name !== party.name && <p>{a.name}</p>}
                    {a?.address_line_1 && <p>{a.address_line_1}</p>}
                    {a?.address_line_2 && <p>{a.address_line_2}</p>}
                    {(cityLine || a?.zip_code) && (
                        <p>{[cityLine, a?.zip_code].filter(Boolean).join(' ')}</p>
                    )}
                    {a?.country && <p>{a.country}</p>}
                    {party.email && <p>{party.email}</p>}
                    {party.phone && <p>{party.phone}</p>}
                    {party.taxNumber && (
                        <p>
                            {t('Tax No.')}: {party.taxNumber}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export function DocumentLayout({
    title,
    number,
    meta = [],
    parties = [],
    totals = [],
    notes,
    signature,
    stamp,
    theme = 'classic',
    size = 'a4',
    filename,
    hideToolbar = false,
    backUrl,
    children,
    className,
}: Props) {
    const { t } = useTranslation();
    const pageProps = usePage().props as any;

    const { print, downloadRasterPdf, isGenerating } = useDocumentPrint({
        filename: filename || (number ? `${title}-${number}` : title).replace(/\s+/g, '-').toLowerCase(),
        landscape: size === 'a4-landscape',
    });

    const setting = (key: string) => getCompanySetting(key, pageProps);
    const logo = pageProps?.companyAllSetting?.logo_dark || pageProps?.companyAllSetting?.logo_light;

    const companyCityLine = [setting('company_city'), setting('company_state')]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="doc-desk">
            {/* Screen-only toolbar. Hidden in print by .doc-toolbar in print.css. */}
            {!hideToolbar && (
                <div className="doc-toolbar mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-end gap-2">
                    {backUrl && (
                        <a
                            href={backUrl}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#e2e4e6] bg-white px-3.5 text-[13px] font-semibold text-[#051321] hover:bg-[#f7f8f9]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('Back')}
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={downloadRasterPdf}
                        disabled={isGenerating}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#e2e4e6] bg-white px-3.5 text-[13px] font-semibold text-[#051321] hover:bg-[#f7f8f9] disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        {isGenerating ? t('Generating...') : t('Download PDF')}
                    </button>
                    {/*
                      Print is the PRIMARY action, not Download. The browser's
                      print dialog offers "Save as PDF", and that path produces
                      selectable vector text with repeating table headers —
                      which the rasterised download cannot do at all.
                    */}
                    <button
                        type="button"
                        onClick={print}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#1e3a6f] px-3.5 text-[13px] font-semibold text-white hover:bg-[#183057]"
                    >
                        <Printer className="h-4 w-4" />
                        {t('Print')}
                    </button>
                </div>
            )}

            <article
                className={cn(
                    'doc-sheet',
                    `doc-theme-${theme}`,
                    size === 'a4-landscape' && 'doc-sheet--landscape',
                    size === 'thermal' && 'doc-sheet--thermal',
                    className,
                )}
            >
                {stamp && (
                    <div className={`doc-stamp doc-stamp--${stamp}`} aria-hidden="true">
                        {t(stamp)}
                    </div>
                )}

                {/* ---------------------------------------------- letterhead */}
                <header className="doc-letterhead doc-no-break">
                    <div className="min-w-0">
                        {logo && (
                            <img
                                src={getImagePath(logo)}
                                alt=""
                                className="doc-letterhead__logo mb-3"
                            />
                        )}
                        <p className="text-[13pt] font-bold leading-tight">
                            {setting('company_name') || t('Your Company')}
                        </p>
                        <div className="mt-1 space-y-[1px] text-[9pt]">
                            {setting('company_address') && <p>{setting('company_address')}</p>}
                            {(companyCityLine || setting('company_zipcode')) && (
                                <p>{[companyCityLine, setting('company_zipcode')].filter(Boolean).join(' ')}</p>
                            )}
                            {setting('company_country') && <p>{setting('company_country')}</p>}
                            {setting('company_telephone') && <p>{setting('company_telephone')}</p>}
                            {setting('company_email') && <p>{setting('company_email')}</p>}
                            {setting('registration_number') && (
                                <p>
                                    {t('Reg. No.')}: {setting('registration_number')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="shrink-0 text-end">
                        <h1 className="doc-title">{t(title)}</h1>
                        {number && <p className="doc-number mt-1">#{number}</p>}
                        {meta.length > 0 && (
                            <dl className="mt-3 space-y-[2px] text-[9.5pt]">
                                {meta.map((field) => (
                                    <div key={field.label} className="flex justify-end gap-3">
                                        <dt className="text-[#5d6772]">{t(field.label)}:</dt>
                                        <dd className="font-medium tabular-nums">{field.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                </header>

                {/* -------------------------------------------------- parties */}
                {parties.length > 0 && (
                    <section className="doc-parties">
                        {parties.map((party) => (
                            <AddressBlock key={party.label} party={party} />
                        ))}
                    </section>
                )}

                {/* ----------------------------------------------------- body */}
                <section>{children}</section>

                {/* --------------------------------------------------- totals */}
                {totals.length > 0 && (
                    <section className="doc-totals mt-6">
                        {totals.map((row) => (
                            <div
                                key={row.label}
                                className={cn(
                                    'doc-totals__row',
                                    row.grand && 'doc-totals__grand',
                                    row.muted && 'text-[#5d6772]',
                                )}
                            >
                                <span>{t(row.label)}</span>
                                <span>{row.value}</span>
                            </div>
                        ))}
                    </section>
                )}

                {/* ------------------------------------------ notes/signature */}
                {(notes || signature) && (
                    <section className="doc-no-break mt-8 flex items-end justify-between gap-10">
                        <div className="min-w-0 flex-1 text-[9.5pt]">{notes}</div>
                        {signature && <div className="doc-signature shrink-0">{signature}</div>}
                    </section>
                )}

                {/* --------------------------------------------------- footer */}
                <footer className="doc-footer flex items-end justify-between gap-6">
                    <div>
                        <p>{setting('company_name')}</p>
                        {/*
                          Paper documents get separated from their context. A
                          generated-on line tells the reader how current the
                          figures are, which matters most for statements and
                          aged reports.
                        */}
                        <p className="print-only">
                            {t('Generated')}: {formatDate(new Date(), pageProps)}
                        </p>
                    </div>
                    <p className="text-end">{t('This is a computer-generated document.')}</p>
                </footer>
            </article>
        </div>
    );
}
