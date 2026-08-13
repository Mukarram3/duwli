import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, TrendingUp, Eye, Calendar, LayoutGrid, PauseCircle, CheckCircle, Clock, AlertTriangle, AlertCircle, Sparkles, Target, ArrowLeft, DollarSign, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from '@/lib/utils';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import Create from './Create';
import Edit from './Edit';
import NoRecordsFound from '@/components/no-records-found';
import { GoalTracking, TrackingIndexProps, TrackingFilters, TrackingModalState } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { trackings, goals, auth, stats } = usePage<TrackingIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<TrackingFilters>({
        goal_name: urlParams.get('goal_name') || '',
        goal_id: urlParams.get('goal_id') || '',
        on_track_status: urlParams.get('on_track_status') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })(),
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<TrackingModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showFilters, setShowFilters] = useState(false);

    const trackingList = trackings?.data || [];
    const totalTrackings = stats?.total ?? trackings?.meta?.total ?? trackingList.length;
    const aheadCount = stats?.ahead ?? trackingList.filter(t => t.on_track_status === 'ahead').length;
    const onTrackCount = stats?.on_track ?? trackingList.filter(t => t.on_track_status === 'on_track').length;
    const behindCount = stats?.behind ?? trackingList.filter(t => t.on_track_status === 'behind').length;
    const criticalCount = stats?.critical ?? trackingList.filter(t => t.on_track_status === 'critical').length;
    const totalContribution = stats?.total_contribution ?? trackingList.reduce((sum, t) => sum + (parseFloat(t.contribution_amount) || 0), 0);

    const positiveCount = aheadCount + onTrackCount;

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, on_track_status: newStatus };
        setFilters(newFilters);
        
        const filterParams = {...newFilters};
        if (newFilters.date_range) {
            const [fromDate, toDate] = newFilters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('goal.tracking.index'), {...filterParams, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.on_track_status || 'all';

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'goal.tracking.destroy',
        defaultMessage: t('Are you sure you want to delete this tracking?')
    });

    const handleFilter = () => {
        const filterParams = {...filters};

        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('goal.tracking.index'), {...filterParams, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        const filterParams = {...filters};
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('goal.tracking.index'), {...filterParams, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            goal_name: '',
            goal_id: '',
            on_track_status: '',
            date_range: '',
        });
        router.get(route('goal.tracking.index'), {per_page: perPage});
    };



    const openModal = (mode: 'add' | 'edit', data: GoalTracking | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'goal',
            header: t('Goal'),
            sortable: false,
            render: (_: any, tracking: GoalTracking) => (
                <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground block">{tracking.goal?.goal_name || '-'}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                        <span>{t('Goal Type')}: <span className="capitalize">{tracking.goal?.goal_type?.replace('_', ' ') || '-'}</span></span>
                    </div>
                </div>
            )
        },
        {
            key: 'tracking_date',
            header: t('Date'),
            sortable: true,
            render: (_: any, tracking: GoalTracking) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-sm font-normal text-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span>{formatDate(tracking.tracking_date)}</span>
                    </div>
                    <span className={cn(
                        "text-xs block",
                        tracking.days_remaining < 0 
                            ? "text-rose-600 dark:text-rose-400 font-medium" 
                            : "text-muted-foreground"
                    )}>
                        {tracking.days_remaining < 0 
                            ? t('Overdue by {{days}} days', { days: Math.abs(tracking.days_remaining) }) 
                            : t('{{days}} days left', { days: tracking.days_remaining })}
                    </span>
                </div>
            )
        },
        {
            key: 'contribution_amount',
            header: t('Contribution / Current'),
            sortable: true,
            render: (_: any, tracking: GoalTracking) => (
                <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground block">{formatCurrency(tracking.contribution_amount)}</span>
                    <span className="text-xs text-muted-foreground block">{formatCurrency(tracking.current_amount)}</span>
                </div>
            )
        },
        {
            key: 'progress_percentage',
            header: t('Progress'),
            sortable: true,
            render: (value: number) => {
                const percent = Math.min(Math.round(value), 100);
                return (
                    <div className="space-y-1 w-[100px]">
                        <span className="text-xs font-semibold text-foreground block">{percent}%</span>
                        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    percent >= 100 ? "bg-emerald-500" : "bg-primary"
                                )}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'on_track_status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const colors: Record<string, string> = {
                    ahead: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30',
                    on_track: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-800/30',
                    behind: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-800/30',
                    critical: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-800/30'
                };
                const colorClass = colors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
                const label = value.replace('_', ' ');
                return (
                    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", colorClass)}>
                        {t(label.charAt(0).toUpperCase() + label.slice(1))}
                    </span>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-goal-tracking', 'edit-goal-tracking', 'delete-goal-tracking'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, tracking: GoalTracking) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-goal-tracking') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('goal.tracking.show', tracking.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-goal-tracking') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', tracking)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-goal-tracking') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(tracking.id)}
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
                {label: t('Goal')},
                {label: t('Tracking')}
            ]}
            pageTitle={t('Manage Tracking')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-goal-tracking') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')} className="rounded-lg shadow-sm gap-1">
                                    <Plus className="h-4 w-4" />
                                    <span>{t('New Tracking')}</span>
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
            <Head title={t('Tracking')} />

            {/* KPI Cards Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-6">
                {/* Small KPI Cards Grid */}
                <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Card 1: Total Trackings */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Trackings')}</CardTitle>
                            <Activity className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalTrackings}</div>
                            <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All records')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 2: On Track */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('On Track')}</CardTitle>
                            <CheckCircle className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{positiveCount}</div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{t('On track / Ahead')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Behind */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Behind')}</CardTitle>
                            <Clock className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{behindCount}</div>
                            <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{t('Requires focus')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Critical */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">{t('Critical')}</CardTitle>
                            <AlertCircle className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{criticalCount}</div>
                            <p className="text-xs text-rose-700 dark:text-rose-400 opacity-80 mt-1">{t('Immediate action')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Wide Progress Card */}
                <div className="xl:col-span-4">
                    <Card className="relative overflow-hidden bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-800/50 rounded-xl h-full flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">{t('Total Contributions')}</CardTitle>
                            <TrendingUp className="h-8 w-8 text-teal-700 dark:text-teal-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-center justify-between gap-6 flex-1">
                            <div className="space-y-0.5">
                                <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{formatCurrency(totalContribution)}</div>
                                <p className="text-xs text-teal-700 dark:text-teal-400 opacity-80 mt-1">{t('Cumulative contribution')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="shadow-sm rounded-xl border border-border/50 bg-card overflow-hidden">
                <CardContent className="p-5 border-b border-border/40 bg-muted/[0.02]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.goal_name}
                                onChange={(value) => setFilters({...filters, goal_name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search Goals...')}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <PerPageSelector
                                routeName="goal.tracking.index"
                                filters={{...filters}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.goal_id, filters.date_range].filter(f => f !== '' && f !== null && f !== undefined).length;
                                    return activeFilters > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border border-background">
                                            {activeFilters}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Status Tabs */}
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 border-border/40">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all',       label: t('All'),       icon: LayoutGrid,    count: totalTrackings },
                            { key: 'ahead',     label: t('Ahead'),     icon: Sparkles,      count: aheadCount },
                            { key: 'on_track',  label: t('On Track'),  icon: CheckCircle,   count: onTrackCount },
                            { key: 'behind',    label: t('Behind'),    icon: Clock,         count: behindCount },
                            { key: 'critical',  label: t('Critical'),  icon: AlertCircle,   count: criticalCount },
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
                                <span>{tab.label}</span>
                                <span className={cn(
                                    "inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors",
                                    activeTab === tab.key
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>

                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 dark:bg-blue-950/20 border-b border-border/40">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Goal')}</label>
                                <Select value={filters.goal_id || 'all'} onValueChange={(value) => setFilters({...filters, goal_id: value === 'all' ? '' : value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Goal')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Goals')}</SelectItem>
                                        {goals?.map((goal) => (
                                            <SelectItem key={goal.id} value={goal.id.toString()}>
                                                {goal.goal_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Date Range')}</label>
                                <DateRangePicker
                                    value={filters.date_range}
                                    onChange={(value) => setFilters({...filters, date_range: value})}
                                    placeholder={t('Select date range')}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                        <DataTable
                            data={trackings?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={TrendingUp}
                                    title={t('No Tracking found')}
                                    description={t('Get started by creating your first Tracking.')}
                                    hasFilters={!!(filters.goal_name || filters.goal_id || filters.on_track_status || filters.date_range)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-goal-tracking"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Tracking')}
                                    className="h-auto"
                                />
                            }
                        />
                        </div>
                    </div>
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={trackings || { data: [], links: [], meta: {} }}
                        routeName="goal.tracking.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create goals={goals} onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <Edit
                        tracking={modalState.data}
                        goals={goals}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Tracking')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
