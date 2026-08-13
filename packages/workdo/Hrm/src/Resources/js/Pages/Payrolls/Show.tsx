import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { PayslipModal } from './payslip/PayslipModal';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Calculator, Users, DollarSign, Calendar, Download, Eye, Trash2, CreditCard, User as UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';

interface PayrollEntry {
    id: number;
    employee: {
        id: number;
        name: string;
        email: string;
        user: {
            name: string;
            email: string;
            avatar?: string;
        };
    };
    basic_salary: number;
    total_allowances: number;
    total_manual_overtimes: number;
    total_deductions: number;
    total_loans: number;
    gross_pay: number;
    net_pay: number;
    attendance_overtime_amount: number;
    working_days: number;
    present_days: number;
    absent_days: number;
    paid_leave_days: number;
    unpaid_leave_days: number;
    overtime_hours: number;
    allowances_breakdown: Record<string, number>;
    deductions_breakdown: Record<string, number>;
    manual_overtimes_breakdown: Record<string, number>;
    loans_breakdown: Record<string, number>;
}

interface Payroll {
    id: number;
    title: string;
    payroll_frequency: string;
    pay_period_start: string;
    pay_period_end: string;
    pay_date: string;
    status: string;
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    employee_count: number;
    payroll_entries: PayrollEntry[];
}

interface ShowProps {
    payroll: Payroll;
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Show() {
    const { t } = useTranslation();
    const { payroll, auth } = usePage<ShowProps>().props;
    const [selectedPayrollEntry, setSelectedPayrollEntry] = useState<PayrollEntry | null>(null);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
    

    const openPayslipModal = (entry: PayrollEntry) => {
        setSelectedPayrollEntry(entry);
        setIsPayslipModalOpen(true);
    };

    const closePayslipModal = () => {
        setIsPayslipModalOpen(false);
        setSelectedPayrollEntry(null);
    };

    const handlePayment = (entryId: number) => {
        router.patch(route('hrm.payroll-entries.pay', entryId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Success message will be handled by flash messages
            }
        });
    };
    
    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.payroll-entries.destroy',
        defaultMessage: t('Are you sure you want to delete this payroll entry? This will remove the salary calculation for this employee.')
    });

    const getStatusColor = (status: string) => {
        const colors = {
            draft: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || colors.draft;
    };

    const tableColumns = [
        {
            key: 'employee_name',
            header: t('Employee'),
            render: (_: any, entry: PayrollEntry) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                        {entry.employee?.user?.avatar ? (
                            <img
                                src={getImagePath(entry.employee.user.avatar)}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{entry.employee?.user?.name || entry.employee?.name}</span>
                        <span className="text-sm text-gray-500 dark:text-zinc-400">{entry.employee?.user?.email || entry.employee?.email}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'basic_salary',
            header: t('Basic Salary'),
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'total_allowances',
            header: t('Allowances'),
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'total_manual_overtimes',
            header: t('Manual OT'),
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'attendance_overtime_amount',
            header: t('Attendance OT'),
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'total_deductions',
            header: t('Deductions'),
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'total_loans',
            header: t('Loans'),
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'gross_pay',
            header: t('Gross Pay'),
            render: (value: number) => (
                <span className="font-medium text-green-600 dark:text-emerald-400">{formatCurrency(value)}</span>
            )
        },
        {
            key: 'net_pay',
            header: t('Net Pay'),
            render: (value: number) => (
                <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(value)}</span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: string) => {
                const isPaid = value === 'paid';
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        isPaid 
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' 
                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                    }`}>
                        {t(isPaid ? 'Paid' : 'Unpaid')}
                    </span>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['pay-payslip', 'download-payslip', 'view-payslip', 'delete-payslip'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-center [&>div]:justify-center',
            render: (_: any, entry: PayrollEntry) => (
                <div className="flex gap-1 items-center justify-center">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('pay-payslip') && entry.status !== 'paid' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => handlePayment(entry.id)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <CreditCard className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Pay Salary')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('download-payslip') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(route('hrm.payroll-entries.print', entry.id) + '?download=pdf', '_blank')} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Download Payslip')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-payslip') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openPayslipModal(entry)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View Payslip')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-payslip') && entry.status !== 'paid' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(entry.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Delete Payslip')}</p>
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
                { label: t('Payrolls'), url: route('hrm.payrolls.index') },
                { label: payroll.title }
            ]}
            pageTitle={t('Payroll Details')}
            pageDescription={t('View detailed breakdown of employee salaries, allowances, and deductions.')}
            backUrl={route('hrm.payrolls.index')}
        >
            <Head title={`${t('Payroll')} - ${payroll.title}`} />

            <div className="space-y-8">
                {/* Payroll Summary */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Calculator className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-1xl font-bold text-gray-900 dark:text-gray-100">{payroll.title}</CardTitle>
                                    <div className="flex items-center gap-6 mt-2">
                                        <p className="text-base text-gray-600 dark:text-zinc-400">
                                            {formatDate(payroll.pay_period_start)} - {formatDate(payroll.pay_period_end)}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium">{t('Pay Date')}:</span>
                                                <span>{formatDate(payroll.pay_date)}</span>
                                            </div>
                                            {(() => {
                                                const frequencyLabels = {
                                                    weekly: 'Weekly',
                                                    biweekly: 'Bi-Weekly',
                                                    monthly: 'Monthly'
                                                };
                                                const frequencyColors = {
                                                    weekly: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
                                                    biweekly: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20',
                                                    monthly: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20'
                                                };
                                                const freqValue = payroll.payroll_frequency || 'weekly';
                                                const freqLabel = frequencyLabels[freqValue as keyof typeof frequencyLabels] || freqValue;
                                                const freqBadgeColor = frequencyColors[freqValue as keyof typeof frequencyColors] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/50';
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{t('Frequency')}:</span>
                                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${freqBadgeColor}`}>
                                                            {t(freqLabel)}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                payroll.status === 'draft' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20' :
                                payroll.status === 'processing' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20' :
                                payroll.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' :
                                payroll.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20' :
                                'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20'
                            }`}>
                                {t(payroll.status?.charAt(0).toUpperCase() + payroll.status?.slice(1) || 'Draft')}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex items-center gap-4 p-5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">{t('Employees')}</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{payroll.employee_count}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-green-50 dark:bg-emerald-950/20 rounded-xl border border-green-100 dark:border-emerald-900/30">
                                <div className="p-2 bg-green-100 dark:bg-emerald-900/40 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">{t('Gross Pay')}</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-emerald-400">{formatCurrency(payroll.total_gross_pay)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">{t('Deductions')}</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(payroll.total_deductions)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">{t('Net Pay')}</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(payroll.total_net_pay)}</p>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Employee Salary Details */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                                <Users className="h-5 w-5 text-gray-600 dark:text-zinc-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Employee Salary Details')}</CardTitle>
                                <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">{t('Detailed breakdown of employee salaries and deductions')}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[60vh] rounded-none w-full">
                            <div className="min-w-[1200px]">
                                <DataTable
                                    data={payroll.payroll_entries || []}
                                    columns={tableColumns}
                                    className="rounded-none"
                                    emptyState={
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <div className="p-4 bg-gray-100 rounded-full mb-4">
                                                <Calculator className="h-12 w-12 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('No Salary Data')}</h3>
                                            <p className="text-gray-500 text-center max-w-md leading-relaxed">
                                                {t('No employee salary data found for this payroll. Run the payroll process to generate salary calculations.')}
                                            </p>
                                        </div>
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Payroll Entry')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
            
            <PayslipModal
                open={isPayslipModalOpen}
                onOpenChange={closePayslipModal}
                payrollEntry={selectedPayrollEntry}
                payroll={payroll}
            />
        </AuthenticatedLayout>
    );
}