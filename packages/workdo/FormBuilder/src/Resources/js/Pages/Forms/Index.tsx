import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Pagination } from '@/components/ui/pagination';
import NoRecordsFound from '@/components/no-records-found';
import BadgeUI from '@/components/badge-ui';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Plus, Edit as EditIcon, Trash2, BarChart3, FileText, Link, Copy, Zap } from 'lucide-react';
import { formatDateTime } from '@/utils/helpers';

interface Form {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  responses_count: number;
  fields_count: number;
  created_at: string;
}

interface FormsIndexProps {
  forms: {
    data: Form[];
    links: any;
    meta: any;
  };
  statistics: {
    total_forms: number;
    total_fields: number;
    total_responses: number;
    avg_response: number;
  };
  auth: any;
}

export default function FormsIndex({ forms, statistics, auth }: FormsIndexProps) {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);

  const [filters, setFilters] = useState({
    name: urlParams.get('name') || ''
  });

  const [perPage] = useState(urlParams.get('per_page') || '10');
  const [sortField, setSortField] = useState(urlParams.get('sort') || '');
  const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
    routeName: 'formbuilder.forms.destroy',
    defaultMessage: t('Are you sure you want to delete this form?')
  });

  const handleFilter = () => {
    router.get(route('formbuilder.forms.index'), {
      ...filters,
      per_page: perPage,
      sort: sortField,
      direction: sortDirection
    }, {
      preserveState: true,
      replace: true
    });
  };

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    router.get(route('formbuilder.forms.index'), {
      ...filters,
      per_page: perPage,
      sort: field,
      direction
    }, {
      preserveState: true,
      replace: true
    });
  };

  const clearFilters = () => {
    setFilters({ name: '' });
    router.get(route('formbuilder.forms.index'), { per_page: perPage });
  };

  const copyFormLink = async (formCode: string) => {
    const formUrl = route('formbuilder.public.form.show', formCode);
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopiedCode(formCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const tableColumns = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      className: 'pl-6 pr-4 py-3 text-left',
      render: (value: string, form: Form) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          {auth.user?.permissions?.includes('edit-formbuilder-form') ? (
            <span
              className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-primary cursor-pointer truncate"
              onClick={() => router.visit(route('formbuilder.forms.edit', form.id))}
            >
              {value}
            </span>
          ) : (
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{value}</span>
          )}
        </div>
      )
    },
    {
      key: 'fields_count',
      header: t('Fields'),
      sortable: true,
      className: 'px-4 py-3 text-left',
      render: (value: number) => (
        <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{value}</span>
      )
    },
    {
      key: 'responses_count',
      header: t('Responses'),
      sortable: true,
      className: 'px-4 py-3 text-left',
      render: (value: number) => (
        <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{value}</span>
      )
    },
    {
      key: 'is_active',
      header: t('Status'),
      sortable: true,
      className: 'px-4 py-3 text-left',
      render: (value: boolean) => (
        <BadgeUI className={`${value
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          : 'bg-red-50 text-red-700 ring-red-600/20'
          }`}>
          {value ? t('Active') : t('Inactive')}
        </BadgeUI>
      )
    },
    {
      key: 'created_at',
      header: t('Created At'),
      sortable: true,
      className: 'px-4 py-3 text-left',
      render: (value: string) => <span className="text-gray-500 text-sm">{formatDateTime(value)}</span>
    },
    {
      key: 'actions',
      header: t('Actions'),
      className: 'px-4 py-3 text-center [&>div]:justify-center',
      render: (_: any, form: Form) => (
        <div className="flex gap-1 items-center justify-center">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyFormLink(form.code)}
                  className={`h- 8 w - 8 p - 0 transition - colors ${copiedCode === form.code
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-purple-600 hover:text-purple-700'
                    } `}
                >
                  {copiedCode === form.code ? <Copy className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{copiedCode === form.code ? t('Copied!') : t('Copy Link')}</p></TooltipContent>
            </Tooltip>
            {auth.user?.permissions?.includes('view-formbuilder-responses') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => router.visit(route('formbuilder.forms.responses', form.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('Responses')}</p></TooltipContent>
              </Tooltip>
            )}
            {auth.user?.permissions?.includes('manage-formbuilder-conversions') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => router.visit(route('formbuilder.forms.conversion', form.id))} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                    <Zap className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('Convert')}</p></TooltipContent>
              </Tooltip>
            )}
            {auth.user?.permissions?.includes('edit-formbuilder-form') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => router.visit(route('formbuilder.forms.edit', form.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
              </Tooltip>
            )}
            {auth.user?.permissions?.includes('delete-formbuilder-form') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(form.id)}
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
    }
  ];

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: t('Form Builder') }]}
      pageTitle={t('Manage Form Builder')}
      pageActions={
        auth.user?.permissions?.includes('create-formbuilder-form') && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={() => router.visit(route('formbuilder.forms.create'))}>
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
      <Head title={t('Form List')} />

      {/* Dashboard Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Total Forms */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('Total Forms')}</CardTitle>
            <FileText className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{statistics.total_forms}</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{t('Active forms')}</p>
          </CardContent>
        </Card>

        {/* Total Fields */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Fields')}</CardTitle>
            <FileText className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{statistics.total_fields}</div>
            <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('Across all forms')}</p>
          </CardContent>
        </Card>

        {/* Total Responses */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Total Responses')}</CardTitle>
            <FileText className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{statistics.total_responses}</div>
            <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">{t('All time responses')}</p>
          </CardContent>
        </Card>

        {/* Avg. Response / Form */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('Avg. Response / Form')}</CardTitle>
            <Zap className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{statistics.avg_response}</div>
            <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80 mt-1">{t('Average responses')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 border-b bg-gray-50/50 dark:bg-gray-900/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={filters.name}
                onChange={(value) => setFilters({ ...filters, name: value })}
                onSearch={handleFilter}
                placeholder={t('Search forms...')}
              />
            </div>
            <div className="flex items-center gap-3">
              <PerPageSelector
                routeName="formbuilder.forms.index"
                filters={{ ...filters }}
              />
            </div>
          </div>
        </CardContent>

        <CardContent className="p-0">
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
            <div className="min-w-[800px]">
              <DataTable
                data={forms.data}
                columns={tableColumns}
                onSort={handleSort}
                sortKey={sortField}
                sortDirection={sortDirection as 'asc' | 'desc'}
                className="rounded-none shadow-none border-0"
                emptyState={
                  <NoRecordsFound
                    icon={FileText}
                    title={t('No forms found')}
                    description={t('Get started by creating your first form.')}
                    hasFilters={!!filters.name}
                    onClearFilters={clearFilters}
                    createPermission="create-formbuilder"
                    onCreateClick={() => router.visit(route('formbuilder.forms.create'))}
                    createButtonText={t('Create Form')}
                  />
                }
              />
            </div>
          </div>
        </CardContent>

        <CardContent className="px-4 py-2 border-t bg-gray-50/30 dark:bg-gray-900/20">
          <Pagination
            data={forms}
            routeName="formbuilder.forms.index"
            filters={{ ...filters, per_page: perPage }}
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={closeDeleteDialog}
        title={t('Delete Form')}
        message={deleteState.message}
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </AuthenticatedLayout>
  );
}