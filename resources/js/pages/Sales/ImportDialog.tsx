// resources/js/pages/Sales/ImportDialog.tsx
import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { usePage } from '@inertiajs/react';

/**
 * SALES INVOICE IMPORT
 * ----------------------------------------------------------------------------
 * Two-step: upload and validate, then confirm.
 *
 * WHY THE PREVIEW STEP EXISTS
 * The existing shared ImportDialog uploads and imports in one action. That is
 * fine for customers — a bad customer row is easy to spot and delete. It is not
 * fine for invoices: an invoice writes to the ledger, and a batch imported
 * wrongly has to be reversed through credit notes rather than deleted.
 *
 * So nothing is written until the user has seen the invoice count, the line
 * count and the total value the file will create, and every error found.
 *
 * THREE THINGS THE USER IS SHOWN BEFORE COMMITTING
 *   - Errors, by row number. The import is blocked while any exist.
 *   - Duplicates: invoice numbers already in the system. These are SKIPPED,
 *     not treated as errors, so a re-uploaded file tops up the missing rows
 *     rather than failing wholesale or creating doubles.
 *   - The totals that will be created, so the figure can be checked against
 *     whatever the file was reconciled to before it got here.
 *
 * Everything imports as DRAFT and raises no journal entries. Posting is done
 * afterwards through the normal workflow, so nothing reaches the ledger
 * without a person putting it there.
 */

type PreviewInvoice = {
    invoice_number: string;
    customer_name: string;
    invoice_date: string | null;
    line_count: number;
    total_amount: number;
};

type PreviewResult = {
    token: string;
    summary: {
        invoice_count: number;
        line_count: number;
        total_value: number;
        error_count: number;
        skipped_count: number;
    };
    errors: string[];
    duplicates: string[];
    invoices: PreviewInvoice[];
    truncated: boolean;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function ImportDialog({ open, onOpenChange }: Props) {
    const { t } = useTranslation();
    const pageProps = usePage().props as any;
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [checking, setChecking] = useState(false);
    const [importing, setImporting] = useState(false);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [failure, setFailure] = useState<string | null>(null);

    const money = (value: any) => formatCurrency(Number(value ?? 0), pageProps);

    const reset = () => {
        setFile(null);
        setPreview(null);
        setFailure(null);
        setChecking(false);
        setImporting(false);
        if (inputRef.current) inputRef.current.value = '';
    };

    const close = () => {
        reset();
        onOpenChange(false);
    };

    const validate = async (selected: File) => {
        setChecking(true);
        setFailure(null);
        setPreview(null);

        try {
            const form = new FormData();
            form.append('file', selected);

            const { data } = await axios.post(
                route('sales-invoices.import.preview'),
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setPreview(data);
        } catch (error: any) {
            setFailure(
                error?.response?.data?.message ||
                    t('The file could not be read. Check it is a valid .xlsx or .csv file.')
            );
        } finally {
            setChecking(false);
        }
    };

    const onPick = (selected: File | null) => {
        if (!selected) return;
        setFile(selected);
        validate(selected);
    };

    const confirm = () => {
        if (!preview) return;
        setImporting(true);
        router.post(
            route('sales-invoices.import.confirm'),
            { token: preview.token },
            {
                onFinish: () => {
                    setImporting(false);
                    close();
                },
            }
        );
    };

    const blocked = Boolean(preview && preview.errors.length > 0);
    const nothingToImport = Boolean(preview && preview.summary.invoice_count === 0);

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('Import Invoices')}</DialogTitle>
                    <DialogDescription>
                        {t('One row per line item. Rows sharing an invoice number belong to the same invoice.')}
                    </DialogDescription>
                </DialogHeader>

                {/* ------------------------------------------------ upload */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                        <div className="min-w-0 text-sm">
                            <p className="font-medium">{t('Need the format?')}</p>
                            <p className="text-muted-foreground">
                                {t('Download the template with worked examples.')}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
                            <a href={route('sales-invoices.import.template')}>
                                <Download className="h-4 w-4" />
                                {t('Template')}
                            </a>
                        </Button>
                    </div>

                    <div
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/40"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            onPick(e.dataTransfer.files?.[0] ?? null);
                        }}
                    >
                        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            {file ? file.name : t('Choose a file or drag it here')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('.xlsx, .xls or .csv — up to 10 MB')}
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    {checking && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('Checking the file...')}
                        </div>
                    )}

                    {failure && (
                        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{failure}</span>
                        </div>
                    )}

                    {/* --------------------------------------------- preview */}
                    {preview && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">{t('Invoices')}</p>
                                    <p className="text-lg font-semibold tabular-nums">
                                        {preview.summary.invoice_count}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">{t('Line items')}</p>
                                    <p className="text-lg font-semibold tabular-nums">
                                        {preview.summary.line_count}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">{t('Total value')}</p>
                                    <p className="text-lg font-semibold tabular-nums">
                                        {money(preview.summary.total_value)}
                                    </p>
                                </div>
                            </div>

                            {/* Errors block the import entirely. */}
                            {preview.errors.length > 0 && (
                                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                                    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        {t('Errors found')} ({preview.errors.length})
                                    </p>
                                    <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-destructive">
                                        {preview.errors.map((error, i) => (
                                            <li key={i}>• {error}</li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {t('Nothing will be imported until these are fixed.')}
                                    </p>
                                </div>
                            )}

                            {/* Duplicates are skipped, not fatal. */}
                            {preview.duplicates.length > 0 && (
                                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                                    <p className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                                        {t('Already in the system — will be skipped')} ({preview.duplicates.length})
                                    </p>
                                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-amber-700 dark:text-amber-400">
                                        {preview.duplicates.map((line, i) => (
                                            <li key={i}>• {line}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {preview.invoices.length > 0 && (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-3 py-2 text-start font-medium">{t('Invoice')}</th>
                                                <th className="px-3 py-2 text-start font-medium">{t('Customer')}</th>
                                                <th className="px-3 py-2 text-start font-medium">{t('Date')}</th>
                                                <th className="px-3 py-2 text-end font-medium">{t('Lines')}</th>
                                                <th className="px-3 py-2 text-end font-medium">{t('Total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.invoices.map((invoice) => (
                                                <tr key={invoice.invoice_number} className="border-t">
                                                    <td className="px-3 py-1.5 tabular-nums">{invoice.invoice_number}</td>
                                                    <td className="px-3 py-1.5">{invoice.customer_name}</td>
                                                    <td className="px-3 py-1.5 tabular-nums">{invoice.invoice_date || '—'}</td>
                                                    <td className="px-3 py-1.5 text-end tabular-nums">{invoice.line_count}</td>
                                                    <td className="px-3 py-1.5 text-end tabular-nums">{money(invoice.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {preview.truncated && (
                                        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                                            {t('Showing the first 50. All valid invoices will be imported.')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {!blocked && !nothingToImport && (
                                <div className="flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span className="text-emerald-800 dark:text-emerald-400">
                                        {t('These will be created as drafts. No accounting entries are made until each invoice is posted.')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={close} disabled={importing}>
                        <X className="mr-1.5 h-4 w-4" />
                        {t('Cancel')}
                    </Button>
                    <Button
                        onClick={confirm}
                        disabled={!preview || blocked || nothingToImport || importing || checking}
                    >
                        {importing ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                        )}
                        {preview && !blocked && !nothingToImport
                            ? `${t('Import')} ${preview.summary.invoice_count} ${t('invoices')}`
                            : t('Import')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
