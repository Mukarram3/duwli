import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface Employee {
    id: number;
    employee_id: string;
    user?: {
        id: number;
        name: string;
    };
    designation?: {
        name: string;
    };
    shift?: {
        shift_name: string;
    };
}

export interface Shift {
    id: number;
    shift_name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Attendance {
    id: number;
    employee_id: number;
    shift_id: number;
    date: string;
    clock_in: string;
    clock_out?: string;
    break_hour?: number;
    total_hour?: number;
    overtime_hours?: number;
    overtime_amount?: number;
    status: string;
    notes?: string;
    user?: User;
    employee?: Employee;
    shift?: Shift;
    created_at: string;
}

export interface DayHeader {
    day: number;
    day_name: string;
    is_weekend: boolean;
    is_holiday: boolean;
    holiday_name: string | null;
    is_future: boolean;
}

export interface AttendanceDay {
    id?: number;
    date?: string;
    employee_id?: number;
    status: string;
    is_late: boolean;
    is_early_departure: boolean;
    overtime_hours: number;
    overtime_amount: number;
    is_weekend: boolean;
    clock_in?: string;
    clock_out?: string;
    total_hours?: number;
    break_hours?: number;
    notes?: string;
    is_holiday?: boolean;
    leave_type_name?: string | null;
    is_paid_leave?: boolean;
}

export interface EmployeeRow {
    id: number;
    name: string;
    designation: string | null;
    shift: string | null;
    avatar: string;
    days: AttendanceDay[];
    present_days: number;
    total_working_days: number;
}

export interface AttendanceFilters {
    employee_id: string;
    month: string;
    year: string;
    per_page: string;
}

export interface AttendancesIndexProps {
    employeeRows: PaginatedData<EmployeeRow>;
    dayHeaders: DayHeader[];
    employees: any[];
    monthOptions: { value: string; label: string }[];
    yearOptions: { value: string; label: string }[];
    currentMonth: number;
    currentYear: number;
    daysInMonth: number;
    filters: AttendanceFilters;
    auth: AuthContext;
    [key: string]: any;
}

export type AttendanceModalState = ModalState<any>;