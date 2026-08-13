import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Eye, BarChart3, FolderKanban, CheckCircle2, Play, PauseCircle, AlertCircle, LayoutGrid } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

import { PerPageSelector } from '@/components/ui/per-page-selector';
import { FilterButton } from '@/components/ui/filter-button';
import { DatePicker } from '@/components/ui/date-picker';
import NoRecordsFound from '@/components/no-records-found';
import { formatDate } from '@/utils/helpers';

interface ProjectReportItem {
    id: number;
    name: string;
    start_date?: string;
    end_date?: string;
    status: string;
    tasks_count: string;
    bugs_count: string;
    milestones_count: string;
}

interface ProjectReportIndexProps {
    projects: {
        data: ProjectReportItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    users: Array<{
        id: number;
        name: string;
    }>;
    auth: {
        user: {
            permissions: string[];
        };
    };
    stats: {
        total: number;
        ongoing: number;
        onhold: number;
        finished: number;
        overdue: number;
    };
}

export default function Index() {
    const { t } = useTranslation();
    const { projects, users, auth, stats } = usePage<ProjectReportIndexProps>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState({
        name: urlParams.get('name') || '',
        status: urlParams.get('status') || '',
        date: urlParams.get('date') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState(urlParams.get('status') || 'all');

    const handleFilter = () => {
        router.get(route('project.report.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('project.report.index'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', status: '', date: '' });
        setActiveTab('all');
        router.get(route('project.report.index'), {per_page: perPage});
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const newStatus = tab === 'all' ? '' : tab;
        setFilters(prev => ({ ...prev, status: newStatus }));
        router.get(route('project.report.index'), {
            name: filters.name,
            date: filters.date,
            status: newStatus,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
        }, { preserveState: true, replace: true });
    };

    const getStatusBadge = (status: string) => {
        const configs = {
            'Ongoing': 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
            'Onhold': 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
            'Finished': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
        };
        return configs[status as keyof typeof configs] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    };

    const getProjectIconBg = (status: string) => {
        const icons = {
            'Ongoing': 'bg-blue-50 text-blue-500',
            'Onhold': 'bg-amber-50 text-amber-500',
            'Finished': 'bg-emerald-50 text-emerald-500'
        };
        return icons[status as keyof typeof icons] || 'bg-gray-50 text-gray-500';
    };

    const parseCount = (value: string) => {
        const [completed, total] = (value || '0/0').split('/');
        return {
            completed: parseInt(completed) || 0,
            total: parseInt(total) || 0,
            percentage: total !== '0' ? Math.round((parseInt(completed) || 0) / (parseInt(total) || 1) * 100) : 0
        };
    };

    const isOverdue = (endDate?: string, status?: string) => {
        return endDate && new Date(endDate) < new Date() && status !== 'Finished';
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Project Name'),
            sortable: true,
            className: 'w-[200px]',
            render: (value: string, item: ProjectReportItem) => {
                return (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getProjectIconBg(item.status)}`}>
                            <FolderKanban className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('Web Development')}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'tasks_count',
            header: (
                <div className="text-center w-full">
                    <div>{t('Tasks')}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{t('Total')}</div>
                </div>
            ),
            className: 'w-[60px]',
            render: (value: string) => {
                const { completed, total } = parseCount(value);
                return (
                    <div className="text-center w-full">
                        <span className="text-sm font-medium text-foreground">{completed} / {total}</span>
                    </div>
                );
            }
        },
        {
            key: 'bugs_count',
            header: (
                <div className="text-center w-full">
                    <div>{t('Bugs')}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{t('Open')}</div>
                </div>
            ),
            className: 'w-[50px]',
            render: (value: string) => {
                const { completed, total } = parseCount(value);
                const openBugs = total - completed;
                return (
                    <div className="text-center w-full">
                        <span className={`text-sm font-medium ${openBugs > 0 ? 'text-red-500' : 'text-foreground'}`}>
                            {openBugs}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'milestones_count',
            header: (
                <div className="text-center w-full">
                    <div>{t('Milestones')}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{t('Done / Total')}</div>
                </div>
            ),
            className: 'w-[80px]',
            render: (value: string) => {
                const { completed, total, percentage } = parseCount(value);
                return (
                    <div className="text-center w-full px-1">
                        <span className="text-sm font-medium text-foreground">{completed} / {total}</span>
                        {total > 0 && (
                            <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5 mx-auto" style={{ maxWidth: '60px' }}>
                                <div 
                                    className="bg-emerald-500 h-1 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'start_date',
            header: <div className="text-center w-full">{t('Start Date')}</div>,
            className: 'w-[80px]',
            render: (value: string) => (
                <div className="text-center w-full">
                    <span className="text-sm text-foreground">{value ? formatDate(value) : '-'}</span>
                </div>
            )
        },
        {
            key: 'end_date',
            header: <div className="text-center w-full">{t('End Date')}</div>,
            className: 'w-[80px]',
            render: (value: string, item: ProjectReportItem) => {
                const overdue = isOverdue(value, item.status);
                return (
                    <div className="text-center w-full">
                        <span className={`text-sm ${overdue ? 'text-red-500 font-medium' : 'text-foreground'}`}>
                            {value ? formatDate(value) : '-'}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: <div className="text-center w-full">{t('Status')}</div>,
            className: 'w-[70px]',
            render: (value: string) => (
                <div className="flex justify-center w-full">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(value)}`}>
                        {t(value)}
                    </span>
                </div>
            )
        },
        {
            key: 'progress',
            header: <div className="text-center w-full">{t('Progress')}</div>,
            className: 'w-[100px]',
            render: (_: any, item: ProjectReportItem) => {
                const tasks = parseCount(item.tasks_count);
                const percentage = tasks.percentage;
                let progressColor = 'bg-blue-500';
                if (percentage === 100) progressColor = 'bg-emerald-500';
                else if (percentage >= 50) progressColor = 'bg-blue-500';
                else if (percentage > 0) progressColor = 'bg-amber-500';
                else progressColor = 'bg-gray-300';

                return (
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-sm font-medium text-foreground w-8 text-right">{percentage}%</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div 
                                className={`${progressColor} h-2 rounded-full transition-all`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        ...(auth.user?.permissions?.includes('view-project') ? [{
            key: 'actions',
            header: <div className="text-center w-full">{t('Actions')}</div>,
            className: 'w-[50px]',
            render: (_: any, item: ProjectReportItem) => (
                <div className="flex items-center justify-center w-full">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.get(route('project.report.show', item.id))}
                                    className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('View')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Project'), url: route('project.dashboard.index')},
                {label: t('Project Reports')},
            ]}
            pageTitle={t('Manage Project Reports')}
        >
            <Head title={t('Project Reports')} />

            {/* Summary Stats Cards - Matching Projects Page Style */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Projects')}</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.total}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('All time')}</p>
                            </div>
                            <LayoutGrid className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Ongoing')}</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.ongoing}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{stats.total > 0 ? Math.round((stats.ongoing / stats.total) * 100) : 0}% {t('of total')}</p>
                            </div>
                            <Play className="h-8 w-8 text-emerald-600 dark:text-emerald-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('On Hold')}</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.onhold}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{stats.total > 0 ? Math.round((stats.onhold / stats.total) * 100) : 0}% {t('of total')}</p>
                            </div>
                            <PauseCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Completed')}</p>
                                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 mt-1">{stats.finished}</p>
                                <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">{stats.total > 0 ? Math.round((stats.finished / stats.total) * 100) : 0}% {t('of total')}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-violet-600 dark:text-violet-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:from-red-900/30 dark:to-red-800/20 dark:border-red-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">{t('Overdue')}</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{stats.overdue}</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0}% {t('of total')}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm dark:border-gray-700">
                <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({...filters, name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search projects by name, client...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <PerPageSelector
                                routeName="project.report.index"
                                filters={{...filters}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.date].filter(Boolean).length;
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

                {/* Status Filter Tabs - Matching Projects Page */}
                <CardContent className="px-4 py-0 border-b bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-1 overflow-x-auto">
                            {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: stats.total },
                            { key: 'Ongoing', label: t('Ongoing'), icon: Play, count: stats.ongoing },
                            { key: 'Onhold', label: t('On Hold'), icon: PauseCircle, count: stats.onhold },
                            { key: 'Finished', label: t('Finished'), icon: CheckCircle2, count: stats.finished },
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

                {/* Date Filter Only - Status removed */}
                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 dark:bg-blue-950/20 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Date Range')}</label>
                                <DatePicker
                                    value={filters.date}
                                    onChange={(value) => setFilters({...filters, date: value})}
                                    placeholder={t('Select date')}
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
                        <div className="min-w-[1000px]">
                            <DataTable
                                data={projects.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={BarChart3}
                                        title={t('No project reports found')}
                                        description={t('No projects available for reporting.')}
                                        hasFilters={!!(filters.name || filters.status || filters.date)}
                                        onClearFilters={clearFilters}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                    <Pagination
                        data={projects}
                        routeName="project.report.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
