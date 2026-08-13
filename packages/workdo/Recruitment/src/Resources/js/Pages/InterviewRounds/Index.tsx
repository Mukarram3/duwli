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
import { Edit as EditIcon, Trash2, MessageCircle as MessageCircleIcon, Search, X, ChevronDown, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import { FilterButton } from '@/components/ui/filter-button';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Dialog } from "@/components/ui/dialog";
import NoRecordsFound from '@/components/no-records-found';
import View from './View';
import { InterviewRound, InterviewRoundsIndexProps, InterviewRoundFilters } from './types';

export default function Index() {
    const { t } = useTranslation();
    const { interviewrounds, auth, jobpostings } = usePage<InterviewRoundsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<InterviewRoundFilters>({
        name: urlParams.get('name') || '',
        description: urlParams.get('description') || '',
        job_id: urlParams.get('job_id') || 'all',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [editingItem, setEditingItem] = useState<InterviewRound | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [viewingItem, setViewingItem] = useState<InterviewRound | null>(null);

    const isCreateMode = !editingItem;

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.interview-rounds.destroy',
        defaultMessage: t('Are you sure you want to delete this interview round?')
    });

    // Create form
    const createForm = useForm({
        name: '',
        sequence_number: '',
        description: '',
        status: '0',
        job_id: '',
    });

    // Edit form
    const editForm = useForm({
        name: '',
        sequence_number: '',
        description: '',
        status: '0',
        job_id: '',
    });

    const handleFilter = () => {
        router.get(route('recruitment.interview-rounds.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('recruitment.interview-rounds.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', description: '', job_id: 'all', status: '' });
        router.get(route('recruitment.interview-rounds.index'), { per_page: perPage, sort: sortField, direction: sortDirection });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('recruitment.interview-rounds.store'), {
            onSuccess: () => createForm.reset()
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('recruitment.interview-rounds.update', editingItem.id), {
            onSuccess: () => setEditingItem(null)
        });
    };

    const startEdit = (item: InterviewRound) => {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            sequence_number: item.sequence_number?.toString() || '',
            description: item.description || '',
            status: item.status?.toString() || '0',
            job_id: (item as any).job_id?.toString() || '',
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        editForm.reset();
    };

    // TruncatedDescription — same as TrainingTypes pattern
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
            header: t('Interview Round'),
            sortable: true,
            className: 'w-full max-w-0',
            render: (_: any, item: InterviewRound) => (
                <div className="flex items-start gap-3 w-full overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageCircleIcon className="h-5 w-5 text-primary" />
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
            key: 'job_posting.title',
            header: t('Job'),
            sortable: true,
            render: (_: any, row: any) => (
                <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 whitespace-nowrap">
                    {row.job_posting?.title || '-'}
                </span>
            )
        },
        {
            key: 'sequence_number',
            header: t('Sequence'),
            sortable: true,
            render: (value: number) => (
                <span className="inline-flex px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            className: 'text-center',
            render: (value: any) => (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                    value === '0' || value === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {value === '0' || value === 0 ? t('Active') : t('Inactive')}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-interview-rounds', 'edit-interview-rounds', 'delete-interview-rounds'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-right',
            render: (_: any, item: InterviewRound) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-interview-rounds') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-interview-rounds') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(item.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
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
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Interview Rounds') }
            ]}
            pageTitle={t('Interview Rounds')}
        >
            <Head title={t('Interview Rounds')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Create/Edit Form */}
                <div className="lg:col-span-4">
                    <Card className="shadow-sm sticky top-6">
                        <CardContent className="p-6">
                            {isCreateMode ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Add New Interview Round')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new interview round')}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Edit Interview Round')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Update the interview round details below')}</p>
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
                                        placeholder={t('Enter interview round name')}
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
                                        placeholder={t('Brief description of the interview round')}
                                        rows={3}
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.description : editForm.errors.description} />
                                </div>

                                {/* Job */}
                                <div>
                                    <Label htmlFor="job_id">{t('Job')}</Label>
                                    <div className="mt-1">
                                        <Select
                                            value={isCreateMode ? createForm.data.job_id : editForm.data.job_id}
                                            onValueChange={(value) => isCreateMode ? createForm.setData('job_id', value) : editForm.setData('job_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select job')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {jobpostings?.map((job: any) => (
                                                    <SelectItem key={job.id} value={job.id.toString()}>
                                                        {job.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.job_id : editForm.errors.job_id} />
                                </div>

                                {/* Sequence Number */}
                                <div>
                                    <Label htmlFor="sequence_number">{t('Sequence Number')}</Label>
                                    <Input
                                        id="sequence_number"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={isCreateMode ? createForm.data.sequence_number : editForm.data.sequence_number}
                                        onChange={(e) => isCreateMode ? createForm.setData('sequence_number', e.target.value) : editForm.setData('sequence_number', e.target.value)}
                                        placeholder={t('Enter sequence number')}
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.sequence_number : editForm.errors.sequence_number} />
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
                                                <SelectItem value="0">{t('Active')}</SelectItem>
                                                <SelectItem value="1">{t('Inactive')}</SelectItem>
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
                                            ? (createForm.processing ? t('Creating...') : t('Add Interview Round'))
                                            : (editForm.processing ? t('Updating...') : t('Update Interview Round'))
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
                                            placeholder={t('Search interview rounds...')}
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
                                        routeName="recruitment.interview-rounds.index"
                                        filters={{ ...filters, sort: sortField, direction: sortDirection }}
                                    />
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {(() => {
                                            const activeFilters = [filters.job_id !== 'all' ? filters.job_id : '', filters.status].filter(Boolean).length;
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Job')}</label>
                                        <Select value={filters.job_id} onValueChange={(value) => setFilters({ ...filters, job_id: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Job')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Job')}</SelectItem>
                                                {jobpostings?.map((job: any) => (
                                                    <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Filter by Status')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">{t('Active')}</SelectItem>
                                                <SelectItem value="1">{t('Inactive')}</SelectItem>
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

                    {/* Interview Rounds List */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <div className="min-w-[500px] table-fixed w-full">
                                    <DataTable
                                        data={interviewrounds?.data || []}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="shadow-none border-0"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={MessageCircleIcon}
                                                title={t('No Interview Rounds found')}
                                                description={t('Get started by creating your first Interview Round.')}
                                                hasFilters={!!(filters.name || filters.description || (filters.job_id !== 'all' && filters.job_id) || filters.status)}
                                                onClearFilters={clearFilters}
                                                createPermission="create-interview-rounds"
                                                onCreateClick={() => {}}
                                                createButtonText={t('Create Interview Round')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {interviewrounds?.data?.length > 0 && (
                            <CardContent className="px-6 py-3 border-t bg-gray-50/30">
                                <Pagination
                                    data={interviewrounds || { data: [], links: [], meta: {} }}
                                    routeName="recruitment.interview-rounds.index"
                                    filters={{ ...filters, per_page: perPage, sort: sortField, direction: sortDirection }}
                                />
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            {/* View Dialog — preserved from original */}
            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View interviewround={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Interview Round')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
