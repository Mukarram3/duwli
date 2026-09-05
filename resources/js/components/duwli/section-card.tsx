// resources/js/components/duwli/section-card.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DUWLI SECTION CARD
 * ----------------------------------------------------------------------------
 * The card shell used to group fields on forms and blocks on detail screens.
 *
 * Audit finding this replaces: forms across the system use raw <Card> with
 * inconsistent padding, heading sizes and divider treatment. Long forms —
 * invoice create, employee create, chart of account — become one undifferentiated
 * wall of inputs, and users cannot tell where "Customer details" stops and
 * "Line items" starts.
 *
 * This gives every grouped block the same anatomy:
 *
 *   ┌───────────────────────────────────────────────┐
 *   │ ▸ Title                          [action]     │  ← header, optional divider
 *   │   Description                                  │
 *   ├───────────────────────────────────────────────┤
 *   │  content                                       │
 *   ├───────────────────────────────────────────────┤
 *   │  footer                                        │  ← optional, muted surface
 *   └───────────────────────────────────────────────┘
 *
 * `collapsible` matters for the long accounting forms: optional sections
 * (shipping address, custom fields, notes and terms) collapse by default so the
 * required path down the form stays short.
 */

type Props = {
    /** Section heading. Untranslated; translated here. */
    title?: string;
    /** One line of guidance under the title. */
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;

    /** Right-aligned control in the header, e.g. an "Add line" button. */
    action?: React.ReactNode;
    /** Content below the body on a muted surface, e.g. totals or form buttons. */
    footer?: React.ReactNode;

    /** Allows the body to collapse. */
    collapsible?: boolean;
    /** Starting state when collapsible. Default open. */
    defaultOpen?: boolean;

    /** Removes body padding — use when the body is a full-bleed table. */
    flush?: boolean;

    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
};

export function SectionCard({
    title,
    description,
    icon: Icon,
    action,
    footer,
    collapsible = false,
    defaultOpen = true,
    flush = false,
    children,
    className,
    bodyClassName,
}: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(defaultOpen);

    const hasHeader = Boolean(title || description || action);
    const showBody = !collapsible || open;

    return (
        <section
            className={cn(
                'rounded-lg border bg-card text-card-foreground',
                'shadow-[0_1px_2px_0_rgb(5_19_33/0.04)]',
                className,
            )}
        >
            {hasHeader && (
                <header
                    className={cn(
                        'flex items-start justify-between gap-3 px-5 py-4',
                        showBody && 'border-b',
                    )}
                >
                    <div className="flex min-w-0 items-start gap-3">
                        {collapsible && (
                            <button
                                type="button"
                                onClick={() => setOpen((v) => !v)}
                                aria-expanded={open}
                                aria-label={open ? t('Collapse') : t('Expand')}
                                className="mt-0.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 transition-transform',
                                        !open && '-rotate-90 rtl:rotate-90',
                                    )}
                                />
                            </button>
                        )}

                        {Icon && !collapsible && (
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                            </span>
                        )}

                        <div className="min-w-0">
                            {title && (
                                <h2 className="truncate text-[15px] font-semibold leading-tight">
                                    {t(title)}
                                </h2>
                            )}
                            {description && (
                                <p className="mt-0.5 text-[13px] text-muted-foreground">
                                    {t(description)}
                                </p>
                            )}
                        </div>
                    </div>

                    {action && <div className="shrink-0">{action}</div>}
                </header>
            )}

            {showBody && (
                <div className={cn(flush ? 'p-0' : 'p-5', bodyClassName)}>{children}</div>
            )}

            {footer && showBody && (
                <footer className="rounded-b-lg border-t bg-muted/40 px-5 py-3.5">
                    {footer}
                </footer>
            )}
        </section>
    );
}
