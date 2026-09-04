// packages/workdo/Account/src/Resources/js/Pages/ChartOfAccounts/Index.tsx
import { useState, useMemo, useEffect } from 'react';
import ImportDialog from '@/components/import-dialog';
import { actionRoute } from '@/components/page-action-bar';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Calculator as CalculatorIcon, Download, FileImage } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Create from './Create';
import EditChartOfAccount from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { ChartOfAccount, ChartOfAccountsIndexProps, ChartOfAccountFilters, ChartOfAccountModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import AccountTree, { collectParentIds, filterTree, type TreeAccount } from './AccountTree';
import { ChevronsDownUp, ChevronsUpDown, List, Network, Upload, Archive, PencilLine, FileText } from 'lucide-react';

export default function Index() {
    const { t } = useTranslation();
    const { chartofaccounts, auth, accounttypes, accountTree } = usePage<any>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ChartOfAccountFilters>({
        account_code: urlParams.get('account_code') || '',
        account_name: urlParams.get('account_name') || '',
        account_type_id: urlParams.get('account_type_id') || 'all',
        normal_balance: urlParams.get('normal_balance') || 'all',
        is_active: urlParams.get('is_active') || 'all',
    });

    // ---- Tree view state -------------------------------------------------
    // 'tree' mirrors Qoyod: the chart read as one hierarchical document.
    // 'list' keeps the original paginated + sortable table.
    const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [treeSearch, setTreeSearch] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    // Archived = inactive accounts, kept out of the default view.
    const [showArchived, setShowArchived] = useState(false);
    // Quick edit turns account name and code into inline inputs so a whole
    // chart can be corrected without opening a modal per row.
    const [quickEdit, setQuickEdit] = useState(false);

    const rawTree: TreeAccount[] = accountTree || [];

    /**
     * Archived accounts are inactive ones. They are hidden by default so the
     * working chart stays readable, and a parent is kept whenever any
     * descendant still matches — otherwise the visible children would lose
     * their heading.
     */
    const filterByActive = (nodes: TreeAccount[], wantArchived: boolean): TreeAccount[] =>
        nodes
            .map((node) => {
                const children = filterByActive(node.children, wantArchived);
                const selfMatches = wantArchived ? !node.is_active : node.is_active;
                if (!selfMatches && children.length === 0) return null;
                return { ...node, children };
            })
            .filter((node): node is TreeAccount => node !== null);

    const tree: TreeAccount[] = useMemo(
        () => filterByActive(rawTree, showArchived),
        [rawTree, showArchived],
    );

    // Every node that has children, at any depth — the target of Expand All.
    const allParentIds = useMemo(() => collectParentIds(tree), [tree]);

    const { tree: visibleTree, openIds } = useMemo(
        () => filterTree(tree, treeSearch),
        [tree, treeSearch],
    );

    // While searching, force every branch containing a match open so the
    // matched rows are actually reachable.
    useEffect(() => {
        if (treeSearch.trim()) {
            setExpandedIds((current) => new Set([...current, ...openIds]));
        }
    }, [treeSearch, openIds.join(',')]);

    /**
     * Client-side PDF. jspdf + autotable are already dependencies, so this
     * needs no server route and no extra install. Indentation is preserved
     * with leading spaces so the hierarchy survives into the document.
     */
    const downloadPdf = async () => {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);

        const rows: any[] = [];
        const walk = (nodes: TreeAccount[]) => {
            nodes.forEach((node) => {
                rows.push([
                    '    '.repeat(node.depth) + node.account_name,
                    node.account_code,
                    node.account_type?.name || '-',
                    node.normal_balance,
                    node.opening_balance ? Number(node.opening_balance).toFixed(2) : '-',
                    node.current_balance ? Number(node.current_balance).toFixed(2) : '-',
                    node.is_active ? t('Active') : t('Inactive'),
                ]);
                if (node.children?.length) walk(node.children);
            });
        };
        walk(tree);

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFontSize(14);
        doc.text(t('Chart Of Accounts'), 14, 16);
        doc.setFontSize(9);
        doc.text(new Date().toLocaleDateString(), 14, 22);

        autoTable(doc, {
            startY: 27,
            head: [[
                t('Account Name'), t('Account Code'), t('Account Type Name'),
                t('Normal Balance'), t('Opening Balance'), t('Current Balance'), t('Status'),
            ]],
            body: rows,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [30, 58, 111], textColor: 255 },
            columnStyles: { 0: { cellWidth: 60 } },
        });

        doc.save('chart-of-accounts-' + new Date().toISOString().slice(0, 10) + '.pdf');
    };

    const expandAll = () => setExpandedIds(new Set(allParentIds));
    const collapseAll = () => setExpandedIds(new Set());

    const toggleNode = (id: number) =>
        setExpandedIds((current) => {
            const next = new Set(current);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const allExpanded = allParentIds.length > 0 && allParentIds.every((id) => expandedIds.has(id));

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<ChartOfAccountModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const [showFilters, setShowFilters] = useState(false);




    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.chart-of-accounts.destroy',
        defaultMessage: t('Are you sure you want to delete this chartofaccount?')
    });

    const quickBooksPageBtn = usePageButtons('quickBooksPageBtn');
    const xeroAccountBtn = usePageButtons('xeroAccountBtn');

    const handleFilter = () => {
        router.get(route('account.chart-of-accounts.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('account.chart-of-accounts.index'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            account_code: '',
            account_name: '',
            account_type_id: 'all',
            normal_balance: 'all',
            is_active: 'all',
        });
        router.get(route('account.chart-of-accounts.index'), {per_page: perPage});
    };

    const openModal = (mode: 'add' | 'edit', data: ChartOfAccount | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'account_code',
            header: t('Account Code'),
            sortable: true
        },
        {
            key: 'account_name',
            header: t('Account Name'),
            sortable: true
        },
        {
            key: 'account_type.name',
            header: t('Account Type Name'),
            sortable: false,
            render: (value: any, row: any) => row.account_type?.name || '-'
        },
        {
            key: 'parent_account.account_name',
            header: t('Parent Account'),
            sortable: false,
            render: (value: any, row: any) => row.parent_account?.account_name || '-'
        },
        {
            key: 'normal_balance',
            header: t('Normal Balance'),
            sortable: true,
            render: (value: any) => (
                <span className={`px-2 py-1 rounded-full text-sm ${
                    value === 'debit' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                    {t(value.charAt(0).toUpperCase() + value.slice(1))}
                </span>
            )
        },
        {
            key: 'opening_balance',
            header: t('Opening Balance'),
            sortable: false,
            render: (value: number) => value ? formatCurrency(value) : '-'
        },
        {
            key: 'current_balance',
            header: t('Current Balance'),
            sortable: true,
            render: (value: number) => value ? formatCurrency(value) : '-'
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: false,
            render: (value: boolean) => (
                <span className={`px-2 py-1 rounded-full text-sm ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {value ? t('Active') : t('Inactive')}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-chart-of-accounts', 'delete-chart-of-accounts'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, chartofaccount: ChartOfAccount) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-chart-of-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('account.chart-of-accounts.show', chartofaccount.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-chart-of-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', chartofaccount)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('delete-chart-of-accounts') && chartofaccount.is_system_account == 0 && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(chartofaccount.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Delete')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Accounting'), url:route('account.index')},
                {label: t('Chart Of Accounts')}
            ]}
            pageTitle={t('Manage Chart Of Accounts')}
            pageActions={
                <div className="flex flex-wrap items-center justify-end gap-2 max-w-full">
                    {viewMode === 'tree' && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={expandAll}
                                disabled={allParentIds.length === 0 || allExpanded}
                                title={
                                    allParentIds.length === 0
                                        ? t('No account has a parent account set, so there is nothing to expand.')
                                        : t('Expand All')
                                }
                                className="h-9 px-3.5 text-[13px] font-semibold"
                            >
                                <ChevronsUpDown className="mr-1.5 h-4 w-4" />
                                {t('Expand All')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={collapseAll}
                                disabled={expandedIds.size === 0}
                                className="h-9 px-3.5 text-[13px] font-semibold"
                            >
                                <ChevronsDownUp className="mr-1.5 h-4 w-4" />
                                {t('Collapse All')}
                            </Button>
                        </>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'tree' ? 'list' : 'tree')}
                        className="h-9 px-3.5 text-[13px] font-semibold"
                        title={viewMode === 'tree' ? t('Switch to list view') : t('Switch to tree view')}
                    >
                        {viewMode === 'tree' ? (
                            <List className="mr-1.5 h-4 w-4" />
                        ) : (
                            <Network className="mr-1.5 h-4 w-4" />
                        )}
                        {viewMode === 'tree' ? t('List View') : t('Tree View')}
                    </Button>
                    <TooltipProvider>
                        {xeroAccountBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {quickBooksPageBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>

                    {/*
                      One create control, labelled. The bare "+" icon that used
                      to sit here did the same thing as this button, so the page
                      offered two ways to create an account side by side.
                    */}
                    {auth.user?.permissions?.includes('edit-chart-of-accounts') && viewMode === 'tree' && (
                        <Button
                            variant={quickEdit ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setQuickEdit(!quickEdit)}
                            className="h-9 px-3.5 text-[13px] font-semibold"
                        >
                            <PencilLine className="mr-1.5 h-4 w-4" />
                            {quickEdit ? t('Done') : t('Quick Edit')}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPdf}
                        disabled={tree.length === 0}
                        className="h-9 px-3.5 text-[13px] font-semibold"
                    >
                        <FileText className="mr-1.5 h-4 w-4" />
                        {t('Download PDF')}
                    </Button>
                    {auth.user?.permissions?.includes('create-chart-of-accounts') &&
                        actionRoute('account.chart-of-accounts.import') && (
                        <Button
                            size="sm"
                            onClick={() => setImportOpen(true)}
                            className="h-9 bg-[#1E3A6F] px-3.5 text-[13px] font-semibold text-white hover:bg-[#183057]"
                        >
                            <Upload className="mr-1.5 h-4 w-4" />
                            {t('Import Accounts')}
                        </Button>
                    )}
                    {auth.user?.permissions?.includes('manage-chart-of-accounts') &&
                        actionRoute('account.chart-of-accounts.export') && (
                        <a href={actionRoute('account.chart-of-accounts.export') || '#'} download>
                            <Button
                                size="sm"
                                className="h-9 bg-[#1E3A6F] px-3.5 text-[13px] font-semibold text-white hover:bg-[#183057]"
                            >
                                <Download className="mr-1.5 h-4 w-4" />
                                {t('Export Accounts')}
                            </Button>
                        </a>
                    )}
                    <Button
                        variant={showArchived ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowArchived(!showArchived)}
                        className="h-9 px-3.5 text-[13px] font-semibold"
                    >
                        <Archive className="mr-1.5 h-4 w-4" />
                        {showArchived ? t('Active Accounts') : t('Archived Accounts')}
                    </Button>
                    {auth.user?.permissions?.includes('create-chart-of-accounts') && (
                        <Button
                            size="sm"
                            onClick={() => openModal('add')}
                            className="h-9 bg-[#1E3A6F] px-3.5 text-[13px] font-semibold text-white hover:bg-[#183057]"
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t('New Account')}
                        </Button>
                    )}
                </div>
            }
        >
            <Head title={t('Chart Of Accounts')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            {viewMode === 'tree' ? (
                                <SearchInput
                                    value={treeSearch}
                                    onChange={(value: string) => setTreeSearch(value)}
                                    onSearch={() => {}}
                                    placeholder={t('Search Chart Of Accounts...')}
                                />
                            ) : (
                                <SearchInput
                                    value={filters.account_code}
                                    onChange={(value) => setFilters({...filters, account_code: value})}
                                    onSearch={handleFilter}
                                    placeholder={t('Search Chart Of Accounts...')}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-3">

                            {viewMode === 'list' && (
                                <PerPageSelector
                                    routeName="account.chart-of-accounts.index"
                                    filters={{...filters}}
                                />
                            )}
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [
                                        filters.account_type_id !== 'all' ? filters.account_type_id : '',
                                        filters.normal_balance !== 'all' ? filters.normal_balance : '',
                                        filters.is_active !== 'all' ? filters.is_active : ''
                                    ].filter(f => f !== '' && f !== null && f !== undefined).length;
                                    return activeFilters > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {activeFilters}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Account Type')}</label>
                                <Select value={filters.account_type_id} onValueChange={(value) => setFilters({...filters, account_type_id: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Account Types')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Account Types')}</SelectItem>
                                        {accounttypes?.map((account_type: any) => (
                                            <SelectItem key={account_type.id} value={account_type.id.toString()}>
                                                {account_type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Normal Balance')}</label>
                                <Select value={filters.normal_balance} onValueChange={(value) => setFilters({...filters, normal_balance: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Normal Balance')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Normal Balance')}</SelectItem>
                                        <SelectItem value="debit">{t('Debit')}</SelectItem>
                                        <SelectItem value="credit">{t('Credit')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.is_active} onValueChange={(value) => setFilters({...filters, is_active: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Status')}</SelectItem>
                                        <SelectItem value="1">{t('Active')}</SelectItem>
                                        <SelectItem value="0">{t('Inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                        {viewMode === 'tree' && tree.length > 0 && allParentIds.length === 0 && (
                            <div className="border-b bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                                {t('This chart of accounts is flat — no account has a Parent Account set, so Expand All and Collapse All have nothing to act on. Edit an account and choose its Parent Account to build the hierarchy.')}
                            </div>
                        )}
                        {viewMode === 'tree' ? (
                            visibleTree.length === 0 ? (
                                <NoRecordsFound
                                    icon={CalculatorIcon}
                                    title={t('No Chart Of Accounts found')}
                                    description={t('Get started by creating your first Chart Of Account.')}
                                    hasFilters={!!treeSearch}
                                    onClearFilters={() => setTreeSearch('')}
                                    createPermission="create-chart-of-accounts"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create ChartOfAccount')}
                                    className="h-auto py-12"
                                />
                            ) : (
                                <AccountTree
                                    nodes={visibleTree}
                                    expandedIds={expandedIds}
                                    onToggle={toggleNode}
                                    permissions={auth.user?.permissions || []}
                                    onEdit={(account) => openModal('edit', account as any)}
                                    onDelete={(id) => openDeleteDialog(id)}
                                    // Opens the create modal with this account
                                    // pre-selected as the parent, so building
                                    // the hierarchy does not mean retyping it.
                                    quickEdit={quickEdit}
                                    onAddChild={(parent) =>
                                        openModal('add', { parent_account_id: parent.id } as any)
                                    }
                                />
                            )
                        ) : (
                        <DataTable
                            data={chartofaccounts?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={CalculatorIcon}
                                    title={t('No Chart Of Accounts found')}
                                    description={t('Get started by creating your first Chart Of Account.')}
                                    hasFilters={!!(filters.account_code || filters.account_name || (filters.account_type_id !== 'all' && filters.account_type_id) || filters.normal_balance || filters.is_active)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-chart-of-accounts"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create ChartOfAccount')}
                                    className="h-auto"
                                />
                            }
                        />
                        )}
                        </div>
                    </div>
                </CardContent>

                {/* Pagination Footer — list view only; the tree is one document */}
                {viewMode === 'list' && (
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                        <Pagination
                            data={chartofaccounts || { data: [], links: [], meta: {} }}
                            routeName="account.chart-of-accounts.index"
                            filters={{...filters, per_page: perPage}}
                        />
                    </CardContent>
                )}
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditChartOfAccount
                        chartofaccount={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>



            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete ChartOfAccount')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
            <ImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                importRoute="account.chart-of-accounts.import"
                templateRoute="account.chart-of-accounts.import.template"
                title={t('Import Accounts')}
            />
        </AuthenticatedLayout>
    );
}
