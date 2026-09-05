// resources/js/components/duwli/index.ts
//
// DUWLI DESIGN SYSTEM — Phase 1 primitives
// -----------------------------------------------------------------------------
// Import everything from here rather than reaching into individual files, so
// the internal file layout can change without touching 191 screens:
//
//     import { PageHeader, KpiStrip, StatusBadge, MoneyCell } from '@/components/duwli';
//
// These sit alongside the existing shadcn primitives in components/ui — they
// do not replace them. components/ui holds generic building blocks (Button,
// Input, Dialog); components/duwli holds the ERP-specific compositions that
// every business screen is assembled from.

export { PageHeader } from './page-header';
export type { Breadcrumb, ExportOption } from './page-header';

export { KpiStrip } from './kpi-strip';
export type { Kpi, KpiTone } from './kpi-strip';

export {
    StatusBadge,
    statusTone,
    statusLabel,
    normalizeStatus,
    registerStatuses,
} from './status-badge';
export type { StatusTone } from './status-badge';

export { FilterBar } from './filter-bar';
export type { ActiveFilter } from './filter-bar';

export { SectionCard } from './section-card';

export { EmptyState } from './empty-state';
export type { EmptyVariant } from './empty-state';

export {
    MoneyCell,
    DateCell,
    EntityCell,
    ReferenceCell,
    NumberCell,
    TextCell,
    PercentCell,
} from './cells';

// --- Phase 3: printed documents and reports -------------------------------
// Re-exported for convenience. Importing from '@/components/duwli/document'
// directly is equally valid and keeps the document code visibly separate.
export {
    DocumentLayout,
    DocumentTable,
    ReportLayout,
    useDocumentPrint,
} from './document';
export type {
    DocumentTheme,
    DocumentSize,
    DocumentStamp,
    DocumentColumn,
    Party,
    PartyAddress,
    MetaField,
    ReportFilter,
    ReportSummaryItem,
} from './document';
