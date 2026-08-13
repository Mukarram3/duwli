import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { getImagePath } from '@/utils/helpers';
import { CalendarData, CalendarEmployee, CalendarLeave, CalendarDate } from './types';

interface WeeklyCalendarProps {
    calendarData: CalendarData;
    employees: { id: number; name: string; avatar?: string; email?: string }[];
}

interface LeaveSpan {
    leave: CalendarLeave;
    startIndex: number;
    endIndex: number;
}

export default function WeeklyCalendar({ calendarData, employees }: WeeklyCalendarProps) {
    const { t } = useTranslation();
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

    const { week_dates, employees: calendarEmployees, leaves, week_start } = calendarData;

    // Filter employees based on selection
    const filteredEmployees = useMemo(() => {
        if (selectedEmployee === 'all') {
            return calendarEmployees;
        }
        return calendarEmployees.filter(emp => emp.id.toString() === selectedEmployee);
    }, [calendarEmployees, selectedEmployee]);

    // Get leave for a specific employee and date
    const getLeaveForDate = (employeeId: number, dateStr: string): CalendarLeave | null => {
        return leaves.find(leave => {
            if (leave.employee_id !== employeeId) return false;
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
            const checkDate = new Date(dateStr);
            return checkDate >= leaveStart && checkDate <= leaveEnd;
        }) || null;
    };

    // Check if a date is a weekend (non-working day)
    const isWeekend = (dateStr: string): boolean => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    };

    // Calculate leave spans for an employee across the week
    // Spans are broken on weekends to show leave only on working days
    const getEmployeeLeaveSpans = (employeeId: number): LeaveSpan[] => {
        const spans: LeaveSpan[] = [];
        const processedIndices = new Set<number>();

        week_dates.forEach((date, index) => {
            // Skip if already processed or if weekend
            if (processedIndices.has(index) || isWeekend(date.date)) {
                return;
            }

            const leave = getLeaveForDate(employeeId, date.date);
            if (leave) {
                // Find the end index for this leave within the week
                // Stop at weekends or when leave changes
                let endIndex = index;
                for (let i = index + 1; i < week_dates.length; i++) {
                    const checkDate = week_dates[i];
                    
                    // Stop at weekend
                    if (isWeekend(checkDate.date)) {
                        break;
                    }
                    
                    const checkLeave = getLeaveForDate(employeeId, checkDate.date);
                    if (checkLeave && checkLeave.id === leave.id) {
                        endIndex = i;
                    } else {
                        break;
                    }
                }
                spans.push({ leave, startIndex: index, endIndex });
                
                // Mark all days in this span as processed
                for (let i = index; i <= endIndex; i++) {
                    processedIndices.add(i);
                }
            }
        });

        return spans;
    };

    // Navigate to previous month
    const goToPreviousMonth = () => {
        const currentStart = new Date(week_start);
        currentStart.setMonth(currentStart.getMonth() - 1);
        router.get(route('hrm.leave-applications.index'), {
            week_start: currentStart.toISOString().split('T')[0]
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Navigate to next month
    const goToNextMonth = () => {
        const currentStart = new Date(week_start);
        currentStart.setMonth(currentStart.getMonth() + 1);
        router.get(route('hrm.leave-applications.index'), {
            week_start: currentStart.toISOString().split('T')[0]
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Navigate to previous week
    const goToPreviousWeek = () => {
        const currentStart = new Date(week_start);
        currentStart.setDate(currentStart.getDate() - 7);
        router.get(route('hrm.leave-applications.index'), {
            week_start: currentStart.toISOString().split('T')[0]
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Navigate to next week
    const goToNextWeek = () => {
        const currentStart = new Date(week_start);
        currentStart.setDate(currentStart.getDate() + 7);
        router.get(route('hrm.leave-applications.index'), {
            week_start: currentStart.toISOString().split('T')[0]
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Get month name from week_start
    const monthName = useMemo(() => {
        const date = new Date(week_start);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [week_start]);

    // Get unique leave types for legend
    const leaveTypesForLegend = useMemo(() => {
        const types = new Map();
        leaves.forEach(leave => {
            if (leave.leave_type) {
                types.set(leave.leave_type.id, leave.leave_type);
            }
        });
        return Array.from(types.values());
    }, [leaves]);

    return (
        <div className="space-y-4">
            {/* Header with Month Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToPreviousMonth}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold min-w-[160px] text-center">
                        {monthName}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNextMonth}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('Employee')}</span>
                    <Select
                        value={selectedEmployee}
                        onValueChange={setSelectedEmployee}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('All Employees')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('All Employees')}</SelectItem>
                            {employees?.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Legend */}
            {leaveTypesForLegend.length > 0 && (
                <div className="flex items-center gap-4 flex-wrap text-sm">
                    <span className="text-muted-foreground font-medium">{t('Legend')}:</span>
                    <div className="flex items-center gap-3 flex-wrap">
                        {week_dates.some(d => d.isToday) && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary"></div>
                                <span className="text-xs">{t('Today')}</span>
                            </div>
                        )}
                        {leaveTypesForLegend.map((type) => (
                            <div key={type.id} className="flex items-center gap-1.5">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: type.color || '#gray' }}
                                ></div>
                                <span className="text-xs">{type.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50/50 dark:bg-gray-800/50">
                                    <th className="text-left p-3 font-semibold text-sm w-[180px] min-w-[180px] sticky left-0 bg-gray-50/50 dark:bg-gray-800/50 z-10 border-r">
                                        {t('Employee')}
                                    </th>
                                    {week_dates.map((date: CalendarDate, index: number) => (
                                        <th
                                            key={date.date}
                                            className={`p-3 text-center min-w-[110px] border-r relative ${
                                                date.isToday ? 'bg-primary/5' : ''
                                            } ${index === week_dates.length - 1 ? 'border-r-0' : ''}`}
                                        >
                                            {/* Week navigation arrows on first and last day */}
                                            {index === 0 && (
                                                <button
                                                    onClick={goToPreviousWeek}
                                                    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    <ChevronLeft className="h-4 w-4 text-gray-500" />
                                                </button>
                                            )}
                                            {index === week_dates.length - 1 && (
                                                <button
                                                    onClick={goToNextWeek}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                                </button>
                                            )}
                                            <div className={`text-lg font-semibold ${date.isToday ? 'text-primary' : ''}`}>
                                                {date.day}
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {date.dayName}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((employee: CalendarEmployee) => {
                                    const leaveSpans = getEmployeeLeaveSpans(employee.id);
                                    const spanMap = new Map<number, LeaveSpan>();
                                    leaveSpans.forEach(span => {
                                        for (let i = span.startIndex; i <= span.endIndex; i++) {
                                            spanMap.set(i, span);
                                        }
                                    });

                                    return (
                                        <tr key={employee.id} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                            <td className="p-2 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r w-[180px]">
                                                <div className="flex items-center gap-2">
                                                    {employee.avatar ? (
                                                        <img
                                                            src={getImagePath(employee.avatar)}
                                                            alt={employee.name}
                                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-medium text-primary">
                                                                {employee.name?.charAt(0)?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate leading-tight">{employee.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate leading-tight">{employee.designation}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {week_dates.map((date: CalendarDate, index: number) => {
                                                const span = spanMap.get(index);
                                                
                                                // If this day is part of a span but not the start, skip it (colSpan handles it)
                                                if (span && span.startIndex !== index) {
                                                    return null;
                                                }

                                                // If this is the start of a leave span
                                                if (span) {
                                                    const spanDays = span.endIndex - span.startIndex + 1;
                                                    const isLastCol = index + spanDays - 1 === week_dates.length - 1;
                                                    const isPaid = span.leave.leave_type?.name?.toLowerCase().includes('paid') || 
                                                                  span.leave.status === 'approved';

                                                    return (
                                                        <td
                                                            key={`${employee.id}-${date.date}`}
                                                            colSpan={spanDays}
                                                            className={`p-1 border-r ${
                                                                date.isToday ? 'bg-primary/5' : ''
                                                            } ${isLastCol ? 'border-r-0' : ''}`}
                                                        >
                                                            <div
                                                                className="rounded-lg px-3 py-1.5 h-[52px] flex flex-col justify-center cursor-pointer hover:opacity-90 transition-opacity"
                                                                style={{
                                                                    backgroundColor: (span.leave.leave_type?.color || '#9ca3af') + '18',
                                                                    border: `1px solid ${(span.leave.leave_type?.color || '#9ca3af') + '40'}`,
                                                                }}
                                                                title={`${span.leave.leave_type?.name} (${span.leave.status})`}
                                                            >
                                                                <span
                                                                    className="font-semibold text-xs truncate"
                                                                    style={{ color: span.leave.leave_type?.color || '#374151' }}
                                                                >
                                                                    {span.leave.leave_type?.name}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                    {isPaid ? t('Paid Leave') : t('Unpaid Leave')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                // Empty cell
                                                return (
                                                    <td
                                                        key={`${employee.id}-${date.date}`}
                                                        className={`p-2 text-center border-r ${
                                                            date.isToday ? 'bg-primary/5' : ''
                                                        } ${index === week_dates.length - 1 ? 'border-r-0' : ''}`}
                                                    >
                                                        <div className="h-[52px]"></div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                                {filteredEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            {t('No employees found')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
