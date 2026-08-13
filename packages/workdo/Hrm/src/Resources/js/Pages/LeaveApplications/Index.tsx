import { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, FileText as FileTextIcon, Play, User as UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Create from './Create';
import EditLeaveApplication from './Edit';
import View from './View';
import StatusUpdate from './StatusUpdate';
import WeeklyCalendar from './WeeklyCalendar';
import NoRecordsFound from '@/components/no-records-found';
import { LeaveApplication, LeaveApplicationsIndexProps, LeaveApplicationFilters, LeaveApplicationModalState } from './types';
import { Input } from '@/components/ui/input';
import { formatDate, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { leaveapplications, auth, leavetypes, employees, calendarData } = usePage<LeaveApplicationsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    // Initialize filters from URL params
    const [filters, setFilters] = useState<LeaveApplicationFilters>({
        reason: urlParams.get('reason') || '',
        status: urlParams.get('status') || 'pending',
        employee_id: urlParams.get('employee_id') || '',
        leave_type_id: urlParams.get('leave_type_id') || '',
        start_date: urlParams.get('start_date') || '',
        end_date: urlParams.get('end_date') || '',
    });

    const [perPage, setPerPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [activeTab, setActiveTab] = useState(urlParams.get('status') || 'pending');
    const [showFilters, setShowFilters] = useState(false);

    const [modalState, setModalState] = useState<LeaveApplicationModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<LeaveApplication | null>(null);
    const [statusModalItem, setStatusModalItem] = useState<LeaveApplication | null>(null);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.leave-applications.destroy',
        defaultMessage: t('Are you sure you want to delete this leaveapplication?')
    });

    // Build query params from all state
    const buildQueryParams = useCallback((overrides: Partial<LeaveApplicationFilters & { per_page?: string; sort?: string; direction?: string; page?: number }> = {}) => {
        const params: Record<string, string> = {};
        
        // Add filters
        if (filters.reason) params.reason = filters.reason;
        if (filters.status) params.status = filters.status;
        if (filters.employee_id) params.employee_id = filters.employee_id;
        if (filters.leave_type_id) params.leave_type_id = filters.leave_type_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        
        // Add pagination
        params.per_page = perPage;
        
        // Add sorting
        if (sortField) {
            params.sort = sortField;
            params.direction = sortDirection;
        }
        
        // Add week_start for calendar
        const weekStart = urlParams.get('week_start');
        if (weekStart) params.week_start = weekStart;
        
        // Apply overrides
        Object.entries(overrides).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params[key] = String(value);
            } else if (overrides.hasOwnProperty(key) && (value === undefined || value === null || value === '')) {
                delete params[key];
            }
        });
        
        return params;
    }, [filters, perPage, sortField, sortDirection]);

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const newFilters = { ...filters, status: value };
        setFilters(newFilters);
        router.get(route('hrm.leave-applications.index'), buildQueryParams({ status: value }), {
            preserveState: true,
            replace: true
        });
    };

    // Handle filter apply
    const handleFilter = () => {
        router.get(route('hrm.leave-applications.index'), buildQueryParams(), {
            preserveState: true,
            replace: true
        });
    };

    // Handle search input change with debounce
    const handleSearchChange = (value: string) => {
        const newFilters = { ...filters, reason: value };
        setFilters(newFilters);
    };

    // Handle search submit
    const handleSearchSubmit = () => {
        handleFilter();
    };

    // Handle sort
    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.leave-applications.index'), buildQueryParams({ sort: field, direction }), {
            preserveState: true,
            replace: true
        });
    };

    // Handle per page change
    const handlePerPageChange = (newPerPage: string) => {
        setPerPage(newPerPage);
        router.get(route('hrm.leave-applications.index'), buildQueryParams({ per_page: newPerPage }), {
            preserveState: true,
            replace: true
        });
    };

    // Clear all filters
    const clearFilters = () => {
        const clearedFilters = {
            reason: '',
            status: activeTab,
            employee_id: '',
            leave_type_id: '',
            start_date: '',
            end_date: '',
        };
        setFilters(clearedFilters);
        router.get(route('hrm.leave-applications.index'), { status: activeTab, per_page: perPage }, {
            preserveState: true,
            replace: true
        });
    };

    const openModal = (mode: 'add' | 'edit', data: LeaveApplication | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const openStatusModal = (leaveapplication: LeaveApplication) => {
        setStatusModalItem(leaveapplication);
    };

    // Get employee details by ID
    const getEmployeeById = (id: number) => {
        return employees.find(emp => emp.id === id);
    };

    // Count active filters (excluding status since it's controlled by tabs)
    const activeFilterCount = [
        filters.employee_id,
        filters.leave_type_id,
        filters.start_date,
        filters.end_date
    ].filter(f => f !== '' && f !== null && f !== undefined).length;

    const tableColumns = [
        {
            key: 'employee',
            header: t('Employee'),
            sortable: false,
            render: (_: any, row: LeaveApplication) => {
                const employee = getEmployeeById(row.employee_id || 0) || row.employee;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                            {employee?.avatar ? (
                                <img src={getImagePath(employee.avatar)} alt={employee.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{employee?.name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{employee?.email || ''}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'leave_type',
            header: t('Leave Type'),
            sortable: false,
            render: (_: any, row: LeaveApplication) => (
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: row.leave_type?.color || '#9ca3af' }}
                    ></div>
                    <div className="flex flex-col">
                        <span className="text-sm">{row.leave_type?.name || '-'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit ${
                            row.leave_type?.is_paid
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                            {row.leave_type?.is_paid ? t('Paid') : t('Unpaid')}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'start_date',
            header: t('Start Date'),
            sortable: true,
            render: (value: string) => value ? formatDate(value) : '-'
        },
        {
            key: 'end_date',
            header: t('End Date'),
            sortable: true,
            render: (value: string) => value ? formatDate(value) : '-'
        },
        {
            key: 'total_days',
            header: t('Days'),
            sortable: false,
            render: (value: number) => value || '-'
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                    'pending': { 
                        bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
                        text: 'text-yellow-800 dark:text-yellow-400', 
                        label: t('Pending') 
                    },
                    'approved': { 
                        bg: 'bg-green-100 dark:bg-green-900/30', 
                        text: 'text-green-800 dark:text-green-400', 
                        label: t('Approved') 
                    },
                    'rejected': { 
                        bg: 'bg-red-100 dark:bg-red-900/30', 
                        text: 'text-red-800 dark:text-red-400', 
                        label: t('Rejected') 
                    }
                };
                const config = statusConfig[value] || { bg: 'bg-gray-100', text: 'text-gray-800', label: t('Unknown') };
                return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                        {config.label}
                    </span>
                );
            }
        },
        {
            key: 'created_at',
            header: t('Applied On'),
            sortable: true,
            render: (value: string) => value ? formatDate(value) : '-'
        },
        ...(auth.user?.permissions?.some((p: string) => ['manage-leave-status', 'view-leave-applications', 'edit-leave-applications', 'delete-leave-applications'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, leaveapplication: LeaveApplication) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-leave-applications') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(leaveapplication)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('manage-leave-status') && leaveapplication.status === 'pending' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openStatusModal(leaveapplication)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Manage Status')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-leave-applications') && leaveapplication.status === 'pending' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', leaveapplication)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-leave-applications') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(leaveapplication.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
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
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Leave Applications') }
            ]}
            pageTitle={t('Leave Applications')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-leave-applications') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    {t('Add Leave Application')}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Create')}</p></TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            }
        >
            <Head title={t('Leave Applications')} />

            <div className="space-y-6">
                {/* Weekly Calendar View */}
                <WeeklyCalendar calendarData={calendarData} employees={employees} />

                {/* Tabbed Leave List */}
                <Card className="shadow-sm">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <div className="p-6 border-b bg-gray-50/50">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <TabsList className="bg-gray-200/50">
                                    <TabsTrigger value="pending" className="data-[state=active]:bg-white">
                                        {t('Pending Leaves')}
                                    </TabsTrigger>
                                    <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
                                        {t('Rejected Leaves')}
                                    </TabsTrigger>
                                </TabsList>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 max-w-md">
                                        <SearchInput
                                            value={filters.reason}
                                            onChange={handleSearchChange}
                                            onSearch={handleSearchSubmit}
                                            placeholder={t('Search...')}
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleFilter} className="bg-primary">
                                        {t('Search')}
                                    </Button>
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {activeFilterCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </div>
                                    <PerPageSelector
                                        routeName="hrm.leave-applications.index"
                                        filters={buildQueryParams()}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <CardContent className="p-6 bg-blue-50/30 border-b">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {auth.user?.permissions?.includes('manage-employees') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('Employee')}</label>
                                            <Select value={filters.employee_id} onValueChange={(value) => setFilters({ ...filters, employee_id: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Filter by Employee')} />
                                                </SelectTrigger>
                                                <SelectContent searchable={true}>
                                                    {employees?.map((employee) => (
                                                        <SelectItem key={employee.id} value={employee.id.toString()}>
                                                            {employee.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Leave Type')}</label>
                                        <Select value={filters.leave_type_id || ''} onValueChange={(value) => setFilters({ ...filters, leave_type_id: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Filter by Leave Type')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {leavetypes?.map((type: any) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Start Date')}</label>
                                        <Input
                                            type="date"
                                            value={filters.start_date}
                                            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('End Date')}</label>
                                        <Input
                                            type="date"
                                            value={filters.end_date}
                                            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                    <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                                </div>
                            </CardContent>
                        )}

                        {/* Table Content */}
                        <CardContent className="p-0">
                            <TabsContent value="pending" className="mt-0">
                                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                    <div className="min-w-[900px]">
                                        <DataTable
                                            data={leaveapplications?.data || []}
                                            columns={tableColumns}
                                            onSort={handleSort}
                                            sortKey={sortField}
                                            sortDirection={sortDirection as 'asc' | 'desc'}
                                            className="rounded-none"
                                            emptyState={
                                                <NoRecordsFound
                                                    icon={FileTextIcon}
                                                    title={t('No LeaveApplications found')}
                                                    description={t('Get started by creating your first LeaveApplication.')}
                                                    hasFilters={!!(filters.reason || filters.employee_id || filters.leave_type_id || filters.start_date || filters.end_date)}
                                                    onClearFilters={clearFilters}
                                                    createPermission="create-leave-applications"
                                                    onCreateClick={() => openModal('add')}
                                                    createButtonText={t('Create LeaveApplication')}
                                                    className="h-auto"
                                                />
                                            }
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="rejected" className="mt-0">
                                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                    <div className="min-w-[900px]">
                                        <DataTable
                                            data={leaveapplications?.data || []}
                                            columns={tableColumns}
                                            onSort={handleSort}
                                            sortKey={sortField}
                                            sortDirection={sortDirection as 'asc' | 'desc'}
                                            className="rounded-none"
                                            emptyState={
                                                <NoRecordsFound
                                                    icon={FileTextIcon}
                                                    title={t('No LeaveApplications found')}
                                                    description={t('Get started by creating your first LeaveApplication.')}
                                                    hasFilters={!!(filters.reason || filters.employee_id || filters.leave_type_id || filters.start_date || filters.end_date)}
                                                    onClearFilters={clearFilters}
                                                    createPermission="create-leave-applications"
                                                    onCreateClick={() => openModal('add')}
                                                    createButtonText={t('Create LeaveApplication')}
                                                    className="h-auto"
                                                />
                                            }
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </CardContent>

                        {/* Pagination Footer */}
                        <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                            <Pagination
                                data={leaveapplications || { data: [], links: [], meta: {} }}
                                routeName="hrm.leave-applications.index"
                                filters={buildQueryParams()}
                            />
                        </CardContent>
                    </Tabs>
                </Card>
            </div>

            {/* Modals */}
            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditLeaveApplication
                        leaveapplication={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View leaveapplication={viewingItem} />}
            </Dialog>

            <Dialog open={!!statusModalItem} onOpenChange={() => setStatusModalItem(null)}>
                {statusModalItem && <StatusUpdate leaveapplication={statusModalItem} onSuccess={() => setStatusModalItem(null)} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete LeaveApplication')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
