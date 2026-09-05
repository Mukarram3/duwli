// resources/js/components/duwli/document/use-document-print.ts
import { useCallback, useEffect, useState } from 'react';

/**
 * DOCUMENT PRINT / PDF HOOK
 * ----------------------------------------------------------------------------
 * One place that knows how to get a document onto paper or into a PDF.
 *
 * WHY window.print() IS THE DEFAULT
 * The existing print screens generate PDFs with html2pdf.js at html2canvas
 * scale 2. That rasterises the page: the resulting PDF is a PHOTOGRAPH of the
 * invoice, not a document. It means
 *
 *   - text cannot be selected, searched or copied,
 *   - the customer's accounts-payable system cannot extract anything from it,
 *   - files run to several megabytes for a one-page invoice,
 *   - it prints blurry, especially when the recipient scales or re-prints it,
 *   - and — the reason it matters most here — html2canvas has NO CONCEPT OF A
 *     PAGE, so it physically cannot repeat table headers across pages or honour
 *     any of the page-break rules in print.css. A long invoice comes out with
 *     rows sliced through the middle.
 *
 * The browser's own print-to-PDF produces real vector text, embeds fonts, keeps
 * files small, and applies every rule in print.css including the repeating
 * headers. For a business document that is not a preference, it is the
 * difference between a document and a picture of one.
 *
 * html2pdf is kept behind `downloadRasterPdf` for the one case it genuinely
 * serves: an unattended download where no print dialog may appear (a bulk
 * export, or an automated email attachment). It is never the default path.
 *
 * AUTO-TRIGGER
 * The existing screens open with `?download=pdf` to fire a download on load.
 * That is preserved, and `?print=1` is added to open the print dialog directly
 * — which is what "Print" in a row action should do.
 */

type Options = {
    /** Filename without extension, e.g. `invoice-INV-000124`. */
    filename: string;
    /** Selector for the printable region. Defaults to the document sheet. */
    selector?: string;
    /** Close the tab once the job is handed off. Default true when auto-triggered. */
    closeAfter?: boolean;
    /** Landscape output. Only affects the raster fallback; print.css owns the rest. */
    landscape?: boolean;
};

export function useDocumentPrint({
    filename,
    selector = '.doc-sheet',
    closeAfter,
    landscape = false,
}: Options) {
    const [isGenerating, setIsGenerating] = useState(false);

    /**
     * Preferred path. Opens the browser print dialog, from which the user can
     * print or "Save as PDF" — both produce real vector output.
     */
    const print = useCallback(() => {
        // Give the browser a frame to settle layout (fonts, images) before the
        // dialog snapshots the page, or the first print of a session can come
        // out with a fallback font.
        requestAnimationFrame(() => {
            setTimeout(() => window.print(), 60);
        });
    }, []);

    /**
     * Fallback path — rasterised PDF via html2pdf. Loaded on demand so the
     * ~800KB html2pdf bundle is not pulled into every page that merely offers
     * a Print button.
     *
     * Use only where no dialog may appear. Everything in the header comment
     * about quality applies.
     */
    const downloadRasterPdf = useCallback(async () => {
        setIsGenerating(true);
        try {
            const target = document.querySelector(selector) as HTMLElement | null;
            if (!target) {
                console.error(`[useDocumentPrint] No element matched "${selector}"`);
                return;
            }

            const { default: html2pdf } = await import('html2pdf.js');

            await html2pdf()
                .set({
                    margin: [10, 8, 12, 8],
                    filename: `${filename}.pdf`,
                    image: { type: 'jpeg' as const, quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: {
                        unit: 'mm' as const,
                        format: 'a4',
                        orientation: (landscape ? 'landscape' : 'portrait') as 'landscape' | 'portrait',
                    },
                    // Respect the same class print.css uses, so rows and totals
                    // are not sliced. This is the best html2pdf can manage —
                    // it still cannot repeat table headers.
                    pagebreak: { mode: ['css', 'legacy'], avoid: '.doc-no-break, .doc-table tbody tr' },
                })
                .from(target)
                .save();
        } catch (error) {
            console.error('[useDocumentPrint] PDF generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [filename, selector, landscape]);

    /**
     * Honour the URL flags the existing screens rely on:
     *   ?print=1        → open the print dialog
     *   ?download=pdf   → rasterised download (legacy links already in the wild)
     */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shouldClose = closeAfter ?? true;

        if (params.get('print') === '1') {
            print();
            if (shouldClose) {
                // afterprint fires whether the user prints or cancels.
                const done = () => setTimeout(() => window.close(), 300);
                window.addEventListener('afterprint', done, { once: true });
                return () => window.removeEventListener('afterprint', done);
            }
        } else if (params.get('download') === 'pdf') {
            downloadRasterPdf().then(() => {
                if (shouldClose) setTimeout(() => window.close(), 800);
            });
        }
        // Intentionally runs once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { print, downloadRasterPdf, isGenerating };
}
