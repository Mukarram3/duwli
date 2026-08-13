import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from '@/components/charts/PieChart';
import { BarChart } from '@/components/charts/BarChart';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getImagePath, formatCurrency, formatDate } from '@/utils/helpers';
import {
    CalendarDays, Users, CheckCircle, Clock, BarChart3,
    PieChart as PieChartIcon, TrendingUp, Target, Activity,
    AlertCircle, CheckCheck, Timer, DollarSign
} from 'lucide-react';

interface ProjectReportViewProps {
    project: {
        id: number;
        name: string;
        description?: string;
        start_date?: string;
        end_date?: string;
        status: string;
        budget?: number;
    };
    taskStatusData: Array<{
        name: string;
        value: number;
        color?: string;
    }>;
    taskPriorityData: Array<{
        name: string;
        value: number;
    }>;
    projectStats: {
        total_tasks: number;
        completed_tasks: number;
        in_progress_tasks: number;
        team_members: number;
    };
    usersData: Array<{
        id: number;
        name: string;
        avatar?: string;
        assigned_tasks: number;
        done_tasks: number;
    }>;
    milestonesData: Array<{
        id: number;
        name: string;
        progress: number;
        cost: number;
        status: string;
        start_date?: string;
        end_date?: string;
    }>;
}

export default function View() {
    const { t } = useTranslation();
    const { project, taskStatusData, taskPriorityData, projectStats, usersData, milestonesData } = usePage<ProjectReportViewProps>().props;

    const getStatusColor = (status: string) => {
        const colors = {
            'active': 'bg-green-100 text-green-800',
            'completed': 'bg-blue-100 text-blue-800',
            'on_hold': 'bg-yellow-100 text-yellow-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const completionPercentage = projectStats.total_tasks > 0
        ? Math.round((projectStats.completed_tasks / projectStats.total_tasks) * 100)
        : 0;

    const statusBadgeStyle = (status: string) => {
        if (status === 'Finished')  return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
        if (status === 'Ongoing')   return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
        if (status === 'Onhold')    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
        return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300';
    };

    const milestoneBadgeStyle = (status: string) => {
        if (status === 'Complete')   return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
        if (status === 'Ongoing')    return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200';
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Project'), url: route('project.dashboard.index') },
                { label: t('Project Report'), url: route('project.report.index') },
                { label: project.name }
            ]}
            pageTitle={`${t('Project Report')}: ${project.name}`}
            backUrl={route('project.report.index')}
        >
            <Head title={`${t('Project Report')}: ${project.name}`} />

            <div className="space-y-6">

                {/* ── Top Summary Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                    {/* Card 1 — Project */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('Project')}</span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeStyle(project.status)}`}>
                                {t(project.status)}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-3">{project.name}</h3>
                        </div>
                        {project.budget && (
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                                <span className="text-xs text-gray-400 dark:text-gray-500">{t('Budget')}</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(project.budget)}</span>
                            </div>
                        )}
                    </div>

                    {/* Card 2 — Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                                <CalendarDays className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('Timeline')}</span>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3.5 py-2.5">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('Start Date')}</span>
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{formatDate(project.start_date) || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3.5 py-2.5">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('End Date')}</span>
                                <span className={`text-xs font-semibold ${project.end_date && new Date(project.end_date) < new Date() ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {formatDate(project.end_date) || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 — Tasks */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('Tasks')}</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{projectStats.total_tasks}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 flex-1">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5">
                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{projectStats.completed_tasks}</span>
                                <span className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/70">{t('Completed')}</span>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5">
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{projectStats.in_progress_tasks}</span>
                                <span className="text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70">{t('In Progress')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4 — Progress */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t('Progress')}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded-full px-2.5 py-1">
                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{projectStats.team_members}</span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('Completion Rate')}</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-primary transition-all duration-700"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('Team Members')}</span>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{projectStats.team_members} {t('Members')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Task Status Pie Chart */}
                    <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <PieChartIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {t('Task Status Distribution')}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-4">
                            {taskStatusData.length > 0 ? (
                                <div className="flex items-center gap-6">
                                    <div className="flex-1 min-w-0">
                                        <PieChart
                                            data={taskStatusData}
                                            dataKey="value"
                                            nameKey="name"
                                            height={280}
                                            outerRadius={110}
                                            showLabels={false}
                                            showLegend={false}
                                            showTooltip={true}
                                            colors={taskStatusData.map(item => item.color)}
                                        />
                                    </div>
                                    <div className="w-40 space-y-2 shrink-0">
                                        {taskStatusData.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: item.color || ['#3b82f6','#10b77f','#f59e0b','#ef4444','#8b5cf6'][index % 5] }}
                                                    />
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-56 text-gray-400 dark:text-gray-500">
                                    <PieChartIcon className="h-10 w-10 mb-3 opacity-40" />
                                    <p className="text-sm font-medium">{t('No task data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Task Priority Bar Chart */}
                    <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                                    <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                </div>
                                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {t('Task Priority Distribution')}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 py-4">
                            {taskPriorityData.length > 0 ? (
                                <BarChart
                                    data={taskPriorityData}
                                    dataKey="value"
                                    xAxisKey="name"
                                    color="#8b5cf6"
                                    height={280}
                                    showGrid={true}
                                    showTooltip={true}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-56 text-gray-400 dark:text-gray-500">
                                    <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                                    <p className="text-sm font-medium">{t('No priority data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Users & Milestones Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Users Table */}
                    <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {t('Users')}
                                    </CardTitle>
                                </div>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-0.5 rounded-full font-semibold">
                                    {usersData?.length || 0}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className={`${usersData?.length > 5 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent' : ''}`}>
                                {usersData?.length > 0 ? (
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/60">
                                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-600">{t('Name')}</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-600 w-28">{t('Assigned')}</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 w-28">{t('Done')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersData.map((user, index) => {
                                                const userCompletion = user.assigned_tasks > 0
                                                    ? Math.round((user.done_tasks / user.assigned_tasks) * 100)
                                                    : 0;
                                                const colors = [
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                                                    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                                                    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
                                                ];
                                                const avatarColor = colors[index % colors.length];
                                                return (
                                                    <tr key={user.id} className="border-b border-gray-200 dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                                        <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-600">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600">
                                                                    {user.avatar ? (
                                                                        <img
                                                                            src={getImagePath(user.avatar)}
                                                                            alt={user.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className={`w-full h-full flex items-center justify-center font-bold text-xs ${avatarColor}`}>
                                                                            {user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user.name}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                                            <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${userCompletion}%` }} />
                                                                        </div>
                                                                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{userCompletion}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                                                            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                                                                {user.assigned_tasks}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                                                                {user.done_tasks}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                                        <Users className="h-10 w-10 mb-3 opacity-40" />
                                        <p className="text-sm font-medium">{t('No users assigned to this project')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Milestones Table */}
                    <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {t('Milestones')}
                                    </CardTitle>
                                </div>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-0.5 rounded-full font-semibold">
                                    {milestonesData?.length || 0}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className={`${milestonesData?.length > 5 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent' : ''}`}>
                                {milestonesData?.length > 0 ? (
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/60">
                                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-600">{t('Name')}</th>
                                                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-600 w-28">{t('Progress')}</th>
                                                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-600 w-28">{t('Cost')}</th>
                                                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 w-28">{t('Status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {milestonesData.map((milestone) => (
                                                <tr key={milestone.id} className="border-b border-gray-200 dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-600">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{milestone.name}</p>
                                                        {(milestone.start_date || milestone.end_date) && (
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                                {formatDate(milestone.start_date)}{milestone.end_date ? ` → ${formatDate(milestone.end_date)}` : ''}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{milestone.progress}%</span>
                                                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                                <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${milestone.progress}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                            {formatCurrency(milestone.cost)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${milestoneBadgeStyle(milestone.status)}`}>
                                                            {t(milestone.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                                        <Target className="h-10 w-10 mb-3 opacity-40" />
                                        <p className="text-sm font-medium">{t('No milestones found for this project')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
