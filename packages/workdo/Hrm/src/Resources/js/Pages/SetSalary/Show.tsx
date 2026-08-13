import { useState, useEffect } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { useTranslation } from 'react-i18next';

import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, UserIcon, Edit, Save, X, Plus, Trash2, Eye, Building2, GitFork, Briefcase, TrendingUp, TrendingDown, CreditCard, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getImagePath, getCurrencySymbol , formatCurrency, formatDate} from '@/utils/helpers';
import CreateAllowance from './Allowances/Create';
import EditAllowance from './Allowances/Edit';
import CreateDeduction from './Deductions/Create';
import EditDeduction from './Deductions/Edit';
import CreateLoan from './Loans/Create';
import EditLoan from './Loans/Edit';
import ViewLoan from './Loans/View';
import CreateOvertime from './Overtimes/Create';
import EditOvertime from './Overtimes/Edit';
import ViewOvertime from './Overtimes/View';

interface Allowance {
    id: number;
    allowance_type_id: number;
    type: string;
    amount: number;
    allowance_type?: {
        name: string;
    };
}

interface Employee {
    id: number;
    employee_id: string;
    basic_salary?: number;
    user?: {
        id: number;
        name: string;
        avatar?: string;
    };
    branch?: {
        branch_name: string;
    };
    department?: {
        department_name: string;
    };
    designation?: {
        designation_name: string;
    };
}

interface Deduction {
    id: number;
    deduction_type_id: number;
    type: string;
    amount: number;
    deduction_type?: {
        name: string;
    };
}

interface Loan {
    id: number;
    loan_type_id: number;
    type: string;
    amount: number;
    start_date?: string;
    end_date?: string;
    loan_type?: {
        name: string;
    };
}

interface Overtime {
    id: number;
    title: string;
    total_days: number;
    hours: number;
    rate: number;
    start_date?: string;
    end_date?: string;
    notes?: string;
    status: string;
}

interface SetSalaryShowProps {
    employee: Employee;
    allowanceTypes: any[];
    allowances: Allowance[];
    deductionTypes: any[];
    deductions: Deduction[];
    loanTypes: any[];
    loans: Loan[];
    overtimes: Overtime[];
    auth: any;
}

export default function Show() {
    const { t } = useTranslation();
    const { employee, allowanceTypes, allowances: initialAllowances, deductionTypes, deductions: initialDeductions, loanTypes, loans: initialLoans, overtimes: initialOvertimes, auth } = usePage<SetSalaryShowProps>().props;
    const [isEditing, setIsEditing] = useState(false);
    const [allowances, setAllowances] = useState<Allowance[]>(initialAllowances || []);
    const [deductions, setDeductions] = useState<Deduction[]>(initialDeductions || []);
    const [loans, setLoans] = useState<Loan[]>(initialLoans || []);
    const [overtimes, setOvertimes] = useState<Overtime[]>(initialOvertimes || []);

    // Update local state when props change (after redirect)
    useEffect(() => {
        setAllowances(initialAllowances || []);
        setDeductions(initialDeductions || []);
        setLoans(initialLoans || []);
        setOvertimes(initialOvertimes || []);
    }, [initialAllowances, initialDeductions, initialLoans, initialOvertimes]);
    const [allowanceModalState, setAllowanceModalState] = useState<{
        isOpen: boolean;
        mode: string;
        data: Allowance | null;
    }>({ isOpen: false, mode: '', data: null });

    const [deductionModalState, setDeductionModalState] = useState<{
        isOpen: boolean;
        mode: string;
        data: Deduction | null;
    }>({ isOpen: false, mode: '', data: null });

    const [loanModalState, setLoanModalState] = useState<{
        isOpen: boolean;
        mode: string;
        data: Loan | null;
    }>({ isOpen: false, mode: '', data: null });

    const [overtimeModalState, setOvertimeModalState] = useState<{
        isOpen: boolean;
        mode: string;
        data: Overtime | null;
    }>({ isOpen: false, mode: '', data: null });
    


    const { data, setData, put, processing, errors } = useForm({
        basic_salary: employee.basic_salary?.toString() || '0',

    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.allowances.destroy',
        defaultMessage: t('Are you sure you want to delete this allowance?')
    });

    const { deleteState: deductionDeleteState, openDeleteDialog: openDeductionDeleteDialog, closeDeleteDialog: closeDeductionDeleteDialog, confirmDelete: confirmDeductionDelete } = useDeleteHandler({
        routeName: 'hrm.deductions.destroy',
        defaultMessage: t('Are you sure you want to delete this deduction?')
    });

    const { deleteState: loanDeleteState, openDeleteDialog: openLoanDeleteDialog, closeDeleteDialog: closeLoanDeleteDialog, confirmDelete: confirmLoanDelete } = useDeleteHandler({
        routeName: 'hrm.loans.destroy',
        defaultMessage: t('Are you sure you want to delete this loan?')
    });

    const { deleteState: overtimeDeleteState, openDeleteDialog: openOvertimeDeleteDialog, closeDeleteDialog: closeOvertimeDeleteDialog, confirmDelete: confirmOvertimeDelete } = useDeleteHandler({
        routeName: 'hrm.overtimes.destroy',
        defaultMessage: t('Are you sure you want to delete this overtime?')
    });





    const openAllowanceModal = (mode: string, data: Allowance | null = null) => {
        setAllowanceModalState({ isOpen: true, mode, data });
    };

    const closeAllowanceModal = () => {
        setAllowanceModalState({ isOpen: false, mode: '', data: null });
    };

    const openDeductionModal = (mode: string, data: Deduction | null = null) => {
        setDeductionModalState({ isOpen: true, mode, data });
    };

    const closeDeductionModal = () => {
        setDeductionModalState({ isOpen: false, mode: '', data: null });
    };

    const openLoanModal = (mode: string, data: Loan | null = null) => {
        setLoanModalState({ isOpen: true, mode, data });
    };

    const closeLoanModal = () => {
        setLoanModalState({ isOpen: false, mode: '', data: null });
    };

    const openOvertimeModal = (mode: string, data: Overtime | null = null) => {
        setOvertimeModalState({ isOpen: true, mode, data });
    };

    const closeOvertimeModal = () => {
        setOvertimeModalState({ isOpen: false, mode: '', data: null });
    };



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('hrm.set-salary.update', employee.id), {
            onSuccess: () => {
                setIsEditing(false);
            }
        });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setData('basic_salary', employee.basic_salary?.toString() || '0');
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Set Salary'), url: route('hrm.set-salary.index') },
                { label: t('View Salary') }
            ]}
            pageTitle={t('Employee Salary Details')}
            pageDescription={t('Manage and view detailed salary structure, allowances, deductions, loans, and overtimes.')}
            backUrl={route('hrm.set-salary.index')}
        >
            <Head title={t('View Salary')} />

            {/* Employee Basic Salary Card */}
            <Card className="shadow-sm mb-6 border border-gray-300 dark:border-zinc-700">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                            {employee.user?.avatar ? (
                                <img
                                    src={getImagePath(employee.user.avatar)}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-zinc-700"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 border dark:border-zinc-700 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{employee.user?.name}</h2>
                                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700 mt-1">
                                    {employee.employee_id}
                                </span>
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Basic Salary */}
                        <div className="flex items-center gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shrink-0">
                                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground">{t('Basic Salary')}</p>
                                {isEditing ? (
                                    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.basic_salary}
                                                onChange={(e) => setData('basic_salary', e.target.value)}
                                                className="text-lg font-bold h-9"
                                                autoFocus
                                            />
                                            <InputError message={errors.basic_salary} />
                                        </div>
                                        <div className="flex gap-1">
                                            <TooltipProvider>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <Button type="submit" size="sm" className="h-8 w-8 p-0" disabled={processing}>
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{t('Save')}</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={cancelEdit}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{t('Cancel')}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(employee.basic_salary ?? 0)}
                                        </p>
                                        {auth.user?.permissions?.includes('edit-set-salary') && (
                                            <TooltipProvider>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setIsEditing(true)}
                                                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Branch */}
                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100/60 dark:bg-blue-900/30 rounded-lg shrink-0">
                                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground">{t('Branch')}</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate mt-0.5">{employee.branch?.branch_name || '-'}</p>
                            </div>
                        </div>

                        {/* Department */}
                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                            <div className="p-2.5 bg-purple-100/60 dark:bg-purple-900/30 rounded-lg shrink-0">
                                <GitFork className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground">{t('Department')}</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate mt-0.5">{employee.department?.department_name || '-'}</p>
                            </div>
                        </div>

                        {/* Designation */}
                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100/60 dark:bg-amber-900/30 rounded-lg shrink-0">
                                <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground">{t('Designation')}</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate mt-0.5">{employee.designation?.designation_name || '-'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Allowances, Deductions, Loans & Overtimes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Allowances Section */}
                <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                {t('Allowances')}
                            </CardTitle>
                            {auth.user?.permissions?.includes('create-allowances') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" onClick={() => openAllowanceModal('add')} className="h-8 w-8 p-0">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Create Allowance')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                            <DataTable
                                data={allowances}
                                columns={[
                                    {
                                        key: 'allowance_type',
                                        header: t('Allowance Type'),
                                        sortable: false,
                                        render: (_: any, row: Allowance) => (
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {row.allowance_type?.name || '-'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'type',
                                        header: t('Type'),
                                        sortable: false,
                                        render: (_: any, row: Allowance) => (
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                row.type === 'fixed'
                                                    ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                                                    : 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20'
                                            }`}>
                                                {t(row.type === 'fixed' ? 'Fixed' : 'Percentage')}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'amount',
                                        header: t('Amount'),
                                        sortable: false,
                                        render: (_: any, row: Allowance) => (
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                {row.type === 'fixed' ? (formatCurrency(row.amount) || '0') : `${row.amount || '0'}%`}
                                            </span>
                                        )
                                    },
                                    ...(auth.user?.permissions?.some((p: string) => ['edit-allowances', 'delete-allowances'].includes(p)) ? [{
                                        key: 'actions',
                                        header: t('Actions'),
                                        className: 'text-center [&>div]:justify-center',
                                        render: (_: any, allowance: Allowance) => (
                                            <div className="flex items-center justify-center gap-1">
                                                <TooltipProvider>
                                                    {auth.user?.permissions?.includes('edit-allowances') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openAllowanceModal('edit', allowance)}
                                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('Edit')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-allowances') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog([allowance.id, employee.id])}
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                                ]}
                                className="rounded-none"
                                emptyState={
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">{t('No allowances found')}</p>
                                    </div>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Deductions Section */}
                <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                                <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-lg">
                                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                {t('Deductions')}
                            </CardTitle>
                            {auth.user?.permissions?.includes('create-deductions') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" onClick={() => openDeductionModal('add')} className="h-8 w-8 p-0">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Create Deduction')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                            <DataTable
                                data={deductions}
                                columns={[
                                    {
                                        key: 'deduction_type',
                                        header: t('Deduction Type'),
                                        sortable: false,
                                        render: (_: any, row: Deduction) => (
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {row.deduction_type?.name || '-'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'type',
                                        header: t('Type'),
                                        sortable: false,
                                        render: (_: any, row: Deduction) => (
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                row.type === 'fixed'
                                                    ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                                                    : 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20'
                                            }`}>
                                                {t(row.type === 'fixed' ? 'Fixed' : 'Percentage')}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'amount',
                                        header: t('Amount'),
                                        sortable: false,
                                        render: (_: any, row: Deduction) => (
                                            <span className="font-semibold text-red-600 dark:text-red-400">
                                                {row.type === 'fixed' ? (formatCurrency(row.amount) || '0') : `${row.amount || '0'}%`}
                                            </span>
                                        )
                                    },
                                    ...(auth.user?.permissions?.some((p: string) => ['edit-deductions', 'delete-deductions'].includes(p)) ? [{
                                        key: 'actions',
                                        header: t('Actions'),
                                        className: 'text-center [&>div]:justify-center',
                                        render: (_: any, deduction: Deduction) => (
                                            <div className="flex items-center justify-center gap-1">
                                                <TooltipProvider>
                                                    {auth.user?.permissions?.includes('edit-deductions') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeductionModal('edit', deduction)}
                                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('Edit')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-deductions') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeductionDeleteDialog([deduction.id, employee.id])}
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                                ]}
                                className="rounded-none"
                                emptyState={
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">{t('No deductions found')}</p>
                                    </div>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Loans Section */}
                <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                                <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                {t('Loans')}
                            </CardTitle>
                            {auth.user?.permissions?.includes('create-loans') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" onClick={() => openLoanModal('add')} className="h-8 w-8 p-0">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Create Loan')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                            <DataTable
                                data={loans}
                                columns={[
                                    {
                                        key: 'loan_type',
                                        header: t('Type'),
                                        sortable: false,
                                        render: (_: any, row: Loan) => (
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {row.loan_type?.name || '-'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'amount',
                                        header: t('Amount'),
                                        sortable: false,
                                        render: (_: any, row: Loan) => (
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                {row.type === 'fixed' ? (formatCurrency(row.amount) || '0') : `${row.amount || '0'}%`}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'start_date',
                                        header: t('Start Date'),
                                        sortable: false,
                                        render: (_: any, row: Loan) => (
                                            <span className="text-sm text-gray-600 dark:text-zinc-400">
                                                {formatDate(row.start_date)}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'end_date',
                                        header: t('End Date'),
                                        sortable: false,
                                        render: (_: any, row: Loan) => (
                                            <span className="text-sm text-gray-600 dark:text-zinc-400">
                                                {formatDate(row.end_date)}
                                            </span>
                                        )
                                    },
                                    ...(auth.user?.permissions?.some((p: string) => ['edit-loans', 'delete-loans'].includes(p)) ? [{
                                        key: 'actions',
                                        header: t('Actions'),
                                        className: 'text-center [&>div]:justify-center',
                                        render: (_: any, loan: Loan) => (
                                            <div className="flex items-center justify-center gap-1">
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openLoanModal('view', loan)}
                                                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('View')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {auth.user?.permissions?.includes('edit-loans') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openLoanModal('edit', loan)}
                                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('Edit')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-loans') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openLoanDeleteDialog([loan.id, employee.id])}
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                                ]}
                                className="rounded-none"
                                emptyState={
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">{t('No loans found')}</p>
                                    </div>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Overtimes Section */}
                <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                                <div className="p-2 bg-amber-100 dark:bg-amber-950/50 rounded-lg">
                                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                {t('Overtimes')}
                            </CardTitle>
                            {auth.user?.permissions?.includes('create-overtimes') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" onClick={() => openOvertimeModal('add')} className="h-8 w-8 p-0">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Create Overtime')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                            <DataTable
                                data={overtimes}
                                columns={[
                                    {
                                        key: 'title',
                                        header: t('Title'),
                                        sortable: false,
                                        render: (_: any, row: Overtime) => (
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {row.title || '-'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'total_days',
                                        header: t('Days'),
                                        sortable: false,
                                        render: (_: any, row: Overtime) => (
                                            <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
                                                {row.total_days || '-'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'hours',
                                        header: t('Hours'),
                                        sortable: false,
                                        render: (_: any, row: Overtime) => (
                                            <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
                                                {row.hours || '-'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'rate',
                                        header: t('Rate'),
                                        sortable: false,
                                        render: (_: any, row: Overtime) => (
                                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                {formatCurrency(row.rate) || '0'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'status',
                                        header: t('Status'),
                                        sortable: false,
                                        render: (_: any, row: Overtime) => (
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                row.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                                    : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                                            }`}>
                                                {t(row.status === 'active' ? 'Active' : 'Expired')}
                                            </span>
                                        )
                                    },
                                    ...(auth.user?.permissions?.some((p: string) => ['edit-overtimes', 'delete-overtimes'].includes(p)) ? [{
                                        key: 'actions',
                                        header: t('Actions'),
                                        className: 'text-center [&>div]:justify-center',
                                        render: (_: any, overtime: Overtime) => (
                                            <div className="flex items-center justify-center gap-1">
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openOvertimeModal('view', overtime)}
                                                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('View')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {auth.user?.permissions?.includes('edit-overtimes') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openOvertimeModal('edit', overtime)}
                                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('Edit')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-overtimes') && (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openOvertimeDeleteDialog([overtime.id, employee.id])}
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                                ]}
                                className="rounded-none"
                                emptyState={
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">{t('No overtimes found')}</p>
                                    </div>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Allowance Modals */}
            <Dialog open={allowanceModalState.isOpen} onOpenChange={closeAllowanceModal}>
                {allowanceModalState.mode === 'add' && (
                    <CreateAllowance
                        employeeId={employee.id}
                        allowanceTypes={allowanceTypes}
                        onSuccess={closeAllowanceModal}
                    />
                )}
                {allowanceModalState.mode === 'edit' && allowanceModalState.data && (
                    <EditAllowance
                        allowance={allowanceModalState.data}
                        allowanceTypes={allowanceTypes}
                        onSuccess={closeAllowanceModal}
                    />
                )}
            </Dialog>

            {/* Deduction Modals */}
            <Dialog open={deductionModalState.isOpen} onOpenChange={closeDeductionModal}>
                {deductionModalState.mode === 'add' && (
                    <CreateDeduction
                        employeeId={employee.id}
                        deductionTypes={deductionTypes}
                        onSuccess={closeDeductionModal}
                    />
                )}
                {deductionModalState.mode === 'edit' && deductionModalState.data && (
                    <EditDeduction
                        deduction={deductionModalState.data}
                        deductionTypes={deductionTypes}
                        onSuccess={closeDeductionModal}
                    />
                )}
            </Dialog>

            {/* Loan Modals */}
            <Dialog open={loanModalState.isOpen} onOpenChange={closeLoanModal}>
                {loanModalState.mode === 'add' && (
                    <CreateLoan
                        employeeId={employee.id}
                        loanTypes={loanTypes}
                        onSuccess={closeLoanModal}
                    />
                )}
                {loanModalState.mode === 'edit' && loanModalState.data && (
                    <EditLoan
                        loan={loanModalState.data}
                        loanTypes={loanTypes}
                        onSuccess={closeLoanModal}
                    />
                )}
                {loanModalState.mode === 'view' && loanModalState.data && (
                    <ViewLoan
                        loan={loanModalState.data}
                    />
                )}
            </Dialog>

            {/* Overtime Modals */}
            <Dialog open={overtimeModalState.isOpen} onOpenChange={closeOvertimeModal}>
                {overtimeModalState.mode === 'add' && (
                    <CreateOvertime
                        employeeId={employee.id}
                        onSuccess={closeOvertimeModal}
                    />
                )}
                {overtimeModalState.mode === 'edit' && overtimeModalState.data && (
                    <EditOvertime
                        overtime={overtimeModalState.data}
                        onSuccess={closeOvertimeModal}
                    />
                )}
                {overtimeModalState.mode === 'view' && overtimeModalState.data && (
                    <ViewOvertime
                        overtime={overtimeModalState.data}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Allowance')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            <ConfirmationDialog
                open={deductionDeleteState.isOpen}
                onOpenChange={closeDeductionDeleteDialog}
                title={t('Delete Deduction')}
                message={deductionDeleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDeductionDelete}
                variant="destructive"
            />

            <ConfirmationDialog
                open={loanDeleteState.isOpen}
                onOpenChange={closeLoanDeleteDialog}
                title={t('Delete Loan')}
                message={loanDeleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmLoanDelete}
                variant="destructive"
            />

            <ConfirmationDialog
                open={overtimeDeleteState.isOpen}
                onOpenChange={closeOvertimeDeleteDialog}
                title={t('Delete Overtime')}
                message={overtimeDeleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmOvertimeDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}