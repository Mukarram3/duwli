// resources/js/components/duwli/document/report-layout.tsx
import * as React from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { getCompanySetting, getImagePath, formatDate } from '@/utils/helpers';
import { useDocumentPrint } from './use-document-print';
import { cn } from '@/lib/utils';

/**
 * DUWLI REPORT LAYOUT
 * ----------------------------------------------------------------------------
 * The printed shell for financial reports: trial balance, general ledger,
 * profit & loss, balance sheet, cash flow, aged receivables/payables, tax
 * summary, account statements.
 *
 * A REPORT IS NOT A DOCUMENT, and the difference matters on paper:
 *
 *   - An invoice is addressed to someone; a report is not. No parties block.
 *   - A report is only meaningful WITH ITS FILTERS. A trial balance printed
 *     without its date range is worthless — nobody can tell what period it
 *     covers. The existing report prints omit this, which makes a printed copy
 *     unauditable the moment it leaves the screen. `filters` is therefore a
 *     first-class prop, printed in the header, not an afterthought.
 *   - A report is usually wide and long, so landscape and repeating headers
 *     matter more than they do for a one-page invoice.
 *   - A report needs a summary band: the two or three figures a reader checks
 *     before reading any of the detail.
 *
 * USAGE
 *   <ReportLayout
 *       title="Trial Balance"
 *       filters={[
 *           { label: 'Period', value: 'Jan 2026 – Aug 2026' },
 *           { label: 'Basis', value: 'Accrual' },
 *       ]}
 *       summary={[
 *           { label: 'Total Debit',  value: formatCurrency(totals.debit, pageProps) },
 *           { label: 'Total Credit', value: formatCurrency(totals.credit, pageProps) },
 *       ]}
 *       size="a4-landscape"
 *   >
 *       <DocumentTable ... />
 *   </ReportLayout>
 */

export type ReportFilter = {
    /** e.g. "Period", "Account", "Customer". Untranslated. */
    label: string;
    value: React.ReactNode;
};

export type ReportSummaryItem = {
    label: string;
    value: React.ReactNode;
    /** Emphasises the figure — use for the one that answers the report. */
    emphasis?: boolean;
    /** Marks a figure that should be zero, e.g. a trial balance difference. */
    warn?: boolean;
};

type Props = {
    /** e.g. "Trial Balance". Untranslated. */
    title: string;
    /** One line under the title explaining what the report shows. */
    subtitle?: string;

    /**
     * The filters this report was run with. PRINTED IN THE HEADER — without
     * them a paper copy cannot be interpreted or audited.
     */
    filters?: ReportFilter[];

    /** The two or three headline figures, shown above the detail. */
    summary?: ReportSummaryItem[];

    size?: 'a4' | 'a4-landscape';
    filename?: string;
    hideToolbar?: boolean;
    backUrl?: string;

    children: React.ReactNode;
    className?: string;
};

export function ReportLayout({
    title,
    subtitle,
    filters = [],
    summary = [],
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
        filename: filename || title.replace(/\s+/g, '-').toLowerCase(),
        landscape: size === 'a4-landscape',
    });

    const setting = (key: string) => getCompanySetting(key, pageProps);
    const logo = pageProps?.companyAllSetting?.logo_dark || pageProps?.companyAllSetting?.logo_light;

    return (
        <div className="doc-desk">
            {!hideToolbar && (
                <div
                    className={cn(
                        'doc-toolbar mx-auto mb-4 flex flex-wrap items-center justify-end gap-2',
                        size === 'a4-landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]',
                    )}
                >
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
                    'doc-sheet doc-theme-minimal',
                    size === 'a4-landscape' && 'doc-sheet--landscape',
                    className,
                )}
            >
                {/* --------------------------------------------------- header */}
                <header className="doc-letterhead doc-no-break">
                    <div className="min-w-0">
                        {logo && (
                            <img src={getImagePath(logo)} alt="" className="doc-letterhead__logo mb-2" />
                        )}
                        <p className="text-[12pt] font-bold leading-tight">
                            {setting('company_name') || t('Your Company')}
                        </p>
                        {setting('registration_number') && (
                            <p className="mt-0.5 text-[8.5pt] text-[#5d6772]">
                                {t('Reg. No.')}: {setting('registration_number')}
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 text-end">
                        <h1 className="doc-title">{t(title)}</h1>
                        {subtitle && (
                            <p className="mt-1 text-[9.5pt] text-[#5d6772]">{t(subtitle)}</p>
                        )}

                        {/*
                          The filters the report was run with. This is the part
                          that makes a printed report auditable — a trial
                          balance with no visible date range cannot be checked
                          by anyone who was not at the screen when it was run.
                        */}
                        {filters.length > 0 && (
                            <dl className="mt-3 space-y-[2px] text-[9pt]">
                                {filters.map((filter) => (
                                    <div key={filter.label} className="flex justify-end gap-3">
                                        <dt className="text-[#5d6772]">{t(filter.label)}:</dt>
                                        <dd className="font-medium">{filter.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                </header>

                {/* -------------------------------------------------- summary */}
                {summary.length > 0 && (
                    <section className="doc-summary-band mb-6 flex flex-wrap gap-x-10 gap-y-3 border-y border-[#e2e4e6] py-3">
                        {summary.map((item) => (
                            <div key={item.label}>
                                <div className="doc-label mb-0.5">{t(item.label)}</div>
                                <div
                                    className={cn(
                                        'tabular-nums',
                                        item.emphasis ? 'text-[13pt] font-bold' : 'text-[11pt] font-semibold',
                                        item.warn && 'text-[#ef1e1e]',
                                    )}
                                >
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* ----------------------------------------------------- body */}
                <section>{children}</section>

                {/* --------------------------------------------------- footer */}
                <footer className="doc-footer flex items-end justify-between gap-6">
                    <div>
                        <p>{setting('company_name')}</p>
                        <p>
                            {t('Generated')}: {formatDate(new Date(), pageProps)}
                        </p>
                    </div>
                    <p className="text-end">{t('This is a computer-generated report.')}</p>
                </footer>
            </article>
        </div>
    );
}
