import { useState, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@inertiajs/react';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Plus, Edit as EditIcon, Trash2, Calendar as CalendarIcon,
    Search, X, Lock, ChevronDown
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { FilterButton } from '@/components/ui/filter-button';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import NoRecordsFound from '@/components/no-records-found';
import { LeaveType, LeaveTypesIndexProps, LeaveTypeFilters } from './types';

export default function Index() {
    const { t } = useTranslation();
    const { leavetypes, auth } = usePage<LeaveTypesIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<LeaveTypeFilters>({
        name: urlParams.get('name') || '',
        is_paid: urlParams.get('is_paid') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    // Edit mode state
    const [editingItem, setEditingItem] = useState<LeaveType | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.leave-types.destroy',
        defaultMessage: t('Are you sure you want to delete this leave type?')
    });

    // Create form
    const createForm = useForm({
        name: '',
        description: '',
        max_days_per_year: '',
        is_paid: false,
        color: '#10b77f',
    });

    // Edit form
    const editForm = useForm({
        name: editingItem?.name ?? '',
        description: editingItem?.description ?? '',
        max_days_per_year: editingItem?.max_days_per_year ?? '',
        is_paid: editingItem?.is_paid ?? false,
        color: editingItem?.color ?? '#10b77f',
    });

    const handleFilter = () => {
        router.get(route('hrm.leave-types.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.leave-types.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', is_paid: '' });
        router.get(route('hrm.leave-types.index'), { per_page: perPage, sort: sortField, direction: sortDirection });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('hrm.leave-types.store'), {
            onSuccess: () => {
                createForm.reset();
            }
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('hrm.leave-types.update', editingItem.id), {
            onSuccess: () => {
                setEditingItem(null);
            }
        });
    };

    const startEdit = (item: LeaveType) => {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            description: item.description || '',
            max_days_per_year: item.max_days_per_year?.toString() || '',
            is_paid: item.is_paid,
            color: item.color || '#10b77f',
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        editForm.reset();
    };

    const isCreateMode = !editingItem;

    // Component for truncated description with show more/less
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
            header: t('Leave Type'),
            sortable: true,
            className: 'w-full max-w-0',
            render: (_: any, item: LeaveType) => (
                <div className="flex items-start gap-3 w-full overflow-hidden">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: item.color || '#10b77f' }}
                    >
                        <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                        <TruncatedDescription description={item.description || '-'} />
                    </div>
                </div>
            )
        },
        {
            key: 'max_days_per_year',
            header: t('Days/Year'),
            sortable: true,
            className: 'text-center',
            render: (value: number) => (
                <span className="font-semibold text-sm">{value || 0} {t('Days')}</span>
            )
        },
        {
            key: 'is_paid',
            header: t('Payment Type'),
            sortable: true,
            className: 'text-center',
            render: (value: boolean) => (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs ${value
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                    {value ? t('Paid') : t('Unpaid')}
                </span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            className: 'text-center',
            render: () => (
                <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    {t('Active')}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-leave-types', 'delete-leave-types'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-right',
            render: (_: any, item: LeaveType) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-leave-types') && (
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
                        {auth.user?.permissions?.includes('delete-leave-types') && (
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
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Leave Types') }
            ]}
            pageTitle={t('Leave Types')}
        >
            <Head title={t('Leave Types')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Create/Edit Form */}
                <div className="lg:col-span-4">
                    <Card className="shadow-sm sticky top-6">
                        <CardContent className="p-6">
                            {isCreateMode ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Add New Leave Type')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new leave type')}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Edit Leave Type')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Update the leave type details below')}</p>
                                </>
                            )}

                            <form onSubmit={isCreateMode ? handleCreate : handleUpdate} className="space-y-4">
                                {/* Leave Type Name */}
                                <div>
                                    <Label htmlFor="name">{t('Leave Type Name')}</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={isCreateMode ? createForm.data.name : editForm.data.name}
                                        onChange={(e) => isCreateMode ? createForm.setData('name', e.target.value) : editForm.setData('name', e.target.value)}
                                        placeholder={t('e.g., Casual Leave, Sick Leave')}
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
                                        placeholder={t('Brief description of the leave policies')}
                                        rows={3}
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.description : editForm.errors.description} />
                                </div>

                                {/* Max Days / Year & Color */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="max_days_per_year">{t('Max Days / Year')}</Label>
                                        <Input
                                            id="max_days_per_year"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={isCreateMode ? createForm.data.max_days_per_year : editForm.data.max_days_per_year}
                                            onChange={(e) => isCreateMode ? createForm.setData('max_days_per_year', e.target.value) : editForm.setData('max_days_per_year', e.target.value)}
                                            placeholder="0"
                                            required
                                            className="mt-1"
                                        />
                                        <InputError message={isCreateMode ? createForm.errors.max_days_per_year : editForm.errors.max_days_per_year} />
                                    </div>
                                    <div>
                                        <Label htmlFor="color">{t('Color')}</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="color"
                                                type="color"
                                                value={isCreateMode ? createForm.data.color : editForm.data.color}
                                                onChange={(e) => isCreateMode ? createForm.setData('color', e.target.value) : editForm.setData('color', e.target.value)}
                                                className="w-12 h-10 p-1"
                                            />
                                            <Input
                                                type="text"
                                                value={isCreateMode ? createForm.data.color : editForm.data.color}
                                                onChange={(e) => isCreateMode ? createForm.setData('color', e.target.value) : editForm.setData('color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                        <InputError message={isCreateMode ? createForm.errors.color : editForm.errors.color} />
                                    </div>
                                </div>

                                {/* Paid Leave Toggle */}
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{t('Paid Leave')}</p>
                                        <p className="text-xs text-gray-500">{t('Employees will receive salary for these days')}</p>
                                    </div>
                                    <Switch
                                        id="is_paid"
                                        checked={isCreateMode ? createForm.data.is_paid : editForm.data.is_paid}
                                        onCheckedChange={(checked) => isCreateMode ? createForm.setData('is_paid', !!checked) : editForm.setData('is_paid', !!checked)}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreateMode ? createForm.processing : editForm.processing}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isCreateMode
                                            ? (createForm.processing ? t('Creating...') : t('Add Leave Type'))
                                            : (editForm.processing ? t('Updating...') : t('Update Leave Type'))
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
                                            placeholder={t('Search leave types...')}
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
                                        routeName="hrm.leave-types.index"
                                        filters={{...filters, sort: sortField, direction: sortDirection}}
                                    />
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {(() => {
                                            const activeFilters = [filters.is_paid].filter(Boolean).length;
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Payment Type')}</label>
                                        <Select value={filters.is_paid || 'all'} onValueChange={(value) => setFilters({ ...filters, is_paid: value === 'all' ? '' : value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Statuses')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                                <SelectItem value="1">{t('Paid')}</SelectItem>
                                                <SelectItem value="0">{t('Unpaid')}</SelectItem>
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

                    {/* Leave Types List */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <div className="min-w-[800px] table-fixed w-full">
                                    <DataTable
                                        data={leavetypes?.data || []}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="shadow-none border-0"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={CalendarIcon}
                                                title={t('No Leave Types found')}
                                                description={t('Get started by creating your first Leave Type.')}
                                                hasFilters={!!(filters.name || filters.is_paid)}
                                                onClearFilters={clearFilters}
                                                createPermission="create-leave-types"
                                                onCreateClick={() => { }}
                                                createButtonText={t('Create Leave Type')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {leavetypes?.data?.length > 0 && (
                            <CardContent className="px-6 py-3 border-t bg-gray-50/30">
                                <Pagination
                                    data={leavetypes || { data: [], links: [], meta: {} }}
                                    routeName="hrm.leave-types.index"
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
                title={t('Delete Leave Type')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
