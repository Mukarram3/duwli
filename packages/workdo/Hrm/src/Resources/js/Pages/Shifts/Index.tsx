import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
    Plus, Edit as EditIcon, Trash2, Eye, Clock as ClockIcon,
    Sun, Moon, CheckCircle, Users, Search, Calendar, LayoutGrid
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Create from './Create';
import EditShift from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { Shift, ShiftsIndexProps, ShiftFilters, ShiftModalState } from './types';
import { formatTime, formatDate } from '@/utils/helpers';

// Helper: Calculate duration between two times in minutes (handles overnight)
function calculateDurationMinutes(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; // Overnight shift
    }
    return endMinutes - startMinutes;
}

// Helper: Format minutes as "X.0 hours"
function formatHours(minutes: number): string {
    return (minutes / 60).toFixed(1) + ' hours';
}

// Helper: Format minutes as "X minutes" or "X hours Y minutes"
function formatMinutes(minutes: number): string {
    if (minutes < 60) return minutes + ' minutes';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return h + ' hours';
    return h + 'h ' + m + 'm';
}

// Helper: Format time range "HH:MM - HH:MM"
function formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '-';
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export default function Index() {
    const { t } = useTranslation();
    const { shifts, shiftStats, auth, users } = usePage<ShiftsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ShiftFilters>({
        shift_name: urlParams.get('shift_name') || '',
        created_by: urlParams.get('created_by') || '',
        creator_id: urlParams.get('creator_id') || '',
        shift_type: urlParams.get('shift_type') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '9');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [modalState, setModalState] = useState<ShiftModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Shift | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState(urlParams.get('shift_type') || 'all');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.shifts.destroy',
        defaultMessage: t('Are you sure you want to delete this shift?')
    });

    const handleFilter = () => {
        router.get(route('hrm.shifts.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.shifts.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            shift_name: '',
            created_by: '',
            creator_id: '',
            shift_type: '',
        });
        setActiveTab('all');
        router.get(route('hrm.shifts.index'), { per_page: perPage });
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const newShiftType = tab === 'all' ? '' : tab;
        setFilters(prev => ({ ...prev, shift_type: newShiftType }));
        router.get(route('hrm.shifts.index'), {
            ...filters,
            shift_type: newShiftType,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
        }, { preserveState: true, replace: true });
    };

    const openModal = (mode: 'add' | 'edit', data: Shift | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    // Use total counts from backend (not paginated data)
    const totalShifts = shiftStats?.total || 0;
    const nightShifts = shiftStats?.night || 0;
    const dayShifts = shiftStats?.day || 0;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Shifts') }
            ]}
            pageTitle={t('Shifts')}
            pageDescription={t('Manage and track employee shifts, durations, breaks, and working hours.')}
            pageActions={
                auth.user?.permissions?.includes('create-shifts') && (
                    <Button onClick={() => openModal('add')} size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                )
            }
        >
            <Head title={t('Shifts')} />

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Shifts */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Shifts')}</CardTitle>
                        <Users className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalShifts}</div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All time')}</p>
                    </CardContent>
                </Card>

                {/* Active Shifts */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Active Shifts')}</CardTitle>
                        <CheckCircle className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalShifts}</div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{t('100% of total')}</p>
                    </CardContent>
                </Card>

                {/* Night Shifts */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Night Shifts')}</CardTitle>
                        <Moon className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{nightShifts}</div>
                        <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">
                            {totalShifts > 0 ? Math.round((nightShifts / totalShifts) * 100) : 0}% {t('of total')}
                        </p>
                    </CardContent>
                </Card>

                {/* Day Shifts */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Day Shifts')}</CardTitle>
                        <Sun className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{dayShifts}</div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">
                            {totalShifts > 0 ? Math.round((dayShifts / totalShifts) * 100) : 0}% {t('of total')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Card Container */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50 dark:bg-zinc-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.shift_name}
                                onChange={(value) => setFilters({ ...filters, shift_name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="hrm.shifts.index"
                                filters={{ ...filters }}
                                defaultValue="9"
                                options={[
                                    { value: '9', label: '9' },
                                    { value: '27', label: '27' },
                                    { value: '45', label: '45' },
                                    { value: '90', label: '90' },
                                ]}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.creator_id].filter(Boolean).length;
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

                {/* Status/Type Tabs */}
                <CardContent className="px-6 py-0 border-b bg-white dark:bg-zinc-950/20">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all',   label: t('All'),         icon: LayoutGrid, count: totalShifts },
                            { key: 'day',   label: t('Day Shift'),   icon: Sun,        count: dayShifts },
                            { key: 'night', label: t('Night Shift'), icon: Moon,       count: nightShifts },
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
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-4 bg-blue-50/30 dark:bg-blue-950/20 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Created By')}</label>
                                <Select value={filters.creator_id} onValueChange={(value) => setFilters({ ...filters, creator_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Creator')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users?.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
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

                {/* Content Area */}
                <CardContent className="p-6">
                    {/* Shift Cards Grid */}
                    {shifts?.data?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {shifts.data.map((shift) => {
                                const shiftDuration = calculateDurationMinutes(shift.start_time, shift.end_time);
                                const breakDuration = calculateDurationMinutes(shift.break_start_time, shift.break_end_time);
                                const workingMinutes = shiftDuration - breakDuration;

                                return (
                                    <Card key={shift.id} className="shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden border border-gray-300 dark:border-zinc-700">
                                        <CardContent className="p-0 flex flex-col h-full justify-between">
                                            <div>
                                                {/* Card Header */}
                                                <div className="p-5 pb-3 flex items-center justify-between border-b border-gray-300 dark:border-zinc-700">
                                                    <div className="flex items-center gap-3">
                                                        {/* Day/Night Icon */}
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${shift.is_night_shift
                                                                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800/50'
                                                                : 'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800/50'
                                                            }`}>
                                                            {shift.is_night_shift ? (
                                                                <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                            ) : (
                                                                <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                                            )}
                                                        </div>
                                                        {/* Shift Name */}
                                                        <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{shift.shift_name}</h3>
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <div className="px-5 pt-4 pb-3 flex items-center gap-2">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                        shift.is_night_shift
                                                            ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-950/20 dark:text-indigo-400 dark:ring-indigo-500/20'
                                                            : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-500/20'
                                                    }`}>
                                                        {shift.is_night_shift ? t('Night Shift') : t('Day Shift')}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20">
                                                        {t('Active')}
                                                    </span>
                                                </div>

                                                {/* Time Range */}
                                                <div className="px-5 pb-4">
                                                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                                        <ClockIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                        <span className="text-sm font-semibold">
                                                            {formatTimeRange(shift.start_time, shift.end_time)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 ms-6">{t('Shift Hours')}</p>
                                                </div>

                                                {/* Metrics Grid */}
                                                <div className="px-5 pb-5">
                                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                        {/* Shift Hours */}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatHours(shiftDuration)}</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">{t('Shift Hours')}</p>
                                                        </div>
                                                        {/* Break Duration */}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatMinutes(breakDuration)}</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">{t('Break Duration')}</p>
                                                        </div>
                                                        {/* Working Time */}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatHours(workingMinutes)}</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">{t('Working Time')}</p>
                                                        </div>
                                                        {/* Grace Period */}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">15 minutes</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">{t('Grace Period')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Footer */}
                                            <div className="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-950/20 px-5 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    <span className="text-gray-900 dark:text-gray-100">{formatDate(shift.created_at)}</span>
                                                </div>
                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1">
                                                    <TooltipProvider>
                                                        {auth.user?.permissions?.includes('view-shifts') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setViewingItem(shift)}
                                                                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('edit-shifts') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openModal('edit', shift)}
                                                                        className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                                                                    >
                                                                        <EditIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('delete-shifts') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openDeleteDialog(shift.id)}
                                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <NoRecordsFound
                            icon={ClockIcon}
                            title={t('No Shifts found')}
                            description={t('Get started by creating your first Shift.')}
                            hasFilters={!!(filters.shift_name || filters.created_by || filters.creator_id || filters.shift_type)}
                            onClearFilters={clearFilters}
                            createPermission="create-shifts"
                            onCreateClick={() => openModal('add')}
                            createButtonText={t('Create Shift')}
                        />
                    )}
                </CardContent>

                {/* Pagination Footer */}
                {shifts?.data?.length > 0 && (
                    <CardContent className="px-6 py-3 border-t bg-gray-50/30">
                        <Pagination
                            data={shifts || { data: [], links: [], meta: {} }}
                            routeName="hrm.shifts.index"
                            filters={{ ...filters, per_page: perPage }}
                        />
                    </CardContent>
                )}
            </Card>

            {/* Modals */}
            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditShift
                        shift={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View shift={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Shift')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
