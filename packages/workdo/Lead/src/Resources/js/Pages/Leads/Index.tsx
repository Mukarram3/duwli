import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Users as UsersIcon, Tag, MoreVertical, Calendar, Kanban, List, ShoppingCart, Globe, CheckSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import KanbanBoard from '@/components/kanban-board';
import Create from './Create';
import EditLead from './Edit';
import View from './View';
import LabelView from './LabelView';
import ConvertToDeal from './Show/ConvertToDeal';
import NoRecordsFound from '@/components/no-records-found';
import RandomBadgeUI from '@/components/random-badge-ui';
import { Lead, LeadsIndexProps, LeadFilters, LeadModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';
import { DateRangePicker } from '@/components/ui/date-range-picker';


export default function Index() {
    const { t } = useTranslation();
    const { leads, auth, users, pipelines, stages, labels, sources, products, currentPipelineId } = usePage<LeadsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<LeadFilters>({
        name: urlParams.get('name') || '',
        email: urlParams.get('email') || '',
        subject: urlParams.get('subject') || '',
        is_active: urlParams.get('is_active') || '',
        user_id: urlParams.get('user_id') || '',
        pipeline_id: urlParams.get('pipeline_id') || (currentPipelineId?.toString() || ''),
        stage_id: urlParams.get('stage_id') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })(),
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>(urlParams.get('view') as 'list' | 'kanban' || 'list');
    const [modalState, setModalState] = useState<LeadModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Lead | null>(null);
    const [labelingItem, setLabelingItem] = useState<Lead | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Lead', settingKey: 'GoogleDrive Lead' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Lead', settingKey: 'OneDrive Lead' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Lead', settingKey: 'Dropbox Lead' });
    const boxBtn = usePageButtons('boxBtn', { module: 'Lead', settingKey: 'Box Lead' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'lead.leads.destroy',
        defaultMessage: t('Are you sure you want to delete this lead?')
    });

    const handleFilter = () => {
        const filterParams: any = {
            ...filters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        };
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;
        router.get(route('lead.leads.index'), filterParams, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('lead.leads.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            email: '',
            subject: '',
            is_active: '',
            user_id: '',
            pipeline_id: '',
            stage_id: '',
            date_range: '',
        });
        router.get(route('lead.leads.index'), {per_page: perPage, view: viewMode});
    };

    const openModal = async (mode: 'add' | 'edit', data: Lead | null = null) => {
        if (mode === 'edit' && data) {
            try {
                const response = await fetch(route('lead.leads.edit', data.id));
                const editData = await response.json();
                setModalState({ isOpen: true, mode, data: editData });
            } catch (error) {
                setModalState({ isOpen: true, mode, data });
            }
        } else {
            setModalState({ isOpen: true, mode, data });
        }
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const handleMove = (leadId: number, fromStage: string, toStage: string) => {
        router.post(route('lead.leads.order'), {
            lead_id: leadId,
            stage_id: toStage,
            order: [leadId]
        }, {
            preserveState: true,
            onSuccess: () => {
                router.reload({ only: ['leads'] });
            }
        });
    };

    const stageColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'];

    const getStageColor = (stageId: number | string) => {
        const index = stages?.findIndex(s => s.id.toString() === stageId?.toString()) ?? -1;
        return index >= 0 ? stageColors[index % stageColors.length] : '#6b7280';
    };

    const getKanbanData = () => {
        const colors = stageColors;

        const filteredStages = filters.pipeline_id && filters.pipeline_id !== ''
            ? stages?.filter(stage => stage.pipeline_id?.toString() === filters.pipeline_id) || []
            : stages || [];

        const columns = filteredStages.map((stage, index) => ({
            id: stage.id.toString(),
            title: stage.name,
            color: colors[index % colors.length]
        }));

        const tasksByStage = {};
        columns.forEach(col => {
            tasksByStage[col.id] = [];
        });

        const filteredLeads = leads?.data?.filter(lead => {
            let isValid = true;
            if (filters.user_id && filters.user_id !== '') {
                isValid = isValid && lead.user_leads?.some(userLead => userLead.user.id.toString() === filters.user_id);
            }
            if (filters.pipeline_id && filters.pipeline_id !== '') {
                isValid = isValid && lead.pipeline_id?.toString() === filters.pipeline_id;
            }
            return isValid;
        }) || [];

        filteredLeads.forEach(lead => {
            const stageId = lead.stage_id?.toString();
            if (stageId && tasksByStage[stageId]) {
                tasksByStage[stageId].push({
                    id: lead.id,
                    title: lead.name,
                    description: lead.subject,
                    status: stageId,
                    due_date: lead.date,
                    assigned_to: lead.user_leads?.[0]?.user || null,
                    priority: null,
                    lead: lead
                });
            }
        });

        return { columns, tasks: tasksByStage };
    };

    const LeadCard = ({ task }: { task: any }) => {
        const lead = task.lead;
        const isOverdue = task.due_date && new Date(task.due_date) < new Date();
        const totalTasks = lead.tasks_count || 0;
        const completedTasks = lead.complete_tasks_count || 0;
        const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const handleDragStart = (e: React.DragEvent) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromStatus: task.status }));
            e.dataTransfer.effectAllowed = 'move';
        };

        return (
            <div
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 mb-2.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing select-none group overflow-hidden"
                draggable={true}
                onDragStart={handleDragStart}
            >
                {/* Header: title + actions menu */}
                <div className="flex items-start justify-between gap-2">
                    <h4
                        className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug flex-1 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.get(route('lead.leads.show', lead.id));
                        }}
                    >
                        {task.title}
                    </h4>
                    {(auth.user?.permissions?.includes('view-leads') ||
                      auth.user?.permissions?.includes('edit-leads') ||
                      auth.user?.permissions?.includes('delete-leads')) && (
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
                                {auth.user?.permissions?.includes('view-leads') && (
                                    <DropdownMenuItem onClick={() => router.get(route('lead.leads.show', lead.id))} className="gap-2 text-xs">
                                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                                        {t('View')}
                                    </DropdownMenuItem>
                                )}
                                {auth.user?.permissions?.includes('edit-leads') && (
                                    <DropdownMenuItem onClick={() => openModal('edit', lead)} className="gap-2 text-xs">
                                        <EditIcon className="h-3.5 w-3.5 text-amber-500" />
                                        {t('Edit')}
                                    </DropdownMenuItem>
                                )}
                                {auth.user?.permissions?.includes('delete-leads') && (
                                    <DropdownMenuItem
                                        onClick={() => openDeleteDialog(lead.id)}
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

                {/* Subject / Description */}
                {task.description && (
                    <p className="text-xs text-muted-foreground dark:text-gray-400 line-clamp-2 leading-relaxed mt-1.5">{task.description}</p>
                )}

                {/* Stats row: products + sources + tasks */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {/* Products badge */}
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 ring-1 ring-inset ring-blue-200 dark:ring-blue-800 px-2 py-0.5 rounded-full cursor-default">
                                    <ShoppingCart className="h-3 w-3" />
                                    <span>{lead.products ? lead.products.split(',').filter((id: string) => id.trim()).length : 0}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <div className="space-y-1">
                                    <p className="font-semibold text-xs border-b border-border pb-1 mb-1">{t('Products')}</p>
                                    {(() => {
                                        const productIds = lead.products ? lead.products.split(',').filter((id: string) => id.trim()) : [];
                                        return productIds.length > 0 ? productIds.map((productId: string, idx: number) => {
                                            const product = products?.find((p: any) => p.id.toString() === String(productId).trim());
                                            return <p key={idx} className="text-xs">{product?.name || `Product ${productId}`}</p>;
                                        }) : <p className="text-xs text-muted-foreground">{t('None')}</p>;
                                    })()}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Sources badge */}
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 ring-1 ring-inset ring-purple-200 dark:ring-purple-800 px-2 py-0.5 rounded-full cursor-default">
                                    <Globe className="h-3 w-3" />
                                    <span>{lead.sources ? lead.sources.split(',').filter((id: string) => id.trim()).length : 0}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <div className="space-y-1">
                                    <p className="font-semibold text-xs border-b border-border pb-1 mb-1">{t('Sources')}</p>
                                    {(() => {
                                        const sourceIds = lead.sources ? lead.sources.split(',').filter((id: string) => id.trim()) : [];
                                        return sourceIds.length > 0 ? sourceIds.map((sourceId: string, idx: number) => {
                                            const source = sources?.find((s: any) => s.id.toString() === sourceId.trim());
                                            return <p key={idx} className="text-xs">{source?.name || `Source ${sourceId}`}</p>;
                                        }) : <p className="text-xs text-muted-foreground">{t('None')}</p>;
                                    })()}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Task status badge (if tasks count > 0) */}
                    {totalTasks > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800 px-2 py-0.5 rounded-full">
                            <CheckSquare className="h-3 w-3" />
                            <span>{completedTasks}/{totalTasks} {t('Tasks')} ({taskPct}%)</span>
                        </div>
                    )}
                </div>

                {/* Progress bar — optional visual cue, cleaner below badges */}
                {totalTasks > 0 && (
                    <div className="mt-2.5 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                taskPct === 100 ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${taskPct}%` }}
                        />
                    </div>
                )}

                {/* Footer: avatars + due date */}
                <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex -space-x-1.5">
                        <TooltipProvider>
                            {lead.user_leads?.length > 0 ? lead.user_leads.slice(0, 3).map((userLead: any) => (
                                <Tooltip key={userLead.user.id} delayDuration={0}>
                                    <TooltipTrigger>
                                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center flex-shrink-0">
                                            {userLead.user.avatar ? (
                                                <img src={getImagePath(userLead.user.avatar)} alt={userLead.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-primary">
                                                    {userLead.user.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top"><p className="text-xs">{userLead.user.name}</p></TooltipContent>
                                </Tooltip>
                            )) : (
                                <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                    <UsersIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                </div>
                            )}
                            {lead.user_leads?.length > 3 && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">+{lead.user_leads.length - 3}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <div className="space-y-1">
                                            {lead.user_leads.slice(3).map((userLead: any) => (
                                                <p key={userLead.user.id} className="text-xs">{userLead.user.name}</p>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    </div>

                    {/* Due date */}
                    {task.due_date && (
                        <div className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ring-1 ring-inset ${
                            isOverdue
                                ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800'
                                : 'bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800'
                        }`}>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(task.due_date)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Lead'),
            sortable: true,
            render: (value: string, lead: Lead) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <span className="text-sm font-bold text-primary">
                            {value?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p
                            className="font-semibold text-sm text-gray-900 hover:text-primary cursor-pointer transition-colors truncate"
                            onClick={() => router.get(route('lead.leads.show', lead.id))}
                        >
                            {value}
                        </p>
                        {lead.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">{lead.email}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'subject',
            header: t('Subject'),
            sortable: true,
            render: (value: string) => (
                <span className="text-sm text-gray-600 truncate max-w-[180px] block">{value || '-'}</span>
            )
        },
        {
            key: 'users',
            header: t('Assigned To'),
            sortable: false,
            render: (value: any, row: any) => (
                <div className="flex items-center">
                    <TooltipProvider>
                        <div className="flex -space-x-1.5">
                            {row.user_leads?.length > 0 ? row.user_leads.slice(0, 3).map((userLead: any, index: number) => (
                                <Tooltip key={userLead.user.id}>
                                    <TooltipTrigger>
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border-2 border-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {userLead.user.avatar ? (
                                                <img src={getImagePath(userLead.user.avatar)} alt={userLead.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-semibold text-primary">
                                                    {userLead.user.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{userLead.user.name}</p></TooltipContent>
                                </Tooltip>
                            )) : (
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                                    <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
                                </div>
                            )}
                            {row.user_leads?.length > 3 && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border-2 border-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <span className="text-xs font-semibold text-gray-600">+{row.user_leads.length - 3}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-1">
                                            {row.user_leads.slice(3).map((userLead: any) => (
                                                <p key={userLead.user.id}>{userLead.user.name}</p>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </TooltipProvider>
                </div>
            )
        },
        {
            key: 'tasks',
            header: t('Tasks'),
            sortable: false,
            render: (value: any, row: any) => {
                const totalTasks = row.tasks_count || 0;
                const completedTasks = row.complete_tasks_count || 0;
                const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                return (
                    <div className="flex flex-col gap-1 min-w-[80px]">
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                totalTasks === 0
                                    ? 'text-gray-400'
                                    : completedTasks === totalTasks
                                        ? 'text-green-700'
                                        : 'text-gray-700'
                            }`}>
                                <CheckSquare className="h-3 w-3" />
                                {completedTasks}/{totalTasks}
                            </span>
                            {totalTasks > 0 && (
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                            )}
                        </div>
                        {totalTasks > 0 && (
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        completedTasks === totalTasks ? 'bg-green-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'date',
            header: t('Follow Up'),
            sortable: false,
            render: (value: string) => {
                if (!value) return <span className="text-gray-400 text-sm">—</span>;
                const isExpired = new Date(value) < new Date();
                return (
                    <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {formatDate(value)}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'stage',
            header: t('Stage'),
            sortable: false,
            render: (value: any, row: any) => {
                const stageName = row.stage?.name || stages?.find(item => item.id.toString() === row.stage_id?.toString())?.name;
                return (
                    <RandomBadgeUI name={stageName ? t(stageName) : t('No Stage')} />
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-leads','edit-leads', 'delete-leads'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, lead: Lead) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-leads') && (
                            <ConvertToDeal
                                lead={lead}
                                deal={lead.is_converted ? { id: lead.is_converted, is_active: true } : undefined}
                                buttonVariant="ghost"
                                buttonClassName={lead.is_converted ? "h-8 w-8 p-0 text-gray-400 hover:text-gray-500" : "h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"}
                            />
                        )}
                        {auth.user?.permissions?.includes('edit-leads') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setLabelingItem(lead)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <Tag className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Label')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-leads') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('lead.leads.show', lead.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-leads') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', lead)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-leads') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(lead.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
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
                {label: t('CRM'), url: route('lead.index')},
                {label: t('Leads')}
            ]}
            pageTitle={t('Manage Leads')}
            pageDescription={t('Manage and track your leads, pipeline stages, and deals.')}
            pageActions={
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Select value={filters.pipeline_id || currentPipelineId?.toString() || ''} onValueChange={(value) => {
                            const pipelineId = value === 'all' ? '' : value;
                            setFilters({...filters, pipeline_id: pipelineId});

                            // Save default pipeline to user table
                            if (pipelineId) {
                                fetch(route('lead.leads.save-default-pipeline'), {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                                    },
                                    body: JSON.stringify({ pipeline_id: pipelineId })
                                });
                            }

                            setFilters(prev => ({...prev, pipeline_id: pipelineId, stage_id: ''}));
                            router.get(route('lead.leads.index'), {...filters, pipeline_id: pipelineId, stage_id: '', per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
                                preserveState: true,
                                replace: true
                            });
                        }}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder={t('Select Pipeline')} />
                            </SelectTrigger>
                            <SelectContent>
                                {pipelines?.map((pipeline: any) => (
                                    <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                                        {pipeline.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {googleDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {dropboxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {boxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('view-leads') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}>
                                        {viewMode === 'kanban' ? <List className="h-4 w-4" /> : <Kanban className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{viewMode === 'kanban' ? t('List View') : t('Kanban View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-leads') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Leads')} />

            {viewMode === 'kanban' ? (
                (() => {
                    const { columns, tasks } = getKanbanData();
                    return (
                        <KanbanBoard
                            tasks={tasks}
                            columns={columns}
                            onMove={handleMove}
                            taskCard={LeadCard}
                            kanbanActions={null}
                        />
                    );
                })()
            ) : (
                <Card className="shadow-sm">
                    {/* Search & Controls */}
                    <CardContent className="p-4 border-b bg-gray-50/50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-md">
                                <SearchInput
                                    value={filters.name}
                                    onChange={(value) => setFilters({...filters, name: value})}
                                    onSearch={handleFilter}
                                    placeholder={t('Search Name and Subject...')}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <PerPageSelector
                                    routeName="lead.leads.index"
                                    filters={{...filters, view: viewMode}}
                                />
                                <div className="relative">
                                    <FilterButton
                                        showFilters={showFilters}
                                        onToggle={() => setShowFilters(!showFilters)}
                                    />
                                    {(() => {
                                        const activeFilters = [filters.is_active, filters.user_id, filters.stage_id, filters.date_range].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                    {/* Advanced Filters */}
                    {showFilters && (
                        <CardContent className="p-4 bg-blue-50/30 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('User')}</label>
                                    <Select value={filters.user_id} onValueChange={(value) => setFilters({...filters, user_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by User')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users?.map((item: any) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Stage')}</label>
                                    <Select value={filters.stage_id} onValueChange={(value) => setFilters({...filters, stage_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by Stage')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stages?.filter((item: any) =>
                                                !filters.pipeline_id || item.pipeline_id?.toString() === filters.pipeline_id
                                            ).map((item: any) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Follow Up Date Range')}</label>
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

                    {/* Table */}
                    <CardContent className="p-0">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={leads?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={UsersIcon}
                                            title={t('No Leads found')}
                                            description={t('Get started by creating your first Lead.')}
                                            hasFilters={!!(filters.name || filters.email || filters.subject || filters.is_active || filters.user_id || filters.stage_id)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-leads"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Lead')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>

                    {/* Pagination */}
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                        <Pagination
                            data={leads || { data: [], links: [], meta: {} }}
                            routeName="lead.leads.index"
                            filters={{...filters, per_page: perPage, view: viewMode}}
                        />
                    </CardContent>
                </Card>
            )}

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditLead
                        lead={modalState.data.lead || modalState.data}
                        sources={modalState.data.sources || {}}
                        products={modalState.data.products || {}}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View lead={viewingItem} />}
            </Dialog>

            <Dialog open={!!labelingItem} onOpenChange={() => setLabelingItem(null)}>
                {labelingItem && <LabelView lead={labelingItem} onSuccess={() => setLabelingItem(null)} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Lead')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
