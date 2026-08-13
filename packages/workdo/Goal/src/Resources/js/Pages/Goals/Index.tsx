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
import { 
    Plus, 
    Edit as EditIcon, 
    Trash2, 
    Target, 
    Eye, 
    Flag, 
    CheckCircle, 
    Folder, 
    Calendar, 
    TrendingUp, 
    Shield, 
    DollarSign, 
    Award,
    Settings,
    MoreVertical,
    CalendarDays,
    Play,
    PauseCircle,
    AlertCircle,
    LayoutGrid
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Create from './Create';
import EditGoal from './Edit';
import ViewGoal from './View';
import NoRecordsFound from '@/components/no-records-found';
import { Goal, GoalsIndexProps, GoalFilters, GoalModalState } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { cn } from "@/lib/utils";

const getGoalTypeLabel = (type: string) => {
    if (!type) return '';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getGoalTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        savings: 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-950/20 dark:text-pink-400 dark:ring-pink-800/30',
        expense_reduction: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/20 dark:text-orange-400 dark:ring-orange-800/30',
        debt_reduction: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/20 dark:text-purple-400 dark:ring-purple-800/30'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
};

export default function Index() {
    const { t } = useTranslation();
    const { goals, categories, auth, stats } = usePage<GoalsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<GoalFilters>({
        goal_name: urlParams.get('goal_name') || '',
        goal_type: urlParams.get('goal_type') || '',
        status: urlParams.get('status') || '',
        priority: urlParams.get('priority') || '',
        category_id: urlParams.get('category_id') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<GoalModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Goal | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'goal.goals.destroy',
        defaultMessage: t('Are you sure you want to delete this goal?')
    });

    const handleFilter = () => {
        router.get(route('goal.goals.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('goal.goals.index'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            goal_name: '',
            goal_type: '',
            status: '',
            priority: '',
            category_id: '',
        });
        router.get(route('goal.goals.index'), {per_page: perPage});
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);
        router.get(route('goal.goals.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.status || 'all';

    const openModal = (mode: 'add' | 'edit', data: Goal | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const getDaysLeft = (targetDate: string, status: string) => {
        if (status === 'completed') return t('Completed');
        const target = new Date(targetDate);
        const today = new Date();
        target.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return t('{{days}} days overdue', { days: Math.abs(diffDays) });
        }
        return t('{{days}} days left', { days: diffDays });
    };

    const tableColumns = [
        {
            key: 'goal_name',
            header: t('Goal'),
            sortable: true,
            render: (value: string, goal: Goal) => {
                const getIcon = () => {
                    switch (goal.goal_type) {
                        case 'savings': 
                            return <Target className="h-4 w-4 text-pink-500" />;
                        case 'debt_reduction': 
                            return <Flag className="h-4 w-4 text-purple-500" />;
                        case 'expense_reduction': 
                            return <CheckCircle className="h-4 w-4 text-orange-500" />;
                        default: 
                            return <Target className="h-4 w-4 text-primary" />;
                    }
                };
                return (
                    <div className="flex items-center gap-3 py-1">
                        <div className="p-2.5 bg-muted/40 rounded-xl flex items-center justify-center border border-border/20">
                            {getIcon()}
                        </div>
                        <div className="min-w-0">
                            <span className="font-semibold text-foreground block truncate max-w-[200px] leading-snug">{goal.goal_name}</span>
                            {goal.goal_description && (
                                <span className="text-xs text-muted-foreground block truncate max-w-[250px] mt-0.5">{goal.goal_description}</span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'category',
            header: t('Category'),
            sortable: false,
            render: (_: any, goal: Goal) => {
                return goal.category ? (
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-900/30 dark:text-slate-400 dark:ring-slate-800/50">
                        {goal.category.category_name}
                    </span>
                ) : '-';
            }
        },
        {
            key: 'goal_type',
            header: t('Type'),
            sortable: false,
            render: (value: string) => (
                <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", getGoalTypeColor(value))}>
                    {t(getGoalTypeLabel(value))}
                </span>
            )
        },
        {
            key: 'target_amount',
            header: t('Target / Current'),
            sortable: false,
            render: (_: any, goal: Goal) => (
                <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground block">{formatCurrency(goal.target_amount)}</span>
                    <span className="text-xs text-muted-foreground block">{formatCurrency(goal.current_amount)}</span>
                </div>
            )
        },
        {
            key: 'progress',
            header: t('Progress'),
            sortable: false,
            render: (_: any, goal: Goal) => {
                const progress = goal.target_amount > 0 ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100) : 0;
                let progressColor = 'bg-primary';
                if (progress >= 100 || goal.status === 'completed') progressColor = 'bg-emerald-500';
                
                return (
                    <div className="space-y-1.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-xs font-normal text-foreground">
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/10">
                            <div
                                className={cn("h-full rounded-full transition-all duration-300", progressColor)}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'target_date',
            header: t('Target Date'),
            sortable: false,
            render: (value: string, goal: Goal) => {
                const target = new Date(value);
                const today = new Date();
                target.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                const isOverdue = target < today && goal.status !== 'completed';
                return (
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-sm font-normal">
                            <Calendar className={cn("h-4 w-4 flex-shrink-0", isOverdue ? "text-rose-500" : "text-gray-400")} />
                            <span className={cn(isOverdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-foreground")}>
                                {formatDate(value)}
                            </span>
                        </div>
                        <span className={cn("text-xs block pl-[22px]", isOverdue ? "text-rose-500 font-medium" : "text-muted-foreground")}>
                            {getDaysLeft(value, goal.status)}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'priority',
            header: t('Priority'),
            sortable: false,
            render: (value: string) => {
                const colors: Record<string, string> = {
                    critical: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-800/30',
                    high: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/20 dark:text-orange-400 dark:ring-orange-800/30',
                    medium: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-800/30',
                    low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30'
                };
                const colorClass = colors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
                return (
                    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", colorClass)}>
                        {t(value.charAt(0).toUpperCase() + value.slice(1))}
                    </span>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const colors: Record<string, string> = {
                    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30',
                    active: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-800/30',
                    draft: 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-zinc-800/40 dark:text-gray-400 dark:ring-zinc-700/30'
                };
                const colorClass = colors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
                return (
                    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", colorClass)}>
                        {t(value.charAt(0).toUpperCase() + value.slice(1))}
                    </span>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-goals', 'edit-goals', 'delete-goals'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, goal: Goal) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {goal.status === 'draft' && auth.user?.permissions?.includes('active-goals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('goal.goals.active', goal.id))} className="h-8 w-8 p-0 text-foreground/70 hover:text-foreground">
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Once the status becomes Active, it cannot be edited')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-goals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(goal)} className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {goal.status === 'draft' && auth.user?.permissions?.includes('edit-goals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', goal)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-goals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(goal.id)}
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

    const totalGoals = stats?.total ?? 0;
    const activeGoals = stats?.active ?? 0;
    const completedGoals = stats?.completed ?? 0;
    const draftGoals = stats?.draft ?? 0;
    const totalTarget = stats?.total_target ?? 0;
    const totalCurrent = stats?.total_current ?? 0;
    const totalProgressPercent = totalTarget > 0 ? Math.min(Math.round((totalCurrent / totalTarget) * 100), 100) : 0;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Goal')},
                {label: t('Goals')}
            ]}
            pageTitle={t('Manage Goals')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-goals') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')} className="rounded-lg shadow-sm gap-1">
                                    <Plus className="h-4 w-4" />
                                    <span>{t('New Goal')}</span>
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
            <Head title={t('Goals')} />

            {/* KPI Cards Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-6">
                {/* Small KPI Cards Grid */}
                <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {/* Card 1: Total Goals */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Goals')}</CardTitle>
                            <Target className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalGoals}</div>
                            <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All time')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Active */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Active')}</CardTitle>
                            <Play className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{activeGoals}</div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{totalGoals > 0 ? Math.round((activeGoals / totalGoals) * 100) : 0}% {t('of total')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Completed */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Completed')}</CardTitle>
                            <Award className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{completedGoals}</div>
                            <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">{totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}% {t('of total')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Draft */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Draft')}</CardTitle>
                            <PauseCircle className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{draftGoals}</div>
                            <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{totalGoals > 0 ? Math.round((draftGoals / totalGoals) * 100) : 0}% {t('of total')}</p>
                        </CardContent>
                    </Card>

                    {/* Card 5: Total Target */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 flex flex-col justify-between rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">{t('Total Target')}</CardTitle>
                            <DollarSign className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-80" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-base font-bold text-rose-700 dark:text-rose-300 truncate" title={formatCurrency(totalTarget)}>{formatCurrency(totalTarget)}</div>
                            <p className="text-xs text-rose-700 dark:text-rose-400 opacity-80 mt-1">{t('Total target value')}</p>
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
                                <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{formatCurrency(totalCurrent)}</div>
                                <p className="text-xs text-teal-700 dark:text-teal-400 opacity-80 mt-1">{t('Total Current')}</p>
                            </div>
                            <div className="flex-1 space-y-1.5 pb-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-300">
                                    <span>{t('Current Amount')}</span>
                                    <span>{totalProgressPercent}%</span>
                                </div>
                                <div className="w-full bg-teal-200/50 dark:bg-teal-950/40 rounded-full h-2 overflow-hidden border border-teal-300/30">
                                    <div
                                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                        style={{ width: `${totalProgressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content Area */}
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
                                routeName="goal.goals.index"
                                filters={filters}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.goal_type, filters.status, filters.priority, filters.category_id].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all',       label: t('All'),       icon: LayoutGrid,  count: stats?.total || 0 },
                            { key: 'draft',     label: t('Draft'),     icon: PauseCircle, count: stats?.draft || 0 },
                            { key: 'active',    label: t('Active'),    icon: Play,        count: stats?.active || 0 },
                            { key: 'completed', label: t('Completed'), icon: CheckCircle, count: stats?.completed || 0 },
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
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>

                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 dark:bg-blue-950/20 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Goal Type')}</label>
                                <Select value={filters.goal_type} onValueChange={(value) => setFilters({...filters, goal_type: value})}>
                                    <SelectTrigger className="rounded-lg border-border/60">
                                        <SelectValue placeholder={t('Filter by Type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="savings">{t('Savings')}</SelectItem>
                                        <SelectItem value="debt_reduction">{t('Debt Reduction')}</SelectItem>
                                        <SelectItem value="expense_reduction">{t('Expense Reduction')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Priority')}</label>
                                <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                                    <SelectTrigger className="rounded-lg border-border/60">
                                        <SelectValue placeholder={t('Filter by Priority')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">{t('Low')}</SelectItem>
                                        <SelectItem value="medium">{t('Medium')}</SelectItem>
                                        <SelectItem value="high">{t('High')}</SelectItem>
                                        <SelectItem value="critical">{t('Critical')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Category')}</label>
                                <Select value={filters.category_id} onValueChange={(value) => setFilters({...filters, category_id: value})}>
                                    <SelectTrigger className="rounded-lg border-border/60">
                                        <SelectValue placeholder={t('Filter by Category')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.category_name}
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

                <CardContent className="p-0">

                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[1200px]">
                                <DataTable
                                    data={goals?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none border-0"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Target}
                                            title={t('No Goals found')}
                                            description={t('Get started by creating your first Goal.')}
                                            hasFilters={!!(filters.goal_name || filters.goal_type || filters.status || filters.priority || filters.category_id)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-goals"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Goal')}
                                            className="h-auto py-12"
                                        />
                                    }
                                />
                            </div>
                        </div>
                </CardContent>

                <CardContent className="px-5 py-3.5 border-t border-border/40 bg-muted/[0.02]">
                    <Pagination
                        data={goals || { data: [], links: [], meta: {} }}
                        routeName="goal.goals.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditGoal
                        goal={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <ViewGoal goal={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Goal')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
