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
import { Plus, Edit as EditIcon, Trash2, Eye, Calendar, CalendarDays, Clock, User as UserIcon, LayoutGrid, CheckCircle2, XCircle, Tag, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Create from './Create';
import EditEvent from './Edit';
import View from './View';
import StatusUpdate from './StatusUpdate';
import NoRecordsFound from '@/components/no-records-found';
import { Event, EventsIndexProps, EventFilters, EventModalState } from './types';
import { formatDate, formatTime, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { events, auth, eventtypes } = usePage<EventsIndexProps>().props;
    const stats = (usePage().props as any).stats;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<EventFilters>({
        title: urlParams.get('title') || '',
        description: urlParams.get('description') || '',
        location: urlParams.get('location') || '',
        status: urlParams.get('status') || '',
        event_type_id: urlParams.get('event_type_id') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [modalState, setModalState] = useState<EventModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Event | null>(null);
    const [statusUpdateItem, setStatusUpdateItem] = useState<Event | null>(null);

    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.events.destroy',
        defaultMessage: t('Are you sure you want to delete this event?')
    });

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
            case 'pending':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
            case 'reject':
            case 'rejected':
                return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20';
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';
        }
    };

    const handleFilter = () => {
        router.get(route('hrm.events.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (statusKey: string) => {
        const newFilters = { ...filters, status: statusKey };
        setFilters(newFilters);
        router.get(route('hrm.events.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.events.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            title: '',
            description: '',
            location: '',
            status: '',
            event_type_id: '',
        });
        router.get(route('hrm.events.index'), { per_page: perPage });
    };

    const openModal = (mode: 'add' | 'edit', data: Event | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const statusTabs = [
        { key: '', label: t('All'), icon: LayoutGrid, count: stats?.total ?? events?.total ?? 0 },
        { key: 'pending', label: t('Pending'), icon: Clock, count: stats?.pending ?? 0 },
        { key: 'approved', label: t('Approved'), icon: CheckCircle2, count: stats?.approved ?? 0 },
        { key: 'reject', label: t('Reject'), icon: XCircle, count: stats?.reject ?? 0 },
    ];

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            sortable: true,
            render: (value: string, row: any) => {
                const eventType = eventtypes?.find(item => item.id.toString() === row.event_type_id?.toString())?.event_type || row.eventType?.event_type;
                return (
                    <div className="flex items-start gap-2.5 py-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CalendarDays className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{value}</span>
                            {eventType && (
                                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium w-fit ring-1 ring-inset bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20">
                                    <Tag className="w-3 h-3" />
                                    {eventType}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'start_date',
            header: t('Start Date'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        {
            key: 'end_date',
            header: t('End Date'),
            sortable: false,
            render: (value: string) => {
                if (!value) return <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>;
                const isExpired = new Date(value) < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                    <div className={`flex items-center gap-1.5 text-sm ${isExpired ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                        <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${isExpired ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`} />
                        <span>{formatDate(value)}</span>
                    </div>
                );
            }
        },
        {
            key: 'start_time',
            header: t('Start Time'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatTime(value)}</span>
                </div>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        {
            key: 'end_time',
            header: t('End Time'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{formatTime(value)}</span>
                </div>
            ) : <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(value)}`}>
                    {t(value?.charAt(0).toUpperCase() + value?.slice(1) || 'Unknown')}
                </span>
            )
        },
        {
            key: 'approved_by',
            header: t('Approved By'),
            sortable: false,
            render: (_: any, row: any) => {
                const user = row.approved_by || row.approvedBy;
                if (!user || !user.name) {
                    return <div className=" text-gray-400 dark:text-gray-500 font-medium">-</div>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                            {user.avatar ? (
                                <img
                                    src={getImagePath(user.avatar)}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    </div>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['manage-event-status', 'view-events', 'edit-events', 'delete-events'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, event: Event) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-event-status') && event.status === 'pending' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setStatusUpdateItem(event)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Update Status')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-events') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(event)} className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-events') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', event)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-events') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(event.id)}
                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
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

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Events') }
            ]}
            pageTitle={t('Manage Events')}
            pageActions={
                <TooltipProvider>
                    <div className="flex gap-2">
                        {auth.user?.permissions?.includes('view-event-calendar') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => router.visit(route('hrm.events.calendar'))}>
                                        <CalendarDays className="h-4 w-4 mr-1.5" />
                                        <span>{t('Calendar')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View Calendar')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-events') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        <span>{t('Create')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create Event')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </TooltipProvider>
            }
        >
            <Head title={t('Events')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.title}
                                onChange={(value) => setFilters({ ...filters, title: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Events...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="hrm.events.index"
                                filters={{ ...filters }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.event_type_id].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Interactive Status Tabs */}
                <div className="flex items-center gap-2 px-6 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto bg-gray-50/50 dark:bg-zinc-900/50">
                    {statusTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = (filters.status || '') === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
                                <span>{tab.label}</span>
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 dark:bg-zinc-800/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Event Type')}</label>
                                <Select value={filters.event_type_id} onValueChange={(value) => setFilters({ ...filters, event_type_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Event Type')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        {eventtypes?.map((eventType: any) => (
                                            <SelectItem key={eventType.id} value={eventType.id.toString()}>
                                                {eventType.event_type}
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

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                            <DataTable
                                data={events?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={Calendar}
                                        title={t('No Events found')}
                                        description={t('Get started by creating your first Event.')}
                                        hasFilters={!!(filters.title || filters.description || filters.location || filters.status || filters.event_type_id)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-events"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Event')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-zinc-900/30">
                    <Pagination
                        data={events || { data: [], links: [], meta: {} }}
                        routeName="hrm.events.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditEvent
                        event={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View event={viewingItem} />}
            </Dialog>

            <Dialog open={!!statusUpdateItem} onOpenChange={() => setStatusUpdateItem(null)}>
                {statusUpdateItem && <StatusUpdate event={statusUpdateItem} onSuccess={() => setStatusUpdateItem(null)} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Event')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}