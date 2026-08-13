import { useState, useEffect } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from '@/components/ui/pagination';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Edit as EditIcon, Trash2, Upload, Plus, Search, X, ChevronDown, HelpCircle } from 'lucide-react';
import ImportDialog from './ImportDialog';
import NoRecordsFound from '@/components/no-records-found';
import { formatDateTime } from '@/utils/helpers';

interface FAQ {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface Props {
  faqs: {
    data: FAQ[];
    links: any;
    meta: any;
  };
}

export default function Index() {
  const { t } = useTranslation();
  const { faqs } = usePage<Props>().props;
  const urlParams = new URLSearchParams(window.location.search);
  const { auth } = usePage().props as any;

  const [filters, setFilters] = useState({
    search: urlParams.get('search') || '',
  });

  const [perPage] = useState(urlParams.get('per_page') || '10');
  const [sortField, setSortField] = useState(urlParams.get('sort') || '');
  const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQ | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
    routeName: 'support-ticket-faq.destroy',
    defaultMessage: t('Are you sure you want to delete this FAQ?')
  });

  // Create form
  const createForm = useForm({
    title: '',
    description: '',
  });

  // Edit form
  const editForm = useForm({
    title: editingItem?.title ?? '',
    description: editingItem?.description ?? '',
  });

  const handleFilter = () => {
    router.get(route('support-ticket-faq.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
      preserveState: true,
      replace: true
    });
  };

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    router.get(route('support-ticket-faq.index'), { ...filters, per_page: perPage, sort: field, direction }, {
      preserveState: true,
      replace: true
    });
  };

  const clearFilters = () => {
    setFilters({ search: '' });
    router.get(route('support-ticket-faq.index'), { per_page: perPage, sort: sortField, direction: sortDirection });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post(route('support-ticket-faq.store'), {
      onSuccess: () => createForm.reset()
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    editForm.put(route('support-ticket-faq.update', editingItem.id), {
      onSuccess: () => setEditingItem(null)
    });
  };

  const startEdit = (item: FAQ) => {
    setEditingItem(item);
    editForm.setData({
      title: item.title,
      description: item.description,
    });
    setEditorKey(prev => prev + 1);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    editForm.reset();
    setEditorKey(prev => prev + 1);
  };

  const isCreateMode = !editingItem;

  // TruncatedDescription component
  const TruncatedDescription = ({ description, maxLength = 200 }: { description: string; maxLength?: number }) => {
    const [expanded, setExpanded] = useState(false);
    if (!description || description === '-') return <p className="text-xs text-gray-500">-</p>;
    const text = description.replace(/<[^>]*>/g, '');
    const shouldTruncate = text.length > maxLength;
    const displayText = expanded || !shouldTruncate ? text : text.substring(0, maxLength) + '...';
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
      key: 'title',
      header: t('FAQ'),
      sortable: true,
      className: 'w-full max-w-0',
      render: (_: any, item: FAQ) => (
        <div className="flex items-start gap-3 w-full overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
            <TruncatedDescription description={item.description || '-'} />
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      header: t('Created'),
      sortable: true,
      className: 'w-[140px] text-center whitespace-nowrap',
      render: (value: string) => <span className="whitespace-nowrap">{formatDateTime(value)}</span>
    },
    ...(auth.user?.permissions?.some((p: string) => ['edit-faq', 'delete-faq'].includes(p)) ? [{
      key: 'actions',
      header: t('Actions'),
      className: 'w-[90px] text-right',
      render: (_: any, item: FAQ) => (
        <div className="flex justify-end gap-1">
          <TooltipProvider>
            {auth.user?.permissions?.includes('edit-faq') && (
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
            {auth.user?.permissions?.includes('delete-faq') && (
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
        { label: t('Support Tickets'), url: route('dashboard.support-tickets') },
        { label: t('FAQ') }
      ]}
      pageTitle={t('Manage FAQ')}
      pageActions={
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{t('Import')}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      }
    >
      <Head title={t('FAQ')} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side - Create/Edit Form */}
        <div className="lg:col-span-4">
          <Card className="shadow-sm sticky top-6">
            <CardContent className="p-6">
              {isCreateMode ? (
                <>
                  <h2 className="text-lg font-semibold mb-1">{t('Add New FAQ')}</h2>
                  <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new FAQ')}</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-1">{t('Edit FAQ')}</h2>
                  <p className="text-sm text-gray-500 mb-6">{t('Update the FAQ details below')}</p>
                </>
              )}

              <form onSubmit={isCreateMode ? handleCreate : handleUpdate} className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">{t('Question')}</Label>
                  <Input
                    id="title"
                    type="text"
                    value={isCreateMode ? createForm.data.title : editForm.data.title}
                    onChange={(e) => isCreateMode ? createForm.setData('title', e.target.value) : editForm.setData('title', e.target.value)}
                    placeholder={t('Enter FAQ question')}
                    required
                    className="mt-1"
                  />
                  <InputError message={isCreateMode ? createForm.errors.title : editForm.errors.title} />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">{t('Answer')}</Label>
                  <div className="mt-1 max-h-[450px] overflow-y-auto">
                    <div className="[&_.ProseMirror]:min-h-[200px]">
                      <RichTextEditor
                        key={isCreateMode ? 'create' : `edit-${editorKey}`}
                        content={isCreateMode ? createForm.data.description : editForm.data.description}
                        onChange={(value) => isCreateMode ? createForm.setData('description', value) : editForm.setData('description', value)}
                        placeholder={t('Enter FAQ answer')}
                      />
                    </div>
                  </div>
                  <InputError message={isCreateMode ? createForm.errors.description : editForm.errors.description} />
                </div>

                {/* Submit */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isCreateMode ? createForm.processing : editForm.processing}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isCreateMode
                      ? (createForm.processing ? t('Creating...') : t('Add FAQ'))
                      : (editForm.processing ? t('Updating...') : t('Update FAQ'))
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
                      placeholder={t('Search FAQ...')}
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleFilter} size="sm">{t('Search')}</Button>
                  {filters.search && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                      <X className="h-4 w-4" />
                      {t('Reset')}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <PerPageSelector
                    routeName="support-ticket-faq.index"
                    filters={{ ...filters, sort: sortField, direction: sortDirection }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ List */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                <div className="min-w-[500px] table-fixed w-full">
                  <DataTable
                    data={faqs.data}
                    columns={tableColumns}
                    onSort={handleSort}
                    sortKey={sortField}
                    sortDirection={sortDirection as 'asc' | 'desc'}
                    className="shadow-none border-0"
                    emptyState={
                      <NoRecordsFound
                        icon={HelpCircle}
                        title={t('No FAQ found')}
                        description={t('Get started by creating your first FAQ.')}
                        hasFilters={!!filters.search}
                        onClearFilters={clearFilters}
                        createPermission="create-faq"
                        onCreateClick={() => { }}
                        createButtonText={t('Create FAQ')}
                        className="h-auto"
                      />
                    }
                  />
                </div>
              </div>
            </CardContent>

            {/* Pagination */}
            {faqs.data.length > 0 && (
              <CardContent className="px-6 py-3 border-t bg-gray-50/30">
                <Pagination
                  data={faqs || { data: [], links: [], meta: {} }}
                  routeName="support-ticket-faq.index"
                  filters={{ ...filters, per_page: perPage, sort: sortField, direction: sortDirection }}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Import Modal - preserved */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl">
          <ImportDialog onSuccess={() => {
            setShowImportModal(false);
            router.reload();
          }} />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={closeDeleteDialog}
        title={t('Delete FAQ')}
        message={deleteState.message}
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </AuthenticatedLayout>
  );
}
