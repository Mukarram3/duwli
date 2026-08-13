import { useState } from 'react';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate, downloadFile, formatDateTime } from '@/utils/helpers';
import { getImagePath } from '@/utils/helpers';
import { Plus, Trash2, Edit, FolderKanban, Kanban, List, Bug, CheckSquare, Calendar, Activity, Image, File, FileText, Video, Music, Download, Eye, Users, Flag, Paperclip, Clock, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DataTable } from "@/components/ui/data-table";
import NoRecordsFound from '@/components/no-records-found';
import InputError from '@/components/ui/input-error';
import { LineChart } from '@/components/charts/LineChart';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import MediaPicker from "@/components/MediaPicker";
import axios from 'axios';
import { useFormFields } from '@/hooks/useFormFields';



interface Project {
    id: number;
    name: string;
    description?: string;
    user: { id: number; name: string; };
    creator: { id: number; name: string; };
    team_members: Array<{ id: number; name: string; avatar?: string; email?: string; }>;
    clients: Array<{ id: number; name: string; avatar?: string; email?: string; }>;
    milestones: Array<{
        id: number;
        title: string;
        cost?: number;
        start_date?: string;
        end_date?: string;
        summary?: string;
        status: string;
        progress: number;
    }>;
}

interface ShowProps {
    project: Project;
    teamMembers: Array<{ id: number; name: string; }>;
    available_clients: Array<{ id: number; name: string; }>;
    projectStats: {
        taskCount: number;
        bugCount: number;
        daysLeft: number;
        budget: number;
    };
    chartData: Array<{ name: string; [key: string]: any; }>;
    chartLines: Array<{ dataKey: string; color: string; name: string; }>;
    activityLogs: Array<{
        id: number;
        log_type: string;
        remark: string;
        created_at: string;
        user: { id: number; name: string; };
    }>;
    projectFiles: Array<{
        id: number;
        file_name: string;
        file_path: string;
    }>;
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Show() {
    const { t } = useTranslation();
    const { project, teamMembers, available_clients, projectStats, chartData, chartLines, activityLogs, projectFiles, auth } = usePage<ShowProps>().props;
    const videoHubButtons = usePageButtons('projectShowButtons', { project });
    const spreadsheetButtons = usePageButtons('spreadsheetBtn', { module: 'Project', sub_module: project.id });
    const businessProcessMappingButtons = usePageButtons('businessProcessMappingBtn', { module: 'Taskly', submodule: 'Project', id: project.id });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isEditMilestoneModalOpen, setIsEditMilestoneModalOpen] = useState(false);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<any>(null);
    const [projectEditData, setProjectEditData] = useState<any>(null);
    const [loadingProjectData, setLoadingProjectData] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'milestones' | 'attachments' | 'activity'>('overview');

    const [deleteState, setDeleteState] = useState({ isOpen: false, userId: null as number | null, userName: '' });
    const [deleteClientState, setDeleteClientState] = useState({ isOpen: false, clientId: null as number | null, clientName: '' });

    const [milestoneDeleteState, setMilestoneDeleteState] = useState({ isOpen: false, milestoneId: null as number | null });

    const openMilestoneDeleteDialog = (milestoneId: number) => {
        setMilestoneDeleteState({ isOpen: true, milestoneId });
    };

    const closeMilestoneDeleteDialog = () => {
        setMilestoneDeleteState({ isOpen: false, milestoneId: null });
    };

    const confirmMilestoneDelete = () => {
        if (milestoneDeleteState.milestoneId) {
            router.delete(route('project.milestones.delete', project.id), {
                data: { id: milestoneDeleteState.milestoneId },
                onSuccess: () => closeMilestoneDeleteDialog()
            });
        }
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        user_ids: [],
    });

    const { data: clientData, setData: setClientData, post: postClient, processing: clientProcessing, errors: clientErrors, reset: resetClient } = useForm({
        client_ids: [],
    });

    const { data: milestoneData, setData: setMilestoneData, post: postMilestone, processing: milestoneProcessing, errors: milestoneErrors, reset: resetMilestone } = useForm({
        title: '',
        cost: '',
        start_date: '',
        end_date: '',
        summary: '',
    });

    const { data: editMilestoneData, setData: setEditMilestoneData, put: putMilestone, processing: editMilestoneProcessing, errors: editMilestoneErrors, reset: resetEditMilestone } = useForm({
        title: '',
        cost: '',
        start_date: '',
        end_date: '',
        summary: '',
        status: 'Incomplete',
        progress: 0,
        milestone_id: null,
    });

    const { data: editProjectData, setData: setEditProjectData, put: putProject, processing: editProjectProcessing, errors: editProjectErrors, reset: resetEditProject } = useForm({
        name: '',
        description: '',
        budget: 0,
        start_date: '',
        end_date: '',
        status: 'Ongoing',
    });

    const { data: imagesData, setData: setImagesData, post: postImages, processing: imagesProcessing, errors: imagesErrors, reset: resetImages } = useForm({
        images: [],
    });

    // AI hooks for milestone forms
    const milestoneCreateTitleAI = useFormFields('aiField', milestoneData, setMilestoneData, milestoneErrors, 'create', 'title', 'Title', 'taskly', 'milestone');
    const milestoneCreateSummaryAI = useFormFields('aiField', milestoneData, setMilestoneData, milestoneErrors, 'create', 'summary', 'Summary', 'taskly', 'milestone');
    const milestoneEditTitleAI = useFormFields('aiField', editMilestoneData, setEditMilestoneData, editMilestoneErrors, 'edit', 'title', 'Title', 'taskly', 'milestone');
    const milestoneEditSummaryAI = useFormFields('aiField', editMilestoneData, setEditMilestoneData, editMilestoneErrors, 'edit', 'summary', 'Summary', 'taskly', 'milestone');

    const openEditProjectModal = async () => {
        if (!auth.user?.permissions?.includes('edit-project')) {
            return;
        }

        setLoadingProjectData(true);
        try {
            const response = await axios.get(route('project.edit', project.id));
            const projectData = response.data.project;

            setProjectEditData(projectData);
            setEditProjectData({
                name: projectData.name || '',
                description: projectData.description || '',
                budget: projectData.budget || 0,
                start_date: projectData.start_date || '',
                end_date: projectData.end_date || '',
                status: projectData.status || 'Ongoing',
            });
            setIsEditProjectModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch project data:', error);
        } finally {
            setLoadingProjectData(false);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('project.invite', project.id), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleClientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postClient(route('project.invite-client', project.id), {
            onSuccess: () => {
                setIsClientModalOpen(false);
                resetClient();
            }
        });
    };

    const handleMilestoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postMilestone(route('project.milestones.store', project.id), {
            onSuccess: () => {
                setIsMilestoneModalOpen(false);
                resetMilestone();
            }
        });
    };

    const openEditMilestone = (milestone: any) => {
        setEditingMilestone(milestone);
        setEditMilestoneData({
            title: milestone.title,
            cost: milestone.cost || '',
            start_date: milestone.start_date || '',
            end_date: milestone.end_date || '',
            summary: milestone.summary || '',
            status: milestone.status || 'Incomplete',
            progress: milestone.progress || 0,
            milestone_id: milestone.id,
        });
        setIsEditMilestoneModalOpen(true);
    };

    const handleEditMilestoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        putMilestone(route('project.milestones.update', project.id), {
            onSuccess: () => {
                setIsEditMilestoneModalOpen(false);
                resetEditMilestone();
                setEditingMilestone(null);
            }
        });
    };

    const handleEditProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        putProject(route('project.update', project.id), {
            onSuccess: () => {
                setIsEditProjectModalOpen(false);
                resetEditProject();
                setProjectEditData(null);
            }
        });
    };



    const openDeleteDialog = (userId: number, userName: string) => {
        setDeleteState({ isOpen: true, userId, userName });
    };

    const closeDeleteDialog = () => {
        setDeleteState({ isOpen: false, userId: null, userName: '' });
    };

    const confirmDelete = () => {
        if (deleteState.userId) {
            router.delete(route('project.delete-member', project.id), {
                data: { user_id: deleteState.userId },
                onSuccess: () => closeDeleteDialog()
            });
        }
    };

    const openDeleteClientDialog = (clientId: number, clientName: string) => {
        setDeleteClientState({ isOpen: true, clientId, clientName });
    };

    const closeDeleteClientDialog = () => {
        setDeleteClientState({ isOpen: false, clientId: null, clientName: '' });
    };

    const confirmDeleteClient = () => {
        if (deleteClientState.clientId) {
            router.delete(route('project.delete-client', project.id), {
                data: { client_id: deleteClientState.clientId },
                onSuccess: () => closeDeleteClientDialog()
            });
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Project'), url: route('project.dashboard.index')},
                { label: project.name }
            ]}
            pageTitle={project.name}
            backUrl={route('project.index')}
            pageActions={
                <div className="flex gap-2 items-center">
                    <TooltipProvider>
                        {videoHubButtons.map((button) => (
                            <div key={button.id}>
                                {button.component}
                            </div>
                        ))}
                        {spreadsheetButtons.map((button) => (
                            <div key={button.id}>
                                {button.component}
                            </div>
                        ))}
                        {businessProcessMappingButtons.map((button) => (
                            <div key={button.id}>
                                {button.component}
                            </div>
                        ))}


                        {auth.user?.permissions?.includes('manage-project-task') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.get(route('project.tasks.kanban', project.id))}>
                                        <Kanban className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Task Kanban')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('manage-project-bug') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.get(route('project.bugs.kanban', project.id))}>
                                        <Bug className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Bug')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('manage-project-task') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.get(route('project.tasks.calendar', project.id))}>
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Calendar View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={project.name} />

            {/* Top Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Team Members Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Team Members')}</CardTitle>
                        <Users className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {project.team_members?.length + (project.clients?.length || 0)}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('Members & Clients')}</p>
                    </CardContent>
                </Card>

                {/* Deadline Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Deadline')}</CardTitle>
                        <Calendar className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            {project.end_date ? formatDate(project.end_date) : '-'}
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{t('Due Date')}</p>
                    </CardContent>
                </Card>

                {/* Budget Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Budget')}</CardTitle>
                        <DollarSign className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                            {formatCurrency(projectStats.budget)}
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{t('Total Allocated')}</p>
                    </CardContent>
                </Card>

                {/* Days Left Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Days Left')}</CardTitle>
                        <Clock className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                            {Math.max(0, Math.round(projectStats.daysLeft))}
                        </div>
                        <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">{t('Days Remaining')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Project Progress Card */}
            {(() => {
                const projectProgress = project.milestones && project.milestones.length > 0
                    ? Math.round(project.milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / project.milestones.length)
                    : 0;
                return (
                    <Card className="mb-6 shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('Project Progress')}</span>
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                    project.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/30' :
                                    project.status === 'Onhold' ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/30' :
                                    project.status === 'Finished' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/30' :
                                    'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-zinc-800/40 dark:text-gray-400 dark:ring-zinc-700/30'
                                }`}>
                                    {t(project.status || 'Ongoing')}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-primary dark:text-primary">{projectProgress}%</span>
                        </div>
                        <div className="w-full bg-primary/10 dark:bg-primary/15 rounded-full h-1.5">
                            <div
                                className="bg-primary/80 dark:bg-primary/85 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${projectProgress}%` }}
                            />
                        </div>
                    </Card>
                );
            })()}

            {/* Tab Navigation Menu */}
            <div className="flex justify-center gap-2 p-1.5 mb-6 bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-x-auto scrollbar-none">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'overview'
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary/40'
                            : 'border border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                    <FolderKanban className="h-4 w-4" />
                    {t('Overview')}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('team')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'team'
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary/40'
                            : 'border border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                    <Users className="h-4 w-4" />
                    {t('Team')}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('milestones')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'milestones'
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary/40'
                            : 'border border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                    <Flag className="h-4 w-4" />
                    {t('Milestones')}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('attachments')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'attachments'
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary/40'
                            : 'border border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                    <Paperclip className="h-4 w-4" />
                    {t('Attachments')}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'activity'
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary/40'
                            : 'border border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                    <Activity className="h-4 w-4" />
                    {t('Activity')}
                </Button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Project Description & Charts Card */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 h-[260px] flex flex-col">
                                <CardHeader className="p-6 border-b border-gray-150 dark:border-zinc-800 flex-shrink-0">
                                    <CardTitle className="text-lg flex items-center justify-between text-gray-900 dark:text-gray-100">
                                        <div className="flex items-center gap-2">
                                            <FolderKanban className="h-5 w-5 text-primary" />
                                            {t('Project Description')}
                                        </div>
                                        {auth.user?.permissions?.includes('edit-project') && (
                                            <TooltipProvider>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={openEditProjectModal}
                                                            disabled={loadingProjectData}
                                                            className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{t('Edit')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                        {project.description || t('No description available for this project.')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Progress Chart */}
                            <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                                <CardHeader className="p-6 border-b border-gray-150 dark:border-zinc-800">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Activity className="h-5 w-5 text-primary" />
                                        {t('Task Progress Chart')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-0 py-4">
                                    <LineChart
                                        data={chartData || []}
                                        dataKey=""
                                        xAxisKey="name"
                                        height={280}
                                        showGrid={false}
                                        lines={chartLines || []}
                                        margin={{ left: 0, right: 0, top: 5, bottom: 5 }}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            {/* Project Timeline Card */}
                            <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 h-[260px] flex flex-col">
                                <CardHeader className="p-6 border-b border-gray-150 dark:border-zinc-800 flex-shrink-0">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        {t('Project Timeline')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 overflow-y-auto flex-1">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2.5 border-b border-gray-200 dark:border-zinc-800">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Start Date')}</span>
                                            <span className="text-sm font-semibold text-gray-950 dark:text-gray-50">{project.start_date ? formatDate(project.start_date) : '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2.5 border-b border-gray-200 dark:border-zinc-800">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Deadline')}</span>
                                            <span className={`text-sm font-semibold ${project.end_date && new Date(project.end_date) < new Date() ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-950 dark:text-gray-50'}`}>
                                                {project.end_date ? formatDate(project.end_date) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2.5 border-b border-gray-200 dark:border-zinc-800">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Budget')}</span>
                                            <span className="text-sm font-semibold text-gray-955 dark:text-gray-50">{formatCurrency(projectStats.budget)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Team Summary Card */}
                            <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                                <CardHeader className="p-6 border-b border-gray-150 dark:border-zinc-800">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Users className="h-5 w-5 text-primary" />
                                        {t('Team Summary')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2.5 border-b border-gray-200 dark:border-zinc-800">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Managers')}</span>
                                            <span className="text-sm font-semibold text-gray-950 dark:text-gray-50">1</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2.5 border-b border-gray-200 dark:border-zinc-800">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Team Members')}</span>
                                            <span className="text-sm font-semibold text-gray-950 dark:text-gray-50">{project.team_members?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2.5 border-b border-gray-200 dark:border-zinc-800">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Clients')}</span>
                                            <span className="text-sm font-semibold text-gray-950 dark:text-gray-50">{project.clients?.length || 0}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Team Members List */}
                        <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-150 dark:border-zinc-800">
                                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <Users className="h-5 w-5 text-primary" />
                                    {t('Team Members')}
                                </CardTitle>
                                {auth.user?.permissions?.includes('invite-project-member') && (
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('Create')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {project.team_members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-gray-200 dark:border-zinc-700">
                                                    {member.avatar ? (
                                                        <img
                                                            src={getImagePath(member.avatar)}
                                                            alt={member.name}
                                                            className="h-full w-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                            {member.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{member.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.email || '-'}</span>
                                                </div>
                                            </div>
                                            {auth.user?.permissions?.includes('delete-project-member') && (
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openDeleteDialog(member.id, member.name)}
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('Delete')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    ))}
                                    {project.team_members.length === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">{t('No team members added yet.')}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Clients List */}
                        <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-150 dark:border-zinc-800">
                                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <Users className="h-5 w-5 text-primary" />
                                    {t('Clients')}
                                </CardTitle>
                                {auth.user?.permissions?.includes('invite-project-client') && (
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" onClick={() => setIsClientModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('Create')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {project.clients?.map((client) => (
                                        <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-gray-200 dark:border-zinc-700">
                                                    {client.avatar ? (
                                                        <img
                                                            src={getImagePath(client.avatar)}
                                                            alt={client.name}
                                                            className="h-full w-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                            {client.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{client.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{client.email || '-'}</span>
                                                </div>
                                            </div>
                                            {auth.user?.permissions?.includes('delete-project-client') && (
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openDeleteClientDialog(client.id, client.name)}
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('Delete')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    ))}
                                    {(!project.clients || project.clients.length === 0) && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">{t('No clients added yet.')}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'milestones' && (
                    <div>
                        {(auth.user?.permissions?.includes('manage-project-milestone')) && (
                            <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                                <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Flag className="h-5 w-5 text-primary" />
                                        {t('Milestones')}
                                    </CardTitle>
                                    {auth.user?.permissions?.includes('create-project-milestone') && (
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button size="sm" onClick={() => setIsMilestoneModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Create')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                        <div className="min-w-[800px]">
                                            <DataTable
                                                data={project.milestones || []}
                                                columns={[
                                                    {
                                                        key: 'title',
                                                        header: t('Title')
                                                    },
                                                    {
                                                        key: 'cost',
                                                        header: t('Cost'),
                                                        render: (value: any) => value ? formatCurrency(value) : '-'
                                                    },
                                                    {
                                                        key: 'start_date',
                                                        header: t('Start Date'),
                                                        render: (value: string) => value ? formatDate(value) : '-'
                                                    },
                                                    {
                                                        key: 'end_date',
                                                        header: t('End Date'),
                                                        render: (value: string) => {
                                                            if (!value) return '-';
                                                            const isOverdue = new Date(value) < new Date();
                                                            return (
                                                                <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                                                                    {formatDate(value)}
                                                                </span>
                                                            );
                                                        }
                                                    },
                                                    {
                                                        key: 'status',
                                                        header: t('Status'),
                                                        render: (value: string) => (
                                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                                value === 'Complete' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20' :
                                                                value === 'Ongoing' ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20' :
                                                                'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20'
                                                            }`}>
                                                                {t(value)}
                                                            </span>
                                                        )
                                                    },
                                                    {
                                                        key: 'progress',
                                                        header: t('Progress'),
                                                        render: (value: number) => {
                                                            const pct = value || 0;
                                                            return (
                                                                <div className="flex items-center gap-2 min-w-24">
                                                                    <div className="flex-1 bg-primary/10 dark:bg-primary/15 rounded-full h-1.5">
                                                                        <div
                                                                            className="bg-primary/80 dark:bg-primary/85 h-1.5 rounded-full transition-all duration-300"
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-8">{pct}%</span>
                                                                </div>
                                                            );
                                                        }
                                                    },
                                                    {
                                                        key: 'actions',
                                                        header: t('Action'),
                                                        render: (_: any, milestone: any) => (
                                                            <div className="flex gap-1">
                                                                {auth.user?.permissions?.includes('edit-project-milestone') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openEditMilestone(milestone)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Edit')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('delete-project-milestone') && (
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="sm" onClick={() => openMilestoneDeleteDialog(milestone.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Delete')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                ]}
                                                className="rounded-none"
                                                emptyState={
                                                    <NoRecordsFound
                                                        icon={FolderKanban}
                                                        title={t('No milestones found')}
                                                        description={t('Get started by creating your first milestone.')}
                                                        hasFilters={false}
                                                        onClearFilters={() => {}}
                                                        createPermission="create-milestone"
                                                        onCreateClick={() => setIsMilestoneModalOpen(true)}
                                                        createButtonText={t('Create Milestone')}
                                                        className="h-auto"
                                                    />
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'attachments' && (
                    <div className="grid grid-cols-1 gap-6">
                        {/* Project Files Card */}
                        <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('Files')}</h4>
                            <div className="mb-4">
                                <MediaPicker
                                    value={imagesData.images}
                                    onChange={(value) => {
                                        const items = Array.isArray(value) ? value : [value].filter(Boolean);
                                        if (items.length > 0) {
                                            const formData = { images: items };
                                            router.post(route('project.files.store', project.id), formData, {
                                                onSuccess: () => {
                                                    setImagesData('images', []);
                                                }
                                            });
                                        }
                                    }}
                                    multiple={true}
                                    placeholder={t('Select files')}
                                    showPreview={false}
                                    label=""
                                />
                                <InputError message={imagesErrors.images} />
                            </div>
                            {projectFiles && projectFiles.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 overflow-y-auto max-h-[60vh] p-1">
                                    {projectFiles.map((file) => {
                                        const getFileIcon = (fileName: string) => {
                                            const ext = fileName.split('.').pop()?.toLowerCase();
                                            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
                                                return <Image className="h-5 w-5 text-blue-500" />;
                                            } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) {
                                                return <Video className="h-5 w-5 text-purple-500" />;
                                            } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext || '')) {
                                                return <Music className="h-5 w-5 text-green-500" />;
                                            } else if (['txt', 'doc', 'docx', 'pdf', 'rtf'].includes(ext || '')) {
                                                return <FileText className="h-5 w-5 text-red-500" />;
                                            } else {
                                                return <File className="h-5 w-5 text-gray-500" />;
                                            }
                                        };

                                        const isImage = (fileName: string) => {
                                            const ext = fileName.split('.').pop()?.toLowerCase();
                                            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
                                        };

                                        let imageUrl = getImagePath(file.file_path);
                                        return (
                                            <div key={file.id} className="aspect-square flex flex-col relative border border-gray-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all group">
                                                <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-white/40 dark:bg-zinc-900/20">
                                                    {isImage(file.file_path) ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={file.file_name}
                                                            className="w-full h-full object-contain rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                                                            {getFileIcon(file.file_name)}
                                                        </div>
                                                    )}

                                                    {/* Hover Overlay with Action Buttons */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => window.open(imageUrl, '_blank')}
                                                                        className="h-8 w-8 p-0 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow"
                                                                    >
                                                                        <Eye className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('View')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => downloadFile(imageUrl)}
                                                                        className="h-8 w-8 p-0 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow"
                                                                    >
                                                                        <Download className="h-4 w-4 text-blue-600" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Download')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => router.delete(route('project.files.delete', file.id))}
                                                                        className="h-8 w-8 p-0 bg-white hover:bg-red-50 text-gray-800 rounded-lg shadow"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Delete')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                                <div className="p-3 border-t border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 flex flex-col min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={file.file_name}>
                                                        {file.file_name}
                                                    </p>
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90 border border-primary/20 dark:border-primary/30">
                                                            {file.file_path.split('.').pop()?.toUpperCase() || 'FILE'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex-1 flex flex-col items-center justify-center">
                                    <File className="h-12 w-12 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">{t('No files uploaded yet')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="grid grid-cols-1 gap-6">
                        {/* Recent Activity Card */}
                        <Card className="shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col">
                            <CardHeader className="p-6 border-b border-gray-150 dark:border-zinc-800">
                                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <Activity className="h-5 w-5 text-primary" />
                                    {t('Recent Activity')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[60vh] pe-2">
                                    {activityLogs && activityLogs.length > 0 ? (
                                        <div className="relative border-s border-gray-200 dark:border-zinc-800 ms-8 md:ms-32 ps-6 md:ps-8 space-y-6 py-4 me-4">
                                            {(() => {
                                                let lastDate = '';
                                                const getActivityIcon = (remark: string) => {
                                                    const lower = remark.toLowerCase();
                                                    if (lower.includes('task')) {
                                                        return <CheckSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
                                                    }
                                                    if (lower.includes('milestone')) {
                                                        return <Flag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
                                                    }
                                                    if (lower.includes('file') || lower.includes('attachment') || lower.includes('upload')) {
                                                        return <Paperclip className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
                                                    }
                                                    return <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
                                                };

                                                return activityLogs.map((log) => {
                                                    const itemDate = formatDate(log.created_at);
                                                    const showDate = itemDate !== lastDate;
                                                    lastDate = itemDate;
                                                    const icon = getActivityIcon(log.remark);

                                                    return (
                                                        <div key={log.id} className="relative">
                                                            {showDate && (
                                                                <div className="absolute -start-[164px] w-[100px] text-end text-xs font-semibold text-gray-500 dark:text-gray-400 top-[26px] hidden md:block">
                                                                    {itemDate}
                                                                </div>
                                                            )}
                                                            <div className="absolute -start-[40px] md:-start-[48px] top-[18px] w-8 h-8 rounded-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center z-10 shadow-sm">
                                                                {icon}
                                                            </div>
                                                            <div className="p-4 bg-white dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-150" dangerouslySetInnerHTML={{ __html: log.remark }} />
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5 font-medium">
                                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                    {formatDateTime(log.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex-1 flex flex-col items-center justify-center">
                                            <Activity className="h-12 w-12 mx-auto mb-2 opacity-40" />
                                            <p>{t('No recent activity')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Team Member')}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label required>{t('Users')}</Label>
                            <MultiSelectEnhanced
                                options={teamMembers.map(user => ({ value: user.id.toString(), label: user.name }))}
                                value={data.user_ids.map(id => id.toString())}
                                onValueChange={(value) => setData('user_ids', value.map(v => parseInt(v)))}
                                placeholder={t('Select users')}
                                searchable={true}
                            />
                            {errors.user_ids && <p className="text-sm text-red-500 mt-1">{errors.user_ids}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? t('Adding...') : t('Add')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Share To Client')}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleClientSubmit} className="space-y-4">
                        <div>
                            <Label required>{t('Clients')}</Label>
                            <MultiSelectEnhanced
                                options={available_clients.map(client => ({ value: client.id.toString(), label: client.name }))}
                                value={clientData.client_ids.map(id => id.toString())}
                                onValueChange={(value) => setClientData('client_ids', value.map(v => parseInt(v)))}
                                placeholder={t('Select clients')}
                                searchable={true}
                            />
                            {clientErrors.client_ids && <p className="text-sm text-red-500 mt-1">{clientErrors.client_ids}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={clientProcessing}>
                                {clientProcessing ? t('Inviting...') : t('Invite')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Create Milestone')}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                        <div>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Label htmlFor="title">{t('Milestone Title')}</Label>
                                    <Input
                                        id="title"
                                        value={milestoneData.title}
                                        onChange={(e) => setMilestoneData('title', e.target.value)}
                                        placeholder={t('Enter milestone title')}
                                        className={milestoneErrors.title ? 'border-red-500' : ''}
                                        required
                                    />
                                    {milestoneErrors.title && <p className="text-sm text-red-500 mt-1">{milestoneErrors.title}</p>}
                                </div>
                                {milestoneCreateTitleAI.map(field => <div key={field.id}>{field.component}</div>)}
                            </div>
                        </div>

                        <div>
                            <CurrencyInput
                                id="cost"
                                required
                                label={t('Milestone Cost')}
                                value={milestoneData.cost}
                                onChange={(value) => setMilestoneData('cost', value)}
                                error={milestoneErrors.cost}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label required>{t('Start Date')}</Label>
                                <DatePicker
                                    value={milestoneData.start_date}
                                    onChange={(value) => setMilestoneData('start_date', value)}
                                    placeholder={t('Select start date')}
                                />
                                {milestoneErrors.start_date && <p className="text-sm text-red-500 mt-1">{milestoneErrors.start_date}</p>}
                            </div>
                            <div>
                                <Label required>{t('End Date')}</Label>
                                <DatePicker
                                    value={milestoneData.end_date}
                                    onChange={(value) => setMilestoneData('end_date', value)}
                                    placeholder={t('Select end date')}
                                />
                                {milestoneErrors.end_date && <p className="text-sm text-red-500 mt-1">{milestoneErrors.end_date}</p>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="summary">{t('Summary')}</Label>
                                <div className="flex gap-2">
                                    {milestoneCreateSummaryAI.map(field => <div key={field.id}>{field.component}</div>)}
                                </div>
                            </div>
                            <Textarea
                                id="summary"
                                rows={3}
                                value={milestoneData.summary}
                                onChange={(e) => setMilestoneData('summary', e.target.value)}
                                placeholder={t('Enter summary')}
                                className={milestoneErrors.summary ? 'border-red-500' : ''}
                            />
                            {milestoneErrors.summary && <p className="text-sm text-red-500 mt-1">{milestoneErrors.summary}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsMilestoneModalOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={milestoneProcessing}>
                                {milestoneProcessing ? t('Creating...') : t('Create')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditMilestoneModalOpen} onOpenChange={setIsEditMilestoneModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Edit Milestone')}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleEditMilestoneSubmit} className="space-y-4">
                        <div>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Label htmlFor="edit-title">{t('Milestone Title')}</Label>
                                    <Input
                                        id="edit-title"
                                        value={editMilestoneData.title}
                                        onChange={(e) => setEditMilestoneData('title', e.target.value)}
                                        placeholder={t('Enter milestone title')}
                                        className={editMilestoneErrors.title ? 'border-red-500' : ''}
                                        required
                                    />
                                    {editMilestoneErrors.title && <p className="text-sm text-red-500 mt-1">{editMilestoneErrors.title}</p>}
                                </div>
                                {milestoneEditTitleAI.map(field => <div key={field.id}>{field.component}</div>)}
                            </div>
                        </div>

                        <div>
                            <CurrencyInput
                                id="edit-cost"
                                required
                                label={t('Milestone Cost')}
                                value={editMilestoneData.cost}
                                onChange={(value) => setEditMilestoneData('cost', value)}
                                error={editMilestoneErrors.cost}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label required>{t('Start Date')}</Label>
                                <DatePicker
                                    value={editMilestoneData.start_date}
                                    onChange={(value) => setEditMilestoneData('start_date', value)}
                                    placeholder={t('Select start date')}
                                />
                                {editMilestoneErrors.start_date && <p className="text-sm text-red-500 mt-1">{editMilestoneErrors.start_date}</p>}
                            </div>
                            <div>
                                <Label required>{t('End Date')}</Label>
                                <DatePicker
                                    value={editMilestoneData.end_date}
                                    onChange={(value) => setEditMilestoneData('end_date', value)}
                                    placeholder={t('Select end date')}
                                />
                                {editMilestoneErrors.end_date && <p className="text-sm text-red-500 mt-1">{editMilestoneErrors.end_date}</p>}
                            </div>
                        </div>

                        <div>
                            <Label>{t('Status')}</Label>
                            <Select value={editMilestoneData.status} onValueChange={(value) => setEditMilestoneData('status', value)}>
                                <SelectTrigger className={editMilestoneErrors.status ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={t('Select status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Incomplete">{t('Incomplete')}</SelectItem>
                                    <SelectItem value="Complete">{t('Complete')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {editMilestoneErrors.status && <p className="text-sm text-red-500 mt-1">{editMilestoneErrors.status}</p>}
                        </div>

                        <div>
                            <Label htmlFor="edit-progress">{t('Progress')} ({editMilestoneData.progress}%)</Label>
                            <Slider
                                value={[editMilestoneData.progress]}
                                onValueChange={(value) => setEditMilestoneData('progress', value[0])}
                                max={100}
                                step={1}
                                className="mt-2"
                            />
                            {editMilestoneErrors.progress && <p className="text-sm text-red-500 mt-1">{editMilestoneErrors.progress}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="edit-summary">{t('Summary')}</Label>
                                <div className="flex gap-2">
                                    {milestoneEditSummaryAI.map(field => <div key={field.id}>{field.component}</div>)}
                                </div>
                            </div>
                            <Textarea
                                id="edit-summary"
                                rows={3}
                                value={editMilestoneData.summary}
                                onChange={(e) => setEditMilestoneData('summary', e.target.value)}
                                placeholder={t('Enter summary')}
                                className={editMilestoneErrors.summary ? 'border-red-500' : ''}
                            />
                            {editMilestoneErrors.summary && <p className="text-sm text-red-500 mt-1">{editMilestoneErrors.summary}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditMilestoneModalOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={editMilestoneProcessing}>
                                {editMilestoneProcessing ? t('Updating...') : t('Update')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Remove Team Member')}
                message={t('Are you sure you want to remove {{name}} from this project?', { name: deleteState.userName })}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            <ConfirmationDialog
                open={deleteClientState.isOpen}
                onOpenChange={closeDeleteClientDialog}
                title={t('Remove Client')}
                message={t('Are you sure you want to remove {{name}} from this project?', { name: deleteClientState.clientName })}
                confirmText={t('Delete')}
                onConfirm={confirmDeleteClient}
                variant="destructive"
            />
            <ConfirmationDialog
                open={milestoneDeleteState.isOpen}
                onOpenChange={closeMilestoneDeleteDialog}
                title={t('Delete Milestone')}
                message={t('Are you sure you want to delete this milestone?')}
                confirmText={t('Delete')}
                onConfirm={confirmMilestoneDelete}
                variant="destructive"
            />

            <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Edit Project')}</DialogTitle>
                    </DialogHeader>

                    {projectEditData && (
                        <form onSubmit={handleEditProjectSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="edit_project_name">{t('Name')}</Label>
                                <Input
                                    id="edit_project_name"
                                    value={editProjectData.name}
                                    onChange={(e) => setEditProjectData('name', e.target.value)}
                                    placeholder={t('Enter project name')}
                                    className={editProjectErrors.name ? 'border-red-500' : ''}
                                    required
                                />
                                <InputError message={editProjectErrors.name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label required>{t('Start Date')}</Label>
                                    <DatePicker
                                        value={editProjectData.start_date}
                                        onChange={(value) => setEditProjectData('start_date', value)}
                                        placeholder={t('Select start date')}
                                    />
                                    <InputError message={editProjectErrors.start_date} />
                                </div>
                                <div>
                                    <Label required>{t('End Date')}</Label>
                                    <DatePicker
                                        value={editProjectData.end_date}
                                        onChange={(value) => setEditProjectData('end_date', value)}
                                        placeholder={t('Select end date')}
                                    />
                                    <InputError message={editProjectErrors.end_date} />
                                </div>
                            </div>

                            <div>
                                <CurrencyInput
                                    label={t('Budget')}
                                    value={editProjectData.budget.toString()}
                                    onChange={(value) => setEditProjectData('budget', parseFloat(value) || 0)}
                                    error={editProjectErrors.budget}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_project_status">{t('Status')}</Label>
                                <Select value={editProjectData.status} onValueChange={(value) => setEditProjectData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ongoing">{t('Ongoing')}</SelectItem>
                                        <SelectItem value="Onhold">{t('Onhold')}</SelectItem>
                                        <SelectItem value="Finished">{t('Finished')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={editProjectErrors.status} />
                            </div>

                            <div>
                                <Label htmlFor="edit_project_description">{t('Description')}</Label>
                                <Textarea
                                    id="edit_project_description"
                                    rows={3}
                                    value={editProjectData.description}
                                    onChange={(e) => setEditProjectData('description', e.target.value)}
                                    placeholder={t('Enter project description')}
                                    className={editProjectErrors.description ? 'border-red-500' : ''}
                                />
                                <InputError message={editProjectErrors.description} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditProjectModalOpen(false)}>
                                    {t('Cancel')}
                                </Button>
                                <Button type="submit" disabled={editProjectProcessing}>
                                    {editProjectProcessing ? t('Updating...') : t('Update')}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>



        </AuthenticatedLayout>
    );
}
