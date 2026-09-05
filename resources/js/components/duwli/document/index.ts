// resources/js/components/duwli/document/index.ts
//
// DUWLI DOCUMENT SYSTEM — Phase 3
// -----------------------------------------------------------------------------
// The printed side of the product: invoices, quotations, delivery challans,
// credit/debit notes, receipts, statements and financial reports.
//
//     import { DocumentLayout, DocumentTable } from '@/components/duwli/document';
//
// Requires `resources/css/print.css` to be imported from app.css. Without it the
// documents render but lose their page geometry AND their repeating table
// headers, which is the whole point.

export { DocumentLayout } from './document-layout';
export type {
    DocumentTheme,
    DocumentSize,
    DocumentStamp,
    Party,
    PartyAddress,
    MetaField,
} from './document-layout';

export { DocumentTable } from './document-table';
export type { DocumentColumn } from './document-table';

export { ReportLayout } from './report-layout';
export type { ReportFilter, ReportSummaryItem } from './report-layout';

export { useDocumentPrint } from './use-document-print';
