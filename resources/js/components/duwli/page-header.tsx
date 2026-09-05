// resources/js/components/duwli/page-header.tsx
import * as React from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * DUWLI PAGE HEADER
 * ----------------------------------------------------------------------------
 * The header block at the top of every screen.
 *
 * IMPORTANT — HOW THIS IS WIRED
 * This component is rendered by `AuthenticatedLayout`, not by pages. 295 screens
 * already pass `pageTitle` / `pageDescription` / `pageActions` / `backUrl` to
 * the layout, and the layout used to render those with inline markup. That
 * inline block has been replaced by this component, so every one of those
 * screens picks up the improved header WITHOUT ANY PAGE BEING EDITED.
 *
 * Screens opt into the extras by passing the new layout props:
 *
 *   <AuthenticatedLayout
 *       pageTitle="Customers"
 *       pageIcon={Users}                      // NEW — tinted icon square
 *       pageCount={customers.total}           // NEW — record count chip
 *       onExportExcel={() => ...}             // NEW — folds into Export menu
 *       onExportPdf={() => ...}               // NEW
 *       onPrint={() => window.print()}        // NEW
 *       pageActions={<>...</>}                // unchanged
 *   >
 *
 * Every new prop is optional, so nothing breaks for the 295 screens that pass
 * none of them.
 *
 * BREADCRUMBS are deliberately NOT rendered here by default. The layout already
 * shows them in the top bar beside the sidebar trigger; rendering them again
 * would double them up. The `breadcrumbs` prop exists only for standalone use
 * of this component outside the layout (e.g. the style guide).
 *
 * Layout decisions:
 *   - Export is a dropdown, never two loose buttons. Excel and PDF are the same
 *     intent with different output.
 *   - The record count sits with the title, not in the toolbar. It describes
 *     the page; it is not an action.
 *   - `actions` renders last so the page's primary button stays right-most in
 *     LTR and left-most in RTL — the only position users reliably learn.
 *   - The toolbar wraps rather than shrinking. Shrinking was the cause of the
 *     horizontal scrollbar on action-heavy pages.
 */

export type Breadcrumb = {
    label: string;
    href?: string;
};

export type ExportOption = {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
};

type Props = {
    /** Page title. Already translated by the caller in layout usage. */
    title: string;
    /** One short line under the title. */
    description?: React.ReactNode;
    /** Icon shown in a tinted square left of the title. */
    icon?: React.ComponentType<{ className?: string }>;
    /** Record count chip beside the title. */
    count?: number;

    /** Export menu entries. */
    exports?: ExportOption[];
    /** Convenience: adds an Excel entry to the Export menu. */
    onExportExcel?: () => void;
    /** Convenience: adds a PDF entry to the Export menu. */
    onExportPdf?: () => void;
    /** Shows a Print button beside Export. */
    onPrint?: () => void;

    /** Shows a Back button before the other actions. */
    backUrl?: string;
    /** The page's own buttons. Rendered last. */
    actions?: React.ReactNode;

    /** Only for standalone use outside the layout — the layout renders its own. */
    breadcrumbs?: Breadcrumb[];

    /** 'rtl' | 'ltr'. Passed by the layout from brand settings. */
    dir?: string;
    className?: string;
};

export function PageHeader({
    title,
    description,
    icon: Icon,
    count,
    exports = [],
    onExportExcel,
    onExportPdf,
    onPrint,
    backUrl,
    actions,
    breadcrumbs,
    dir = 'ltr',
    className,
}: Props) {
    const { t } = useTranslation();
    const isRtl = dir === 'rtl';

    const exportItems: ExportOption[] = [
        ...(onExportExcel
            ? [{ label: 'Download as Excel', onClick: onExportExcel, icon: FileSpreadsheet }]
            : []),
        ...(onExportPdf
            ? [{ label: 'Download as PDF', onClick: onExportPdf, icon: FileText }]
            : []),
        ...exports,
    ];

    const hasToolbar =
        Boolean(backUrl) || exportItems.length > 0 || Boolean(onPrint) || Boolean(actions);

    return (
        <div className={cn('mb-4', className)} dir={dir}>
            {/* Only used standalone — the layout renders breadcrumbs in the top bar. */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav
                    aria-label={t('Breadcrumb')}
                    className="mb-2 flex items-center gap-1 text-xs text-muted-foreground"
                >
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={`${crumb.label}-${i}`}>
                            {i > 0 && (
                                <ChevronRight
                                    className={cn('h-3 w-3 shrink-0', isRtl && 'rotate-180')}
                                    aria-hidden="true"
                                />
                            )}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="transition-colors hover:text-primary"
                                >
                                    {t(crumb.label)}
                                </Link>
                            ) : (
                                <span>{t(crumb.label)}</span>
                            )}
                        </React.Fragment>
                    ))}
                    <ChevronRight
                        className={cn('h-3 w-3 shrink-0', isRtl && 'rotate-180')}
                        aria-hidden="true"
                    />
                    <span className="font-medium text-foreground">{title}</span>
                </nav>
            )}

            <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Title block */}
                <div className="flex min-w-0 items-center gap-3">
                    {Icon && (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                        </span>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-xl font-semibold leading-tight text-foreground">
                                {title}
                            </h1>
                            {typeof count === 'number' && (
                                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                    {count.toLocaleString()}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>

                {/* Toolbar — wraps rather than shrinking. */}
                {hasToolbar && (
                    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                        {backUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5"
                                onClick={() => router.visit(backUrl)}
                            >
                                <ArrowLeft className={cn('h-4 w-4', isRtl && 'rotate-180')} />
                                {t('Back')}
                            </Button>
                        )}

                        {exportItems.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-1.5 text-[13px] font-semibold"
                                    >
                                        <Download className="h-4 w-4" />
                                        {t('Export')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align={isRtl ? 'start' : 'end'}
                                    className="w-52"
                                >
                                    {exportItems.map((item) => {
                                        const ItemIcon = item.icon;
                                        return (
                                            <DropdownMenuItem
                                                key={item.label}
                                                onClick={item.onClick}
                                                className="cursor-pointer gap-2"
                                            >
                                                {ItemIcon && <ItemIcon className="h-4 w-4" />}
                                                {t(item.label)}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {onPrint && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPrint}
                                className="h-9 gap-1.5 text-[13px] font-semibold"
                            >
                                <Printer className="h-4 w-4" />
                                {t('Print')}
                            </Button>
                        )}

                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
