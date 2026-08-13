import { useState } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit as EditIcon, Trash2, RefreshCw, Search, X, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import { FilterButton } from '@/components/ui/filter-button';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import NoRecordsFound from '@/components/no-records-found';

interface ReviewCycle {
    id: number;
    name: string;
    frequency: string;
    description: string;
    status: string;
    created_at: string;
}

interface ReviewCycleFilters {
    name: string;
    frequency: string;
    status: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { reviewCycles, auth } = usePage<{ reviewCycles: any; auth: any }>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ReviewCycleFilters>({
        name: urlParams.get('name') || '',
        frequency: urlParams.get('frequency') || '',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [editingItem, setEditingItem] = useState<ReviewCycle | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'performance.review-cycles.destroy',
        defaultMessage: t('Are you sure you want to delete this review cycle?')
    });

    // Create form
    const createForm = useForm({
        name: '',
        frequency: 'annual',
        description: '',
        status: 'active',
    });

    // Edit form
    const editForm = useForm({
        name: editingItem?.name ?? '',
        frequency: editingItem?.frequency ?? 'annual',
        description: editingItem?.description ?? '',
        status: editingItem?.status ?? 'active',
    });

    const handleFilter = () => {
        router.get(route('performance.review-cycles.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('performance.review-cycles.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', frequency: '', status: '' });
        router.get(route('performance.review-cycles.index'), { per_page: perPage, sort: sortField, direction: sortDirection });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('performance.review-cycles.store'), {
            onSuccess: () => createForm.reset()
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('performance.review-cycles.update', editingItem.id), {
            onSuccess: () => setEditingItem(null)
        });
    };

    const startEdit = (item: ReviewCycle) => {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            frequency: item.frequency,
            description: item.description || '',
            status: item.status,
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        editForm.reset();
    };

    const isCreateMode = !editingItem;

    // Component for review cycle action buttons
    const ReviewCycleActionButtons = ({ reviewCycle }: { reviewCycle: ReviewCycle }) => {
        const actionButtons = usePageButtons('reviewCycleActionButtons', { review_cycle_id: reviewCycle.id, auth });
        return (
            <>
                {actionButtons.map((button) => (
                    <div key={button.id}>{button.component}</div>
                ))}
            </>
        );
    };

    // TruncatedDescription — exactly same as LeaveTypes
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

    const getFrequencyLabel = (frequency: string) => {
        const labels: { [key: string]: string } = {
            monthly: t('Monthly'),
            quarterly: t('Quarterly'),
            'semi-annual': t('Semi-Annual'),
            annual: t('Annual')
        };
        return labels[frequency] || frequency;
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Review Cycle'),
            sortable: true,
            className: 'w-full max-w-0',
            render: (_: any, item: ReviewCycle) => (
                <div className="flex items-start gap-3 w-full overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <RefreshCw className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                        <TruncatedDescription description={item.description || '-'} />
                    </div>
                </div>
            )
        },
        {
            key: 'frequency',
            header: t('Frequency'),
            sortable: true,
            className: 'text-center',
            render: (value: string) => (
                <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    {getFrequencyLabel(value)}
                </span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            className: 'text-center',
            render: (value: string) => (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                    value === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {value === 'active' ? t('Active') : t('Inactive')}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-review-cycles', 'delete-review-cycles'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-right',
            render: (_: any, item: ReviewCycle) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        <ReviewCycleActionButtons reviewCycle={item} />
                        {auth.user?.permissions?.includes('edit-review-cycles') && (
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
                        {auth.user?.permissions?.includes('delete-review-cycles') && (
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
                { label: t('Performance') },
                { label: t('Review Cycles') }
            ]}
            pageTitle={t('Review Cycles')}
        >
            <Head title={t('Review Cycles')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Create/Edit Form */}
                <div className="lg:col-span-4">
                    <Card className="shadow-sm sticky top-6">
                        <CardContent className="p-6">
                            {isCreateMode ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Add New Review Cycle')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new review cycle')}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Edit Review Cycle')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Update the review cycle details below')}</p>
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
                                        placeholder={t('Enter review cycle name')}
                                        required
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.name : editForm.errors.name} />
                                </div>

                                {/* Frequency */}
                                <div>
                                    <Label htmlFor="frequency">{t('Frequency')}</Label>
                                    <div className="mt-1">
                                        <Select
                                            value={isCreateMode ? createForm.data.frequency : editForm.data.frequency}
                                            onValueChange={(value) => isCreateMode ? createForm.setData('frequency', value) : editForm.setData('frequency', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select frequency')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">{t('Monthly')}</SelectItem>
                                                <SelectItem value="quarterly">{t('Quarterly')}</SelectItem>
                                                <SelectItem value="semi-annual">{t('Semi-Annual')}</SelectItem>
                                                <SelectItem value="annual">{t('Annual')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.frequency : editForm.errors.frequency} />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description">{t('Description')}</Label>
                                    <Textarea
                                        id="description"
                                        value={isCreateMode ? createForm.data.description : editForm.data.description}
                                        onChange={(e) => isCreateMode ? createForm.setData('description', e.target.value) : editForm.setData('description', e.target.value)}
                                        placeholder={t('Brief description of the review cycle')}
                                        rows={3}
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.description : editForm.errors.description} />
                                </div>

                                {/* Status */}
                                <div>
                                    <Label htmlFor="status">{t('Status')}</Label>
                                    <div className="mt-1">
                                        <Select
                                            value={isCreateMode ? createForm.data.status : editForm.data.status}
                                            onValueChange={(value) => isCreateMode ? createForm.setData('status', value) : editForm.setData('status', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select status')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">{t('Active')}</SelectItem>
                                                <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.status : editForm.errors.status} />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreateMode ? createForm.processing : editForm.processing}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isCreateMode
                                            ? (createForm.processing ? t('Creating...') : t('Add Review Cycle'))
                                            : (editForm.processing ? t('Updating...') : t('Update Review Cycle'))
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
                                            placeholder={t('Search review cycles...')}
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
                                        routeName="performance.review-cycles.index"
                                        filters={{ ...filters, sort: sortField, direction: sortDirection }}
                                    />
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {(() => {
                                            const activeFilters = [filters.frequency, filters.status].filter(Boolean).length;
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Frequency')}</label>
                                        <Select value={filters.frequency || 'all'} onValueChange={(value) => setFilters({ ...filters, frequency: value === 'all' ? '' : value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Frequencies')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Frequencies')}</SelectItem>
                                                <SelectItem value="monthly">{t('Monthly')}</SelectItem>
                                                <SelectItem value="quarterly">{t('Quarterly')}</SelectItem>
                                                <SelectItem value="semi-annual">{t('Semi-Annual')}</SelectItem>
                                                <SelectItem value="annual">{t('Annual')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                        <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Status')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Status')}</SelectItem>
                                                <SelectItem value="active">{t('Active')}</SelectItem>
                                                <SelectItem value="inactive">{t('Inactive')}</SelectItem>
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

                    {/* Review Cycles List */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <div className="min-w-[500px] table-fixed w-full">
                                    <DataTable
                                        data={reviewCycles?.data || []}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="shadow-none border-0"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={RefreshCw}
                                                title={t('No Review Cycles found')}
                                                description={t('Get started by creating your first Review Cycle.')}
                                                hasFilters={!!(filters.name || filters.frequency || filters.status)}
                                                onClearFilters={clearFilters}
                                                createPermission="create-review-cycles"
                                                onCreateClick={() => {}}
                                                createButtonText={t('Create Review Cycle')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {reviewCycles?.data?.length > 0 && (
                            <CardContent className="px-6 py-3 border-t bg-gray-50/30">
                                <Pagination
                                    data={reviewCycles || { data: [], links: [], meta: {} }}
                                    routeName="performance.review-cycles.index"
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
                title={t('Delete Review Cycle')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
