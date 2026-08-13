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
import { Plus, Edit as EditIcon, Trash2, Eye, UserX as UserXIcon, Download, Play, User as UserIcon, Calendar, LayoutGrid, CheckCircle2, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Create from './Create';
import EditTermination from './Edit';
import TerminationStatusModal from './TerminationStatusModal';
import TerminationView from './View';

import NoRecordsFound from '@/components/no-records-found';
import { Termination, TerminationsIndexProps, TerminationFilters, TerminationModalState } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';

const getTerminationTypeStyle = (type: string) => {
    const normalized = type?.toLowerCase().trim();
    if (normalized.includes('medical')) {
        return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20';
    }
    if (normalized.includes('redundancy')) {
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
    }
    if (normalized.includes('mutual') || normalized.includes('agreement')) {
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
    }
    if (normalized.includes('performance') || normalized.includes('issue')) {
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20';
    }
    if (normalized.includes('abandonment') || normalized.includes('abandon')) {
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20';
    }
    if (normalized.includes('misconduct')) {
        return 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20';
    }
    if (normalized.includes('layoff')) {
        return 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20';
    }
    if (normalized.includes('contract') || normalized.includes('end')) {
        return 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20';
    }
    const colors = [
        'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
        'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
        'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/10 dark:text-pink-400 dark:ring-pink-500/20',
        'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20',
        'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-500/20'
    ];
    let sum = 0;
    for (let i = 0; i < normalized.length; i++) {
        sum += normalized.charCodeAt(i);
    }
    return colors[sum % colors.length];
};

export default function Index() {
    const { t } = useTranslation();
    const { terminations, auth, users, terminationtypes, stats } = usePage<TerminationsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);
    
    const [filters, setFilters] = useState<TerminationFilters>({
        name: urlParams.get('name') || '',
        employee_id: urlParams.get('employee_id') || 'all',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [activeTab, setActiveTab] = useState(urlParams.get('status') || 'all');
    const [modalState, setModalState] = useState<TerminationModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [statusModalState, setStatusModalState] = useState<{
        isOpen: boolean;
        termination: Termination | null;
    }>({
        isOpen: false,
        termination: null
    });
    const [viewingItem, setViewingItem] = useState<Termination | null>(null);

    const [showFilters, setShowFilters] = useState(false);

    const statsData = stats || { total: 0, pending: 0, approved: 0, rejected: 0 };

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.terminations.destroy',
        defaultMessage: t('Are you sure you want to delete this termination?')
    });

    const handleFilter = () => {
        router.get(route('hrm.terminations.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.terminations.index'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            employee_id: 'all',
            status: '',
        });
        setActiveTab('all');
        router.get(route('hrm.terminations.index'), {per_page: perPage});
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const newStatus = tab === 'all' ? '' : tab;
        setFilters(prev => ({ ...prev, status: newStatus }));
        router.get(route('hrm.terminations.index'), {
            ...filters,
            status: newStatus,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
        }, { preserveState: true, replace: true });
    };

    const openModal = (mode: 'add' | 'edit', data: Termination | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const openStatusModal = (termination: Termination) => {
        setStatusModalState({ isOpen: true, termination });
    };

    const closeStatusModal = () => {
        setStatusModalState({ isOpen: false, termination: null });
    };

    const tableColumns = [
        {
            key: 'employee.name',
            header: t('Employee Name'),
            sortable: false,
            render: (value: any, row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                        {row.employee?.avatar ? (
                            <img src={getImagePath(row.employee.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{row.employee?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground">{row.employee?.email || ''}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'terminationType.termination_type',
            header: t('Termination Type'),
            sortable: false,
            render: (value: any, row: any) => {
                const type = row.termination_type?.termination_type;
                if (!type) return <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>;
                return (
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getTerminationTypeStyle(type)}`}>
                        {type}
                    </span>
                );
            }
        },
        {
            key: 'notice_date',
            header: t('Notice Date'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        {
            key: 'termination_date',
            header: t('Termination Date'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        {
            key: 'document',
            header: t('Document'),
            sortable: false,
            className: 'text-center [&>div]:justify-center',
            render: (_: any, termination: Termination) => (
                termination.document ? (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = getImagePath(termination.document);
                                        link.download = termination.document?.split('/').pop() || 'termination-document';
                                        link.click();
                                    }}
                                    className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Download Document')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">-</span>
                )
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const isPending = value === 'pending';
                const isApproved = value === 'approved';
                return (
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        isPending 
                            ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-800/30' 
                            : isApproved
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/30'
                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800/30'
                    }`}>
                        {t(value?.charAt(0).toUpperCase() + value?.slice(1) || 'Pending')}
                    </span>
                );
            }
        },
        {
            key: 'approved_by',
            header: t('Approved By'),
            sortable: false,
            render: (_: any, termination: Termination) => {
                const user = termination.approved_by;
                if (!user || !user.name) {
                    return <div className="text-gray-400 dark:text-gray-500 font-medium">-</div>;
                }
                return (
                    <div className="flex items-center gap-2 py-1">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                            {user.avatar ? (
                                <img
                                    src={getImagePath(user.avatar)}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    </div>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['manage-termination-status', 'view-terminations', 'edit-terminations', 'delete-terminations'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, termination: Termination) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-termination-status') && termination.status === 'pending' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openStatusModal(termination)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Status')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-terminations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(termination)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-terminations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', termination)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-terminations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(termination.id)}
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
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Terminations') }
            ]}
            pageTitle={t('Manage Terminations')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-terminations') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Create')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            }
        >
            <Head title={t('Terminations')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({...filters, name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by Employee Name...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="hrm.terminations.index"
                                filters={{...filters}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.employee_id !== 'all' ? filters.employee_id : ''].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Status Tabs */}
                <CardContent className="px-6 py-0 border-b bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all',      label: t('All'),      icon: LayoutGrid, count: statsData.total },
                            { key: 'pending',  label: t('Pending'),  icon: Play,        count: statsData.pending },
                            { key: 'approved', label: t('Approved'), icon: CheckCircle2,count: statsData.approved },
                            { key: 'rejected', label: t('Rejected'), icon: XCircle,     count: statsData.rejected },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${
                                    activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                                    activeTab === tab.key
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        {auth.user?.permissions?.includes('manage-employees') && (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Employee')}</label>
                                    <Select value={filters.employee_id} onValueChange={(value) => setFilters({...filters, employee_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('All Employees')} />
                                        </SelectTrigger>
                                        <SelectContent searchable={true}>
                                            <SelectItem value="all">{t('All Employees')}</SelectItem>
                                            {users?.map((employee: any) => (
                                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                                    {employee.name}
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
                        )}
                    </CardContent>
                )}

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                            <DataTable
                                data={terminations?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={UserXIcon}
                                        title={t('No Terminations found')}
                                        description={t('Get started by creating your first Termination.')}
                                        hasFilters={!!(filters.name || (filters.employee_id !== 'all' && filters.employee_id) || filters.status)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-terminations"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Termination')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={terminations || { data: [], links: [], meta: {} }}
                        routeName="hrm.terminations.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditTermination
                        termination={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Termination')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            <Dialog open={statusModalState.isOpen} onOpenChange={closeStatusModal}>
                {statusModalState.termination && (
                    <TerminationStatusModal
                        termination={statusModalState.termination}
                        onSuccess={closeStatusModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <TerminationView termination={viewingItem} />}
            </Dialog>
        </AuthenticatedLayout>
    );
}