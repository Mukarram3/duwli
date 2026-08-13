import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Users as UsersIcon, Download, FileImage, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, FileText, CheckCircle2, XCircle, Calendar, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { usePageButtons } from '@/hooks/usePageButtons';
import GenerateAvatar from '@/components/generate-avatar';
import RandomBadgeUI from '@/components/random-badge-ui';

import NoRecordsFound from '@/components/no-records-found';
import { Candidate, CandidatesIndexProps, CandidateFilters, CandidateModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { candidates, auth, jobpostings, candidatesources, stats } = usePage<CandidatesIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CandidateFilters>({
        name: urlParams.get('name') || '',
        job_id: urlParams.get('job_id') || 'all',
        source_id: urlParams.get('source_id') || 'all',
        status: urlParams.get('status') || '',
    });

    const [selectedYear, setSelectedYear] = useState(
        parseInt(urlParams.get('year') || '') || new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        urlParams.get('month') !== null && urlParams.get('month') !== ''
            ? parseInt(urlParams.get('month') || '0')
            : new Date().getMonth()
    );

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<CandidateModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const [showFilters, setShowFilters] = useState(false);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Job Application', settingKey: 'Dropbox Job Application' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.candidates.destroy',
        defaultMessage: t('Are you sure you want to delete this candidate?')
    });

    const handleFilter = () => {
        router.get(route('recruitment.candidates.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode, year: selectedYear, month: selectedMonth }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('recruitment.candidates.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode, year: selectedYear, month: selectedMonth }, {
            preserveState: true,
            replace: true
        });
    };

    const updateStatus = (candidateId: number, newStatus: string) => {
        router.patch(route('recruitment.candidates.update-status', candidateId), {
            status: newStatus
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Status updated successfully
            }
        });
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            job_id: 'all',
            source_id: 'all',
            status: '',
        });
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        router.get(route('recruitment.candidates.index'), { per_page: perPage, view: viewMode, year: currentYear, month: currentMonth });
    };

    const handleMonthYearChange = (year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);
        router.get(route('recruitment.candidates.index'), {
            ...filters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode,
            year,
            month
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);
        router.get(route('recruitment.candidates.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode, year: selectedYear, month: selectedMonth }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.status || 'all';

    const openModal = (mode: 'add' | 'edit', data: Candidate | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'tracking_id',
            header: t('Tracking ID'),
            sortable: true,
            render: (value: string, candidate: Candidate) =>
                auth.user?.permissions?.includes('view-candidates') ? (
                    <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                        onClick={() => router.get(route('recruitment.candidates.show', candidate.id))}
                    >
                        {value || '-'}
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                        {value || '-'}
                    </span>
                )
        },
        {
            key: 'name',
            header: t('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-';
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            {row.profile_path ? (
                                <img
                                    src={getImagePath(row.profile_path)}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <GenerateAvatar name={fullName} className="w-full h-full rounded-none text-xs font-bold" />
                            )}
                        </div>
                        <div className="flex flex-col text-start">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {fullName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {row.email || '-'}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'job_posting_title',
            header: t('Job'),
            sortable: false,
            render: (value: any, row: any) => row.job_posting?.title || '-'
        },
        {
            key: 'candidate_source_name',
            header: t('Source'),
            sortable: false,
            render: (value: any, row: any) => row.candidate_source?.name ? (
                <RandomBadgeUI name={row.candidate_source.name} />
            ) : '-'
        },
        {
            key: 'application_date',
            header: t('Application Date'),
            sortable: true,
            render: (value: any) => value ? (
                <div className="flex flex-col gap-1 text-start">
                    <span className="text-gray-900 dark:text-gray-100 text-sm font-semibold">
                        {formatDate(value)}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span>{formatDate(value)}</span>
                    </div>
                </div>
            ) : '-'
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: any, row: any) => {
                const statusOptions = { "0": "New", "1": "Screening", "2": "Interview", "3": "Offer", "4": "Hired", "5": "Rejected" };
                const statusColors = {
                    "0": "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
                    "1": "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
                    "2": "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20",
                    "3": "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
                    "4": "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
                    "5": "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
                };
                const displayValue = statusOptions[value] || value || '-';
                const colorClass = statusColors[value] || 'bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20';

                if (auth.user?.permissions?.includes('edit-candidates')) {
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors cursor-pointer hover:opacity-85 ${colorClass}`}>
                                    {t(displayValue)} <ChevronDown className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => updateStatus(row.id, '0')}>
                                    {t('New')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(row.id, '1')}>
                                    {t('Screening')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(row.id, '2')}>
                                    {t('Interview')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(row.id, '3')}>
                                    {t('Offer')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(row.id, '4')}>
                                    {t('Hired')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(row.id, '5')}>
                                    {t('Rejected')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                }

                return (
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colorClass}`}>
                        {t(displayValue)}
                    </span>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-candidates', 'edit-candidates', 'delete-candidates'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, candidate: Candidate) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-candidates') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('recruitment.candidates.show', candidate.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-candidates') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('recruitment.candidates.edit', candidate.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-candidates') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(candidate.id)}
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
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Candidates') }
            ]}
            pageTitle={t('Manage Candidates')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {dropboxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-candidates') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.get(route('recruitment.candidates.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Candidates')} />

            {/* Year & Month Selection Panel (Biometric Attendance Style) */}
            <Card className="mb-6 border border-gray-300 dark:border-zinc-700 shadow-sm overflow-hidden bg-card">
                {/* Header Row */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-250 dark:border-zinc-800">
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleMonthYearChange(selectedYear - 1, selectedMonth)}
                        className="h-8 w-8 rounded-full border border-gray-250 dark:border-zinc-800 hover:bg-muted"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 select-none">
                        <span className="font-semibold text-foreground">
                            {t(months[selectedMonth])} {selectedYear}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleMonthYearChange(selectedYear + 1, selectedMonth)}
                        className="h-8 w-8 rounded-full border border-gray-250 dark:border-zinc-800 hover:bg-muted"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Months Grid Row */}
                <div className="flex items-center border-t border-gray-250 dark:border-zinc-800">
                    {/* Left Month Arrow */}
                    <button
                        type="button"
                        onClick={() => {
                            let newMonth = selectedMonth - 1;
                            let newYear = selectedYear;
                            if (newMonth < 0) {
                                newMonth = 11;
                                newYear -= 1;
                            }
                            handleMonthYearChange(newYear, newMonth);
                        }}
                        className="h-16 px-4 flex items-center justify-center border-r border-gray-250 dark:border-zinc-800 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Months Scroll Container */}
                    <div className="flex-1 overflow-x-auto scrollbar-none min-w-0">
                        <div className="grid grid-cols-12 min-w-[760px] md:min-w-0">
                            {months.map((monthName, idx) => {
                                const isSelected = selectedMonth === idx;
                                const monthNumber = String(idx + 1).padStart(2, '0');

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleMonthYearChange(selectedYear, idx)}
                                        className={`h-16 flex flex-col items-center justify-center border-r border-gray-250 dark:border-zinc-800 transition-all last:border-r-0 ${isSelected
                                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm border-r-primary'
                                            : 'bg-background hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <span className={`text-[10px] tracking-wider mb-1 font-semibold ${isSelected ? 'text-primary-foreground/95' : 'text-gray-700 dark:text-zinc-300'}`}>
                                            {t(monthName)}
                                        </span>
                                        <span className="text-sm font-bold">
                                            {monthNumber}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Month Arrow */}
                    <button
                        type="button"
                        onClick={() => {
                            let newMonth = selectedMonth + 1;
                            let newYear = selectedYear;
                            if (newMonth > 11) {
                                newMonth = 0;
                                newYear += 1;
                            }
                            handleMonthYearChange(newYear, newMonth);
                        }}
                        className="h-16 px-4 flex items-center justify-center border-l border-gray-250 dark:border-zinc-800 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </Card>

            {/* Main Content Card */}
            <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({ ...filters, name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Candidates...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="recruitment.candidates.index"
                                filters={{ ...filters, view: viewMode, year: selectedYear, month: selectedMonth }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.job_id !== 'all' ? filters.job_id : '', filters.source_id !== 'all' ? filters.source_id : '', filters.status].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: stats?.total || 0 },
                            { key: '0', label: t('New'), icon: FileText, count: stats?.new || 0 },
                            { key: '1', label: t('Screening'), icon: Eye, count: stats?.screening || 0 },
                            { key: '2', label: t('Interview'), icon: Calendar, count: stats?.interview || 0 },
                            { key: '3', label: t('Offer'), icon: CheckCircle2, count: stats?.offer || 0 },
                            { key: '4', label: t('Hired'), icon: UsersIcon, count: stats?.hired || 0 },
                            { key: '5', label: t('Rejected'), icon: XCircle, count: stats?.rejected || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span>{tab.label}</span>
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Job')}</label>
                                <Select value={filters.job_id} onValueChange={(value) => setFilters({ ...filters, job_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Job')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Job')}</SelectItem>
                                        {jobpostings?.map((jobPosting: any) => (
                                            <SelectItem key={jobPosting.id} value={jobPosting.id.toString()}>
                                                {jobPosting.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Source')}</label>
                                <Select value={filters.source_id} onValueChange={(value) => setFilters({ ...filters, source_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Source')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Source')}</SelectItem>
                                        {candidatesources?.map((candidateSource: any) => (
                                            <SelectItem key={candidateSource.id} value={candidateSource.id.toString()}>
                                                {candidateSource.name}
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
                                data={candidates?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={UsersIcon}
                                        title={t('No Candidates found')}
                                        description={t('Get started by creating your first Candidate.')}
                                        hasFilters={!!(filters.name || (filters.job_id !== 'all' && filters.job_id) || (filters.source_id !== 'all' && filters.source_id) || filters.status)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-candidates"
                                        onCreateClick={() => router.get(route('recruitment.candidates.create'))}
                                        createButtonText={t('Create Candidate')}
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
                        data={candidates || { data: [], links: [], meta: {} }}
                        routeName="recruitment.candidates.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode, year: selectedYear, month: selectedMonth }}
                    />
                </CardContent>
            </Card>




            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Candidate')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}