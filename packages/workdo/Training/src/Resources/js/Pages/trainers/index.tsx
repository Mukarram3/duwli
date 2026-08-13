import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Users, 
    Building, 
    Building2, 
    ChevronRight, 
    Search, 
    Mail, 
    Phone, 
    Briefcase, 
    MapPin, 
    Folder, 
    X 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import Create from './create';
import EditTrainer from './edit';
import NoRecordsFound from '@/components/no-records-found';
import { Trainer, TrainersIndexProps, TrainerFilters, TrainerModalState } from './types';

export default function Index() {
    const { t } = useTranslation();
    const { trainers, branches, departments, branch_counts, department_counts, auth } = usePage<TrainersIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<TrainerFilters>({
        name: urlParams.get('name') || '',
        branch_id: urlParams.get('branch_id') || '',
        department_id: urlParams.get('department_id') || ''
    });

    const [branchSearch, setBranchSearch] = useState('');
    const [showBranchSearch, setShowBranchSearch] = useState(false);
    const [deptSearch, setDeptSearch] = useState('');
    const [showDeptSearch, setShowDeptSearch] = useState(false);

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<TrainerModalState>({
        isOpen: true,
        mode: '',
        data: null
    });

    // Make sure we default to modal closed on initial render
    useEffect(() => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    }, []);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'training.trainers.destroy',
        defaultMessage: t('Are you sure you want to delete this trainer?')
    });

    // Initial load sync to ensure first branch & department are selected in URL
    useEffect(() => {
        const currentUrlParams = new URLSearchParams(window.location.search);
        const hasBranch = currentUrlParams.has('branch_id');
        const hasDept = currentUrlParams.has('department_id');
        if ((!hasBranch || !hasDept) && branches.length > 0) {
            const firstBranchId = branches[0].id.toString();
            const firstBranchDepts = departments.filter(d => d.branch_id.toString() === firstBranchId);
            const firstDeptId = firstBranchDepts[0]?.id.toString() || '';
            
            setFilters({
                name: currentUrlParams.get('name') || '',
                branch_id: firstBranchId,
                department_id: firstDeptId
            });

            router.get(route('training.trainers.index'), {
                name: currentUrlParams.get('name') || '',
                branch_id: firstBranchId,
                department_id: firstDeptId
            }, {
                replace: true,
                preserveScroll: true
            });
        } else {
            setFilters({
                name: currentUrlParams.get('name') || '',
                branch_id: currentUrlParams.get('branch_id') || '',
                department_id: currentUrlParams.get('department_id') || ''
            });
        }
    }, [window.location.search]);

    const handleFilter = () => {
        router.get(route('training.trainers.index'), {
            ...filters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSelectBranch = (branchId: string) => {
        const branchDepts = departments.filter(d => d.branch_id.toString() === branchId);
        const firstDeptId = branchDepts[0]?.id.toString() || '';

        setFilters(prev => ({
            ...prev,
            branch_id: branchId,
            department_id: firstDeptId
        }));

        router.get(route('training.trainers.index'), {
            ...filters,
            branch_id: branchId,
            department_id: firstDeptId,
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

        router.get(route('training.trainers.index'), {
            ...filters,
            branch_id: filters.branch_id,
            department_id: deptId,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', branch_id: filters.branch_id, department_id: filters.department_id });
        router.get(route('training.trainers.index'), {
            branch_id: filters.branch_id,
            department_id: filters.department_id,
            per_page: perPage
        });
    };

    const openModal = (mode: 'add' | 'edit', data: Trainer | null = null) => {
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

    const activeBranch = branches.find(b => b.id.toString() === filters.branch_id);
    const activeDept = departments.find(d => d.id.toString() === filters.department_id);

    const filteredBranches = branches.filter(b => 
        b.branch_name.toLowerCase().includes(branchSearch.toLowerCase())
    );

    const filteredDepts = departments
        .filter(d => d.branch_id.toString() === filters.branch_id)
        .filter(d => d.department_name.toLowerCase().includes(deptSearch.toLowerCase()));

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Training')}, {label: t('Trainers')}]}
            pageTitle={t('Manage Trainers')}
            pageDescription={t('View and manage trainers, branch, departments, and training schedules.')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('create-trainers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        onClick={() => openModal('add')}
                                        className="bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>{t('Add Trainer')}</span>
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
            <Head title={t('Trainers')} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                
                {/* Column 1: Branches */}
                <Card className="xl:col-span-3 h-auto xl:h-[calc(100vh-170px)] xl:min-h-[620px] flex flex-col overflow-hidden shadow-sm border border-gray-300 dark:border-zinc-800">
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
                        {filteredBranches.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                <Building className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {t('No branches found')}
                                </p>
                            </div>
                        ) : (
                            filteredBranches.map((branch) => {
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
                                            {branch_counts[branch.id] || 0}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Column 2: Departments */}
                <Card className="xl:col-span-3 h-auto xl:h-[calc(100vh-170px)] xl:min-h-[620px] flex flex-col overflow-hidden shadow-sm border border-gray-300 dark:border-zinc-800">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                {t('Departments')} {activeBranch ? `(${activeBranch.branch_name})` : ''}
                            </span>
                            <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs font-semibold rounded-full border border-primary/20 flex-shrink-0">
                                {filteredDepts.length}
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
                                    disabled={!filters.branch_id}
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
                        {filteredDepts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {filters.branch_id ? t('No departments found') : t('Select a branch first')}
                                </p>
                            </div>
                        ) : (
                            filteredDepts.map((dept) => {
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
                                            <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-semibold rounded-full border transition-colors ${
                                                isSelected
                                                    ? 'bg-primary text-white border-primary/20'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700'
                                            }`}>
                                                {department_counts[dept.id] || 0}
                                            </span>
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

                {/* Column 3: Trainers */}
                <Card className="xl:col-span-6 h-auto xl:h-[calc(100vh-170px)] xl:min-h-[620px] flex flex-col overflow-hidden shadow-sm border border-gray-300 dark:border-zinc-800">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                {t('Trainers')} {activeDept && activeBranch ? `(${activeDept.department_name} - ${activeBranch.branch_name})` : ''}
                            </span>
                             <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs font-semibold rounded-full border border-primary/20 flex-shrink-0">
                                {trainers.total !== undefined ? trainers.total : trainers.data.length}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                        <div className="flex-1 min-w-0">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({...filters, name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search trainers...')}
                            />
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <PerPageSelector
                                routeName="training.trainers.index"
                                filters={filters}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                        {trainers.data.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <NoRecordsFound
                                    icon={Users}
                                    title={t('No trainers found')}
                                    description={t('Get started by creating your first trainer.')}
                                    hasFilters={!!filters.name}
                                    onClearFilters={clearFilters}
                                    createPermission="create-trainers"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Trainer')}
                                    className="h-auto"
                                />
                            </div>
                        ) : (
                            trainers.data.map((trainer) => (
                                <div
                                    key={trainer.id}
                                    className="p-5 rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                                            <span className="font-bold text-lg text-gray-700 dark:text-gray-300">
                                                {trainer.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 truncate">
                                                {trainer.name}
                                            </h4>
                                            {trainer.email && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span>{trainer.email}</span>
                                                </p>
                                            )}
                                            {trainer.contact && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span>{trainer.contact}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-200 dark:border-zinc-800">
                                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{trainer.experience}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{trainer.branch?.branch_name || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Folder className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{trainer.department?.department_name || '-'}</span>
                                            </div>
                                        </div>

                                        {(auth.user?.permissions?.includes('edit-trainers') || auth.user?.permissions?.includes('delete-trainers')) && (
                                            <div className="flex gap-2">
                                                {auth.user?.permissions?.includes('edit-trainers') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openModal('edit', trainer)}
                                                        className="h-9 w-9 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {auth.user?.permissions?.includes('delete-trainers') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDeleteDialog(trainer.id)}
                                                        className="h-9 w-9 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/10 flex-shrink-0">
                        <Pagination
                            data={trainers}
                            routeName="training.trainers.index"
                            filters={{...filters, per_page: perPage}}
                        />
                    </div>
                </Card>
            </div>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} branches={branches} departments={departments} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditTrainer
                        data={modalState.data}
                        trainer={modalState.data}
                        onSuccess={closeModal}
                        branches={branches}
                        departments={departments}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Trainer')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}