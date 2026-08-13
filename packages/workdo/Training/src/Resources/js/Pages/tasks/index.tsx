import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, CheckSquare, MessageSquare, Check, LayoutGrid, Clock, CheckCircle2, User, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CreateTask from './create';
import EditTask from './edit';
import NoRecordsFound from '@/components/no-records-found';
import { formatDate, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { training, tasks, users, auth } = usePage().props;
    
    // Sort tasks to show latest on top
    const sortedTasks = (tasks.data || tasks).sort((a: any, b: any) => b.id - a.id);
    
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const [activeTab, setActiveTab] = useState(urlParams.get('status') || 'all');

    const allTasks = sortedTasks;
    const pendingTasks = allTasks.filter((task: any) => task.status === 'pending');
    const completedTasks = allTasks.filter((task: any) => task.status === 'completed');

    const displayedTasks = allTasks.filter((task: any) => {
        if (activeTab === 'all') return true;
        return task.status === activeTab;
    });

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const newParams = new URLSearchParams(window.location.search);
        if (tab === 'all') {
            newParams.delete('status');
        } else {
            newParams.set('status', tab);
        }
        router.get(window.location.pathname + '?' + newParams.toString(), {}, {
            preserveState: true,
            replace: true
        });
    };

    const [modalState, setModalState] = useState({
        isOpen: false,
        mode: '',
        data: null
    });


    const [deleteState, setDeleteState] = useState({
        isOpen: false,
        id: null,
        message: t('Are you sure you want to delete this task?')
    });

    const openDeleteDialog = (id) => {
        setDeleteState({
            isOpen: true,
            id,
            message: t('Are you sure you want to delete this task?')
        });
    };

    const closeDeleteDialog = () => {
        setDeleteState({
            isOpen: false,
            id: null,
            message: t('Are you sure you want to delete this task?')
        });
    };

    const confirmDelete = () => {
        if (deleteState.id) {
            router.delete(route('training.tasks.destroy', deleteState.id));
            closeDeleteDialog();
        }
    };

    const openModal = (mode, data = null) => {
        setModalState({
            isOpen: true,
            mode,
            data
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    };



    const markTaskComplete = (taskId) => {
        router.patch(route('training.trainings.tasks.complete', [training.id, taskId]));
    };

    const renderStars = (rating: number) => {
        const roundedRating = Math.round(rating * 2) / 2;
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= roundedRating) {
                stars.push(
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                );
            } else if (i - 0.5 === roundedRating) {
                stars.push(
                    <div key={i} className="relative flex-shrink-0">
                        <Star className="h-4 w-4 text-gray-300 dark:text-zinc-600 flex-shrink-0" />
                        <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                        </div>
                    </div>
                );
            } else {
                stars.push(
                    <Star key={i} className="h-4 w-4 text-gray-300 dark:text-zinc-600 flex-shrink-0" />
                );
            }
        }
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5 cursor-help">
                            {stars}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{rating > 0 ? t('Rating: {{rating}} / 5', { rating: rating.toFixed(1) }) : t('No feedback')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            render: (value: any, task: any) => {
                const truncatedDesc = task.description && task.description.length > 50
                    ? task.description.substring(0, 50) + '...'
                    : task.description;

                return (
                    <div className="flex flex-col max-w-[280px]">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{value}</span>
                        {truncatedDesc && (
                            <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={task.description}>
                                {truncatedDesc}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'assigned_user',
            header: t('Assigned To'),
            render: (value: any, task: any) => {
                const user = task.assigned_user;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0 dark:bg-zinc-800 dark:border-zinc-700">
                            {user?.avatar ? (
                                <img src={getImagePath(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{user?.name || '-'}</span>
                            <span className="text-xs text-muted-foreground">{user?.email || '-'}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'due_date',
            header: t('Due Date'),
            render: (value: any, task: any) => {
                if (!value) return '-';
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = task.status !== 'completed' && new Date(value) < today;
                return (
                    <span className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                        {formatDate(value)}
                    </span>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: any) => {
                const statusColors = {
                    pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20',
                    completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20'
                };
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        statusColors[value as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                    }`}>
                        {t(value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '))}
                    </span>
                );
            }
        },
        {
            key: 'feedback',
            header: t('Feedback'),
            render: (value: any, task: any) => {
                const feedbacks = task.feedbacks || [];
                const averageRating = feedbacks.length > 0
                    ? feedbacks.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / feedbacks.length
                    : 0;
                
                return renderStars(averageRating);
            }
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, task: any) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {task.status !== 'completed' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => markTaskComplete(task.id)}
                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Mark Complete')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-training-tasks') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => openModal('edit', task)}
                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => router.visit(route('training.tasks.feedbacks.index', task.id))}
                                    className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Feedbacks')} ({task.feedbacks.length})</p>
                            </TooltipContent>
                        </Tooltip>
                        {auth.user?.permissions?.includes('delete-training-tasks') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(task.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20"
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
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Training')}, 
                {label: t('Training List'), url: route('training.trainings.index')},
                {label: training.title, url: route('training.trainings.index')},
                {label: t('Tasks')}
            ]}
            pageTitle={`${training.title} - ${t('Tasks')}`}
            backUrl={route('training.trainings.index')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('create-training-tasks') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create Task')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Training Tasks')} />

            <Card className="shadow-sm border border-gray-300 dark:border-zinc-800 overflow-hidden">
                {/* Status Tabs */}
                <div className="px-4 py-0 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all',       label: t('All'),       icon: LayoutGrid,   count: allTasks.length },
                            { key: 'pending',   label: t('Pending'),   icon: Clock,        count: pendingTasks.length },
                            { key: 'completed', label: t('Completed'), icon: CheckCircle2, count: completedTasks.length },
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
                </div>

                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                            <DataTable
                                data={displayedTasks}
                                columns={tableColumns}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={CheckSquare}
                                        title={t('No tasks found')}
                                        description={t('Get started by creating your first task.')}
                                        createPermission="create-training-tasks"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Task')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <CreateTask 
                        onSuccess={closeModal} 
                        training={training}
                        users={users}
                    />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditTask 
                        onSuccess={closeModal} 
                        training={training}
                        users={users}
                        task={modalState.data}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Task')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}