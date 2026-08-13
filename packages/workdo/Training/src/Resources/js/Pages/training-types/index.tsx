import { useState } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit as EditIcon, Trash2, GraduationCap, Search, X, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import { FilterButton } from '@/components/ui/filter-button';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import NoRecordsFound from '@/components/no-records-found';
import { TrainingType, Branch, Department, TrainingTypesIndexProps } from './types';

interface TrainingTypeFilters {
    name: string;
    branch_id: string;
    department_id: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { trainingTypes, branches, departments, auth } = usePage<TrainingTypesIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<TrainingTypeFilters>({
        name: urlParams.get('name') || '',
        branch_id: urlParams.get('branch_id') || '',
        department_id: urlParams.get('department_id') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [editingItem, setEditingItem] = useState<TrainingType | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filtered departments for filter panel
    const filteredDepartments = filters.branch_id
        ? departments.filter((dept: Department) => dept.branch_id.toString() === filters.branch_id)
        : departments;

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'training.training-types.destroy',
        defaultMessage: t('Are you sure you want to delete this training type?')
    });

    // Create form
    const createForm = useForm({
        name: '',
        description: '',
        branch_id: '',
        department_id: '',
    });

    // Edit form
    const editForm = useForm({
        name: '',
        description: '',
        branch_id: '',
        department_id: '',
    });

    // Departments filtered by selected branch in form
    const createFormDepts = createForm.data.branch_id
        ? departments.filter((d: Department) => d.branch_id.toString() === createForm.data.branch_id)
        : departments;

    const editFormDepts = editForm.data.branch_id
        ? departments.filter((d: Department) => d.branch_id.toString() === editForm.data.branch_id)
        : departments;

    const isCreateMode = !editingItem;

    const handleFilter = () => {
        router.get(route('training.training-types.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('training.training-types.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', branch_id: '', department_id: '' });
        router.get(route('training.training-types.index'), { per_page: perPage, sort: sortField, direction: sortDirection });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('training.training-types.store'), {
            onSuccess: () => createForm.reset()
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('training.training-types.update', editingItem.id), {
            onSuccess: () => setEditingItem(null)
        });
    };

    const startEdit = (item: TrainingType) => {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            description: item.description || '',
            branch_id: item.branch_id?.toString() || '',
            department_id: (item as any).department_id?.toString() || '',
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        editForm.reset();
    };

    // TruncatedDescription — exact same as ReviewCycles
    const TruncatedDescription = ({ description, maxLength = 200 }: { description: string; maxLength?: number }) => {
        const [expanded, setExpanded] = useState(false);
        if (!description || description === '-') return <p className="text-xs text-gray-500">-</p>;
        const shouldTruncate = description.length > maxLength;
        const displayText = expanded || !shouldTruncate ? description : description.substring(0, maxLength) + '...';
        return (
            <div>
                <p className={`text-xs text-gray-500 ${!expanded && shouldTruncate ? 'line-clamp-2' : ''}`}>{displayText}</p>
                {shouldTruncate && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="text-xs text-blue-500 hover:text-blue-600 mt-0.5 flex items-center gap-0.5"
                    >
                        {expanded ? (
                            <>{t('Show less')} <ChevronDown className="h-3 w-3 rotate-180" /></>
                        ) : (
                            <>{t('Show more')} <ChevronDown className="h-3 w-3" /></>
                        )}
                    </button>
                )}
            </div>
        );
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Training Type'),
            sortable: true,
            className: 'w-full max-w-0',
            render: (_: any, item: TrainingType) => (
                <div className="flex items-start gap-3 w-full overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                        {item.description && (
                            <TruncatedDescription description={item.description} />
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'branch',
            header: t('Branch'),
            render: (_: any, item: TrainingType) => (
                <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 whitespace-nowrap">
                    {(item as any).branch?.branch_name || '-'}
                </span>
            )
        },
        {
            key: 'department',
            header: t('Department'),
            render: (_: any, item: TrainingType) => (
                <span className="text-sm text-gray-700">
                    {(item as any).department?.department_name || '-'}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-training-types', 'delete-training-types'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-right',
            render: (_: any, item: TrainingType) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-training-types') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEdit(item)}
                                        className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-training-types') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(item.id)}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
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
                { label: t('Training') },
                { label: t('Training Types') }
            ]}
            pageTitle={t('Training Types')}
        >
            <Head title={t('Training Types')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Create/Edit Form */}
                <div className="lg:col-span-4">
                    <Card className="shadow-sm sticky top-6">
                        <CardContent className="p-6">
                            {isCreateMode ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Add New Training Type')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new training type')}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Edit Training Type')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Update the training type details below')}</p>
                                </>
                            )}

                            <form onSubmit={isCreateMode ? handleCreate : handleUpdate} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <Label htmlFor="name">{t('Name')}</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={isCreateMode ? createForm.data.name : editForm.data.name}
                                        onChange={(e) => isCreateMode ? createForm.setData('name', e.target.value) : editForm.setData('name', e.target.value)}
                                        placeholder={t('Enter training type name')}
                                        required
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.name : editForm.errors.name} />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description">{t('Description')}</Label>
                                    <Textarea
                                        id="description"
                                        value={isCreateMode ? createForm.data.description : editForm.data.description}
                                        onChange={(e) => isCreateMode ? createForm.setData('description', e.target.value) : editForm.setData('description', e.target.value)}
                                        placeholder={t('Brief description of the training type')}
                                        rows={3}
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.description : editForm.errors.description} />
                                </div>

                                {/* Branch */}
                                <div>
                                    <Label htmlFor="branch_id">{t('Branch')}</Label>
                                    <div className="mt-1">
                                        <Select
                                            value={isCreateMode ? createForm.data.branch_id : editForm.data.branch_id}
                                            onValueChange={(value) => {
                                                if (isCreateMode) {
                                                    createForm.setData('branch_id', value);
                                                    createForm.setData('department_id', '');
                                                } else {
                                                    editForm.setData('branch_id', value);
                                                    editForm.setData('department_id', '');
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select branch')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch: Branch) => (
                                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                                        {branch.branch_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.branch_id : editForm.errors.branch_id} />
                                </div>

                                {/* Department */}
                                <div>
                                    <Label htmlFor="department_id">{t('Department')}</Label>
                                    <div className="mt-1">
                                        <Select
                                            value={isCreateMode ? createForm.data.department_id : editForm.data.department_id}
                                            onValueChange={(value) => isCreateMode ? createForm.setData('department_id', value) : editForm.setData('department_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select department')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(isCreateMode ? createFormDepts : editFormDepts).map((dept: Department) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.department_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.department_id : editForm.errors.department_id} />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreateMode ? createForm.processing : editForm.processing}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isCreateMode
                                            ? (createForm.processing ? t('Creating...') : t('Add Training Type'))
                                            : (editForm.processing ? t('Updating...') : t('Update Training Type'))
                                        }
                                    </Button>
                                    {!isCreateMode && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            {t('Cancel')}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - List View */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Search & Controls Header */}
                    <Card className="shadow-sm">
                        <CardContent className="p-6 border-b bg-gray-50/50">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t('Search training types...')}
                                            value={filters.name}
                                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button onClick={handleFilter} size="sm">{t('Search')}</Button>
                                    {filters.name && (
                                        <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                                            <X className="h-4 w-4" />
                                            {t('Reset')}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <PerPageSelector
                                        routeName="training.training-types.index"
                                        filters={{ ...filters, sort: sortField, direction: sortDirection }}
                                    />
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {(() => {
                                            const activeFilters = [filters.branch_id, filters.department_id].filter(Boolean).length;
                                            return activeFilters > 0 ? (
                                                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                    {activeFilters}
                                                </span>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <CardContent className="p-6 bg-blue-50/30 border-b">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Branch')}</label>
                                        <Select value={filters.branch_id || 'all'} onValueChange={(value) => setFilters({ ...filters, branch_id: value === 'all' ? '' : value, department_id: '' })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Branches')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Branches')}</SelectItem>
                                                {branches.map((branch: Branch) => (
                                                    <SelectItem key={branch.id} value={branch.id.toString()}>{branch.branch_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Department')}</label>
                                        <Select value={filters.department_id || 'all'} onValueChange={(value) => setFilters({ ...filters, department_id: value === 'all' ? '' : value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Departments')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Departments')}</SelectItem>
                                                {filteredDepartments.map((dept: Department) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.department_name}</SelectItem>
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
                    </Card>

                    {/* Training Types List */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <div className="min-w-[500px] table-fixed w-full">
                                    <DataTable
                                        data={trainingTypes?.data || []}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="shadow-none border-0"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={GraduationCap}
                                                title={t('No Training Types found')}
                                                description={t('Get started by creating your first Training Type.')}
                                                hasFilters={!!(filters.name || filters.branch_id || filters.department_id)}
                                                onClearFilters={clearFilters}
                                                createPermission="create-training-types"
                                                onCreateClick={() => {}}
                                                createButtonText={t('Create Training Type')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {trainingTypes?.data?.length > 0 && (
                            <CardContent className="px-6 py-3 border-t bg-gray-50/30">
                                <Pagination
                                    data={trainingTypes || { data: [], links: [], meta: {} }}
                                    routeName="training.training-types.index"
                                    filters={{ ...filters, per_page: perPage, sort: sortField, direction: sortDirection }}
                                />
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Training Type')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
