import { useState, useMemo, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Eye, Copy, CalendarDays, MoreHorizontal, Users, Package, LayoutGrid, Play, PauseCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { FilterButton } from '@/components/ui/filter-button';
import { DatePicker } from '@/components/ui/date-picker';
import { formatCurrency, getImagePath, formatDate } from '@/utils/helpers';
import Create from './Create';
import EditItem from './Edit';
import DuplicateModal from './DuplicateModal';
import NoRecordsFound from '@/components/no-records-found';

interface ProjectItem {
    id: number;
    name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: 'Ongoing' | 'Onhold' | 'Finished';
    team_members?: Array<{
        id: number;
        name: string;
        avatar?: string;
    }>;
    task_count?: number;
    completed_task_count?: number;
    created_at: string;
}

interface ProjectIndexProps {
    items: {
        data: ProjectItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    users: Array<{ id: number; name: string }>;
    auth: { user: { permissions: string[] } };
    stats: {
        total: number;
        ongoing: number;
        onhold: number;
        finished: number;
        overdue: number;
    };
}

const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
        'Ongoing':  'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/30',
        'Onhold':   'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/30',
        'Finished': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/30',
    };
    return map[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-zinc-800/40 dark:text-gray-400 dark:ring-zinc-700/30';
};

const getProgressColor = (status: string) => {
    const map: Record<string, string> = {
        'Ongoing':  'bg-blue-500',
        'Onhold':   'bg-amber-500',
        'Finished': 'bg-emerald-500',
    };
    return map[status] || 'bg-gray-400';
};

const perPageOptions = [
    { value: '12',  label: '12 per page' },
    { value: '24', label: '24 per page' },
    { value: '36', label: '36 per page' },
    { value: '48', label: '48 per page' },
];

export default function Index() {
    const { t } = useTranslation();
    const { items, users, auth, stats } = usePage<ProjectIndexProps>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState({
        name: urlParams.get('name') || '',
        status: urlParams.get('status') || '',
        date: urlParams.get('date') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '12');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState(urlParams.get('status') || 'all');

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: string;
        data: ProjectItem | null;
    }>({ isOpen: false, mode: '', data: null });

    const [duplicateModalState, setDuplicateModalState] = useState<{
        isOpen: boolean;
        project: ProjectItem | null;
    }>({ isOpen: false, project: null });

    const pageButtons = usePageButtons('projectBtn', 'Test data');
    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Projects', settingKey: 'GoogleDrive Projects' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Projects', settingKey: 'OneDrive Projects' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Project Projects', settingKey: 'Dropbox Project Projects' });

    const renderGridTemplateButtons = useCallback((item: ProjectItem) => {
        const buttons = usePageButtons('templateBtn', item, undefined, false);
        return buttons?.map((button) => (
            <div key={button.id}>{button.component}</div>
        )) || null;
    }, []);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'project.destroy',
        defaultMessage: t('Are you sure you want to delete this project item?')
    });

    const handleFilter = () => {
        router.get(route('project.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('project.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', status: '', date: '' });
        setActiveTab('all');
        router.get(route('project.index'), { per_page: perPage });
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const newStatus = tab === 'all' ? '' : tab;
        setFilters(prev => ({ ...prev, status: newStatus }));
        router.get(route('project.index'), {
            name: filters.name,
            date: filters.date,
            status: newStatus,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
        }, { preserveState: true, replace: true });
    };

    const openModal = (mode: 'add' | 'edit', data: ProjectItem | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Projects'), url: route('project.dashboard.index') },
            ]}
            pageTitle={t('Manage Projects')}
            pageDescription={t('Manage and track your projects, budgets, dates, and team member assignments.')}
            pageActions={
                <div className="flex gap-2">
                    {googleDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {oneDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {dropboxBtn.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('create-project') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        {t('New Project')}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Project')} />

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Projects')}</CardTitle>
                        <LayoutGrid className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All time')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Ongoing')}</CardTitle>
                        <Play className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.ongoing}</div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{stats.total > 0 ? Math.round((stats.ongoing / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('On Hold')}</CardTitle>
                        <PauseCircle className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.onhold}</div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{stats.total > 0 ? Math.round((stats.onhold / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Completed')}</CardTitle>
                        <CheckCircle2 className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.finished}</div>
                        <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">{stats.total > 0 ? Math.round((stats.finished / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:from-red-900/30 dark:to-red-800/20 dark:border-red-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">{t('Overdue')}</CardTitle>
                        <AlertCircle className="h-8 w-8 text-red-700 dark:text-red-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.overdue}</div>
                        <p className="text-xs text-red-700 dark:text-red-400 opacity-80 mt-1">{stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm dark:border-gray-700">
                {/* Toolbar */}
                <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({ ...filters, name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search projects...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <PerPageSelector
                                routeName="project.index"
                                filters={{ ...filters, sort: sortField, direction: sortDirection }}
                                defaultValue="12"
                                options={perPageOptions}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.status, filters.date].filter(Boolean).length;
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
                <CardContent className="px-4 py-0 border-b bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all',      label: t('All'),      icon: LayoutGrid, count: stats.total },
                            { key: 'Ongoing',  label: t('Ongoing'),  icon: Play,        count: stats.ongoing },
                            { key: 'Onhold',   label: t('On Hold'),  icon: PauseCircle, count: stats.onhold },
                            { key: 'Finished', label: t('Finished'), icon: CheckCircle2,count: stats.finished },
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

                {/* Filters */}
                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 dark:bg-blue-950/20 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1.5">{t('Date Range')}</label>
                                <DatePicker
                                    value={filters.date}
                                    onChange={(value) => setFilters({ ...filters, date: value })}
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

                {/* Project Grid */}
                <CardContent className="p-6">
                    {items.data.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.data.map((project) => {
                        const total = project.task_count || 0;
                        const completed = project.completed_task_count || 0;
                        const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
                        const isOverdue = project.end_date && new Date(project.end_date) < new Date();

                        return (
                            <Card
                                key={project.id}
                                className="p-0 flex flex-col border border-gray-300 dark:border-gray-600 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl overflow-hidden"
                            >
                                <CardContent className="p-4 flex flex-col gap-3 flex-1">

                                    {/* Header row — name + actions */}
                                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-300 dark:border-gray-600">
                                        <h3
                                            className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-snug cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => auth.user?.permissions?.includes('view-project') ? router.get(route('project.show', project.id)) : undefined}
                                        >
                                            {project.name}
                                        </h3>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0 text-gray-400 hover:text-gray-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                {renderGridTemplateButtons(project)}
                                                {auth.user?.permissions?.includes('view-project') && (
                                                    <DropdownMenuItem onClick={() => router.get(route('project.show', project.id))} className="gap-2 text-green-600 focus:text-green-700">
                                                        <Eye className="h-3.5 w-3.5" />{t('View')}
                                                    </DropdownMenuItem>
                                                )}
                                                {auth.user?.permissions?.includes('edit-project') && (
                                                    <DropdownMenuItem onClick={() => openModal('edit', project)} className="gap-2 text-blue-600 focus:text-blue-700">
                                                        <Edit className="h-3.5 w-3.5" />{t('Edit')}
                                                    </DropdownMenuItem>
                                                )}
                                                {auth.user?.permissions?.includes('duplicate-project') && (
                                                    <DropdownMenuItem onClick={() => setDuplicateModalState({ isOpen: true, project })} className="gap-2 text-purple-600 focus:text-purple-700">
                                                        <Copy className="h-3.5 w-3.5" />{t('Duplicate')}
                                                    </DropdownMenuItem>
                                                )}
                                                {auth.user?.permissions?.includes('delete-project') && (
                                                    <DropdownMenuItem onClick={() => openDeleteDialog(project.id)} className="gap-2 text-red-500 focus:text-red-600">
                                                        <Trash2 className="h-3.5 w-3.5" />{t('Delete')}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Task progress */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <span className="inline-block w-3 h-3 opacity-60">≡</span>
                                                {completed}/{total}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                ({progressPct}% {t('completed')})
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${getProgressColor(project.status)}`}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Assigned to + Deadline */}
                                    <div className="flex items-end justify-between gap-2">
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{t('Assigned to')}</p>
                                            {project.team_members && project.team_members.length > 0 ? (
                                                <div className="flex -space-x-2">
                                                    {project.team_members.slice(0, 3).map((user) => (
                                                        <TooltipProvider key={user.id}>
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger>
                                                                    <div className="h-7 w-7 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                                                                        <img
                                                                            src={user.avatar ? getImagePath(user.avatar) : getImagePath('avatar.png')}
                                                                            alt={user.name}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{user.name}</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                    {project.team_members.length > 3 && (
                                                        <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 ring-1 ring-gray-200 flex items-center justify-center">
                                                            <span className="text-xs font-semibold text-gray-500">+{project.team_members.length - 3}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>{t('No members')}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{t('Deadline')}</p>
                                            <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>{project.end_date ? formatDate(project.end_date) : '—'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom tags row — status + budget */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusStyle(project.status)}`}>
                                            {t(project.status)}
                                        </span>
                                        {project.budget ? (
                                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-zinc-800/40 dark:text-gray-400 dark:ring-zinc-700/30">
                                                {formatCurrency(project.budget)}
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
                    icon={Package}
                    title={t('No projects found')}
                    description={t('Get started by creating your first project.')}
                    hasFilters={!!(filters.name || filters.status || filters.date)}
                    onClearFilters={clearFilters}
                    createPermission="create-project"
                    onCreateClick={() => openModal('add')}
                    createButtonText={t('Create Project')}
                />
            )}
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                    <Pagination
                        data={items}
                        routeName="project.index"
                        filters={{ ...filters, per_page: perPage, sort: sortField, direction: sortDirection }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} users={users} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditItem
                        item={modalState.data}
                        users={users}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Project')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            <Dialog open={duplicateModalState.isOpen} onOpenChange={() => setDuplicateModalState({ isOpen: false, project: null })}>
                <DuplicateModal
                    isOpen={duplicateModalState.isOpen}
                    project={duplicateModalState.project}
                    onClose={() => setDuplicateModalState({ isOpen: false, project: null })}
                />
            </Dialog>
        </AuthenticatedLayout>
    );
}
