import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit as EditIcon, Trash2, Eye, FileSignature, FileText, User as UserIcon, CalendarDays, DollarSign, CheckCircle2, Clock, Archive, AlertTriangle, MoreHorizontal, Copy, LayoutGrid, Play, PauseCircle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import Create from './Create';
import EditContract from './Edit';
import DuplicateButton from './components/DuplicateButton';
import NoRecordsFound from '@/components/no-records-found';
import { Contract, ContractsIndexProps, ContractFilters, ContractModalState } from './types';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';

const getContractStatus = (contract: Contract) => {
    const statusValue = contract.status?.toString().toLowerCase();
    if ((statusValue === 'accepted' || statusValue === 'active') && contract.end_date) {
        const end = new Date(contract.end_date);
        const now = new Date();
        if (now > end) {
            return 'expired';
        }
    }
    return statusValue;
};

const getContractStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
        case 'draft':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20';
        case 'accepted':
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20';
        case 'expired':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-500/20';
        case 'declined':
            return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20';
        case 'closed':
            return 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-950/30 dark:text-slate-400 dark:ring-slate-500/20';
        case 'archived':
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-500/20';
        default:
            return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/20';
    }
};

const getContractStatusText = (status: string, t: (key: string) => string) => {
    switch (status) {
        case 'pending':
            return t('Pending');
        case 'accepted':
        case 'active':
            return t('Active');
        case 'expired':
            return t('Expired');
        case 'declined':
            return t('Declined');
        case 'closed':
            return t('Closed');
        case 'draft':
            return t('Draft');
        case 'archived':
            return t('Archived');
        default:
            return t(status.charAt(0).toUpperCase() + status.slice(1));
    }
};

const getDurationText = (startStr: string, endStr: string, t: any) => {
    if (!startStr || !endStr) return '-';
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    
    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }
    
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    
    const parts = [];
    if (years > 0) {
        parts.push(`${years} ${years === 1 ? t('Year') : t('Years')}`);
    }
    if (months > 0) {
        parts.push(`${months} ${months === 1 ? t('Month') : t('Months')}`);
    }
    if (parts.length === 0 || days > 0) {
        parts.push(`${days} ${days === 1 ? t('Day') : t('Days')}`);
    }
    return parts.join(' ');
};

const getDurationProgress = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const now = new Date().getTime();
    
    if (now <= start) return 0;
    if (now >= end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
};

const getProgressBarColor = (progress: number, endStr: string) => {
    const end = new Date(endStr).getTime();
    const now = new Date().getTime();
    const daysLeft = (end - now) / (1000 * 60 * 60 * 24);
    
    if (now >= end) {
        return 'bg-red-500';
    }
    if (daysLeft <= 30) {
        return 'bg-orange-500';
    }
    return 'bg-emerald-500';
};

export default function Index() {
    const { t } = useTranslation();
    const { contracts, auth, users, contracttypes, cardStats: propCardStats } = usePage<ContractsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const cardStats = propCardStats || {
        total: 0,
        active: 0,
        pending: 0,
        closed: 0,
        declined: 0
    };

    const [filters, setFilters] = useState<ContractFilters>({
        subject: urlParams.get('subject') || '',
        description: urlParams.get('description') || '',
        type_id: urlParams.get('type_id') || '',
        status: urlParams.get('status') || '',
        user_id: urlParams.get('user_id') || '',
        start_date: urlParams.get('start_date') || '',
        end_date: urlParams.get('end_date') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<ContractModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('contractStackBtn', 'Contracts');
    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Contracts', settingKey: 'GoogleDrive Contracts' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Contracts', settingKey: 'OneDrive Contracts' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'contract.destroy',
        defaultMessage: t('Are you sure you want to delete this contract?')
    });

    const handleFilter = () => {
        router.get(route('contract.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: false,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('contract.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: false,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            subject: '',
            description: '',
            type_id: '',
            status: '',
            user_id: '',
            start_date: '',
            end_date: '',
        });
        router.get(route('contract.index'), { per_page: perPage, view: viewMode });
    };

    const openModal = (mode: 'add' | 'edit', data: Contract | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'id',
            header: '#',
            render: (value: any, row: Contract, index: number) => {
                const currentPage = contracts?.current_page || 1;
                const perPageNum = Number(perPage) || 10;
                return <span className="text-sm font-semibold text-gray-500">{(currentPage - 1) * perPageNum + index + 1}</span>;
            }
        },
        {
            key: 'contract_number',
            header: t('Contract Number'),
            sortable: true,
            render: (value: any, contract: Contract) => (
                <div className="flex flex-col gap-1 items-start">
                    {auth.user?.permissions?.includes('view-contracts') ? (
                        <span
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                            onClick={() => router.get(route('contract.show', contract.id))}
                        >
                            {value || '-'}
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                            {value || '-'}
                        </span>
                    )}
                    <span className="text-sm text-gray-900 font-normal dark:text-gray-100">{contract.subject || '-'}</span>
                </div>
            )
        },
        {
            key: 'user.name',
            header: t('Assigned to'),
            sortable: false,
            render: (value: any, row: Contract) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border dark:bg-gray-800 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        {row.user?.avatar ? (
                            <img src={getImagePath(row.user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{row.user?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground truncate">{row.user?.email || ''}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string, contract: Contract) => {
                const calculatedStatus = getContractStatus(contract);
                const displayValue = getContractStatusText(calculatedStatus, t);
                const colorClass = getContractStatusColor(calculatedStatus);
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ring-1 ring-inset capitalize ${colorClass}`}>
                        {displayValue}
                    </span>
                );
            }
        },
        {
            key: 'duration',
            header: t('Contract Duration'),
            sortable: false,
            render: (value: any, contract: Contract) => {
                const durationText = getDurationText(contract.start_date, contract.end_date, t);
                const progress = getDurationProgress(contract.start_date, contract.end_date);
                const progressBarColor = getProgressBarColor(progress, contract.end_date);
                
                return (
                    <div className="flex flex-col min-w-[160px] py-1 gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{durationText}</span>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">({progress}%)</span>
                        </div>
                        <div className="text-xs text-gray-650 dark:text-gray-400 flex items-center gap-1 font-medium">
                            <span>{contract.start_date ? formatDate(contract.start_date) : '-'}</span>
                            <span className="text-gray-400">—</span>
                            <span>{contract.end_date ? formatDate(contract.end_date) : '-'}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'value',
            header: t('Contract Amount'),
            sortable: false,
            render: (value: number) => (
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {value ? formatCurrency(value) : <span className="text-gray-400">—</span>}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-contracts', 'edit-contracts', 'delete-contracts', 'duplicate-contracts'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, contract: Contract) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {usePageButtons('contractActionBtn', contract).map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        <DuplicateButton contract={contract} />
                        {auth.user?.permissions?.includes('preview-contracts') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('contract.preview', contract.id))} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Preview')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-contracts') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('contract.show', contract.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-contracts') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', contract)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-contracts') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(contract.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Contracts') }]}
            pageTitle={t('Manage Contracts')}
            pageDescription={t('Manage and track your contracts, assignment, value, and statuses.')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {googleDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-contracts') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Contracts')} />

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Contracts')}</CardTitle>
                        <LayoutGrid className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{cardStats.total}</div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All time')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Active Contract')}</CardTitle>
                        <Play className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{cardStats.active}</div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{cardStats.total > 0 ? Math.round((cardStats.active / cardStats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Pending Contract')}</CardTitle>
                        <PauseCircle className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{cardStats.pending}</div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{cardStats.total > 0 ? Math.round((cardStats.pending / cardStats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Closed Contract')}</CardTitle>
                        <CheckCircle2 className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{cardStats.closed}</div>
                        <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">{cardStats.total > 0 ? Math.round((cardStats.closed / cardStats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:from-red-900/30 dark:to-red-800/20 dark:border-red-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">{t('Declined Contract')}</CardTitle>
                        <AlertCircle className="h-8 w-8 text-red-700 dark:text-red-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">{cardStats.declined}</div>
                        <p className="text-xs text-red-700 dark:text-red-400 opacity-80 mt-1">{cardStats.total > 0 ? Math.round((cardStats.declined / cardStats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                {/* Search & Controls */}
                <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-900/30 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.subject}
                                onChange={(value) => setFilters({ ...filters, subject: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Contracts...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="contract.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="contract.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.type_id, filters.status, filters.user_id, filters.start_date, filters.end_date].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                    <CardContent className="p-4 bg-blue-50/30 border-b dark:bg-blue-950/10 dark:border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {auth.user?.permissions?.includes('manage-contract-types') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Type')}</label>
                                    <Select value={filters.type_id} onValueChange={(value) => setFilters({ ...filters, type_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by Type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contracttypes?.map((item: any) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">{t('Pending')}</SelectItem>
                                        <SelectItem value="accepted">{t('Accepted')}</SelectItem>
                                        <SelectItem value="declined">{t('Declined')}</SelectItem>
                                        <SelectItem value="closed">{t('Closed')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('User')}</label>
                                <Select value={filters.user_id} onValueChange={(value) => setFilters({ ...filters, user_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by User')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users?.map((item: any) => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Start Date')}</label>
                                <DatePicker
                                    value={filters.start_date}
                                    onChange={(date) => setFilters({ ...filters, start_date: date })}
                                    placeholder={t('Filter by Start Date')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('End Date')}</label>
                                <DatePicker
                                    value={filters.end_date}
                                    onChange={(date) => setFilters({ ...filters, end_date: date })}
                                    placeholder={t('Filter by End Date')}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* List / Grid Content */}
                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={contracts?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={FileSignature}
                                            title={t('No Contracts found')}
                                            description={t('Get started by creating your first Contract.')}
                                            hasFilters={!!(filters.subject || filters.description || filters.type_id || filters.status || filters.user_id || filters.start_date || filters.end_date)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-contracts"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Contract')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {contracts?.data?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {contracts?.data?.map((contract) => {
                                        const progress = getDurationProgress(contract.start_date, contract.end_date);
                                        const progressBarColor = getProgressBarColor(progress, contract.end_date);
                                        const calculatedStatus = getContractStatus(contract);
                                        const displayValue = getContractStatusText(calculatedStatus, t);
                                        const colorClass = getContractStatusColor(calculatedStatus);
                                        const isOverdue = contract.end_date && new Date(contract.end_date) < new Date();

                                        return (
                                            <Card
                                                key={contract.id}
                                                className="p-0 flex flex-col border border-gray-300 dark:border-gray-600 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl overflow-hidden"
                                            >
                                                <CardContent className="p-4 flex flex-col gap-3 flex-1">

                                                    {/* Header row — name + actions */}
                                                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-300 dark:border-gray-600">
                                                        <h3
                                                            className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-snug cursor-pointer hover:text-primary transition-colors"
                                                            onClick={() => auth.user?.permissions?.includes('view-contracts') ? router.get(route('contract.show', contract.id)) : undefined}
                                                        >
                                                            {contract.subject}
                                                        </h3>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0 text-gray-400 hover:text-gray-600">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                {usePageButtons('contractActionBtn', contract).map((button) => (
                                                                    <div key={button.id} className="px-2 py-1.5">{button.component}</div>
                                                                ))}
                                                                {auth.user?.permissions?.includes('view-contracts') && (
                                                                    <DropdownMenuItem onClick={() => router.get(route('contract.show', contract.id))} className="gap-2 text-green-600 focus:text-green-700">
                                                                        <Eye className="h-3.5 w-3.5" />{t('View')}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {auth.user?.permissions?.includes('edit-contracts') && (
                                                                    <DropdownMenuItem onClick={() => openModal('edit', contract)} className="gap-2 text-blue-600 focus:text-blue-700">
                                                                        <EditIcon className="h-3.5 w-3.5" />{t('Edit')}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {auth.user?.permissions?.includes('duplicate-contracts') && (
                                                                    <DropdownMenuItem asChild>
                                                                        <DuplicateButton
                                                                            contract={contract}
                                                                            showTooltip={false}
                                                                            variant="ghost"
                                                                            size="default"
                                                                            className="w-full flex items-center justify-start gap-2 h-8 px-2 text-xs font-normal text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 rounded-sm cursor-pointer bg-transparent border-0 shadow-none"
                                                                        />
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {auth.user?.permissions?.includes('preview-contracts') && (
                                                                    <DropdownMenuItem onClick={() => router.get(route('contract.preview', contract.id))} className="gap-2 text-purple-600 focus:text-purple-700">
                                                                        <FileText className="h-3.5 w-3.5" />{t('Preview')}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {auth.user?.permissions?.includes('delete-contracts') && (
                                                                    <DropdownMenuItem onClick={() => openDeleteDialog(contract.id)} className="gap-2 text-red-500 focus:text-red-650">
                                                                        <Trash2 className="h-3.5 w-3.5" />{t('Delete')}
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Contract Progress */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <span className="inline-block w-3 h-3 opacity-60">#</span>
                                                                {contract.contract_number}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                ({progress}% {t('completed')})
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Assigned to + End Date (Deadline) */}
                                                    <div className="flex items-end justify-between gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{t('Assigned to')}</p>
                                                            <TooltipProvider>
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 cursor-pointer">
                                                                            <img
                                                                                src={contract.user?.avatar ? getImagePath(contract.user.avatar) : getImagePath('avatar.png')}
                                                                                alt={contract.user?.name}
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>{contract.user?.name || '-'}</p></TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{t('Deadline')}</p>
                                                            <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                                                                <span>{contract.end_date ? formatDate(contract.end_date) : '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bottom tags row — status + value + type */}
                                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ring-1 ring-inset capitalize ${colorClass}`}>
                                                            {displayValue}
                                                        </span>
                                                        {contract.value ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-650 font-semibold">
                                                                {formatCurrency(contract.value)}
                                                            </span>
                                                        ) : null}
                                                        {(contract.contract_type?.name || contract.contractType?.name) ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/45 dark:text-blue-450 dark:border-blue-800">
                                                                {contract.contract_type?.name || contract.contractType?.name}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={FileSignature}
                                    title={t('No Contracts found')}
                                    description={t('Get started by creating your first Contract.')}
                                    hasFilters={!!(filters.subject || filters.description || filters.type_id || filters.status || filters.user_id || filters.start_date || filters.end_date)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-contracts"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Contract')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-900/30 dark:border-gray-800">
                    <Pagination
                        data={contracts || { data: [], links: [], meta: {} }}
                        routeName="contract.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditContract
                        contract={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Contract')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
