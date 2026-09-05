// resources/js/components/duwli/document/document-table.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * DOCUMENT LINE-ITEM TABLE
 * ----------------------------------------------------------------------------
 * The table used inside a printed document.
 *
 * The reason this is a component rather than a plain <table> in each screen:
 * the `.doc-table` class carries the `display: table-header-group` rule that
 * makes the column headings REPEAT on every page of a multi-page document.
 * Miss that class and a 40-line invoice prints page 2 as unlabelled numbers.
 * Wrapping it in a component means nobody has to remember.
 *
 * It also fixes two things the hand-rolled tables got wrong:
 *
 *   - Numeric columns are right-aligned and tabular-nums, so decimal points
 *     line up down the column. In an accounting document that is how a reader
 *     spots a misplaced digit.
 *   - A row index column is available. When a customer queries "line 7", both
 *     sides need to be looking at the same line 7.
 *
 * USAGE
 *   <DocumentTable
 *       columns={[
 *           { key: 'item', header: 'Item' },
 *           { key: 'qty',  header: 'Qty',   align: 'end', width: '18mm' },
 *           { key: 'rate', header: 'Rate',  align: 'end', width: '26mm' },
 *           { key: 'total',header: 'Total', align: 'end', width: '30mm' },
 *       ]}
 *       rows={invoice.items}
 *       numbered
 *       render={(item, col) => ...}
 *   />
 */

export type DocumentColumn = {
    key: string;
    /** Column heading. Untranslated. */
    header: string;
    /** 'start' (default) or 'end'. Numeric columns should be 'end'. */
    align?: 'start' | 'end' | 'center';
    /** Fixed width, e.g. '26mm'. Leave off for the description column. */
    width?: string;
};

type Props<T> = {
    columns: DocumentColumn[];
    rows: T[];
    /** Renders one cell. Return a ReactNode. */
    render: (row: T, column: DocumentColumn, index: number) => React.ReactNode;
    /** Adds a leading "#" column with the line number. */
    numbered?: boolean;
    /** Shown when there are no rows. */
    emptyText?: string;
    /** Optional footer row, e.g. a carried-forward subtotal. */
    footer?: React.ReactNode;
    className?: string;
};

export function DocumentTable<T>({
    columns,
    rows,
    render,
    numbered = false,
    emptyText = 'No items on this document.',
    footer,
    className,
}: Props<T>) {
    const { t } = useTranslation();

    const alignClass = (align?: DocumentColumn['align']) =>
        align === 'end' ? 'doc-num' : align === 'center' ? 'text-center' : 'text-start';

    return (
        <table className={cn('doc-table', className)}>
            {/*
              thead is what repeats across pages — see print.css. It must stay a
              real <thead>; a styled <div> row would print once and vanish.
            */}
            <thead>
                <tr>
                    {numbered && <th style={{ width: '8mm' }}>#</th>}
                    {columns.map((column) => (
                        <th
                            key={column.key}
                            className={alignClass(column.align)}
                            style={column.width ? { width: column.width } : undefined}
                        >
                            {t(column.header)}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td
                            colSpan={columns.length + (numbered ? 1 : 0)}
                            className="py-6 text-center text-[9.5pt] text-[#5d6772]"
                        >
                            {t(emptyText)}
                        </td>
                    </tr>
                ) : (
                    rows.map((row, index) => (
                        <tr key={index}>
                            {numbered && (
                                <td className="text-[#5d6772] tabular-nums">{index + 1}</td>
                            )}
                            {columns.map((column) => (
                                <td key={column.key} className={alignClass(column.align)}>
                                    {render(row, column, index)}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>

            {footer && <tfoot>{footer}</tfoot>}
        </table>
    );
}
