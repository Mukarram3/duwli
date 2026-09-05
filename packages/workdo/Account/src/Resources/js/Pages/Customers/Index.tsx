// packages/workdo/Account/src/Resources/js/Pages/Customers/Index.tsx
import { useState } from 'react';
import { actionRoute } from '@/components/page-action-bar';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus, Edit as EditIcon, Trash2, Building2, Lock, FileText, Eye, Upload,
    Users, Wallet, Receipt, TrendingUp,
} from "lucide-react";
import ImportDialog from '@/components/import-dialog';
import { formatCurrency } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { ListGridToggle } from "@/components/ui/list-grid-toggle";
import { PerPageSelector } from "@/components/ui/per-page-selector";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Pagination } from "@/components/ui/pagination";
import {
    KpiStrip, FilterBar, EmptyState, EntityCell, TextCell,
    type ActiveFilter,
} from '@/components/duwli';
import { RowActions } from '@/components/row-actions';
import Create from './Create';
import Edit from './Edit';
import View from './View';
import { Customer, User } from './types';
import { usePageButtons } from '@/hooks/usePageButtons';

interface CustomerFilters {
    company_name: string;
    customer_code: string;
    tax_number: string;
}

interface CustomerModalState {
    isOpen: boolean;
    mode: string;
    data: Customer | null;
}

export default function Index() {
    const pageProps = usePage<any>().props;
    const { customers, users, auth, is_demo, stats } = pageProps;
    const { t } = useTranslation();
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CustomerFilters>({
        company_name: urlParams.get('company_name') || '',
        customer_code: urlParams.get('customer_code') || '',
        tax_number: urlParams.get('tax_number') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<CustomerModalState>({ isOpen: false, mode: '', data: null });
    const [viewingItem, setViewingItem] = useState<Customer | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Customer', settingKey: 'GoogleDrive Customer' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Customer', settingKey: 'OneDrive Customer' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Account Customer', settingKey: 'Dropbox Account Customer' });
    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.customers.destroy',
        defaultMessage: 'Are you sure you want to delete this customer?'
    });

    const can = (permission: string) => Boolean(auth.user?.permissions?.includes(permission));

    const visit = (next: Partial<CustomerFilters> = {}) => {
        router.get(route('account.customers.index'), {
            ...filters, ...next, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode
        }, { preserveState: true, replace: true });
    };

    const handleFilter = () => visit();

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('account.customers.index'), {
            ...filters, per_page: perPage, sort: field, direction, view: viewMode
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setFilters({ company_name: '', customer_code: '', tax_number: '' });
        router.get(route('account.customers.index'), { per_page: perPage, view: viewMode });
    };

    /**
     * One filter is removed at a time from the chip row. The cleared value is
     * passed into the visit explicitly rather than relying on setState, which
     * has not flushed yet at this point.
     */
    const removeFilter = (key: string) => {
        const next = { ...filters, [key]: '' } as CustomerFilters;
        setFilters(next);
        router.get(route('account.customers.index'), {
            ...next, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode
        }, { preserveState: true, replace: true });
    };

    /** Chips describing what is currently filtering the table. */
    const activeFilters: ActiveFilter[] = ([
        { key: 'customer_code', label: 'Customer Code', value: filters.customer_code },
        { key: 'tax_number', label: 'Tax Number', value: filters.tax_number },
    ] as ActiveFilter[]).filter((f) => Boolean(f.value));

    const hasAnyFilter = Boolean(filters.company_name || filters.customer_code || filters.tax_number);

    const openModal = (mode: 'add' | 'edit', data: Customer | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };
    const closeModal = () => setModalState({ isOpen: false, mode: '', data: null });

    const openCustomerReport = (customer: Customer) => {
        const params: any = { customer: customer.user_id };
        if (is_demo) {
            const year = new Date().getFullYear();
            params.start_date = `${year}-01-01`;
            params.end_date = `${year}-12-31`;
        }
        router.visit(route('account.reports.customer-detail', params));
    };

    /**
     * Row actions are identical on every row. A permission the user lacks
     * removes the icon; a state that blocks the action (a disabled portal user)
     * greys it out with the reason. A ragged action column where one row shows
     * two icons and the next shows four is unreadable.
     */
    const rowActionsFor = (customer: Customer) => {
        const userDisabled = (customer as any).user?.is_disable === 1;
        return [
            {
                label: t('View Report'),
                icon: FileText,
                onClick: () => openCustomerReport(customer),
                className: 'text-orange-600 hover:text-orange-700',
                permitted: can('view-customer-detail-report'),
                available: !userDisabled,
                disabledReason: t('User is disabled'),
            },
            {
                label: t('View'),
                icon: Eye,
                onClick: () => setViewingItem(customer),
                className: 'text-green-600 hover:text-green-700',
                permitted: can('view-customers'),
                available: !userDisabled,
                disabledReason: t('User is disabled'),
            },
            {
                label: t('Edit'),
                icon: EditIcon,
                onClick: () => openModal('edit', customer),
                className: 'text-blue-600 hover:text-blue-700',
                permitted: can('edit-customers'),
                available: !userDisabled,
                disabledReason: t('User is disabled'),
            },
            {
                label: t('Delete'),
                icon: Trash2,
                onClick: () => openDeleteDialog(customer.id),
                className: 'text-destructive hover:text-destructive',
                permitted: can('delete-customers'),
                available: !userDisabled,
                disabledReason: t('User is disabled'),
            },
        ];
    };

    const showActions = ['view-customers', 'edit-customers', 'delete-customers', 'view-customer-detail-report']
        .some((p) => can(p));

    const tableColumns = [
        {
            key: 'company_name',
            header: t('Customer'),
            sortable: true,
            render: (_: any, customer: any) => (
                <EntityCell
                    name={customer.company_name}
                    secondary={customer.customer_code}
                    image={customer.user?.avatar}
                    initialsFrom={customer.company_name}
                />
            ),
        },
        {
            key: 'contact_person_name',
            header: t('Contact Person'),
            sortable: true,
            render: (_: any, customer: any) => (
                <span className="flex flex-col leading-tight">
                    <TextCell value={customer.contact_person_name} />
                    {customer.contact_person_email && (
                        <span className="truncate text-xs text-muted-foreground">
                            {customer.contact_person_email}
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'tax_number',
            header: t('Tax Number'),
            render: (value: any) => <TextCell value={value} />,
        },
        {
            key: 'payment_terms',
            header: t('Payment Terms'),
            render: (value: any) => <TextCell value={value} />,
        },
        {
            key: 'portal',
            header: t('Portal Access'),
            render: (_: any, customer: any) => {
                if (!customer.user) {
                    return <span className="text-xs text-muted-foreground">{t('No login')}</span>;
                }
                if (customer.user.is_disable === 1) {
                    return (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" /> {t('Disabled')}
                        </span>
                    );
                }
                return <span className="truncate text-sm">{customer.user.name}</span>;
            },
        },
        ...(showActions ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-end',
            render: (_: any, customer: Customer) => (
                <RowActions className="justify-end" actions={rowActionsFor(customer)} />
            ),
        }] : []),
    ];

    const emptyBlock = (
        hasAnyFilter ? (
            <EmptyState variant="filtered" onClearFilters={clearFilters} />
        ) : (
            <EmptyState
                variant="empty"
                icon={Building2}
                title="No customers yet"
                description="Add your first customer to start issuing invoices."
                createPermission="create-customers"
                createLabel="New Customer"
                onCreate={() => openModal('add')}
            />
        )
    );

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Accounting', url: route('account.index') }, { label: 'Customers' }]}
            pageTitle={t('Customers')}
            pageDescription={t('Your customer book and what each of them owes.')}
            pageIcon={Users}
            pageCount={customers.total}
            onExportExcel={
                can('manage-customers') && actionRoute('account.customers.export')
                    ? () => { window.location.href = actionRoute('account.customers.export') as string; }
                    : undefined
            }
            pageActions={
                <>
                    {googleDriveButtons.map((button) => <div key={button.id}>{button.component}</div>)}
                    {oneDriveButtons.map((button) => <div key={button.id}>{button.component}</div>)}
                    {dropboxBtn.map((button) => <div key={button.id}>{button.component}</div>)}
                    {can('create-customers') && (
                        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}
                            className="h-9 px-3.5 text-[13px] font-semibold">
                            <Upload className="mr-1.5 h-4 w-4" />
                            {t('Import')}
                        </Button>
                    )}
                    {can('create-customers') && (
                        <Button size="sm" onClick={() => openModal('add')}
                            className="h-9 px-3.5 text-[13px] font-semibold">
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t('New Customer')}
                        </Button>
                    )}
                </>
            }
        >
            <Head title="Customers" />

            {/*
              KPI strip. The figures describe the whole customer book, not the
              filtered page, so they stay stable as the user filters below.
              Overdue drills through to the receivables report rather than
              filtering this list, because "overdue" is a property of invoices,
              not of customers.
            */}
            {stats && (
                <KpiStrip
                    items={[
                        {
                            label: 'Total Receivable',
                            value: formatCurrency(stats.receivable, pageProps),
                            caption: 'Across all open invoices',
                            icon: Wallet,
                            tone: 'gradient',
                        },
                        {
                            label: 'Overdue',
                            value: formatCurrency(stats.overdue, pageProps),
                            caption: `${stats.overdueCount} ${t('invoices past due')}`,
                            icon: Receipt,
                            tone: 'danger',
                            href: can('view-invoice-aging')
                                ? route('account.reports.invoice-aging')
                                : undefined,
                        },
                        {
                            label: 'Total Customers',
                            value: String(stats.total),
                            icon: Users,
                            tone: 'plain',
                        },
                        {
                            label: 'Added This Month',
                            value: String(stats.newThisMonth),
                            icon: TrendingUp,
                            tone: 'info',
                        },
                    ]}
                />
            )}

            <Card className="shadow-sm">
                <CardContent className="border-b bg-muted/30 p-4">
                    <FilterBar
                        className="mb-0"
                        search={filters.company_name}
                        onSearchChange={(value) => setFilters({ ...filters, company_name: value })}
                        searchPlaceholder="Search customers..."
                        activeFilters={activeFilters}
                        onRemoveFilter={removeFilter}
                        onClearAll={clearFilters}
                        trailing={
                            <>
                                <ListGridToggle
                                    currentView={viewMode}
                                    routeName="account.customers.index"
                                    filters={{ ...filters, per_page: perPage }}
                                />
                                <PerPageSelector
                                    routeName="account.customers.index"
                                    filters={{ ...filters, view: viewMode }}
                                />
                            </>
                        }
                    >
                        <div className="space-y-1.5">
                            <Label>{t('Customer Code')}</Label>
                            <Input
                                value={filters.customer_code}
                                onChange={(e) => setFilters({ ...filters, customer_code: e.target.value })}
                                placeholder={t('Filter by customer code')}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('Tax Number')}</Label>
                            <Input
                                value={filters.tax_number}
                                onChange={(e) => setFilters({ ...filters, tax_number: e.target.value })}
                                placeholder={t('Filter by tax number')}
                                className="h-9"
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1" onClick={handleFilter}>{t('Apply')}</Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={clearFilters}>{t('Clear')}</Button>
                        </div>
                    </FilterBar>
                </CardContent>

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="w-full max-h-[70vh] overflow-y-auto rounded-none">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={customers.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={emptyBlock}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="max-h-[70vh] overflow-auto p-5">
                            {customers.data.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {customers.data.map((customer: any) => (
                                        <Card key={customer.id} className="transition-shadow hover:shadow-md">
                                            <div className="p-4">
                                                <EntityCell
                                                    name={customer.company_name}
                                                    secondary={customer.customer_code}
                                                    image={customer.user?.avatar}
                                                    className="mb-3"
                                                />

                                                <dl className="mb-3 space-y-1.5 text-xs">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <dt className="text-muted-foreground">{t('Contact')}</dt>
                                                        <dd className="truncate font-medium">{customer.contact_person_name}</dd>
                                                    </div>
                                                    {customer.contact_person_email && (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <dt className="text-muted-foreground">{t('Email')}</dt>
                                                            <dd className="truncate">{customer.contact_person_email}</dd>
                                                        </div>
                                                    )}
                                                    {customer.tax_number && (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <dt className="text-muted-foreground">{t('Tax Number')}</dt>
                                                            <dd className="truncate font-medium">{customer.tax_number}</dd>
                                                        </div>
                                                    )}
                                                    {customer.payment_terms && (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <dt className="text-muted-foreground">{t('Payment Terms')}</dt>
                                                            <dd className="truncate font-medium">{customer.payment_terms}</dd>
                                                        </div>
                                                    )}
                                                </dl>

                                                <div className="flex items-center justify-between border-t pt-3">
                                                    {customer.user?.is_disable === 1 ? (
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <span className="inline-flex items-center text-muted-foreground">
                                                                        <Lock className="h-3.5 w-3.5" />
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('User is disabled')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            {customer.user?.name || t('No login')}
                                                        </span>
                                                    )}
                                                    <RowActions actions={rowActionsFor(customer)} />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                emptyBlock
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="border-t bg-muted/20 px-4 py-2">
                    <Pagination
                        data={customers}
                        routeName="account.customers.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} users={users} auth={auth} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <Edit customer={modalState.data} onSuccess={closeModal} />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View customer={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title="Delete Customer"
                message={deleteState.message}
                confirmText="Delete"
                onConfirm={confirmDelete}
                variant="destructive"
            />
            <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
        </AuthenticatedLayout>
    );
}
