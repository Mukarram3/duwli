// resources/js/pages/style-guide.tsx
import { useState, type ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import {
    Building2,
    Coins,
    CreditCard,
    Download,
    Eye,
    FileText,
    Pencil,
    Plus,
    Receipt,
    Trash2,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import {
    PageHeader,
    KpiStrip,
    StatusBadge,
    FilterBar,
    SectionCard,
    EmptyState,
    MoneyCell,
    DateCell,
    EntityCell,
    ReferenceCell,
    NumberCell,
    PercentCell,
    TextCell,
} from '@/components/duwli';
import { RowActions } from '@/components/row-actions';
import { DocumentTable, type DocumentColumn } from '@/components/duwli/document';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * DUWLI ERP — STYLE GUIDE
 * ----------------------------------------------------------------------------
 * A live reference for the design system, rendered from the real components
 * rather than screenshots. Two jobs:
 *
 *   1. Documents Duwli's visual identity so it is reviewable by the client
 *      without reading code.
 *   2. Gives developers one place to see every status colour, cell type and
 *      layout block before building a new screen, so nobody reinvents a
 *      variant that already exists.
 *
 * Route:  /style-guide   (register in routes/web.php — see the snippet in
 *         the Phase 1 handover notes)
 */

const SWATCHES = [
    { name: 'Primary', varName: '--primary', usage: 'Primary actions, links, active nav' },
    { name: 'Foreground', varName: '--foreground', usage: 'Body text, headings' },
    { name: 'Muted', varName: '--muted', usage: 'Table headers, section footers' },
    { name: 'Muted foreground', varName: '--muted-foreground', usage: 'Secondary text, captions' },
    { name: 'Border', varName: '--border', usage: 'Card and table borders' },
    { name: 'Success', varName: '--success', usage: 'Paid, approved, posted' },
    { name: 'Warning', varName: '--warning', usage: 'Pending, partial, low stock' },
    { name: 'Destructive', varName: '--destructive', usage: 'Overdue, cancelled, delete' },
    { name: 'Info', varName: '--info', usage: 'Sent, processing, informational' },
];

const STATUS_GROUPS: { group: string; statuses: string[] }[] = [
    { group: 'Document lifecycle', statuses: ['draft', 'sent', 'viewed', 'submitted', 'processing'] },
    { group: 'Settlement', statuses: ['paid', 'partially_paid', 'unpaid', 'overdue', 'refunded'] },
    { group: 'Approval', statuses: ['pending', 'approved', 'rejected'] },
    { group: 'Accounting', statuses: ['posted', 'unposted', 'reversed', 'reconciled', 'unreconciled'] },
    { group: 'Fulfilment', statuses: ['ordered', 'shipped', 'delivered', 'received', 'returned'] },
    { group: 'Terminal', statuses: ['cancelled', 'void', 'expired', 'failed', 'archived'] },
    { group: 'On / off', statuses: ['active', 'inactive', 'verified', 'unverified'] },
    { group: 'Stock', statuses: ['in_stock', 'low_stock', 'out_of_stock'] },
    { group: 'Priority', statuses: ['low', 'medium', 'high', 'urgent', 'critical'] },
];

const SAMPLE_ROWS = [
    {
        ref: 'INV-000124',
        customer: 'Al Rajhi Trading Co.',
        email: 'accounts@alrajhi-trading.sa',
        date: '2026-08-14',
        due: '2026-09-01',
        qty: 12,
        amount: 48250.5,
        status: 'paid',
    },
    {
        ref: 'INV-000125',
        customer: 'Najd Contracting',
        email: 'finance@najd-contracting.sa',
        date: '2026-08-19',
        due: '2026-09-03',
        qty: 4,
        amount: 12400,
        status: 'partially_paid',
    },
    {
        ref: 'INV-000126',
        customer: 'Gulf Steel Works',
        email: 'ap@gulfsteel.com',
        date: '2026-07-28',
        due: '2026-08-11',
        qty: 31,
        amount: 96780.25,
        status: 'overdue',
    },
    {
        ref: 'INV-000127',
        customer: 'Bayan Logistics',
        email: null,
        date: '2026-09-01',
        due: '2026-09-30',
        qty: 0,
        amount: 0,
        status: 'draft',
    },
    {
        ref: 'CN-000018',
        customer: 'Gulf Steel Works',
        email: 'ap@gulfsteel.com',
        date: '2026-08-30',
        due: null,
        qty: 2,
        amount: -3150,
        status: 'approved',
    },
];

function Block({
    title,
    note,
    children,
}: {
    title: string;
    note: string;
    children: ReactNode;
}) {
    return (
        <SectionCard title={title} description={note} className="mb-5">
            {children}
        </SectionCard>
    );
}

export default function StyleGuide() {
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<{ key: string; label: string; value: string }[]>([
        { key: 'status', label: 'Status', value: 'Overdue' },
        { key: 'period', label: 'Period', value: 'Aug 2026' },
    ]);

    return (
        <AuthenticatedLayout>
            <Head title="Style Guide" />

            <div className="p-4 sm:p-6">
                <PageHeader
                    title="Design System"
                    subtitle="Every shared component, status and cell type in one place."
                    breadcrumbs={[{ label: 'Settings', href: '#' }]}
                    icon={Building2}
                    onExportPdf={() => window.print()}
                    primaryAction={{ label: 'New Record', icon: Plus, onClick: () => {} }}
                    secondaryActions={[{ label: 'Import', icon: Download, onClick: () => {} }]}
                />

                {/* ------------------------------------------------ colour --- */}
                <Block
                    title="Colour"
                    note="Values come from theme-tokens.css. Changing a token here changes every screen at once."
                >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {SWATCHES.map((swatch) => (
                            <div key={swatch.name} className="rounded-lg border p-3">
                                <div
                                    className="mb-2 h-12 w-full rounded-md border"
                                    style={{ background: `hsl(var(${swatch.varName}))` }}
                                />
                                <p className="text-[13px] font-medium">{swatch.name}</p>
                                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                    {swatch.varName}
                                </p>
                                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                                    {swatch.usage}
                                </p>
                            </div>
                        ))}
                    </div>
                </Block>

                {/* -------------------------------------------- typography --- */}
                <Block
                    title="Typography"
                    note="Four sizes carry the whole system. Anything outside this scale is a mistake."
                >
                    <div className="space-y-3">
                        <div className="flex items-baseline gap-4">
                            <span className="w-32 shrink-0 font-mono text-[11px] text-muted-foreground">
                                text-xl / 600
                            </span>
                            <span className="text-xl font-semibold">Page title</span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="w-32 shrink-0 font-mono text-[11px] text-muted-foreground">
                                text-[15px] / 600
                            </span>
                            <span className="text-[15px] font-semibold">Section heading</span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="w-32 shrink-0 font-mono text-[11px] text-muted-foreground">
                                text-sm / 400
                            </span>
                            <span className="text-sm">
                                Body text — table cells, form values, descriptions.
                            </span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="w-32 shrink-0 font-mono text-[11px] text-muted-foreground">
                                text-xs / muted
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Captions, secondary lines, breadcrumbs, chips.
                            </span>
                        </div>
                    </div>
                </Block>

                {/* --------------------------------------------- KPI strip --- */}
                <Block
                    title="KPI strip"
                    note="Sits between the header and the table. One gradient hero card per strip, never more. Cards with an href drill through to the filtered list."
                >
                    <KpiStrip
                        items={[
                            {
                                label: 'Total Receivable',
                                value: 'SAR 1,248,900',
                                delta: 12.4,
                                caption: 'vs last month',
                                icon: Wallet,
                                tone: 'gradient',
                            },
                            {
                                label: 'Overdue',
                                value: 'SAR 96,780',
                                delta: -4.2,
                                caption: '3 invoices',
                                icon: Receipt,
                                tone: 'danger',
                                href: '#',
                            },
                            {
                                label: 'Paid This Month',
                                value: 'SAR 412,300',
                                delta: 8.1,
                                icon: Coins,
                                tone: 'success',
                            },
                            {
                                label: 'Active Customers',
                                value: '184',
                                caption: '12 added this month',
                                icon: Users,
                                tone: 'info',
                            },
                        ]}
                    />
                </Block>

                {/* ------------------------------------------------ status --- */}
                <Block
                    title="Status vocabulary"
                    note="One canonical map for the whole system. Green = settled, amber = in progress, red = failed or overdue, blue = in flight, slate = inert."
                >
                    <div className="space-y-4">
                        {STATUS_GROUPS.map((group) => (
                            <div key={group.group}>
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {group.group}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {group.statuses.map((status) => (
                                        <StatusBadge key={status} status={status} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Block>

                {/* -------------------------------------------- filter bar --- */}
                <Block
                    title="Filter bar"
                    note="Applied filters are always visible as removable chips. A filtered list never looks like an empty one."
                >
                    <FilterBar
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search invoices..."
                        activeFilters={filters}
                        onRemoveFilter={(key) =>
                            setFilters((f) => f.filter((x) => x.key !== key))
                        }
                        onClearAll={() => setFilters([])}
                    >
                        <div className="space-y-1.5">
                            <Label>Customer</Label>
                            <Input placeholder="Any customer" className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Amount from</Label>
                            <Input type="number" placeholder="0.00" className="h-9" />
                        </div>
                        <Button size="sm" className="w-full">
                            Apply
                        </Button>
                    </FilterBar>
                </Block>

                {/* ------------------------------------------------- table --- */}
                <SectionCard
                    title="Table & cells"
                    description="Money is right-aligned and tabular so decimals line up. Negatives are parenthesised. Empty values show an em dash, never a blank cell."
                    flush
                    className="mb-5"
                >
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Reference</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due</TableHead>
                                <TableHead className="text-end">Qty</TableHead>
                                <TableHead className="text-end">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-end">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {SAMPLE_ROWS.map((row) => (
                                <TableRow key={row.ref}>
                                    <TableCell>
                                        <ReferenceCell value={row.ref} href="#" />
                                    </TableCell>
                                    <TableCell>
                                        <EntityCell
                                            name={row.customer}
                                            secondary={row.email}
                                            href="#"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <DateCell value={row.date} />
                                    </TableCell>
                                    <TableCell>
                                        <DateCell value={row.due} overdue />
                                    </TableCell>
                                    <TableCell>
                                        <NumberCell value={row.qty} lowThreshold={2} unit="pcs" />
                                    </TableCell>
                                    <TableCell>
                                        <MoneyCell value={row.amount} />
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={row.status} />
                                    </TableCell>
                                    <TableCell>
                                        <RowActions
                                            className="justify-end"
                                            actions={[
                                                { label: 'View', icon: Eye, onClick: () => {} },
                                                {
                                                    label: 'Edit',
                                                    icon: Pencil,
                                                    onClick: () => {},
                                                    available: row.status === 'draft',
                                                    disabledReason:
                                                        'Only draft documents can be edited',
                                                },
                                                {
                                                    label: 'Delete',
                                                    icon: Trash2,
                                                    onClick: () => {},
                                                    className: 'text-destructive',
                                                    available: row.status === 'draft',
                                                    disabledReason:
                                                        'Posted documents cannot be deleted',
                                                },
                                            ]}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="border-t-2 bg-muted/40 font-medium">
                                <TableCell colSpan={5}>Total</TableCell>
                                <TableCell>
                                    <MoneyCell
                                        value={SAMPLE_ROWS.reduce((s, r) => s + r.amount, 0)}
                                        bold
                                    />
                                </TableCell>
                                <TableCell colSpan={2} />
                            </TableRow>
                        </TableBody>
                    </Table>
                </SectionCard>

                {/* ------------------------------------------- misc cells --- */}
                <Block
                    title="Other cell types"
                    note="Percent, text and empty handling."
                >
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-md border p-3">
                            <p className="mb-2 text-xs text-muted-foreground">PercentCell</p>
                            <PercentCell value={14.2} />
                            <PercentCell value={-3.8} />
                            <PercentCell value={0} />
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="mb-2 text-xs text-muted-foreground">TextCell</p>
                            <TextCell value="Standard value" />
                            <br />
                            <TextCell value={null} />
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="mb-2 text-xs text-muted-foreground">
                                MoneyCell — coloured
                            </p>
                            <MoneyCell value={4200} colored />
                            <MoneyCell value={-1150} colored />
                            <MoneyCell value={0} />
                        </div>
                    </div>
                </Block>

                {/* ------------------------------------------ empty states --- */}
                <Block
                    title="Empty states"
                    note="Three different situations, three different messages. Offering Create on a filtered list causes duplicate records."
                >
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-lg border">
                            <EmptyState
                                variant="empty"
                                icon={FileText}
                                title="No invoices yet"
                                description="Create your first invoice to start billing customers."
                                createLabel="New Invoice"
                                onCreate={() => {}}
                            />
                        </div>
                        <div className="rounded-lg border">
                            <EmptyState variant="filtered" onClearFilters={() => {}} />
                        </div>
                        <div className="rounded-lg border">
                            <EmptyState
                                variant="search"
                                searchTerm="alrajhi"
                                onClearSearch={() => {}}
                            />
                        </div>
                    </div>
                </Block>

                {/* ------------------------------------------ section card --- */}
                <SectionCard
                    title="Section card"
                    description="The grouping block used on every form and detail screen."
                    icon={CreditCard}
                    action={
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <Plus className="h-3.5 w-3.5" />
                            Add line
                        </Button>
                    }
                    footer={
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Grand total</span>
                            <span className="font-semibold tabular-nums">SAR 48,250.50</span>
                        </div>
                    }
                    className="mb-5"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Customer</Label>
                            <Input placeholder="Select customer" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Invoice date</Label>
                            <Input type="date" />
                        </div>
                    </div>
                </SectionCard>

                {/* ------------------------------------------- documents --- */}
                <Block
                    title="Printed documents"
                    note="Invoices, quotations and reports are built on DocumentLayout / ReportLayout. Open any invoice print screen to see the full sheet; below is the line-item table that repeats its headings across pages."
                >
                    <div className="rounded-md border p-4">
                        <DocumentTable
                            numbered
                            columns={[
                                { key: 'item', header: 'Description' },
                                { key: 'qty', header: 'Qty', align: 'end', width: '16mm' },
                                { key: 'price', header: 'Unit Price', align: 'end', width: '26mm' },
                                { key: 'total', header: 'Amount', align: 'end', width: '28mm' },
                            ] as DocumentColumn[]}
                            rows={[
                                { name: 'Steel bracket, galvanised', sku: 'SB-4410', qty: 120, price: '38.50', total: '4,620.00' },
                                { name: 'Installation labour', sku: null, qty: 16, price: '145.00', total: '2,320.00' },
                                { name: 'Delivery', sku: null, qty: 1, price: '260.00', total: '260.00' },
                            ]}
                            render={(row: any, column) => {
                                switch (column.key) {
                                    case 'item':
                                        return (
                                            <>
                                                <div className="font-medium">{row.name}</div>
                                                {row.sku && (
                                                    <div className="text-[8.5pt] text-[#5d6772]">SKU: {row.sku}</div>
                                                )}
                                            </>
                                        );
                                    case 'qty': return row.qty;
                                    case 'price': return row.price;
                                    case 'total': return <span className="font-semibold">{row.total}</span>;
                                    default: return null;
                                }
                            }}
                        />
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-md border p-3">
                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Themes</dt>
                            <dd className="text-muted-foreground">Classic (ruled), Modern (brand band), Minimal (hairline). They change letterhead and table emphasis only — never geometry or field order.</dd>
                        </div>
                        <div className="rounded-md border p-3">
                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sizes</dt>
                            <dd className="text-muted-foreground">A4 portrait, A4 landscape for wide reports, and 80mm thermal for POS receipts.</dd>
                        </div>
                        <div className="rounded-md border p-3">
                            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Stamps</dt>
                            <dd className="text-muted-foreground">Paid, Overdue, Cancelled and Draft print on the face of the document, so status survives photocopying.</dd>
                        </div>
                    </dl>
                </Block>

                <SectionCard
                    title="Collapsible section"
                    description="Optional blocks collapse by default so the required path down a long form stays short."
                    icon={TrendingUp}
                    collapsible
                    defaultOpen={false}
                >
                    <div className="space-y-1.5">
                        <Label>Notes &amp; terms</Label>
                        <Input placeholder="Payment due within 30 days" />
                    </div>
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
