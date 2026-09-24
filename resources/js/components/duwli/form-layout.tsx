// resources/js/components/duwli/form-layout.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * COMPACT DATA-ENTRY LAYOUT
 * =============================================================================
 * Label BESIDE the field, not above it, in a two-column grid with a tinted
 * section header.
 *
 * WHY THIS IS A COMPONENT RATHER THAN CLASSES ON EACH FORM
 * The same layout is wanted on Sales Invoices, Purchase Invoices and every
 * other data-entry screen. Done with ad-hoc classes, "compact" drifts: one
 * screen ends up with a 120px label column and the next with 140px, and
 * nobody notices until they sit side by side. Here the measurements live in
 * one file and every form inherits the same ones.
 *
 * WHY LABEL-BESIDE SAVES SO MUCH HEIGHT
 * A stacked label costs its own line plus the gap beneath it — roughly 26px
 * per field. Across eleven fields that is close to 300px, which is why the old
 * form ran past the fold with only a third of the screen carrying information.
 *
 * RTL: the label column and the field swap automatically. The grid is
 * direction-agnostic and the label uses `text-start`, never `text-left`, so
 * Arabic reads correctly without a second stylesheet.
 */

type SectionProps = {
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
    children: React.ReactNode;
};

export function FormSection({ title, icon: Icon, className, children }: SectionProps) {
    return (
        <div className={cn('overflow-hidden', className)}>
            {/*
              Tinted header bar. It is a band rather than plain text so the eye
              can find the boundaries of a section at a glance on a form this
              dense — without it, compact fields run together into one block.
            */}
            <div className="flex items-center gap-2 border-y bg-primary/5 px-4 py-2">
                {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
                <h3 className="text-sm font-semibold text-primary">{title}</h3>
            </div>

            {/*
              Two columns on desktop, one on narrow screens — a label-beside
              layout in a 380px column would leave the field about 180px wide,
              which is worse than stacking.
            */}
            <div className="grid gap-x-6 gap-y-2 px-4 py-3 lg:grid-cols-2">
                {children}
            </div>
        </div>
    );
}

type RowProps = {
    label: string;
    htmlFor?: string;
    required?: boolean;
    /** Spans both columns — for a field that needs the full width. */
    wide?: boolean;
    /** Help text or an error, shown under the field rather than the label. */
    hint?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
};

export function FormRow({ label, htmlFor, required, wide, hint, className, children }: RowProps) {
    return (
        <div className={cn('flex items-start gap-3', wide && 'lg:col-span-2', className)}>
            <label
                htmlFor={htmlFor}
                className={cn(
                    // Fixed width so every field on the screen starts at the
                    // same x position. Ragged label columns are the main reason
                    // a dense form looks untidy.
                    'w-[120px] shrink-0 pt-2 text-start text-[13px] font-medium leading-tight',
                    'text-muted-foreground',
                )}
            >
                {label}
                {required && <span className="ms-0.5 text-destructive">*</span>}
            </label>

            {/*
              min-w-0 matters: without it a select or a long value refuses to
              shrink and pushes the row wider than its column.
            */}
            <div className="min-w-0 flex-1">
                {children}
                {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
            </div>
        </div>
    );
}

/**
 * Field heights for compact forms, applied by the parent so individual inputs
 * do not each have to remember them.
 *
 * `[&_[role=combobox]]` catches Radix select triggers, which render as buttons
 * rather than inputs. Nested-bracket variants like `[&_button[role=combobox]]`
 * look valid but do not compile — that mistake silently leaves every dropdown
 * at full height while the inputs shrink.
 */
export const COMPACT_FIELDS =
    '[&_input]:h-8 [&_textarea]:min-h-[60px] [&_[role=combobox]]:h-8 ' +
    '[&_input]:text-[13px] [&_[role=combobox]]:text-[13px]';
