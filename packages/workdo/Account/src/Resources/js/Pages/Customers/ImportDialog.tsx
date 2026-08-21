// packages/workdo/Account/src/Resources/js/Pages/Customers/ImportDialog.tsx
import { useState, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, AlertCircle, X } from 'lucide-react';

/**
 * Customer Excel import.
 *
 * The import is all-or-nothing on the server: if any row fails validation
 * nothing is written, and the offending rows come back here by number so the
 * user can correct the file and retry. That avoids half-loaded customer lists,
 * which are far more work to clean up than a rejected file.
 */

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function ImportDialog({ open, onOpenChange }: Props) {
    const { t } = useTranslation();
    const { props } = usePage<any>();
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const importErrors: string[] = props.importErrors || [];
    const allErrors = errors.length > 0 ? errors : importErrors;

    const pick = (selected: File | null) => {
        setErrors([]);
        setFile(selected);
    };

    const submit = () => {
        if (!file) {
            setErrors([t('Choose a file first.')]);
            return;
        }

        const payload = new FormData();
        payload.append('file', file);

        setUploading(true);
        router.post(route('account.customers.import'), payload, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setUploading(false),
            onSuccess: () => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
                onOpenChange(false);
            },
        });
    };

    const close = () => {
        setFile(null);
        setErrors([]);
        if (inputRef.current) inputRef.current.value = '';
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('Import Customers')}</DialogTitle>
                    <DialogDescription>
                        {t('Upload an Excel file to add customers in bulk. Download the template to see the expected columns.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Template download */}
                    <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            <span>{t('Not sure about the format?')}</span>
                        </div>
                        <a href={route('account.customers.import.template')} download>
                            <Button variant="outline" size="sm" type="button">
                                <Download className="mr-1.5 h-4 w-4" />
                                {t('Download Template')}
                            </Button>
                        </a>
                    </div>

                    {/* File picker */}
                    <div>
                        <label
                            htmlFor="customer-import-file"
                            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                        >
                            <Upload className="h-7 w-7 text-muted-foreground" />
                            {file ? (
                                <span className="text-sm font-medium">{file.name}</span>
                            ) : (
                                <>
                                    <span className="text-sm font-medium">{t('Choose a file')}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {t('.xlsx, .xls or .csv — up to 5 MB')}
                                    </span>
                                </>
                            )}
                        </label>
                        <input
                            ref={inputRef}
                            id="customer-import-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => pick(e.target.files?.[0] || null)}
                        />
                    </div>

                    {/* Row-level errors returned by the server */}
                    {allErrors.length > 0 && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                {t('Nothing was imported. Fix these and try again:')}
                            </div>
                            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-destructive">
                                {allErrors.map((message, i) => (
                                    <li key={i}>• {message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" type="button" onClick={close} disabled={uploading}>
                        <X className="mr-1.5 h-4 w-4" />
                        {t('Cancel')}
                    </Button>
                    <Button type="button" onClick={submit} disabled={!file || uploading}>
                        <Upload className="mr-1.5 h-4 w-4" />
                        {uploading ? t('Importing...') : t('Import')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
