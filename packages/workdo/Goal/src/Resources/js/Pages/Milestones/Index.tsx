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
import { Plus, Edit as EditIcon, Trash2, Flag, ArrowLeft, Eye, Calendar, LayoutGrid, PauseCircle, CheckCircle, TrendingUp, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from '@/lib/utils';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import Create from './Create';
import EditMilestone from './Edit';
import ViewMilestone from './View';
import NoRecordsFound from '@/components/no-records-found';
import { GoalMilestone, MilestonesIndexProps, MilestoneFilters, MilestoneModalState } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { milestones, goals, auth, stats } = usePage<MilestonesIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<MilestoneFilters>({
        milestone_name: urlParams.get('milestone_name') || '',
        status: urlParams.get('status') || '',
        goal_id: urlParams.get('goal_id') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })(),
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<MilestoneModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<GoalMilestone | null>(null);
    const [showFilters, setShowFilters] = useState(false);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'goal.milestones.destroy',
        defaultMessage: t('Are you sure you want to delete this milestone?')
    });

    const milestoneList = milestones?.data || [];
    const totalMilestones = stats?.total ?? milestones?.meta?.total ?? milestoneList.length;
    const achievedMilestones = stats?.achieved ?? milestoneList.filter(m => m.status === 'achieved').length;
    const pendingMilestones = stats?.pending ?? milestoneList.filter(m => m.status === 'pending').length;
    
    const overdueMilestones = stats?.overdue ?? (() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return milestoneList.filter(m => m.status !== 'achieved' && m.target_date < todayStr).length;
    })();

    const totalTargetAmount = stats?.total_target ?? milestoneList.reduce((sum, m) => sum + (parseFloat(m.target_amount) || 0), 0);
    const totalAchievedAmount = stats?.total_achieved ?? milestoneList.reduce((sum, m) => sum + (parseFloat(m.achieved_amount) || 0), 0);
    const progressPercent = totalTargetAmount > 0 ? Math.min(Math.round((totalAchievedAmount / totalTargetAmount) * 100), 100) : 0;

    const handleFilter = () => {
        const filterParams = {...filters};

        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('goal.milestones.index'), {...filterParams, per_page: perPage, sort: sortField, direction: sortDirection}, {
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

        router.get(route('goal.milestones.index'), {...filterParams, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            milestone_name: '',
            status: '',
            goal_id: '',
            date_range: '',
        });
        router.get(route('goal.milestones.index'), {per_page: perPage});
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);
        
        const filterParams = {...newFilters};
        if (newFilters.date_range) {
            const [fromDate, toDate] = newFilters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('goal.milestones.index'), {...filterParams, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.status || 'all';

    const openModal = (mode: 'add' | 'edit', data: GoalMilestone | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'milestone_name',
            header: t('Milestone / Goal'),
            sortable: true,
            render: (_: any, milestone: GoalMilestone) => (
                <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground block">{milestone.milestone_name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                        <span>{milestone.goal?.goal_name || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'target_amount',
            header: t('Target / Achieved'),
            sortable: true,
            render: (_: any, milestone: GoalMilestone) => (
                <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground block">{formatCurrency(milestone.target_amount)}</span>
                    <span className="text-xs text-muted-foreground block">{formatCurrency(milestone.achieved_amount || 0)}</span>
                </div>
            )
        },
        {
            key: 'progress',
            header: t('Progress'),
            sortable: false,
            render: (_: any, milestone: GoalMilestone) => {
                const target = parseFloat(milestone.target_amount as any) || 0;
                const achieved = parseFloat(milestone.achieved_amount as any) || 0;
                const percent = target > 0 ? Math.min(Math.round((achieved / target) * 100), 100) : 0;
                return (
                    <div className="space-y-1 w-[100px]">
                        <span className="text-xs font-semibold text-foreground block">{percent}%</span>
                        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    milestone.status === 'achieved' ? "bg-emerald-500" : "bg-primary"
                                )}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'achieved_date',
            header: t('Achieved Date'),
            sortable: false,
            render: (value: string) => {
                if (!value) return '-';
                return (
                    <div className="flex items-center gap-1.5 text-sm font-normal">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="text-foreground">{formatDate(value)}</span>
                    </div>
                );
            }
        },
        {
            key: 'target_date',
            header: t('Target Date'),
            sortable: false,
            render: (value: string, milestone: GoalMilestone) => {
                const target = new Date(value);
                const today = new Date();
                target.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                const isOverdue = target < today && milestone.status !== 'achieved';
                return (
                    <div className="flex items-center gap-1.5 text-sm font-normal">
                        <Calendar className={cn("h-4 w-4 flex-shrink-0", isOverdue ? "text-rose-500" : "text-gray-400")} />
                        <span className={cn(isOverdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-foreground")}>
                            {formatDate(value)}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const colors: Record<string, string> = {
                    achieved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30',
                    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-800/30',
                    overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-800/30'
                };
                const colorClass = colors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
                return (
                    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", colorClass)}>
                        {t(value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1))}
                    </span>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-goal-milestones', 'edit-goal-milestones', 'delete-goal-milestones'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, milestone: GoalMilestone) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-goal-milestones') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(milestone)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-goal-milestones') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', milestone)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-goal-milestones') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(milestone.id)}
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
                {label: t('Milestones')}
            ]}
            pageTitle={t('Manage Milestones')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-goal-milestones') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')} className="rounded-lg shadow-sm gap-1">
                                    <Plus className="h-4 w-4" />
                                    <span>{t('New Milestone')}</span>
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
            <Head title={t('Milestones')} />

            {/* KPI Cards Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-6">
                {/* Small KPI Cards Grid */}
                <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Card 1: Total Milestones */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Milestones')}</CardTitle>
                            <Flag className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalMilestones}</div>
                            <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All time')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Achieved */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Achieved')}</CardTitle>
                            <CheckCircle className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{achievedMilestones}</div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{t('Current page')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Pending */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Pending')}</CardTitle>
                            <PauseCircle className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingMilestones}</div>
                            <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{t('Current page')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Overdue */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">{t('Overdue')}</CardTitle>
                            <Calendar className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{overdueMilestones}</div>
                            <p className="text-xs text-rose-700 dark:text-rose-400 opacity-80 mt-1">{t('Requires action')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Wide Progress Card */}
                <div className="xl:col-span-4">
                    <Card className="relative overflow-hidden bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-800/50 rounded-xl h-full flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">{t('Current Progress')}</CardTitle>
                            <TrendingUp className="h-8 w-8 text-teal-700 dark:text-teal-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-end justify-between gap-6 flex-1">
                            <div className="space-y-0.5">
                                <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{formatCurrency(totalAchievedAmount)}</div>
                                <p className="text-xs text-teal-700 dark:text-teal-400 opacity-80 mt-1">{t('Total Achieved')}</p>
                            </div>
                            <div className="flex-1 space-y-1.5 pb-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-300">
                                    <span>{t('Achieved Ratio')}</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-teal-200/50 dark:bg-teal-950/40 rounded-full h-2 overflow-hidden border border-teal-300/30">
                                    <div
                                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
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
                                value={filters.milestone_name}
                                onChange={(value) => setFilters({...filters, milestone_name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search Milestones...')}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <PerPageSelector
                                routeName="goal.milestones.index"
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
                            { key: 'all',       label: t('All'),       icon: LayoutGrid,    count: totalMilestones },
                            { key: 'pending',   label: t('Pending'),   icon: PauseCircle,   count: pendingMilestones },
                            { key: 'achieved',  label: t('Achieved'),  icon: CheckCircle,   count: achievedMilestones },
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
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Target Date Range')}</label>
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
                            data={milestones?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={Flag}
                                    title={t('No Milestones found')}
                                    description={t('Get started by creating your first Milestone.')}
                                    hasFilters={!!(filters.milestone_name || filters.status || filters.goal_id || filters.date_range)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-goal-milestones"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Milestone')}
                                    className="h-auto"
                                />
                            }
                        />
                        </div>
                    </div>
                </CardContent>

                <CardContent className="px-5 py-4 border-t border-border/40 bg-muted/[0.02]">
                    <Pagination
                        data={milestones || { data: [], links: [], meta: {} }}
                        routeName="goal.milestones.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create goals={goals} onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditMilestone
                        milestone={modalState.data}
                        goals={goals}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <ViewMilestone milestone={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Milestone')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
