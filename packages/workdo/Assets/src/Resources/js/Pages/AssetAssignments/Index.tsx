import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from "@/components/ui/list-grid-toggle";
import { PerPageSelector } from "@/components/ui/per-page-selector";
import { FilterButton } from "@/components/ui/filter-button";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit as EditIcon, Trash2, RotateCcw, Clock, CheckCircle, Eye } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/helpers';
import Create from './Create';
import EditAssetAssignment from './Edit';
import ReturnAsset from './ReturnAsset';
import ViewAssetAssignment from './View';
import { AssetAssignmentsIndexProps, AssetAssignmentModalState, AssetAssignmentFilters, AssetAssignment } from './types';
import { useEffect } from 'react';
import axios from 'axios';

export default function Index() {
    const { assetAssignments, auth } = usePage<AssetAssignmentsIndexProps>().props;
    const { t } = useTranslation();
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<AssetAssignmentFilters>({
        asset_name: urlParams.get('asset_name') || '',
        user_name: urlParams.get('user_name') || 'all',
        status: urlParams.get('status') || 'all',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<AssetAssignmentModalState & { mode: string }>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showFilters, setShowFilters] = useState(false);
    const [users, setUsers] = useState<any[]>([]);


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(route('assets.asset-assignments.users'));
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const pageButtons = usePageButtons('assetAssignmentBtn','Asset Assignment data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'assets.asset-assignments.destroy',
        defaultMessage: 'Are you sure you want to delete this asset assignment?'
    });

    const handleFilter = () => {
        router.get(route('assets.asset-assignments.index'), {
            ...filters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('assets.asset-assignments.index'), {
            ...filters,
            per_page: perPage,
            sort: field,
            direction,
            view: viewMode
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ asset_name: '', user_name: 'all', status: 'all', condition: 'all' });
        router.get(route('assets.asset-assignments.index'), {per_page: perPage, view: viewMode});
    };

    const openModal = (mode: 'add' | 'edit' | 'return' | 'view', data: AssetAssignment | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { class: 'bg-blue-100 text-blue-800', icon: Clock },
            returned: { class: 'bg-red-100 text-red-800', icon: CheckCircle },
            overdue: { class: 'bg-red-100 text-red-800', icon: Clock }
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config?.icon || Clock;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${config?.class}`}>
                {t(status.charAt(0).toUpperCase() + status.slice(1))}
            </span>
        );
    };

    const getConditionBadge = (condition: string) => {
        if (!condition) return '-';

        const conditionConfig = {
            excellent: 'bg-green-100 text-green-800',
            good: 'bg-blue-100 text-blue-800',
            fair: 'bg-yellow-100 text-yellow-800',
            poor: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${conditionConfig[condition as keyof typeof conditionConfig]}`}>
                {t(condition.charAt(0).toUpperCase() + condition.slice(1))}
            </span>
        );
    };

    const tableColumns = [
        {
            key: 'asset.name',
            header: t('Asset'),
            sortable: true,
            render: (_: any, assignment: AssetAssignment) => (
                <div>
                    <div>{assignment.asset.name}</div>
                </div>
            )
        },
        {
            key: 'user.name',
            header: t('Assigned To'),
            sortable: false,
            render: (_: any, assignment: AssetAssignment) => (
                <div>
                    <div>{assignment.user.name}</div>
                </div>
            )
        },
        {
            key: 'assigned_date',
            header: t('Assigned Date'),
            sortable: false,
            render: (value: string) => value ? formatDate(value) : '-'
        },
        {
            key: 'expected_return_date',
            header: t('Expected Return'),
            sortable: false,
            render: (value: string) => value ? formatDate(value) : '-'
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => getStatusBadge(value)
        },
        {
            key: 'condition',
            header: t('Condition'),
            render: (_: any, assignment: AssetAssignment) => {
                const condition = assignment.status === 'returned' ? assignment.condition_on_return : assignment.condition_on_assignment;
                return getConditionBadge(condition);
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-asset-assignments', 'delete-asset-assignments' ,'view-asset-assignments', 'return-assets'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, assignment: AssetAssignment) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-asset-assignments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('view', assignment)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('return-assets') && assignment.status === 'active' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('return', assignment)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Return')}</p></TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('edit-asset-assignments') && assignment.status === 'active' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', assignment)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('delete-asset-assignments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(assignment.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                { label: t('Assets') },
                { label: t('Assignments') }
            ]}
            pageTitle={t('Manage Assignments')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('create-asset-assignments') && (
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
                        )}
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title="Asset Assignments" />

            <Card className="shadow-sm">
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.asset_name}
                                onChange={(value) => setFilters({...filters, asset_name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by asset name...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="assets.asset-assignments.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="assets.asset-assignments.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.user_name !== 'all' ? filters.user_name : '', filters.status !== 'all' ? filters.status : '', filters.condition !== 'all' ? filters.condition : ''].filter(Boolean).length;
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

                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                             {auth.user?.permissions?.includes('manage-users') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Assign To')}</label>
                                    <Select value={filters.user_name || 'all'} onValueChange={(value) => setFilters({...filters, user_name: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by assign to')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('All Users')}</SelectItem>
                                            {users.map((user: any) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                        <SelectItem value="active">{t('Active')}</SelectItem>
                                        <SelectItem value="returned">{t('Returned')}</SelectItem>
                                        <SelectItem value="overdue">{t('Overdue')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Condition')}</label>
                                <Select value={filters.condition || ''} onValueChange={(value) => setFilters({...filters, condition: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by condition')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Conditions')}</SelectItem>
                                        <SelectItem value="excellent">{t('Excellent')}</SelectItem>
                                        <SelectItem value="good">{t('Good')}</SelectItem>
                                        <SelectItem value="fair">{t('Fair')}</SelectItem>
                                        <SelectItem value="poor">{t('Poor')}</SelectItem>
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

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                            <DataTable
                                data={assetAssignments.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
emptyState={
                                    <div className="text-center py-8">
                                        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No asset assignments found')}</h3>
                                        <p className="text-gray-500 mb-4">{t('Get started by creating your first asset assignment.')}</p>
                                        {auth.user?.permissions?.includes('create-asset-assignments') && (
                                            <Button onClick={() => openModal('add')}>
                                                <Plus className="h-4 w-4" />
                                                {t('Create Assignments')}
                                            </Button>
                                        )}
                                    </div>
                                }
                            />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-6">
                            {assetAssignments.data.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {assetAssignments.data.map((assignment) => (
                                        <Card key={assignment.id} className="p-0 hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full min-w-0">
                                            {/* Header */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Clock className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-sm text-gray-900">{assignment.asset.name}</h3>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="p-4 flex-1 min-h-0">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">{t('Assigned To')}</p>
                                                        <p className="font-medium text-xs">{assignment.user.name}</p>
                                                    </div>
                                                    <div className="text-xs min-w-0 text-end">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide text-end">{t('Status')}</p>
                                                        {getStatusBadge(assignment.status)}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">{t('Assigned Date')}</p>
                                                        <p className="font-medium text-xs">{formatDate(assignment.assigned_date)}</p>
                                                    </div>
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide text-end">{t('Expected Return')}</p>
                                                        <p className={`font-medium text-xs text-end ${assignment.status === 'overdue' ? 'text-red-600' : ''}`}>
                                                            {assignment.expected_return_date ? formatDate(assignment.expected_return_date) : '-'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">{t('Serial Code')}:</span>
                                                            <span className="font-medium">{assignment.asset.serial_code || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">{t('Category')}:</span>
                                                            <span className="font-medium">{assignment.asset.category?.name || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2 mt-2">
                                                            <span className="text-gray-600 font-medium">{t('Condition')}:</span>
                                                            {(() => {
                                                                const condition = assignment.status === 'returned' ? assignment.condition_on_return : assignment.condition_on_assignment;
                                                                return getConditionBadge(condition);
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Footer */}
                                            <div className="flex justify-end gap-2 p-3 border-t bg-gray-50/50 flex-shrink-0 mt-auto">
                                                <TooltipProvider>
                                                    {auth.user?.permissions?.includes('view-asset-assignments') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => openModal('view', assignment)} className="h-9 w-9 p-0 text-green-600 hover:text-green-700">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('return-assets') && assignment.status === 'active' && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => openModal('return', assignment)} className="h-9 w-9 p-0 text-green-600 hover:text-green-700">
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Return')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('edit-asset-assignments') && assignment.status === 'active' && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => openModal('edit', assignment)} className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700">
                                                                    <EditIcon className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-asset-assignments') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog(assignment.id)}
                                                                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </TooltipProvider>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No assignments found')}</h3>
                                    <p className="text-gray-500 mb-4">{t('Get started by creating your first asset assignment.')}</p>
                                    {auth.user?.permissions?.includes('create-asset-assignments') && (
                                        <Button onClick={() => openModal('add')}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t('Create')}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={assetAssignments}
                        routeName="assets.asset-assignments.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditAssetAssignment
                        assetAssignment={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
                {modalState.mode === 'return' && modalState.data && (
                    <ReturnAsset
                        assetAssignment={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
                {modalState.mode === 'view' && modalState.data && (
                    <ViewAssetAssignment
                        assignment={modalState.data}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Asset Assignment')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
