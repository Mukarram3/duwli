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
import { Edit as EditIcon, Trash2, DollarSign, Search, X, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import { FilterButton } from '@/components/ui/filter-button';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DataTable } from '@/components/ui/data-table';
import NoRecordsFound from '@/components/no-records-found';
import { GoalContribution, ContributionsIndexProps, ContributionFilters } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { contributions, goals, auth } = usePage<ContributionsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ContributionFilters>({
        goal_name: urlParams.get('goal_name') || '',
        goal_id: urlParams.get('goal_id') || '',
        contribution_type: urlParams.get('contribution_type') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })(),
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [showFilters, setShowFilters] = useState(false);

    const [editingItem, setEditingItem] = useState<GoalContribution | null>(null);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'goal.contributions.destroy',
        defaultMessage: t('Are you sure you want to delete this contribution?')
    });

    // Create form
    const createForm = useForm({
        goal_id: goals.length > 0 ? goals[0].id : 0,
        contribution_date: new Date().toISOString().split('T')[0],
        contribution_amount: 0,
        contribution_type: 'manual',
        notes: '',
    });

    // Edit form
    const editForm = useForm({
        goal_id: editingItem?.goal_id ?? 0,
        contribution_date: editingItem?.contribution_date ?? '',
        contribution_amount: editingItem?.contribution_amount ?? 0,
        contribution_type: editingItem?.contribution_type ?? 'manual',
        notes: editingItem?.notes ?? '',
    });

    const handleFilter = () => {
        const filterParams = {...filters};
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('goal.contributions.index'), {...filterParams, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        const filterParams = {...filters};
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('goal.contributions.index'), {...filterParams, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ goal_name: '', goal_id: '', contribution_type: '', date_range: '' });
        router.get(route('goal.contributions.index'), { per_page: perPage });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('goal.contributions.store'), {
            onSuccess: () => createForm.reset()
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('goal.contributions.update', editingItem.id), {
            onSuccess: () => setEditingItem(null)
        });
    };

    const startEdit = (item: GoalContribution) => {
        setEditingItem(item);
        editForm.setData({
            goal_id: item.goal_id,
            contribution_date: item.contribution_date,
            contribution_amount: item.contribution_amount,
            contribution_type: item.contribution_type,
            notes: item.notes || '',
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        editForm.reset();
    };

    const isCreateMode = !editingItem;

    // TruncatedDescription component
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
            key: 'goal',
            header: t('Goal'),
            sortable: false,
            className: 'w-full max-w-0',
            render: (_: any, item: GoalContribution) => (
                <div className="flex items-start gap-3 w-full overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.goal?.goal_name || '-'}</p>
                        <TruncatedDescription description={item.notes || '-'} />
                    </div>
                </div>
            )
        },
        {
            key: 'contribution_date',
            header: t('Date'),
            sortable: true,
            className: 'w-[110px] text-center whitespace-nowrap',
            render: (value: string) => <span className="whitespace-nowrap">{formatDate(value)}</span>
        },
        {
            key: 'contribution_amount',
            header: t('Amount'),
            sortable: true,
            className: 'w-[110px] text-center whitespace-nowrap',
            render: (value: number) => (
                <span className="font-medium text-green-600 whitespace-nowrap">{formatCurrency(value)}</span>
            )
        },
        {
            key: 'contribution_type',
            header: t('Type'),
            sortable: true,
            className: 'w-[100px] text-center',
            render: (value: string) => {
                const badgeStyles: any = {
                    "manual": "bg-blue-50 text-blue-700 ring-blue-600/20",
                    "automatic": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
                    "journal_entry": "bg-purple-50 text-purple-700 ring-purple-600/20",
                };
                const style = badgeStyles[value] || "bg-slate-50 text-slate-700 ring-slate-600/20";
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
                        {t(value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1))}
                    </span>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-goal-contributions', 'delete-goal-contributions'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'w-[90px] text-right',
            render: (_: any, item: GoalContribution) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-goal-contributions') && (
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
                        {auth.user?.permissions?.includes('delete-goal-contributions') && (
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
                { label: t('Goal') },
                { label: t('Contributions') }
            ]}
            pageTitle={t('Manage Contributions')}
        >
            <Head title={t('Contributions')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Create/Edit Form */}
                <div className="lg:col-span-4">
                    <Card className="shadow-sm sticky top-6">
                        <CardContent className="p-6">
                            {isCreateMode ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Add New Contribution')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new contribution')}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Edit Contribution')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Update the contribution details below')}</p>
                                </>
                            )}

                            <form onSubmit={isCreateMode ? handleCreate : handleUpdate} className="space-y-4">
                                {/* Goal */}
                                <div>
                                    <Label htmlFor="goal_id">{t('Goal')}</Label>
                                    <div className="mt-1">
                                        <Select
                                            value={isCreateMode ? createForm.data.goal_id.toString() : editForm.data.goal_id.toString()}
                                            onValueChange={(value) => isCreateMode ? createForm.setData('goal_id', parseInt(value)) : editForm.setData('goal_id', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Goal')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {goals.map((goal) => (
                                                    <SelectItem key={goal.id} value={goal.id.toString()}>
                                                        {goal.goal_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.goal_id : editForm.errors.goal_id} />
                                </div>

                                {/* Date */}
                                <div>
                                    <Label htmlFor="contribution_date">{t('Date')}</Label>
                                    <div className="mt-1">
                                        <DatePicker
                                            value={isCreateMode ? createForm.data.contribution_date : editForm.data.contribution_date}
                                            onChange={(value) => isCreateMode ? createForm.setData('contribution_date', value) : editForm.setData('contribution_date', value)}
                                            placeholder={t('Select contribution date')}
                                        />
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.contribution_date : editForm.errors.contribution_date} />
                                </div>

                                {/* Amount */}
                                <div>
                                    <Label htmlFor="contribution_amount">{t('Amount')}</Label>
                                    <div className="mt-1">
                                        <CurrencyInput
                                            value={isCreateMode ? createForm.data.contribution_amount : editForm.data.contribution_amount}
                                            onChange={(value) => isCreateMode ? createForm.setData('contribution_amount', value) : editForm.setData('contribution_amount', value)}
                                            placeholder={t('Enter contribution amount')}
                                        />
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.contribution_amount : editForm.errors.contribution_amount} />
                                </div>

                                {/* Type */}
                                <div>
                                    <Label htmlFor="contribution_type">{t('Type')}</Label>
                                    <div className="mt-1">
                                        <Select
                                            value={isCreateMode ? createForm.data.contribution_type : editForm.data.contribution_type}
                                            onValueChange={(value) => isCreateMode ? createForm.setData('contribution_type', value) : editForm.setData('contribution_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manual">{t('Manual')}</SelectItem>
                                                <SelectItem value="automatic">{t('Automatic')}</SelectItem>
                                                <SelectItem value="journal_entry">{t('Journal Entry')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={isCreateMode ? createForm.errors.contribution_type : editForm.errors.contribution_type} />
                                </div>

                                {/* Notes */}
                                <div>
                                    <Label htmlFor="notes">{t('Notes')}</Label>
                                    <Textarea
                                        id="notes"
                                        value={isCreateMode ? createForm.data.notes : editForm.data.notes}
                                        onChange={(e) => isCreateMode ? createForm.setData('notes', e.target.value) : editForm.setData('notes', e.target.value)}
                                        placeholder={t('Enter notes...')}
                                        rows={3}
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.notes : editForm.errors.notes} />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreateMode ? createForm.processing : editForm.processing}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isCreateMode
                                            ? (createForm.processing ? t('Creating...') : t('Add Contribution'))
                                            : (editForm.processing ? t('Updating...') : t('Update Contribution'))
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
                                            placeholder={t('Search contributions...')}
                                            value={filters.goal_name}
                                            onChange={(e) => setFilters({ ...filters, goal_name: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button onClick={handleFilter} size="sm">{t('Search')}</Button>
                                    {filters.goal_name && (
                                        <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                                            <X className="h-4 w-4" />
                                            {t('Reset')}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <PerPageSelector
                                        routeName="goal.contributions.index"
                                        filters={{ ...filters, sort: sortField, direction: sortDirection }}
                                    />
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {(() => {
                                            const activeFilters = [filters.goal_id, filters.contribution_type, filters.date_range].filter(Boolean).length;
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Goal')}</label>
                                        <Select value={filters.goal_id || 'all'} onValueChange={(value) => setFilters({ ...filters, goal_id: value === 'all' ? '' : value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Goals')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Goals')}</SelectItem>
                                                {goals?.map((goal) => (
                                                    <SelectItem key={goal.id} value={goal.id.toString()}>
                                                        {goal.goal_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Type')}</label>
                                        <Select value={filters.contribution_type || 'all'} onValueChange={(value) => setFilters({ ...filters, contribution_type: value === 'all' ? '' : value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Types')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Types')}</SelectItem>
                                                <SelectItem value="manual">{t('Manual')}</SelectItem>
                                                <SelectItem value="automatic">{t('Automatic')}</SelectItem>
                                                <SelectItem value="journal_entry">{t('Journal Entry')}</SelectItem>
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

                    {/* Contributions List */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <div className="min-w-[500px] table-fixed w-full">
                                    <DataTable
                                        data={contributions?.data || []}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="shadow-none border-0"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={DollarSign}
                                                title={t('No Contributions found')}
                                                description={t('Get started by creating your first Contribution.')}
                                                hasFilters={!!(filters.goal_name || filters.goal_id || filters.contribution_type || filters.date_range)}
                                                onClearFilters={clearFilters}
                                                createPermission="create-goal-contributions"
                                                onCreateClick={() => {}}
                                                createButtonText={t('Create Contribution')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {contributions?.data?.length > 0 && (
                            <CardContent className="px-6 py-3 border-t bg-gray-50/30">
                                <Pagination
                                    data={contributions || { data: [], links: [], meta: {} }}
                                    routeName="goal.contributions.index"
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
                title={t('Delete Contribution')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
