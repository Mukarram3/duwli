import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckSquare, Edit, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { formatDate, formatTime } from '@/utils/helpers';
import { Deal } from '../../types';
import { DealTask } from './types';
import Create from './Create';
import EditTask from './Edit';

interface TasksProps {
    deal: Deal;
    onRegisterAddHandler?: (handler: () => void) => void;
}

export default function Index({ deal, onRegisterAddHandler }: TasksProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [editingTask, setEditingTask] = useState<DealTask | null>(null);

    useEffect(() => {
        onRegisterAddHandler?.(() => setCreateOpen(true));
    }, [onRegisterAddHandler]);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'deal.tasks.destroy',
        defaultMessage: t('Are you sure you want to delete this task?'),
    });

    const getPriorityClass = (priority: string) => {
        switch (priority) {
            case 'Low': return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800';
            case 'Medium': return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-800';
            case 'High': return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800';
            default: return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'On Going': return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800';
            case 'Complete': return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800';
            default: return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800';
        }
    };

    // Sort by created_at descending (latest task on top)
    const sortedTasks = [...(deal.tasks || [])].sort((a: any, b: any) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (aTime !== bTime) {
            return bTime - aTime;
        }
        return b.id - a.id;
    });

    return (
        <>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Tasks')}</h3>
                <TooltipProvider>
                    {auth?.user?.permissions?.includes('create-deal-tasks') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => setCreateOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Create')}</p></TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            </div>

            <div className="overflow-y-auto scrollbar-thin max-h-[75vh] w-full pr-1">
                {sortedTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {sortedTasks.map((task: DealTask) => {
                            const taskDate = task.date ? new Date(task.date) : null;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (taskDate) taskDate.setHours(0, 0, 0, 0);
                            const isExpired = taskDate && taskDate < today && task.status !== 'Complete';

                            return (
                                <div
                                    key={task.id}
                                    className="bg-card border border-border/90 shadow-sm rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                                >
                                    {/* Top Row: Title & Badges */}
                                    <div className="flex items-start justify-between gap-4">
                                        <h4 className="font-bold text-foreground text-sm leading-snug truncate flex-1 pt-0.5">
                                            {task.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize ${getPriorityClass(task.priority)}`}>
                                                {t(task.priority)}
                                            </span>
                                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(task.status)}`}>
                                                {t(task.status)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer Row: Date/Time on Left, Actions on Right */}
                                    <div className="flex items-center justify-between pt-3 border-t border-border/80 gap-4">
                                        {/* Date & Time */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                                            {task.date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className={`h-3.5 w-3.5 ${isExpired ? 'text-red-500' : 'text-muted-foreground/60'}`} />
                                                    <span className={isExpired ? 'text-red-500 font-bold' : ''}>
                                                        {formatDate(task.date)}
                                                    </span>
                                                </div>
                                            )}
                                            {task.time && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                                                    <span>{formatTime(task.time)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {auth?.user?.permissions?.some((p: string) => ['edit-deal-tasks', 'delete-deal-tasks'].includes(p)) && (
                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                {auth?.user?.permissions?.includes('edit-deal-tasks') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditingTask(task)}
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {auth?.user?.permissions?.includes('delete-deal-tasks') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDeleteDialog(task.id)}
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/5"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <NoRecordsFound
                        icon={CheckSquare}
                        title={t('No Tasks found')}
                        description={t('Get started by creating your first Task.')}
                        createPermission="create-deal-tasks"
                        onCreateClick={() => setCreateOpen(true)}
                        createButtonText={t('Create Task')}
                        className="h-auto"
                    />
                )}
            </div>

            <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateKey(k => k + 1); setCreateOpen(open); }}>
                <Create key={createKey} dealId={deal.id} onSuccess={() => setCreateOpen(false)} />
            </Dialog>

            <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
                {editingTask && (
                    <EditTask task={editingTask} onSuccess={() => setEditingTask(null)} />
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
        </>
    );
}
