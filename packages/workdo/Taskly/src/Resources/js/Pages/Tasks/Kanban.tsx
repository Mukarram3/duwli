import { useState, useCallback, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Calendar, Edit, Trash2, MoreVertical, Users, List, Eye, User } from 'lucide-react';
import { getImagePath } from '@/utils/helpers';
import KanbanBoard, { KanbanTask, KanbanColumn } from '@/components/kanban-board';
import Create from './Create';
import EditTask from './Edit';
import ViewTask from './View';
import { formatDate } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';

interface Project {
    id: number;
    name: string;
}

interface TasksByStatus {
    [key: string]: KanbanTask[];
}

interface KanbanProps {
    project: Project;
    stages: Array<{ id: number; name: string; color: string; order: number; }>;
    tasks: TasksByStatus;
    milestones: Array<{ id: number; title: string; }>;
    teamMembers: Array<{ id: number; name: string; }>;
    taskStages: Array<{ id: number; name: string; color: string; }>;
    auth: { user?: { permissions?: string[] } };
}

type ModalMode = 'add' | 'edit' | 'view';

interface ModalState {
    isOpen: boolean;
    mode: ModalMode | '';
    data: KanbanTask | null;
    preSelectedStage?: number;
}

export default function Kanban() {
    const { t } = useTranslation();
    const { project, stages, tasks, milestones, teamMembers, taskStages, auth } = usePage<KanbanProps>().props;

    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const [deleteState, setDeleteState] = useState({ isOpen: false, taskId: null as number | null });

    const openDeleteDialog = (taskId: number) => {
        setDeleteState({ isOpen: true, taskId });
    };

    const closeDeleteDialog = () => {
        setDeleteState({ isOpen: false, taskId: null });
    };
    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Project Task', settingKey: 'GoogleDrive Task' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Task', settingKey: 'OneDrive Task' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Project Task', settingKey: 'Dropbox Project Task' });

    const confirmDelete = async () => {
        if (deleteState.taskId) {
            try {
                await axios.delete(route('project.tasks.destroy', deleteState.taskId));
                refreshTasks();
                closeDeleteDialog();
                toast.success(t('The task has been deleted successfully.'));
            } catch (error) {
                toast.error(t('Failed to delete task'));
            }
        }
    };

    const handleMove = async (taskId: number, fromStatus: string, toStatus: string) => {
        const stageId = stages.find(stage => stage.name.toLowerCase().replace(/\s+/g, '-') === toStatus)?.id;
        if (stageId) {
            try {
                const response = await axios.patch(route('project.tasks.move', taskId), { stage_id: stageId });
                refreshTasks();
                if (response.data.message) {
                    toast.success(t(response.data.message));
                }
            } catch (error) {
                console.error('Failed to move task:', error);
            }
        }
    };

    const openModal = (mode: ModalMode, data: KanbanTask | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const [currentTasks, setCurrentTasks] = useState(tasks);

    const refreshTasks = useCallback(async () => {
        try {
            const response = await axios.get(route('project.tasks.api', project.id));
            setCurrentTasks(response.data.tasks || tasks);
        } catch (error) {
            setCurrentTasks(tasks);
        }
    }, [project.id, tasks]);

    const handleTaskCreated = () => {
        setModalState({ isOpen: false, mode: '', data: null });
        router.reload();
    };


    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    useEffect(() => {
        setCurrentTasks(tasks);
    }, [tasks]);

    // Debug stage mapping
    const generatedColumns = stages.map(stage => ({
        id: stage.name.toLowerCase().replace(/\s+/g, '-'),
        title: stage.name,
        color: stage.color
    }));

    const priorityConfig: Record<string, { label: string; dot: string; badge: string }> = {
        Low:    { label: 'Low',    dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800' },
        Medium: { label: 'Medium', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800' },
        High:   { label: 'High',   dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800' },
    };

    const TaskCard = ({ task }: { task: KanbanTask }) => {
        const handleDragStart = (e: React.DragEvent) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id }));
            e.dataTransfer.effectAllowed = 'move';
        };

        const priority = task.priority ? (priorityConfig[task.priority] ?? priorityConfig['Medium']) : null;

        const isOverdue = (() => {
            if (!task.due_date) return false;
            const endPart = task.due_date.includes(' - ') ? task.due_date.split(' - ')[1]?.trim() : task.due_date;
            return endPart ? new Date(endPart) < new Date() : false;
        })();

        return (
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 p-3.5 mb-2.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-move select-none group"
                draggable={true}
                onDragStart={handleDragStart}
            >

                {/* Header: title + actions menu */}
                <div className="flex items-start justify-between gap-2 pl-2">
                    <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug flex-1 line-clamp-2">
                        {task.title}
                    </h4>
                    {(auth.user?.permissions?.includes('view-project-task') ||
                      auth.user?.permissions?.includes('edit-project-task') ||
                      auth.user?.permissions?.includes('delete-project-task')) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all"
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                                {auth.user?.permissions?.includes('view-project-task') && (
                                    <DropdownMenuItem onClick={() => openModal('view', { id: task.id })} className="gap-2 text-xs">
                                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                                        {t('View')}
                                    </DropdownMenuItem>
                                )}
                                {auth.user?.permissions?.includes('edit-project-task') && (
                                    <DropdownMenuItem onClick={() => openModal('edit', { id: task.id })} className="gap-2 text-xs">
                                        <Edit className="h-3.5 w-3.5 text-amber-500" />
                                        {t('Edit')}
                                    </DropdownMenuItem>
                                )}
                                {auth.user?.permissions?.includes('delete-project-task') && (
                                    <DropdownMenuItem
                                        onClick={() => openDeleteDialog(task.id)}
                                        className="gap-2 text-xs text-red-600 hover:!text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {t('Delete')}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Priority + Overdue inline */}
                <div className="flex items-center gap-1.5 mt-2.5 pl-2">
                    {priority && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${priority.badge}`}>
                            {t(priority.label)}
                        </span>
                    )}
                    {isOverdue && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 ring-1 ring-inset ring-red-200 dark:bg-red-900/40 dark:text-red-400 dark:ring-red-800">
                            {t('Overdue')}
                        </span>
                    )}
                </div>

                {/* Milestone badge — below priority */}
                {task.milestone && (
                    <div className="mt-1.5 pl-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800">
                            <span className="truncate max-w-[160px]">{task.milestone}</span>
                        </span>
                    </div>
                )}

                {/* Footer: avatars (left) + date (right) */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-300 dark:border-gray-600 pl-2">
                    {/* Assigned avatars */}
                    <div className="flex items-center">
                        {task.assigned_users && task.assigned_users.length > 0 ? (
                            <div className="flex -space-x-1.5">
                                {task.assigned_users.slice(0, 2).map((user: any, index: number) => (
                                    <TooltipProvider key={index}>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger>
                                                <div className="h-7 w-7 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-sm">
                                                    {user.avatar ? (
                                                        <img
                                                            src={getImagePath(user.avatar)}
                                                            alt={user.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-primary">
                                                            {user.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs">{user.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                                {task.assigned_users.length > 2 && (
                                    <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                            +{task.assigned_users.length - 2}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-gray-300 dark:text-gray-600">
                                <User className="h-3.5 w-3.5" />
                                <span className="text-xs">{t('Unassigned')}</span>
                            </div>
                        )}
                    </div>

                    {/* Due date beside avatars */}
                    {task.due_date && (
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>
                                {task.due_date.includes(' - ') ? (() => {
                                    const [s, e] = task.due_date.split(' - ');
                                    return `${formatDate(s.trim())} – ${formatDate(e.trim())}`;
                                })() : formatDate(task.due_date)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Project'), url: route('project.index') },
                { label: project.name, url: route('project.show', project.id) },
                { label: t('Task Kanban') }
            ]}
            pageTitle={`${project.name} - ${t('Task Kanban')}`}
            backUrl={route('project.show', project.id)}
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
                        {auth.user?.permissions?.includes('manage-project-task') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm"
                                        onClick={() => router.get(route('project.tasks.index', { project_id: project.id }))}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('List View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-project-task') && (
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
                </div>
            }
        >
            <Head title={t('Task Kanban')} />

            <KanbanBoard
                tasks={currentTasks}
                columns={stages.map(stage => ({
                    id: stage.name.toLowerCase().replace(/\s+/g, '-'),
                    title: stage.name,
                    color: stage.color
                }))}
                onMove={handleMove}
                taskCard={TaskCard}
                kanbanActions={(columnId: string) => {
                    const stage = stages.find(s => s.name.toLowerCase().replace(/\s+/g, '-') === columnId);
                    return auth.user?.permissions?.includes('create-project-task') ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-white/50"
                                    onClick={() => {
                                        setModalState({
                                            isOpen: true,
                                            mode: 'add',
                                            data: null,
                                            preSelectedStage: stage?.id
                                        });
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Create')}</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : null;
                }}
            />

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create
                        onSuccess={handleTaskCreated}
                        project={project}
                        milestones={milestones}
                        teamMembers={teamMembers}
                        taskStages={taskStages}
                        preSelectedStageId={modalState.preSelectedStage}
                    />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditTask
                        onSuccess={() => {
                            closeModal();
                            refreshTasks();
                        }}
                        task={{ id: modalState.data.id }}
                        project={project}
                        milestones={milestones}
                        teamMembers={teamMembers}
                        taskStages={taskStages}
                    />
                )}
                {modalState.mode === 'view' && modalState.data && (
                    <ViewTask
                        task={{ id: modalState.data.id }}
                        project={project}
                        milestones={milestones}
                        teamMembers={teamMembers}
                        taskStages={taskStages}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Task')}
                message={t('Are you sure you want to delete this task?')}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
