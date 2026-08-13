import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
    Plus, 
    Edit, 
    Trash2, 
    GraduationCap, 
    CheckSquare, 
    Building, 
    Building2, 
    ChevronRight, 
    Search, 
    X,
    Calendar,
    MapPin,
    Users,
    DollarSign,
    ArrowLeft,
    LayoutGrid,
    Play,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Input } from '@/components/ui/input';

import Create from './create';
import EditTraining from './edit';
import { formatDate } from '@/utils/helpers';
import { Training, TrainingsIndexProps, TrainingFilters, TrainingModalState } from './types';

export default function Index() {
    const { t } = useTranslation();
    const { trainings, trainingTypes, trainers, branches, departments, users, auth, stats = { total: 0, scheduled: 0, ongoing: 0, completed: 0, cancelled: 0 } } = usePage<TrainingsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<TrainingFilters>({
        title: urlParams.get('title') || '',
        status: urlParams.get('status') || '',
        branch_id: urlParams.get('branch_id') || '',
        department_id: urlParams.get('department_id') || ''
    });

    const [selectedTrainingTypeId, setSelectedTrainingTypeId] = useState<string>(
        urlParams.get('training_type_id') !== null ? (urlParams.get('training_type_id') || '') : '_none_'
    );

    const [filteredDepartments, setFilteredDepartments] = useState(departments || []);
    const [branchSearch, setBranchSearch] = useState('');
    const [showBranchSearch, setShowBranchSearch] = useState(false);
    const [deptSearch, setDeptSearch] = useState('');
    const [showDeptSearch, setShowDeptSearch] = useState(false);
    const [typeSearch, setTypeSearch] = useState('');
    const [showTypeSearch, setShowTypeSearch] = useState(false);

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<TrainingModalState>({
        isOpen: true,
        mode: '',
        data: null
    });
    
    // Close modal on initial render
    useEffect(() => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    }, []);

    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'training.trainings.destroy',
        defaultMessage: t('Are you sure you want to delete this training list?')
    });

    // Synchronize URL parameters with local state on navigation/history change
    useEffect(() => {
        const currentUrlParams = new URLSearchParams(window.location.search);
        setFilters({
            title: currentUrlParams.get('title') || '',
            status: currentUrlParams.get('status') || '',
            branch_id: currentUrlParams.get('branch_id') || '',
            department_id: currentUrlParams.get('department_id') || ''
        });
        const typeParam = currentUrlParams.get('training_type_id');
        setSelectedTrainingTypeId(typeParam !== null ? typeParam : '_none_');
    }, [window.location.search]);

    const handleFilter = () => {
        router.get(route('training.trainings.index'), {
            ...filters,
            training_type_id: selectedTrainingTypeId,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ title: '', status: '', branch_id: filters.branch_id, department_id: filters.department_id });
        setSelectedTrainingTypeId('');
        router.get(route('training.trainings.index'), {
            branch_id: filters.branch_id,
            department_id: filters.department_id,
            per_page: perPage
        });
    };

    const openModal = (mode: 'add' | 'edit', data: Training | null = null) => {
        setModalState({
            isOpen: true,
            mode,
            data
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    };

    useEffect(() => {
        if (filters.branch_id) {
            const branchDepartments = departments.filter(dept => dept.branch_id.toString() === filters.branch_id);
            setFilteredDepartments(branchDepartments);
        } else {
            setFilteredDepartments([]);
        }
    }, [filters.branch_id]);

    const handleSelectBranch = (branchId: string) => {
        setFilters(prev => ({
            ...prev,
            branch_id: branchId,
            department_id: ''
        }));
        setSelectedTrainingTypeId('_none_');

        router.get(route('training.trainings.index'), {
            title: filters.title,
            status: filters.status,
            branch_id: branchId,
            department_id: '',
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleBackToBranches = () => {
        setFilters(prev => ({
            ...prev,
            branch_id: '',
            department_id: ''
        }));
        setSelectedTrainingTypeId('_none_');

        router.get(route('training.trainings.index'), {
            title: filters.title,
            status: filters.status,
            branch_id: '',
            department_id: '',
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSelectDepartment = (deptId: string) => {
        setFilters(prev => ({
            ...prev,
            department_id: deptId
        }));
        setSelectedTrainingTypeId('_none_');

        router.get(route('training.trainings.index'), {
            title: filters.title,
            status: filters.status,
            branch_id: filters.branch_id,
            department_id: deptId,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSelectTrainingType = (typeId: string) => {
        setSelectedTrainingTypeId(typeId);
        router.get(route('training.trainings.index'), {
            title: filters.title,
            status: filters.status,
            branch_id: filters.branch_id,
            department_id: filters.department_id,
            training_type_id: typeId,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleStatusTabChange = (tabKey: string) => {
        const newStatus = tabKey === 'all' ? '' : tabKey;
        setFilters(prev => ({ ...prev, status: newStatus }));
        router.get(route('training.trainings.index'), {
            ...filters,
            status: newStatus,
            training_type_id: selectedTrainingTypeId,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    // Client-side filtering of branches, departments, and training types
    const filteredBranchesList = branches.filter(b => 
        b.branch_name.toLowerCase().includes(branchSearch.toLowerCase())
    );

    const filteredDeptsList = filteredDepartments.filter(d => 
        d.department_name.toLowerCase().includes(deptSearch.toLowerCase())
    );

    const filteredTypesList = trainingTypes.filter(t => 
        t.name.toLowerCase().includes(typeSearch.toLowerCase())
    );

    const isBranchSelected = !!filters.branch_id;
    const isDeptSelected = !!filters.department_id;

    // Get Active Records
    const activeBranch = branches.find(b => b.id.toString() === filters.branch_id);
    const activeDept = departments.find(d => d.id.toString() === filters.department_id);
    const activeTab = filters.status || 'all';

    // Client-side training list filter based on selected training type
    const displayedTrainings = trainings.data.filter(t => 
        !selectedTrainingTypeId || t.training_type_id.toString() === selectedTrainingTypeId
    );

    // Dynamic counts
    const getDeptCountForBranch = (branchId: number) => {
        return departments.filter(d => d.branch_id === branchId).length;
    };

    const getTrainingCountForType = (typeId: number) => {
        return trainings.data.filter(t => t.training_type_id === typeId).length;
    };

    const statusColors = {
        scheduled: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/20',
        ongoing: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20',
        completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20',
        cancelled: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20'
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Training')}, 
                {label: t('Training List')}
            ]}
            pageTitle={t('Manage Training List')}
            pageDescription={t('Organize and oversee professional training sessions, schedules, types, and active statuses.')}
            pageActions={
                auth.user?.permissions?.includes('create-trainings') && (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Create')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            }
        >
            <Head title={t('Training List')} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                
                {/* Column 1: Branches or Departments */}
                <div className="xl:col-span-3 [perspective:1000px] relative h-[500px] xl:h-[calc(100vh-170px)] xl:min-h-[620px]">
                    <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isBranchSelected ? '[transform:rotateY(180deg)]' : ''}`}>
                        
                        {/* Front Face: Branches */}
                        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
                            <Card className="h-full flex flex-col overflow-hidden shadow-sm border border-gray-300 dark:border-zinc-800">
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-gray-100">{t('Branches')}</span>
                                        <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs font-semibold rounded-full border border-primary/20">
                                            {branches.length}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowBranchSearch(!showBranchSearch)}
                                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <Search className="w-4 h-4" />
                                    </Button>
                                </div>

                                {showBranchSearch && (
                                    <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 rtl:right-2.5 rtl:left-auto top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t('Search branches...')}
                                                value={branchSearch}
                                                onChange={(e) => setBranchSearch(e.target.value)}
                                                className="pl-8 rtl:pr-8 rtl:pl-3 h-9"
                                            />
                                            {branchSearch && (
                                                <button
                                                    onClick={() => setBranchSearch('')}
                                                    className="absolute right-2.5 rtl:left-2.5 rtl:right-auto top-2.5 text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                                    {filteredBranchesList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                            <Building className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('No branches found')}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredBranchesList.map((branch) => {
                                            const isSelected = branch.id.toString() === filters.branch_id;
                                            return (
                                                <button
                                                    key={branch.id}
                                                    onClick={() => handleSelectBranch(branch.id.toString())}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 border text-start group ${
                                                        isSelected
                                                            ? 'bg-primary/5 text-primary border-primary/10 dark:bg-primary/10 dark:text-primary dark:border-primary/20'
                                                            : 'bg-transparent text-gray-700 border-transparent hover:bg-gray-50/50 dark:text-gray-300 dark:hover:bg-zinc-800/30'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Building className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                                                            isSelected ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                                        }`} />
                                                        <span className="font-semibold text-sm truncate">{branch.branch_name}</span>
                                                    </div>
                                                    <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-semibold rounded-full border transition-colors ${
                                                        isSelected
                                                            ? 'bg-primary text-white border-primary/20'
                                                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700'
                                                    }`}>
                                                        {getDeptCountForBranch(branch.id)}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Back Face: Departments */}
                        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                            <Card className="h-full flex flex-col overflow-hidden shadow-sm border border-gray-300 dark:border-zinc-800">
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleBackToBranches}
                                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                                        >
                                            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                                        </Button>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                            {activeBranch ? activeBranch.branch_name : t('Departments')}
                                        </span>
                                        <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs font-semibold rounded-full border border-primary/20 flex-shrink-0">
                                            {filteredDeptsList.length}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowDeptSearch(!showDeptSearch)}
                                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <Search className="w-4 h-4" />
                                    </Button>
                                </div>

                                {showDeptSearch && (
                                    <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 rtl:right-2.5 rtl:left-auto top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t('Search departments...')}
                                                value={deptSearch}
                                                onChange={(e) => setDeptSearch(e.target.value)}
                                                className="pl-8 rtl:pr-8 rtl:pl-3 h-9"
                                            />
                                            {deptSearch && (
                                                <button
                                                    onClick={() => setDeptSearch('')}
                                                    className="absolute right-2.5 rtl:left-2.5 rtl:right-auto top-2.5 text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                                    {filteredDeptsList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                            <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('No departments found')}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredDeptsList.map((dept) => {
                                            const isSelected = dept.id.toString() === filters.department_id;
                                            return (
                                                <button
                                                    key={dept.id}
                                                    onClick={() => handleSelectDepartment(dept.id.toString())}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 border text-start group ${
                                                        isSelected
                                                            ? 'bg-primary/5 text-primary border-primary/10 dark:bg-primary/10 dark:text-primary dark:border-primary/20'
                                                            : 'bg-transparent text-gray-700 border-transparent hover:bg-gray-50/50 dark:text-gray-300 dark:hover:bg-zinc-800/30'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Building2 className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                                                            isSelected ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                                        }`} />
                                                        <span className="font-semibold text-sm truncate">{dept.department_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 ${
                                                            isSelected ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                                        }`} />
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </div>

                    </div>
                </div>

                {/* Column 2: Training Types */}
                <div className="xl:col-span-3">
                    {!isDeptSelected ? (
                        <Card className="h-auto xl:h-[calc(100vh-170px)] xl:min-h-[620px] flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-300 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-900/10 shadow-sm">
                            <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800/50 mb-4">
                                <Building2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-1">{t('Select Department')}</h4>
                            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[180px] mx-auto">
                                {t('Please select a department to view available training types.')}
                            </p>
                        </Card>
                    ) : (
                        <Card className="h-auto xl:h-[calc(100vh-170px)] xl:min-h-[620px] flex flex-col overflow-hidden shadow-sm border border-gray-300 dark:border-zinc-800 animate-in fade-in-50 slide-in-from-right duration-500">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                        {t('Training Types')}
                                    </span>
                                    <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs font-semibold rounded-full border border-primary/20 flex-shrink-0">
                                        {filteredTypesList.length}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowTypeSearch(!showTypeSearch)}
                                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <Search className="w-4 h-4" />
                                </Button>
                            </div>

                            {showTypeSearch && (
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 rtl:right-2.5 rtl:left-auto top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t('Search training types...')}
                                            value={typeSearch}
                                            onChange={(e) => setTypeSearch(e.target.value)}
                                            className="pl-8 rtl:pr-8 rtl:pl-3 h-9"
                                        />
                                        {typeSearch && (
                                            <button
                                                onClick={() => setTypeSearch('')}
                                                className="absolute right-2.5 rtl:left-2.5 rtl:right-auto top-2.5 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                                <button
                                    onClick={() => handleSelectTrainingType('')}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 border text-start group ${
                                        selectedTrainingTypeId === ''
                                            ? 'bg-primary/5 text-primary border-primary/10 dark:bg-primary/10 dark:text-primary dark:border-primary/20'
                                            : 'bg-transparent text-gray-700 border-transparent hover:bg-gray-50/50 dark:text-gray-300 dark:hover:bg-zinc-800/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <GraduationCap className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                                            selectedTrainingTypeId === '' ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                        }`} />
                                        <span className="font-semibold text-sm truncate">{t('All Types')}</span>
                                    </div>
                                    <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-semibold rounded-full border transition-colors ${
                                        selectedTrainingTypeId === ''
                                            ? 'bg-primary text-white border-primary/20'
                                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700'
                                    }`}>
                                        {trainings.data.length}
                                    </span>
                                </button>

                                {filteredTypesList.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                        <GraduationCap className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {t('No training types found')}
                                        </p>
                                    </div>
                                ) : (
                                    filteredTypesList.map((type) => {
                                        const isSelected = type.id.toString() === selectedTrainingTypeId;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => handleSelectTrainingType(type.id.toString())}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 border text-start group ${
                                                    isSelected
                                                        ? 'bg-primary/5 text-primary border-primary/10 dark:bg-primary/10 dark:text-primary dark:border-primary/20'
                                                        : 'bg-transparent text-gray-700 border-transparent hover:bg-gray-50/50 dark:text-gray-300 dark:hover:bg-zinc-800/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <GraduationCap className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                                                        isSelected ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                                    }`} />
                                                    <span className="font-semibold text-sm truncate">{type.name}</span>
                                                </div>
                                                <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-semibold rounded-full border transition-colors ${
                                                    isSelected
                                                        ? 'bg-primary text-white border-primary/20'
                                                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700'
                                                }`}>
                                                    {getTrainingCountForType(type.id)}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Column 3: Trainings */}
                <div className="xl:col-span-6">
                    {selectedTrainingTypeId === '_none_' ? (
                        <Card className="h-auto xl:h-[calc(100vh-170px)] xl:min-h-[620px] flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-300 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-900/10 shadow-sm">
                            <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800/50 mb-4">
                                <GraduationCap className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-1">{t('Select Training Type')}</h4>
                            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[200px] mx-auto">
                                {t('Please select a training type to load the training lists.')}
                            </p>
                        </Card>
                    ) : (
                        <Card className="h-auto xl:h-[calc(100vh-170px)] xl:min-h-[620px] flex flex-col overflow-hidden shadow-sm border border-gray-300 dark:border-zinc-800 animate-in fade-in-50 slide-in-from-right duration-500">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                                <div className="flex items-center gap-2 min-w-0 font-bold text-gray-900 dark:text-gray-100">
                                    <span className="truncate">
                                        {t('Trainings')} {activeDept && activeBranch ? `(${activeDept.department_name} - ${activeBranch.branch_name})` : ''}
                                    </span>
                                    <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs font-semibold rounded-full border border-primary/20 flex-shrink-0">
                                        {trainings.total !== undefined ? trainings.total : trainings.data.length}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                                <div className="flex-1 min-w-0">
                                    <SearchInput
                                        value={filters.title}
                                        onChange={(value) => setFilters({...filters, title: value})}
                                        onSearch={handleFilter}
                                        placeholder={t('Search trainings...')}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <PerPageSelector
                                        routeName="training.trainings.index"
                                        filters={{...filters, training_type_id: selectedTrainingTypeId}}
                                    />
                                </div>
                            </div>

                            {/* Status Tabs */}
                            <div className="px-4 py-0 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex-shrink-0">
                                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                                    {[
                                        { key: 'all',       label: t('All'),       icon: LayoutGrid,   count: stats.total },
                                        { key: 'scheduled', label: t('Scheduled'), icon: Calendar,     count: stats.scheduled },
                                        { key: 'ongoing',   label: t('Ongoing'),   icon: Play,         count: stats.ongoing },
                                        { key: 'completed', label: t('Completed'), icon: CheckCircle2, count: stats.completed },
                                        { key: 'cancelled', label: t('Cancelled'), icon: AlertCircle,  count: stats.cancelled },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => handleStatusTabChange(tab.key)}
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
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                                {displayedTrainings.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                        <GraduationCap className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {t('No trainings found')}
                                        </p>
                                    </div>
                                ) : (
                                    displayedTrainings.map((training) => (
                                        <Card key={training.id} className="overflow-hidden border border-gray-400 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-200">
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">
                                                            {training.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                                                                {training.trainingType?.name || trainingTypes.find(type => type.id === training.training_type_id)?.name || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                        statusColors[training.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20'
                                                    }`}>
                                                        {t(training.status.charAt(0).toUpperCase() + training.status.slice(1))}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-gray-300 dark:border-zinc-700 text-xs">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="truncate">
                                                            <strong className="text-gray-700 dark:text-gray-300 font-semibold">{t('Trainer')}:</strong> {training.trainer?.name || '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="truncate">
                                                            {formatDate(training.start_date)} - {formatDate(training.end_date)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="truncate">{training.location || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>
                                                            <strong className="text-gray-700 dark:text-gray-300 font-semibold">{t('Max')}:</strong> {training.max_participants || '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 col-span-2">
                                                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>
                                                            <strong className="text-gray-700 dark:text-gray-300 font-semibold">{t('Cost')}:</strong> {training.cost !== undefined ? `${training.cost}` : '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-1.5 pt-3 border-t border-gray-300 dark:border-zinc-700">
                                                    <TooltipProvider>
                                                        {auth.user?.permissions?.includes('manage-training-tasks') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        onClick={() => router.visit(route('training.trainings.tasks.index', training.id))} 
                                                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                                    >
                                                                        <CheckSquare className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Tasks')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('edit-trainings') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        onClick={() => openModal('edit', training)} 
                                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Edit')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('delete-trainings') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openDeleteDialog(training.id)}
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20"
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
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>

                            <div className="px-4 py-2.5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/30 flex-shrink-0">
                                <Pagination
                                    data={trainings}
                                    routeName="training.trainings.index"
                                    filters={{...filters, training_type_id: selectedTrainingTypeId, per_page: perPage}}
                                />
                            </div>
                        </Card>
                    )}
                </div>

            </div>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} trainingTypes={trainingTypes} trainers={trainers} branches={branches} departments={departments} users={users} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditTraining
                        data={modalState.data}
                        training={modalState.data}
                        onSuccess={closeModal}
                        trainingTypes={trainingTypes}
                        trainers={trainers}
                        branches={branches}
                        departments={departments}
                        users={users}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Training List')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}