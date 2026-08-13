import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Clock as ClockIcon, AlarmClock, ArrowLeftFromLine, Timer, CircleDashed } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Create from './Create';
import Edit from './Edit';
import View from './Show';

import { AttendancesIndexProps, AttendanceModalState } from './types';
import { getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const {
        employeeRows,
        dayHeaders,
        employees,
        monthOptions,
        yearOptions,
        currentMonth,
        currentYear,
        auth,
        filters: pageFilters = {}
    } = usePage<AttendancesIndexProps>().props;

    const { is_demo } = usePage().props as any;

    // In demo mode, default to July 2025 if filters are not already set via URL
    const demoDefaultMonth = is_demo ? '7' : currentMonth.toString();
    const demoDefaultYear = is_demo ? '2025' : currentYear.toString();

    const [selectedEmployee, setSelectedEmployee] = useState(pageFilters.employee_id || 'all');
    const [selectedMonth, setSelectedMonth] = useState(pageFilters.month || demoDefaultMonth);
    const [selectedYear, setSelectedYear] = useState(pageFilters.year || demoDefaultYear);
    const [perPage] = useState(pageFilters.per_page || '10');
    const [showFilters, setShowFilters] = useState(true);

    const [modalState, setModalState] = useState<AttendanceModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.attendances.destroy',
        defaultMessage: t('Are you sure you want to delete this attendance?')
    });

    const applyFilters = () => {
        router.get(route('hrm.attendances.index'), {
            employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
            month: selectedMonth,
            year: selectedYear,
            per_page: perPage
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleResetFilters = () => {
        setSelectedEmployee('all');
        setSelectedMonth(currentMonth.toString());
        setSelectedYear(currentYear.toString());
        router.get(route('hrm.attendances.index'));
    };

    const openModal = (mode: 'add' | 'edit' | 'view', data: any = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const handleCellClick = (day: any, emp: any) => {
        if (day.status === 'future') return;

        if (day.id) {
            if (auth.user?.permissions?.includes('edit-attendances')) {
                openModal('edit', day);
            } else {
                openModal('view', day);
            }
        } else {
            if (auth.user?.permissions?.includes('create-attendances')) {
                openModal('add', { employee_id: emp.id, date: day.date });
            }
        }
    };

    const renderCell = (day: any) => {
        if (day.status === 'future') {
            return (
                <div className="flex flex-col items-center justify-center h-8" title={t('Future')}>
                    <span className="text-gray-400 dark:text-gray-600 text-sm font-bold">-</span>
                </div>
            );
        }

        if (day.status === 'day_off') {
            return (
                <div className="flex flex-col items-center justify-center h-8" title={t('Day Off')}>
                    <span className="text-gray-400 dark:text-gray-500 text-base leading-none">⊘</span>
                </div>
            );
        }

        const statusMap: Record<string, { icon: string | React.ReactNode; className: string; title: string }> = {
            present: { icon: '✓', className: 'text-green-600 dark:text-green-400 font-bold text-base', title: t('Present') },
            absent: { icon: '✕', className: 'text-red-500 dark:text-red-400 font-bold text-base', title: t('Absent') },
            half_day: { icon: '½', className: 'text-yellow-500 dark:text-yellow-400 font-bold text-base', title: t('Half Day') },
            on_leave: { icon: '🚩', className: 'text-blue-500 dark:text-blue-400 text-base', title: day.leave_type_name ? `${t('On Leave')} - ${day.leave_type_name}` : t('On Leave') },
            holiday: { icon: '⭐', className: 'text-purple-500 dark:text-purple-400 text-base', title: t('Holiday') },
            not_added: { icon: <CircleDashed className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />, className: '', title: t('Attendance Not Added') },
        };

        const cfg = statusMap[day.status] ?? { icon: '-', className: 'text-gray-400 text-base', title: day.status };

        const tooltipParts = [cfg.title];
        if (day.is_late) tooltipParts.push(t('Late Arrival'));
        if (day.is_early_departure) tooltipParts.push(t('Early Departure'));
        if (day.clock_in) tooltipParts.push(`${t('In')}: ${day.clock_in}`);
        if (day.clock_out) tooltipParts.push(`${t('Out')}: ${day.clock_out}`);
        if (day.overtime_hours > 0) tooltipParts.push(`OT: ${Number(day.overtime_hours).toFixed(1)}h`);

        return (
            <div className="flex flex-col items-center justify-center gap-0.5 h-8 w-full group" title={tooltipParts.join(' | ')}>
                <span className={`leading-none ${cfg.className}`}>{cfg.icon}</span>
                {(day.is_late || day.is_early_departure || day.overtime_hours > 0) && (
                    <div className="flex items-center gap-0.5">
                        {day.is_late && <AlarmClock className="w-2.5 h-2.5 text-orange-500" />}
                        {day.is_early_departure && <ArrowLeftFromLine className="w-2.5 h-2.5 text-red-400" />}
                        {day.overtime_hours > 0 && <Timer className="w-2.5 h-2.5 text-blue-500" />}
                    </div>
                )}
            </div>
        );
    };

    const monthName = monthOptions?.find((m: any) => m.value === selectedMonth.toString())?.label || '';

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Attendances') }
            ]}
            pageTitle={t('Manage Attendances')}
            pageActions={
                auth.user?.permissions?.includes('create-attendances') && (
                    <Button size="sm" onClick={() => openModal('add')}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )
            }
        >
            <Head title={t('Attendances')} />

            <Card className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={selectedEmployee === 'all' ? '' : selectedEmployee}
                                onChange={(value: string) => setSelectedEmployee(value)}
                                onSearch={applyFilters}
                                placeholder={t('Search by employee name or date...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="hrm.attendances.index"
                                filters={{ month: selectedMonth, year: selectedYear, employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [selectedEmployee !== 'all' ? selectedEmployee : '', selectedMonth, selectedYear].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Filters Row */}
                {showFilters && (
                    <CardContent className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
                            <div className="w-[250px] flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-600 capitalize tracking-wide">{t('Employee')}</label>
                                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Select Employee')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Employees')}</SelectItem>
                                        {employees?.map((emp: any) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-[150px] flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-600 capitalize tracking-wide">{t('Month')}</label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Month')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthOptions?.map((m: any) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-[120px] flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-600 capitalize tracking-wide">{t('Year')}</label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Year')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions?.map((y: any) => (
                                            <SelectItem key={y.value} value={y.value}>
                                                {y.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 pb-0.5">
                                <Button onClick={applyFilters} size="sm" className="h-[40px] px-6">{t('Apply')}</Button>
                                <Button variant="outline" onClick={handleResetFilters} size="sm" className="h-[40px] px-6">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* Legend */}
                <CardContent className="p-0 border-b bg-primary/5 dark:bg-gray-800/40 overflow-x-auto whitespace-nowrap scrollbar-none">
                    <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-4 gap-4">
                        <h3 className="text-sm font-extrabold text-primary dark:text-primary-foreground capitalize tracking-wider">
                            {t('Attendance Report')} : {monthName} {selectedYear}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold text-gray-700 dark:text-gray-300 capitalize tracking-widest">
                            <span className="flex items-center gap-1.5"><span className="text-green-600 font-bold text-sm">✓</span> {t('Present')}</span>
                            <span className="flex items-center gap-1.5"><span className="text-red-500 font-bold text-sm">✕</span> {t('Absent')}</span>
                            <span className="flex items-center gap-1.5"><span className="text-yellow-500 font-bold text-sm">½</span> {t('Half Day')}</span>
                            <span className="flex items-center gap-1.5"><span>🚩</span> {t('On Leave')}</span>
                            <span className="flex items-center gap-1.5"><span>⭐</span> {t('Holiday')}</span>
                            <span className="flex items-center gap-1.5"><span className="text-gray-600 text-sm">⊘</span> {t('Day Off')}</span>
                            <span className="flex items-center gap-1.5"><span className="text-gray-600 font-bold text-sm">-</span> {t('Future')}</span>
                            <span className="flex items-center gap-1.5"><CircleDashed className="w-3.5 h-3.5 text-gray-600" /> {t('Pending')}</span>
                            <span className="flex items-center gap-1.5"><AlarmClock className="w-3.5 h-3.5 text-orange-500" /> {t('Late')}</span>
                            <span className="flex items-center gap-1.5"><ArrowLeftFromLine className="w-3.5 h-3.5 text-red-500" /> {t('Early')}</span>
                            <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-blue-600" /> {t('Overtime')}</span>
                        </div>
                    </div>
                </CardContent>

                {/* Table */}
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <Table className="border-collapse min-w-max">
                        <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 border-b border-gray-100 capitalize tracking-tight">
                                <TableHead className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 min-w-[170px] w-[170px] border-r border-gray-200 dark:border-gray-700 font-bold text-gray-900 px-3 py-3 text-xs">
                                    {t('Employee')}
                                </TableHead>
                                {dayHeaders?.map((header) => (
                                    <TableHead
                                        key={header.day}
                                        className={`text-center px-1 py-2 font-medium min-w-[38px] w-[38px] border-b border-gray-200 dark:border-gray-700 ${header.is_weekend ? 'bg-gray-100 dark:bg-gray-700/50' : ''
                                            }`}
                                    >
                                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{header.day}</div>
                                        <div className="text-[10px] text-gray-400 font-bold">{header.day_name}</div>
                                    </TableHead>
                                ))}
                                <TableHead className="sticky right-0 z-20 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-900 min-w-[60px] w-[60px] border-l border-gray-200 dark:border-gray-700 text-xs">
                                    {t('Total')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employeeRows?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={(dayHeaders?.length || 0) + 2} className="text-center py-20 text-gray-400">
                                        {t('No records found')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employeeRows?.data?.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 h-12">
                                        <TableCell className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-3 py-2 border-r border-gray-100 dark:border-gray-800 min-w-[170px] w-[170px]">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-white dark:ring-gray-900 overflow-hidden shrink-0">
                                                    {emp.avatar ? <img src={getImagePath(emp.avatar)} alt="" className="h-full w-full object-cover" /> : emp.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate leading-none mb-1">{emp.name}</span>
                                                    <span className="text-xs text-gray-400 truncate leading-none">{emp.designation || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        {emp.days.map((day, idx) => (
                                            <TableCell
                                                key={idx}
                                                className={`p-0 text-center relative h-12 transition-colors cursor-pointer hover:bg-primary/5 ${day.is_weekend ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''
                                                    } ${day.status === 'day_off' ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''
                                                    }`}
                                                onClick={() => handleCellClick(day, emp)}
                                            >
                                                {renderCell(day)}
                                            </TableCell>
                                        ))}
                                        <TableCell className="sticky right-0 z-10 bg-white dark:bg-gray-900 text-center border-l border-gray-50 dark:border-gray-800 px-3">
                                            <div className="flex flex-col items-center leading-tight">
                                                <span className="text-sm font-bold text-primary">{emp.present_days}</span>
                                                <span className="text-[10px] text-gray-400 font-bold">/{emp.total_working_days}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-3 border-t bg-gray-50/30 w-full rounded-b-lg">
                    <Pagination
                        data={employeeRows}
                        routeName="hrm.attendances.index"
                        filters={{
                            employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
                            month: selectedMonth,
                            year: selectedYear,
                            per_page: perPage
                        }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create
                        onSuccess={closeModal}
                        initialData={modalState.data}
                    />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <Edit
                        attendance={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
                {modalState.mode === 'view' && modalState.data && (
                    <View
                        attendance={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Attendance')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}