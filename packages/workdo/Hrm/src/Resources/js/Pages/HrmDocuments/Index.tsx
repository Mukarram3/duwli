import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, FileText, Calendar, Download, Play, User as UserIcon, LayoutGrid, CheckCircle2, XCircle, Clock, Tag, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Create from './Create';
import EditDocument from './Edit';
import View from './View';
import Action from './Action';
import NoRecordsFound from '@/components/no-records-found';
import { Document, DocumentsIndexProps, DocumentFilters, DocumentModalState } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<DocumentsIndexProps>().props;
    const { documents, auth, documentcategories, imageUrlPrefix, stats } = pageProps;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<DocumentFilters>({
        title: urlParams.get('title') || '',
        status: urlParams.get('status') || '',
        document_category_id: urlParams.get('document_category_id') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [modalState, setModalState] = useState<DocumentModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Document | null>(null);
    const [actionItem, setActionItem] = useState<Document | null>(null);

    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('googleDriveBtn', { module: 'Document', settingKey: 'GoogleDrive Document' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Document', settingKey: 'OneDrive Document' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.documents.destroy',
        defaultMessage: t('Are you sure you want to delete this document?')
    });

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approve':
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
            case 'pending':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
            case 'reject':
            case 'rejected':
                return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20';
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';
        }
    };

    const handleFilter = () => {
        router.get(route('hrm.documents.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (statusKey: string) => {
        const newFilters = { ...filters, status: statusKey };
        setFilters(newFilters);
        router.get(route('hrm.documents.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.documents.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            title: '',
            status: '',
            document_category_id: '',
        });
        router.get(route('hrm.documents.index'), { per_page: perPage });
    };

    const openModal = (mode: 'add' | 'edit', data: Document | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const statusTabs = [
        { key: '', label: t('All'), icon: LayoutGrid, count: (stats as any)?.total ?? documents?.total ?? 0 },
        { key: 'pending', label: t('Pending'), icon: Clock, count: (stats as any)?.pending ?? 0 },
        { key: 'approve', label: t('Approved'), icon: CheckCircle2, count: (stats as any)?.approve ?? 0 },
        { key: 'reject', label: t('Rejected'), icon: XCircle, count: (stats as any)?.reject ?? 0 },
    ];

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            sortable: true,
            render: (value: string, row: any) => {
                const category = documentcategories?.find(item => item.id.toString() === row.document_category_id?.toString())?.document_type || row.documentCategory?.document_type;
                return (
                    <div className="flex items-start gap-2.5 py-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{value || t('Untitled Document')}</span>
                            {category && (
                                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium w-fit ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                                    <Tag className="w-3 h-3" />
                                    {category}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'effective_date',
            header: t('Effective Date'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        {
            key: 'uploaded_by',
            header: t('Uploaded By'),
            sortable: false,
            render: (_: any, row: any) => {
                const user = row.uploaded_by || row.uploadedBy;
                if (!user || !user.name) {
                    return <div className="text-center w-full text-gray-400 dark:text-gray-500 font-medium">-</div>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                            {user.avatar ? (
                                <img src={getImagePath(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    </div>
                );
            }
        },
        {
            key: 'approved_by',
            header: t('Approved By'),
            sortable: false,
            render: (_: any, row: any) => {
                const user = row.approved_by || row.approvedBy;
                if (!user || !user.name) {
                    return <div className="text-center w-full text-gray-400 dark:text-gray-500 font-medium">-</div>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                            {user.avatar ? (
                                <img src={getImagePath(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const statusLabels: Record<string, string> = { 'pending': 'Pending', 'approve': 'Approved', 'reject': 'Rejected' };
                const label = statusLabels[value?.toLowerCase()] || value || 'Unknown';
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(value)}`}>
                        {t(label)}
                    </span>
                );
            }
        },
        {
            key: 'document',
            header: t('Document'),
            sortable: false,
            render: (_: any, doc: Document) => doc.document ? (
                <a
                    href={getImagePath(doc.document)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{t('View File')}</span>
                </a>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-hrm-documents', 'manage-hrm-documents-status', 'download-hrm-documents', 'edit-hrm-documents', 'delete-hrm-documents'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, docItem: Document) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-hrm-documents-status') && docItem.status === 'pending' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setActionItem(docItem)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Update Status')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {docItem.document && auth.user?.permissions?.includes('download-hrm-documents') && docItem.status === 'approve' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `${imageUrlPrefix}/${docItem.document}`;
                                            link.download = docItem.document.split('/').pop() || 'download';
                                            link.click();
                                        }}
                                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Download')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-hrm-documents') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(docItem)} className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-hrm-documents') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', docItem)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-hrm-documents') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(docItem.id)}
                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
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
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Documents') }
            ]}
            pageTitle={t('Manage Documents')}
            pageActions={
                <TooltipProvider>
                    <div className="flex items-center gap-2">
                        {pageButtons.map((button) => (
                            <div key={button.id}>
                                {button.component}
                            </div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>
                                {button.component}
                            </div>
                        ))}
                        {auth.user?.permissions?.includes('create-hrm-documents') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        <span>{t('Create')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create Document')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </TooltipProvider>
            }
        >
            <Head title={t('Documents')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.title}
                                onChange={(value) => setFilters({ ...filters, title: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Documents...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="hrm.documents.index"
                                filters={{ ...filters }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.document_category_id].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Interactive Status Tabs */}
                <div className="flex items-center gap-2 px-6 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto bg-gray-50/50 dark:bg-zinc-900/50">
                    {statusTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = (filters.status || '') === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
                                <span>{tab.label}</span>
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 dark:bg-zinc-800/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Document Category')}</label>
                                <Select value={filters.document_category_id} onValueChange={(value) => setFilters({ ...filters, document_category_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Document Category')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        {documentcategories?.map((item: any) => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                {item.document_type}
                                            </SelectItem>
                                        ))}
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
                            <DataTable
                                data={documents?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={FileText}
                                        title={t('No Documents found')}
                                        description={t('Get started by creating your first Document.')}
                                        hasFilters={!!(filters.title || filters.status || filters.document_category_id)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-hrm-documents"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Document')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-zinc-900/30">
                    <Pagination
                        data={documents || { data: [], links: [], meta: {} }}
                        routeName="hrm.documents.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditDocument
                        document={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View document={viewingItem} />}
            </Dialog>

            <Dialog open={!!actionItem} onOpenChange={() => setActionItem(null)}>
                {actionItem && <Action document={actionItem} onSuccess={() => setActionItem(null)} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Document')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}