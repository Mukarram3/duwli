import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getImagePath } from '@/utils/helpers';
import { User as UserIcon } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";

interface LeaveTypeBalance {
    leave_type_name: string;
    leave_type_color: string;
    total_days: number;
    used_days: number;
    available_days: number;
}

interface LeaveBalanceData {
    employee_id: number;
    employee_name: string;
    employee_code: string;
    avatar: string | null;
    leave_types: LeaveTypeBalance[];
}

interface LeaveBalanceIndexProps {
    leaveBalances: LeaveBalanceData[];
}

export default function Index() {
    const { t } = useTranslation();
    const { leaveBalances } = usePage<LeaveBalanceIndexProps>().props;
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBalances = leaveBalances?.filter(employee =>
        employee.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employee_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Leave Balance') }
            ]}
            pageTitle={t('Leave Balance')}
            pageDescription={t('View and track employee leave balances, including approved, used, and available days.')}
        >
            <Head title={t('Leave Balance')} />

            {/* Controls bar */}
            <Card className="mb-6 shadow-sm border border-gray-300 dark:border-zinc-700">
                <CardContent className="p-4 bg-gray-50/50 dark:bg-zinc-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={searchQuery}
                                onChange={(value) => setSearchQuery(value)}
                                placeholder={t('Search employee name or code...')}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {filteredBalances && filteredBalances.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBalances.map((employee) => (
                        <Card key={employee.employee_id} className="hover:shadow-md transition-all duration-300 border border-gray-300 dark:border-zinc-700 bg-card">
                            <CardHeader className="pb-3 border-b border-gray-200 dark:border-zinc-700/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border dark:border-zinc-800 flex-shrink-0">
                                        {employee.avatar ? (
                                            <img
                                                src={getImagePath(employee.avatar)}
                                                alt={employee.employee_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <UserIcon className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-base text-foreground truncate">{employee.employee_name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">{employee.employee_code}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                {/* Table Header */}
                                <div className="grid grid-cols-[1fr_42px_42px_64px] gap-2 pl-2 pr-3 pb-2 border-b border-gray-200 dark:border-zinc-700/80 text-xs font-semibold text-muted-foreground">
                                    <div className="text-left">{t('Leave Type')}</div>
                                    <div className="text-center">{t('Total')}</div>
                                    <div className="text-center">{t('Used')}</div>
                                    <div className="text-center">{t('Available')}</div>
                                </div>

                                {/* Leave Type Rows container with custom scrollbar */}
                                <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2 [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/40 dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700/40 [&::-webkit-scrollbar-thumb]:rounded-full transition-all">
                                    {employee.leave_types.map((leaveType, index) => (
                                        <div key={index} className="grid grid-cols-[1fr_42px_42px_64px] gap-2 p-2 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-gray-100/50 dark:hover:bg-zinc-900/80 border border-gray-100/60 dark:border-zinc-800/40 rounded-lg transition-colors text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {leaveType.leave_type_color && (
                                                    <span 
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: leaveType.leave_type_color }}
                                                    />
                                                )}
                                                <span className="font-medium text-sm text-foreground/90 dark:text-zinc-200 truncate">{leaveType.leave_type_name}</span>
                                            </div>
                                            <div className="flex items-center justify-center font-medium text-foreground dark:text-zinc-300">
                                                {leaveType.total_days}
                                            </div>
                                            <div className="flex items-center justify-center font-medium text-red-600 dark:text-red-400">
                                                {leaveType.used_days}
                                            </div>
                                            <div className="flex items-center justify-center font-medium text-emerald-600 dark:text-emerald-400">
                                                {leaveType.available_days}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="shadow-sm border border-gray-200/80 dark:border-zinc-800">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <UserIcon className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                        <h3 className="text-lg font-medium text-foreground">{t('No Leave Balances Found')}</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            {searchQuery 
                                ? t('We couldn\'t find any employee matching your search criteria.')
                                : t('No leave balances are currently allocated in the system.')
                            }
                        </p>
                    </CardContent>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}