import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Users as UsersIcon, Lock, Download, FileImage, User as UserIcon, Calendar, Clock, TrendingUp, LayoutGrid, Briefcase, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NoRecordsFound from '@/components/no-records-found';
import { Employee, EmployeesIndexProps, EmployeeFilters } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';

export default function Index() {
    const { t } = useTranslation();
    const { employees, auth, users, branches, departments, designations, stats } = usePage<any>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<any>({
        employee_id: urlParams.get('employee_id') || '',
        user_name: urlParams.get('user_name') || '',
        branch_id: urlParams.get('branch_id') || 'all',
        department_id: urlParams.get('department_id') || 'all',
        employment_type: urlParams.get('employment_type') || '',
        gender: urlParams.get('gender') || '',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');


    const [filteredBranches, setFilteredBranches] = useState(branches || []);
    const [filteredDepartments, setFilteredDepartments] = useState(departments || []);
    const [filteredDesignations, setFilteredDesignations] = useState(designations || []);
    const [showFilters, setShowFilters] = useState(false);

    // Handle dependent dropdown for department filters
    useEffect(() => {
        if (filters.branch_id && filters.branch_id !== 'all') {
            const branchDepartments = departments.filter(dept => dept.branch_id.toString() === filters.branch_id);
            setFilteredDepartments(branchDepartments);
            // Clear department if it doesn't belong to selected branch
            if (filters.department_id && filters.department_id !== 'all') {
                const departmentExists = branchDepartments.find(dept => dept.id.toString() === filters.department_id);
                if (!departmentExists) {
                    setFilters(prev => ({ ...prev, department_id: 'all' }));
                }
            }
        } else {
            setFilteredDepartments(departments || []);
            setFilters(prev => ({ ...prev, department_id: 'all' }));
        }
    }, [filters.branch_id]);

    // Handle dependent dropdown for designation filters
    useEffect(() => {
        if (filters.department_id && filters.department_id !== 'all') {
            const departmentDesignations = designations.filter(desig => desig.department_id.toString() === filters.department_id);
            setFilteredDesignations(departmentDesignations);
        } else {
            setFilteredDesignations(designations || []);
        }
    }, [filters.department_id]);

    const pageButtons = usePageButtons('googleDriveBtn', { module: 'Employee', settingKey: 'GoogleDrive Employee' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Employee', settingKey: 'OneDrive Employee' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.employees.destroy',
        defaultMessage: t('Are you sure you want to delete this employee?')
    });

    const handleFilter = () => {
        router.get(route('hrm.employees.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.employees.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            employee_id: '',
            user_name: '',
            branch_id: 'all',
            department_id: 'all',
            employment_type: '',
            gender: '',
            status: '',
        });
        router.get(route('hrm.employees.index'), { per_page: perPage, view: viewMode });
    };

    const handleTabChange = (type: string) => {
        const newType = type === 'all' ? '' : type;
        const newFilters = { ...filters, employment_type: newType };
        setFilters(newFilters);
        router.get(route('hrm.employees.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.employment_type || 'all';



    const tableColumns = [
        {
            key: 'user.name',
            header: t('Employee Name'),
            sortable: false,
            render: (value: any, row: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                        {row.user?.avatar ? (
                            <img src={getImagePath(row.user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{row.user?.name || '-'}</span>
                        <span className="text-xs text-muted-foreground">{row.user?.email || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'employee_id',
            header: t('Employee Id'),
            sortable: true,
            render: (value: string, employee: Employee) =>
                auth.user?.permissions?.includes('view-employees') ? (
                    <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                        onClick={() => router.get(route('hrm.employees.show', employee.id))}
                    >
                        {value}
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                        {value}
                    </span>
                )
        },
        {
            key: 'branch.branch_name',
            header: t('Branch'),
            sortable: false,
            render: (value: any, row: any) => row.branch?.branch_name ? (
                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-900/20 dark:text-slate-400 dark:ring-slate-500/20">
                    {row.branch.branch_name}
                </span>
            ) : '-'
        },
        {
            key: 'department.department_name',
            header: t('Department'),
            sortable: false,
            render: (value: any, row: any) => row.department?.department_name ? (
                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-950/20 dark:text-indigo-400 dark:ring-indigo-500/20">
                    {row.department.department_name}
                </span>
            ) : '-'
        },
        {
            key: 'designation.designation_name',
            header: t('Designation'),
            sortable: false,
            render: (value: any, row: any) => row.designation?.designation_name ? (
                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-950/20 dark:text-sky-400 dark:ring-sky-500/20">
                    {row.designation.designation_name}
                </span>
            ) : '-'
        },
        {
            key: 'employment_type',
            header: t('Employment Type'),
            sortable: false,
            render: (value: any) => {
                const options: any = { "0": "Full Time", "1": "Part Time", "2": "Temporary", "3": "Contract" };
                const text = options[value] || value || '-';

                const badgeStyles: any = {
                    "Full Time": "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20",
                    "Part Time": "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-500/20",
                    "Temporary": "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-500/20",
                    "Contract": "bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/20 dark:text-purple-400 dark:ring-purple-500/20",
                };

                const style = badgeStyles[text] || "bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-900/20 dark:text-slate-400 dark:ring-slate-500/20";

                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
                        {t(text)}
                    </span>
                );
            }
        },
        {
            key: 'date_of_joining',
            header: t('Date Of Joining'),
            sortable: false,
            render: (value: string) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : '-'
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-employees', 'edit-employees', 'delete-employees'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, employee: Employee) => (
                <div className="flex gap-1">
                    {employee.user?.is_disable === 1 ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="h-8 w-8 p-0 flex items-center justify-center text-gray-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('User is disabled')}</p></TooltipContent>
                        </Tooltip>
                    ) : (
                        <TooltipProvider>
                            {auth.user?.permissions?.includes('view-employees') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => router.get(route('hrm.employees.show', employee.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('View')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('edit-employees') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => router.visit(route('hrm.employees.edit', employee.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                            <EditIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Edit')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('delete-employees') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteDialog(employee.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                    )}
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Employees') }
            ]}
            pageTitle={t('Employees')}
            pageDescription={t('View and manage employee profiles, branch, departments, and designation.')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-employees') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('hrm.employees.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Employees')} />

            {/* KPI Cards Panel */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">
                {/* Card 1: Total Employees */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 flex flex-col justify-between rounded-xl shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Employees')}</CardTitle>
                        <UsersIcon className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats?.total ?? 0}</div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All time')}</p>
                    </CardContent>
                </Card>

                {/* Card 2: Full Time */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 flex flex-col justify-between rounded-xl shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Full Time')}</CardTitle>
                        <Briefcase className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.full_time ?? 0}</div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{stats?.total > 0 ? Math.round(((stats?.full_time ?? 0) / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>

                {/* Card 3: Part Time */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50 flex flex-col justify-between rounded-xl shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Part Time')}</CardTitle>
                        <Clock className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats?.part_time ?? 0}</div>
                        <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">{stats?.total > 0 ? Math.round(((stats?.part_time ?? 0) / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>

                {/* Card 4: Temporary */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 flex flex-col justify-between rounded-xl shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">{t('Temporary')}</CardTitle>
                        <Calendar className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-80" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{stats?.temporary ?? 0}</div>
                        <p className="text-xs text-rose-700 dark:text-rose-400 opacity-80 mt-1">{stats?.total > 0 ? Math.round(((stats?.temporary ?? 0) / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>

                {/* Card 5: Contract */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 flex flex-col justify-between rounded-xl shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Contract')}</CardTitle>
                        <FileText className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats?.contract ?? 0}</div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{stats?.total > 0 ? Math.round(((stats?.contract ?? 0) / stats.total) * 100) : 0}% {t('of total')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="shadow-sm rounded-xl border border-border/50 overflow-hidden">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.employee_id}
                                onChange={(value) => setFilters({ ...filters, employee_id: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Employees...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="hrm.employees.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="hrm.employees.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.branch_id !== 'all' ? filters.branch_id : '', filters.department_id !== 'all' ? filters.department_id : '', filters.employment_type, filters.gender].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Status Tabs */}
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: stats?.total || 0 },
                            { key: 'Full Time', label: t('Full Time'), icon: Briefcase, count: stats?.full_time || 0 },
                            { key: 'Part Time', label: t('Part Time'), icon: Clock, count: stats?.part_time || 0 },
                            { key: 'Temporary', label: t('Temporary'), icon: Calendar, count: stats?.temporary || 0 },
                            { key: 'Contract', label: t('Contract'), icon: FileText, count: stats?.contract || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Branch')}</label>
                                <Select value={filters.branch_id} onValueChange={(value) => setFilters({ ...filters, branch_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Branchs')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Branchs')}</SelectItem>
                                        {filteredBranches?.map((branch: any) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {branch.branch_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Department')}</label>
                                <Select value={filters.department_id} onValueChange={(value) => setFilters({ ...filters, department_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Departments')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Departments')}</SelectItem>
                                        {filteredDepartments?.map((department: any) => (
                                            <SelectItem key={department.id} value={department.id.toString()}>
                                                {department.department_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Gender')}</label>
                                <Select value={filters.gender} onValueChange={(value) => setFilters({ ...filters, gender: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Gender')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">{t('Male')}</SelectItem>
                                        <SelectItem value="1">{t('Female')}</SelectItem>
                                        <SelectItem value="2">{t('Other')}</SelectItem>
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
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={employees?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={UsersIcon}
                                            title={t('No Employees found')}
                                            description={t('Get started by creating your first Employee.')}
                                            hasFilters={!!(filters.employee_id || filters.user_name || (filters.branch_id !== 'all' && filters.branch_id) || (filters.department_id !== 'all' && filters.department_id) || filters.employment_type || filters.gender)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-employees"
                                            onCreateClick={() => router.visit(route('hrm.employees.create'))}
                                            createButtonText={t('Create Employee')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-6">
                            {employees?.data?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {employees?.data?.map((employee) => (
                                        <Card key={employee.id} className="p-0 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col h-full min-w-0 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pt-5">
                                            {/* Header block with avatar, name/email */}
                                            <div className="px-5 flex items-center gap-3 min-w-0 flex-shrink-0">
                                                {/* Small Avatar */}
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                    {employee.user?.avatar ? (
                                                        <img src={getImagePath(employee.user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                {/* Name and Email */}
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate hover:text-primary cursor-pointer leading-snug" onClick={() => router.get(route('hrm.employees.show', employee.id))}>
                                                        {employee.user?.name || '-'}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground truncate leading-normal">{employee.user?.email || '-'}</p>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="border-t my-3 border-gray-200 dark:border-zinc-800" />

                                            {/* Body info */}
                                            <div className="px-5 py-1 flex-1 min-h-0 flex flex-col justify-center space-y-2.5 text-xs text-gray-600 dark:text-zinc-400">
                                                {/* Employee ID */}
                                                <div className="flex items-center justify-between min-w-0 gap-2">
                                                    <span className="text-gray-400 dark:text-zinc-500 font-medium flex-shrink-0">{t('Employee ID')}</span>
                                                    <span className="font-mono text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                                        {employee.employee_id}
                                                    </span>
                                                </div>
                                                {/* Branch */}
                                                <div className="flex items-center justify-between min-w-0 gap-2">
                                                    <span className="text-gray-400 dark:text-zinc-500 font-medium flex-shrink-0">{t('Branch')}</span>
                                                    <span className="font-medium text-gray-800 dark:text-zinc-200 truncate" title={employee.branch?.branch_name}>
                                                        {employee.branch?.branch_name || '-'}
                                                    </span>
                                                </div>
                                                {/* Department */}
                                                <div className="flex items-center justify-between min-w-0 gap-2">
                                                    <span className="text-gray-400 dark:text-zinc-500 font-medium flex-shrink-0">{t('Department')}</span>
                                                    <span className="font-medium text-gray-800 dark:text-zinc-200 truncate" title={employee.department?.department_name}>
                                                        {employee.department?.department_name || '-'}
                                                    </span>
                                                </div>
                                                {/* Designation */}
                                                <div className="flex items-center justify-between min-w-0 gap-2">
                                                    <span className="text-gray-400 dark:text-zinc-500 font-medium flex-shrink-0">{t('Designation')}</span>
                                                    <span className="font-medium text-gray-800 dark:text-zinc-200 truncate" title={employee.designation?.designation_name}>
                                                        {employee.designation?.designation_name || '-'}
                                                    </span>
                                                </div>
                                                {/* Employment Type */}
                                                <div className="flex items-center justify-between min-w-0 gap-2">
                                                    <span className="text-gray-400 dark:text-zinc-500 font-medium flex-shrink-0">{t('Employment Type')}</span>
                                                    {(() => {
                                                        const options: any = { "0": "Full Time", "1": "Part Time", "2": "Temporary", "3": "Contract" };
                                                        const text = options[employee.employment_type] || employee.employment_type || '-';
                                                        const badgeStyles: any = {
                                                            "Full Time": "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20",
                                                            "Part Time": "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-500/20",
                                                            "Temporary": "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-500/20",
                                                            "Contract": "bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/20 dark:text-purple-400 dark:ring-purple-500/20",
                                                        };
                                                        const style = badgeStyles[text] || "bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-900/20 dark:text-slate-400 dark:ring-slate-500/20";
                                                        return (
                                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
                                                                {t(text)}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Actions Footer */}
                                            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-950/20 flex-shrink-0 mt-3">
                                                {/* Date on Left */}
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium min-w-0">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {employee.date_of_joining ? formatDate(employee.date_of_joining) : '-'}
                                                    </span>
                                                </div>

                                                {/* Actions on Right */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {employee.user?.is_disable === 1 ? (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <div className="h-8 w-8 flex items-center justify-center text-gray-400">
                                                                    <Lock className="h-3.5 w-3.5" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('User is disabled')}</p></TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <TooltipProvider>
                                                            {auth.user?.permissions?.includes('view-employees') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.get(route('hrm.employees.show', employee.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('View')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('edit-employees') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.visit(route('hrm.employees.edit', employee.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                            <EditIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('Edit')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('delete-employees') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openDeleteDialog(employee.id)}
                                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={UsersIcon}
                                    title={t('No Employees found')}
                                    description={t('Get started by creating your first Employee.')}
                                    hasFilters={!!(filters.employee_id || filters.user_name || (filters.branch_id !== 'all' && filters.branch_id) || (filters.department_id !== 'all' && filters.department_id) || filters.employment_type || filters.gender)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-employees"
                                    onCreateClick={() => router.visit(route('hrm.employees.create'))}
                                    createButtonText={t('Create Employee')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={employees || { data: [], links: [], meta: {} }}
                        routeName="hrm.employees.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>





            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Employee')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}