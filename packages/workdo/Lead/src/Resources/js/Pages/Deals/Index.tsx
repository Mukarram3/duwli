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
import { Separator } from '@/components/ui/separator';
import { Plus, Edit as EditIcon, Trash2, Eye, DollarSign as DollarSignIcon, Tag, MoreVertical, Kanban, List, ShoppingCart, Globe, CheckSquare, Users as UsersIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import KanbanBoard from '@/components/kanban-board';
import Create from './Create';
import EditDeal from './Edit';
import View from './View';
import LabelView from './LabelView';
import NoRecordsFound from '@/components/no-records-found';
import { Deal, DealsIndexProps, DealFilters, DealModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';


export default function Index() {
    const { t } = useTranslation();
    const { deals, auth, pipelines, stages, groups, users, sources, products, permissions } = usePage<DealsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<DealFilters>({
        name: urlParams.get('name') || '',
        notes: urlParams.get('notes') || '',
        pipeline_id: urlParams.get('pipeline_id') || (pipelines?.[0]?.id?.toString() || ''),
        stage_id: urlParams.get('stage_id') || '',
        status: urlParams.get('status') || '',
        is_active: urlParams.get('is_active') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>(urlParams.get('view') as 'list' | 'kanban' || 'list');
    const [modalState, setModalState] = useState<DealModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Deal | null>(null);
    const [labelingItem, setLabelingItem] = useState<Deal | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'lead.deals.destroy',
        defaultMessage: t('Are you sure you want to delete this deal?')
    });

    const handleFilter = () => {
        router.get(route('lead.deals.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('lead.deals.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Deal', settingKey: 'GoogleDrive Deal' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Deal', settingKey: 'OneDrive Deal' });
    const dropboxButtons = usePageButtons('dropboxBtn', { module: 'Deal', settingKey: 'Dropbox Deal' });
    const boxButtons = usePageButtons('boxBtn', { module: 'Deal', settingKey: 'Box Deal' });
    const hubspotButtons = usePageButtons('hubspotBtn', { module: 'Deal', settingKey: 'HubSpot Deal' });

    const clearFilters = () => {
        setFilters({
            name: '',
            notes: '',
            pipeline_id: '',
            stage_id: '',
            status: '',
            is_active: '',
        });
        router.get(route('lead.deals.index'), {per_page: perPage, view: viewMode});
    };

    const openModal = (mode: 'add' | 'edit', data: Deal | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const stageColors = ['#3b82f6', '#ef4444', '#10b77f', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'];

    const getStageColor = (stageId: number | string) => {
        const index = stages?.findIndex(s => s.id.toString() === stageId?.toString()) ?? -1;
        return index >= 0 ? stageColors[index % stageColors.length] : '#6b7280';
    };

    const handleMove = (dealId: number, fromStage: string, toStage: string) => {
        router.post(route('lead.deals.order'), {
            deal_id: dealId,
            stage_id: toStage,
            order: [dealId]
        }, {
            preserveState: true,
            onSuccess: () => {
                router.reload({ only: ['deals'] });
            }
        });
    };

    const getKanbanData = () => {
        const colors = ['#3b82f6', '#ef4444', '#10b77f', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'];

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

        const filteredDeals = deals?.data?.filter(deal => {
            let isValid = true;
            if (filters.pipeline_id && filters.pipeline_id !== '') {
                isValid = isValid && deal.pipeline_id?.toString() === filters.pipeline_id;
            }
            return isValid;
        }) || [];

        filteredDeals.forEach(deal => {
            const stageId = deal.stage_id?.toString();
            if (stageId && tasksByStage[stageId]) {
                tasksByStage[stageId].push({
                    id: deal.id,
                    title: deal.name,
                    description: deal.phone,
                    status: stageId,
                    due_date: null,
                    assigned_to: deal.user_deals || [],
                    priority: null,
                    deal: deal
                });
            }
        });

        return { columns, tasks: tasksByStage };
    };

    const DealCard = ({ task }: { task: any }) => {
        const deal = task.deal;
        const totalTasks = deal.tasks_count || 0;
        const completedTasks = deal.complete_tasks_count || 0;
        const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const handleDragStart = (e: React.DragEvent) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromStatus: task.status }));
            e.dataTransfer.effectAllowed = 'move';
        };

        const statusColor = deal.status === 'Won'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800'
            : deal.status === 'Loss'
                ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800'
                : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800';

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
                            router.get(route('lead.deals.show', deal.id));
                        }}
                    >
                        {task.title}
                    </h4>
                    {(auth.user?.permissions?.includes('view-deals') ||
                      auth.user?.permissions?.includes('edit-deals') ||
                      auth.user?.permissions?.includes('delete-deals')) && (
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
                                {auth.user?.permissions?.includes('view-deals') && (
                                    <DropdownMenuItem onClick={() => router.get(route('lead.deals.show', deal.id))} className="gap-2 text-xs">
                                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                                        {t('View')}
                                    </DropdownMenuItem>
                                )}
                                {auth.user?.permissions?.includes('edit-deals') && (
                                    <DropdownMenuItem onClick={() => openModal('edit', deal)} className="gap-2 text-xs">
                                        <EditIcon className="h-3.5 w-3.5 text-amber-500" />
                                        {t('Edit')}
                                    </DropdownMenuItem>
                                )}
                                {auth.user?.permissions?.includes('delete-deals') && (
                                    <DropdownMenuItem
                                        onClick={() => openDeleteDialog(deal.id)}
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

                {/* Price + Status row */}
                <div className="flex items-center justify-between mt-2.5 mb-3">
                    {deal.price ? (
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(deal.price)}</span>
                    ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                    {deal.status && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ring-1 ring-inset ${statusColor}`}>
                            {t(deal.status)}
                        </span>
                    )}
                </div>

                {/* Stats row: products + sources + tasks */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {/* Products badge */}
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 ring-1 ring-inset ring-blue-200 dark:ring-blue-800 px-2 py-0.5 rounded-full cursor-default">
                                    <ShoppingCart className="h-3 w-3" />
                                    <span>{deal.products ? (Array.isArray(deal.products) ? deal.products.length : deal.products.split(',').filter(Boolean).length) : 0}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <div className="space-y-1">
                                    <p className="font-semibold text-xs border-b border-border pb-1 mb-1">{t('Products')}</p>
                                    {(() => {
                                        const productIds = deal.products ? (Array.isArray(deal.products) ? deal.products : deal.products.split(',')).filter(Boolean) : [];
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
                                    <span>{deal.sources ? (Array.isArray(deal.sources) ? deal.sources.length : deal.sources.split(',').filter(Boolean).length) : 0}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <div className="space-y-1">
                                    <p className="font-semibold text-xs border-b border-border pb-1 mb-1">{t('Sources')}</p>
                                    {(() => {
                                        const sourceIds = deal.sources ? (Array.isArray(deal.sources) ? deal.sources : deal.sources.split(',')).filter(Boolean) : [];
                                        return sourceIds.length > 0 ? sourceIds.map((sourceId: string, idx: number) => {
                                            const source = sources?.find((s: any) => s.id.toString() === String(sourceId).trim());
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

                {/* Footer: avatars + client avatars */}
                <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex -space-x-1.5">
                        <TooltipProvider>
                            {deal.users?.length > 0 ? deal.users.slice(0, 3).map((user: any) => (
                                <Tooltip key={user.id} delayDuration={0}>
                                    <TooltipTrigger>
                                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center flex-shrink-0">
                                            {user.avatar ? (
                                                <img src={getImagePath(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-primary">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p className="text-xs">
                                            <span className="font-semibold text-muted-foreground mr-1">{t('User')}:</span>
                                            {user.name}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )) : (
                                <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                    <UsersIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                </div>
                            )}
                            {deal.users?.length > 3 && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">+{deal.users.length - 3}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-xs border-b border-border pb-1 mb-1">{t('Assigned Users')}</p>
                                            {deal.users.slice(3).map((user: any) => (
                                                <p key={user.id} className="text-xs">{user.name}</p>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    </div>

                    {/* Client avatars */}
                    {deal.client_deals?.length > 0 && (
                        <div className="flex -space-x-1.5">
                            <TooltipProvider>
                                {deal.client_deals.slice(0, 2).map((cd: any) => (
                                    <Tooltip key={cd.client_id} delayDuration={0}>
                                        <TooltipTrigger>
                                            <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-100 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center flex-shrink-0">
                                                {cd.client?.avatar ? (
                                                    <img src={getImagePath(cd.client.avatar)} alt={cd.client?.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-amber-700">
                                                        {cd.client?.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                <span className="font-semibold text-muted-foreground mr-1">{t('Client')}:</span>
                                                {cd.client?.name}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </TooltipProvider>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Deal'),
            sortable: true,
            render: (value: string, deal: Deal) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <span className="text-sm font-bold text-primary">
                            {value?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p
                            className="font-semibold text-sm text-gray-900 hover:text-primary cursor-pointer transition-colors truncate"
                            onClick={() => router.get(route('lead.deals.show', deal.id))}
                        >
                            {value}
                        </p>
                        {deal.phone && (
                            <p className="text-xs text-muted-foreground mt-0.5">{deal.phone}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'price',
            header: t('Price'),
            sortable: false,
            render: (value: number) => (
                <span className="font-semibold text-sm text-gray-900">
                    {value ? formatCurrency(value) : <span className="text-gray-400">—</span>}
                </span>
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
                                totalTasks === 0 ? 'text-gray-400' : completedTasks === totalTasks ? 'text-green-700' : 'text-gray-700'
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
                                    className={`h-full rounded-full transition-all ${completedTasks === totalTasks ? 'bg-green-500' : 'bg-primary'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'clients',
            header: t('Clients'),
            sortable: false,
            render: (_: any, row: any) => (
                <div className="flex items-center">
                    <TooltipProvider>
                        <div className="flex -space-x-1.5">
                            {row.client_deals?.length > 0 ? row.client_deals.slice(0, 3).map((cd: any) => (
                                <Tooltip key={cd.client_id} delayDuration={0}>
                                    <TooltipTrigger>
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-amber-100 border-2 border-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {cd.client?.avatar ? (
                                                <img src={getImagePath(cd.client.avatar)} alt={cd.client.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-semibold text-amber-700">
                                                    {cd.client?.name?.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{cd.client?.name}</p></TooltipContent>
                                </Tooltip>
                            )) : (
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                                    <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
                                </div>
                            )}
                            {row.client_deals?.length > 3 && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border-2 border-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <span className="text-xs font-semibold text-gray-600">+{row.client_deals.length - 3}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-1">
                                            {row.client_deals.slice(3).map((cd: any) => (
                                                <p key={cd.client_id}>{cd.client?.name}</p>
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
            key: 'stage',
            header: t('Stage'),
            sortable: false,
            render: (value: any, row: any) => {
                const stageName = row.stage?.name || stages?.find(item => item.id.toString() === row.stage_id?.toString())?.name;
                const color = getStageColor(row.stage_id);
                return (
                    <span
                        className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border capitalize"
                        style={{
                            backgroundColor: `${color}0d`,
                            color: color,
                            borderColor: `${color}30`
                        }}
                    >
                        {stageName ? t(stageName) : t('No Stage')}
                    </span>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => (
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md capitalize ${
                    value === 'Won' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800' :
                    value === 'Loss' ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800' :
                    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800'
                }`}>
                    {value ? t(value) : '-'}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-deals','edit-deals', 'delete-deals'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, deal: Deal) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-deals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setLabelingItem(deal)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <Tag className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Label')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-deals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('lead.deals.show', deal.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-deals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', deal)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-deals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(deal.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
                {label: t('Deals')}
            ]}
            pageTitle={t('Manage Deals')}
            pageDescription={t('Manage and track your deals, pipeline stages, and tasks.')}
            pageActions={
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Select value={filters.pipeline_id || pipelines?.[0]?.id?.toString() || 'all'} onValueChange={(value) => {
                            const pipelineId = value === 'all' ? '' : value;
                            setFilters({...filters, pipeline_id: pipelineId});

                            // Save default pipeline to user table
                            if (pipelineId) {
                                fetch(route('lead.deals.save-default-pipeline'), {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                                    },
                                    body: JSON.stringify({ pipeline_id: pipelineId })
                                });
                            }

                            router.get(route('lead.deals.index'), {...filters, pipeline_id: pipelineId, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
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
                        {dropboxButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {boxButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {hubspotButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('view-deals') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" className="bg-white" onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}>
                                        {viewMode === 'kanban' ? <List className="h-4 w-4" /> : <Kanban className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{viewMode === 'kanban' ? t('List View') : t('Kanban View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-deals') && (
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
            <Head title={t('Deals')} />

            {viewMode === 'kanban' ? (
                (() => {
                    const { columns, tasks } = getKanbanData();
                    return (
                        <KanbanBoard
                            tasks={tasks}
                            columns={columns}
                            onMove={handleMove}
                            taskCard={DealCard}
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
                                    placeholder={t('Search Deals...')}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <PerPageSelector
                                    routeName="lead.deals.index"
                                    filters={{...filters, view: viewMode}}
                                />
                                <div className="relative">
                                    <FilterButton
                                        showFilters={showFilters}
                                        onToggle={() => setShowFilters(!showFilters)}
                                    />
                                    {(() => {
                                        const activeFilters = [filters.stage_id, filters.status].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                    <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by Status')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Won">{t('Won')}</SelectItem>
                                            <SelectItem value="Loss">{t('Loss')}</SelectItem>
                                            <SelectItem value="Active">{t('Active')}</SelectItem>
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

                    {/* Table */}
                    <CardContent className="p-0">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={deals?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={DollarSignIcon}
                                            title={t('No Deals found')}
                                            description={t('Get started by creating your first Deal.')}
                                            hasFilters={!!(filters.name || filters.notes || filters.stage_id || filters.status)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-deals"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Deal')}
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
                            data={deals || { data: [], links: [], meta: {} }}
                            routeName="lead.deals.index"
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
                    <EditDeal
                        deal={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!labelingItem} onOpenChange={() => setLabelingItem(null)}>
                {labelingItem && <LabelView deal={labelingItem} onSuccess={() => setLabelingItem(null)} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Deal')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
