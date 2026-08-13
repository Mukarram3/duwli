import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import NoRecordsFound from '@/components/no-records-found';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Eye, Trash2, FileText, Link, Copy, MessageSquare, Layers, Activity, X, User, Mail, Phone, Download, CalendarDays } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/utils/helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { FilterButton } from '@/components/ui/filter-button';
import { DatePicker } from '@/components/ui/date-picker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface FormResponse {
  id: number;
  response_data: Record<string, any>;
  created_at: string;
}

interface Form {
  id: number;
  name: string;
  code: string;
}

interface ResponsesProps {
  form: Form & { fields: Array<{ id: number; label: string; type: string }> };
  responses: any;
  auth: any;
}

export default function Responses({ form, responses, auth }: ResponsesProps) {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);

  const [search, setSearch] = useState(urlParams.get('search') || '');
  const [perPage] = useState(urlParams.get('per_page') || '10');
  const [viewResponse, setViewResponse] = useState<FormResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [tempPriority, setTempPriority] = useState('all');
  const [tempDate, setTempDate] = useState('');

  const handleApplyFilters = () => {
    setSelectedPriority(tempPriority);
    setSelectedDate(tempDate);
  };

  const handleClearFilters = () => {
    setTempPriority('all');
    setTempDate('');
    setSelectedPriority('all');
    setSelectedDate('');
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysCount = responses?.data?.filter((r: any) => r.created_at?.slice(0, 10) === todayStr).length || 0;

  // Dynamic field mappings based on label search
  const nameField = form.fields.find(f => {
    const lbl = f.label.toLowerCase();
    return lbl.includes('name') || lbl.includes('responder');
  });
  const emailField = form.fields.find(f => {
    const lbl = f.label.toLowerCase();
    return f.type === 'email' || lbl.includes('email');
  });
  const categoryField = form.fields.find(f => {
    const lbl = f.label.toLowerCase();
    return lbl.includes('category') || lbl.includes('subject') || lbl.includes('topic');
  });
  const priorityField = form.fields.find(f => {
    const lbl = f.label.toLowerCase();
    return lbl.includes('priority') || lbl.includes('status') || lbl.includes('level');
  });

  const getNameVal = (response: FormResponse) => {
    if (nameField) return response.response_data[nameField.id] || '-';
    const firstField = form.fields[0];
    return firstField ? response.response_data[firstField.id] || '-' : '-';
  };

  const getEmailVal = (response: FormResponse) => {
    if (emailField) return response.response_data[emailField.id] || '-';
    const secondField = form.fields[1];
    return secondField ? response.response_data[secondField.id] || '-' : '-';
  };

  const getCategoryVal = (response: FormResponse) => {
    if (categoryField) return response.response_data[categoryField.id] || '-';
    const thirdField = form.fields[2];
    return thirdField ? response.response_data[thirdField.id] || '-' : '-';
  };

  const getPriorityVal = (response: FormResponse) => {
    if (priorityField) return response.response_data[priorityField.id] || '-';
    const fourthField = form.fields[3];
    return fourthField ? response.response_data[fourthField.id] || '-' : '-';
  };

  const getInitials = (name: string) => {
    if (!name || name === '-') return 'R';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColorClass = (initials: string) => {
    const colors = [
      'bg-blue-50 text-blue-700 ring-blue-600/20',
      'bg-purple-50 text-purple-700 ring-purple-600/20',
      'bg-amber-50 text-amber-700 ring-amber-600/20',
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      'bg-rose-50 text-rose-700 ring-rose-600/20',
      'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    ];
    let sum = 0;
    for (let i = 0; i < initials.length; i++) {
      sum += initials.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const getPriorityBadgeClass = (priority: string) => {
    const p = String(priority).toLowerCase().trim();
    if (p.includes('high') || p.includes('critical') || p.includes('urgent') || p.includes('red')) {
      return 'bg-red-50 text-red-700 ring-red-600/20';
    }
    if (p.includes('medium') || p.includes('viewed') || p.includes('replied') || p.includes('blue')) {
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    }
    if (p.includes('low') || p.includes('new') || p.includes('open') || p.includes('green') || p.includes('resolved')) {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    }
    return 'bg-gray-50 text-gray-600 ring-gray-500/10';
  };

  const handleDelete = () => {
    if (deleteId) {
      router.delete(route('formbuilder.forms.responses.destroy', [form.id, deleteId]), {
        preserveScroll: true,
        onSuccess: () => setDeleteId(null)
      });
    }
  };

  const handleSearch = () => {
    router.get(route('formbuilder.forms.responses', form.id), {
      search,
      per_page: perPage
    }, {
      preserveState: true,
      replace: true
    });
  };

  const clearSearch = () => {
    setSearch('');
    setTempPriority('all');
    setTempDate('');
    setSelectedPriority('all');
    setSelectedDate('');
    router.get(route('formbuilder.forms.responses', form.id), { per_page: perPage });
  };

  const copyFormLink = async () => {
    const formUrl = route('formbuilder.public.form.show', form.code);
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('Just now');
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? t('minute ago') : t('minutes ago')}`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? t('hour ago') : t('hours ago')}`;
    if (diffDays === 1) return t('Yesterday');
    return `${diffDays} ${diffDays === 1 ? t('day ago') : t('days ago')}`;
  };

  const formatSubDate = (dateString: string) => {
    const d = new Date(dateString);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${month}-${day}-${year} ${strHours}:${minutes} ${ampm}`;
  };

  const tableColumns = [
    {
      key: 'submission_no',
      header: '#',
      className: 'px-4 py-3 text-left font-normal text-gray-750 text-sm w-20',
      render: (_: any, response: FormResponse, index: number) => {
        const submissionNumber = responses.total - ((responses.current_page - 1) * responses.per_page + index);
        return (
          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20">
            #{submissionNumber}
          </span>
        );
      }
    },
    {
      key: 'responder',
      header: t('Responder'),
      className: 'px-4 py-3 text-left font-normal text-gray-750 text-sm',
      render: (_: any, response: FormResponse) => {
        const name = getNameVal(response);
        const email = getEmailVal(response);
        const initials = getInitials(name);
        const avatarColorClass = getAvatarColorClass(initials);
        return (
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 shrink-0 ring-1 ring-inset ${avatarColorClass}`}>
              <AvatarFallback className="bg-transparent font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-gray-900 font-semibold text-sm">{name}</span>
              {email && email !== '-' && (
                <span className="text-gray-400 text-xs mt-0.5 font-normal">{email}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'category',
      header: t('Category'),
      className: 'px-4 py-3 text-left font-normal text-gray-750 text-sm',
      render: (_: any, response: FormResponse) => {
        const category = getCategoryVal(response);
        return <span className="text-gray-650 font-normal">{category}</span>;
      }
    },
    {
      key: 'priority',
      header: t('Priority'),
      className: 'px-4 py-3 text-left font-normal text-gray-750 text-sm',
      render: (_: any, response: FormResponse) => {
        const priority = getPriorityVal(response);
        const badgeClass = getPriorityBadgeClass(priority);
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeClass}`}>
            {priority}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      header: t('Submitted'),
      sortable: false,
      className: 'px-4 py-3 text-left font-normal text-gray-750 text-sm',
      render: (value: string) => (
        <div className="flex flex-col">
          <span className="text-gray-900 font-semibold text-sm">{getRelativeTime(value)}</span>
          <span className="text-gray-400 text-xs mt-0.5 font-normal">{formatSubDate(value)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: t('Actions'),
      className: 'px-4 py-3 text-center [&>div]:justify-center font-normal text-gray-750 text-sm w-28',
      render: (_: any, response: FormResponse) => (
        <div className="flex gap-2 items-center justify-center">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewResponse(response)} 
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{t('View')}</p></TooltipContent>
            </Tooltip>
            {auth.user?.permissions?.includes('delete-formbuilder-responses') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(response.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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

  const filteredData = (responses?.data || []).filter((item: FormResponse) => {
    if (selectedDate) {
      const itemDate = item.created_at?.slice(0, 10);
      if (itemDate !== selectedDate) return false;
    }
    if (selectedPriority !== 'all') {
      const priorityVal = getPriorityVal(item).toLowerCase();
      if (!priorityVal.includes(selectedPriority.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: t('Form Builder'), url: route('formbuilder.forms.index') },
        { label: form.name }
      ]}
      pageTitle={t('Form Responses')}
      backUrl={route('formbuilder.forms.index')}
      pageActions={
        <Button
          size="sm"
          variant="outline"
          onClick={copyFormLink}
          className="flex items-center gap-2 hover:bg-gray-50 border-gray-300 shadow-sm transition-all"
        >
          {copiedLink ? (
            <>
              <Copy className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700 font-medium">{t('Copied!')}</span>
            </>
          ) : (
            <>
              <Link className="h-4 w-4 text-gray-500" />
              <span>{t('Copy Form Link')}</span>
            </>
          )}
        </Button>
      }
    >
      <Head title={t('Form Responses')} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Responses */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Total Responses')}</CardTitle>
            <MessageSquare className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{responses.total}</div>
            <p className="text-xs text-blue-700 dark:text-blue-400 opacity-80 mt-1">{t('All time responses')}</p>
          </CardContent>
        </Card>

        {/* Today's Responses */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t("Today's Responses")}</CardTitle>
            <Activity className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{todaysCount}</div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 opacity-80 mt-1">{t('Responses today')}</p>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">{t('Form Fields')}</CardTitle>
            <Layers className="h-8 w-8 text-violet-700 dark:text-violet-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{form.fields?.length || 0}</div>
            <p className="text-xs text-violet-700 dark:text-violet-400 opacity-80 mt-1">{t('Active input fields')}</p>
          </CardContent>
        </Card>

        {/* Form Status */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">{t('Form Link Status')}</CardTitle>
            <Link className="h-8 w-8 text-teal-700 dark:text-teal-300 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{t('Active')}</div>
            <p className="text-xs text-teal-700 dark:text-teal-400 opacity-80 mt-1">{t('Ready for submissions')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start relative min-h-[600px] w-full">
        <div className="flex-1 min-w-0 w-full transition-all duration-300">
          <Card className="shadow-sm flex flex-col">
            <CardContent className="p-4 border-b bg-card">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
                  <div className="w-full md:w-72">
                    <SearchInput
                      value={search}
                      onChange={(value) => setSearch(value)}
                      onSearch={handleSearch}
                      placeholder={t('Search responses...')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Select value={perPage} onValueChange={(value) => {
                    router.get(route('formbuilder.forms.responses', form.id), {
                      search, per_page: value, page: 1
                    }, { preserveState: false, replace: true });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">{t('10 per page')}</SelectItem>
                      <SelectItem value="25">{t('25 per page')}</SelectItem>
                      <SelectItem value="50">{t('50 per page')}</SelectItem>
                      <SelectItem value="100">{t('100 per page')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <FilterButton
                      showFilters={showFilters}
                      onToggle={() => setShowFilters(!showFilters)}
                    />
                    {(() => {
                      const activeFilters = [selectedPriority !== 'all' ? selectedPriority : '', selectedDate].filter(Boolean).length;
                      return activeFilters > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium border border-background">
                          {activeFilters}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>

            {showFilters && (
              <CardContent className="p-4 bg-blue-50/30 border-b">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 capitalize tracking-wide mb-1.5">{t('Date')}</label>
                    <DatePicker
                      value={tempDate}
                      onChange={(value) => setTempDate(value)}
                      placeholder={t('Select date')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 capitalize tracking-wide mb-1.5">{t('Priority')}</label>
                    <Select value={tempPriority} onValueChange={setTempPriority}>
                      <SelectTrigger className="w-full bg-background border-input">
                        <SelectValue placeholder={t('Priority')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('All Priorities')}</SelectItem>
                        <SelectItem value="low">{t('Low')}</SelectItem>
                        <SelectItem value="medium">{t('Medium')}</SelectItem>
                        <SelectItem value="high">{t('High')}</SelectItem>
                        <SelectItem value="critical">{t('Critical')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={handleApplyFilters} size="sm">{t('Apply')}</Button>
                    <Button variant="outline" onClick={handleClearFilters} size="sm">{t('Clear')}</Button>
                  </div>
                </div>
              </CardContent>
            )}

            <CardContent className="p-0">
              <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[550px] rounded-none w-full">
                <div className="min-w-[800px]">
                  <DataTable
                    data={filteredData}
                    columns={tableColumns}
                    className="rounded-none border-0"
                    emptyState={
                      <NoRecordsFound
                        icon={FileText}
                        title={t('No responses found')}
                        description={t('No one has submitted this form yet.')}
                        hasFilters={!!search || !!selectedDate || selectedPriority !== 'all'}
                        onClearFilters={clearSearch}
                        className="h-auto"
                      />
                    }
                  />
                </div>
              </div>
            </CardContent>

            <CardContent className="px-4 py-2 border-t bg-gray-50/30">
              {responses?.total > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    {t('Showing')} {responses.from} {t('to')} {responses.to} {t('of')} {responses.total} {t('results')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(route('formbuilder.forms.responses', form.id), {
                        search, per_page: perPage, page: responses.current_page - 1
                      }, { preserveState: true, replace: true })}
                      disabled={responses.current_page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('Previous')}
                    </Button>
                    {Array.from({ length: Math.min(5, responses.last_page) }, (_, i) => {
                      const page = i + Math.max(1, responses.current_page - 2);
                      if (page > responses.last_page) return null;
                      return (
                        <Button
                          key={page}
                          variant={page === responses.current_page ? "default" : "outline"}
                          size="sm"
                          onClick={() => router.get(route('formbuilder.forms.responses', form.id), {
                            search, per_page: perPage, page
                          }, { preserveState: true, replace: true })}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.get(route('formbuilder.forms.responses', form.id), {
                        search, per_page: perPage, page: responses.current_page + 1
                      }, { preserveState: true, replace: true })}
                      disabled={responses.current_page === responses.last_page}
                    >
                      {t('Next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inline Detail Card Panel (Opens next to the table inside the main page content layout) */}
        {viewResponse && (() => {
          const viewResponseIndex = responses.data.findIndex((r: any) => r.id === viewResponse.id);
          const submissionNumber = viewResponseIndex !== -1 
            ? responses.total - ((responses.current_page - 1) * responses.per_page + viewResponseIndex)
            : responses.total;

          // Find Phone field dynamically
          const phoneField = form.fields.find(f => {
            const lbl = f.label.toLowerCase();
            return lbl.includes('phone') || lbl.includes('contact') || lbl.includes('mobile');
          });

          const submitterInfo = [
            {
              label: t('Name'),
              value: getNameVal(viewResponse),
              icon: User
            },
            {
              label: t('Email'),
              value: getEmailVal(viewResponse),
              icon: Mail
            },
            {
              label: t('Phone'),
              value: phoneField ? viewResponse.response_data[phoneField.id] || '-' : '-',
              icon: Phone
            }
          ].filter(item => item.value && item.value !== '-');

          const responseFields = form.fields.filter(f => f.id !== nameField?.id && f.id !== emailField?.id && f.id !== phoneField?.id);

          const isAttachment = (val: any) => {
            if (typeof val !== 'string') return false;
            const lowerVal = val.toLowerCase();
            return lowerVal.endsWith('.pdf') || lowerVal.endsWith('.png') || lowerVal.endsWith('.jpg') || lowerVal.endsWith('.jpeg') || lowerVal.endsWith('.docx') || lowerVal.endsWith('.zip');
          };

          return (
            <Card className="w-full lg:w-[420px] shrink-0 border border-gray-200 dark:border-gray-800 shadow-lg bg-card text-card-foreground sticky top-6 transition-all duration-300 flex flex-col h-[700px] max-h-[85vh] overflow-hidden">
              <CardContent className="p-6 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4 mb-4 shrink-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('Response Details')}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewResponse(null)}
                    className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl p-4 shadow-sm mb-5 shrink-0">
                  <div className="flex items-center justify-between border-b border-primary/15 pb-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-sm">
                      #{submissionNumber}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                      {t('New Response')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-gray-600">
                    <CalendarDays className="w-4.5 h-4.5 text-primary mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {t('Submitted')} {getRelativeTime(viewResponse.created_at)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-450 mt-0.5">
                        {formatSubDate(viewResponse.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto pr-1 flex-1 min-h-0">
                  {/* Submitter Information */}
                  {submitterInfo.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 tracking-wider">{t('Submitter Information')}</h4>
                      <div className="space-y-3">
                        {submitterInfo.map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-100/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold text-gray-400 tracking-wider">{item.label}</span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.value}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Response Data */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 tracking-wider">{t('Response Data')}</h4>
                    <div className="space-y-3.5">
                      {responseFields.map((field, index) => {
                        const value = viewResponse.response_data[field.id];
                        return (
                          <div key={index} className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 block">
                              {field.label || `${t('Field')} #${index + 1}`}
                            </span>
                            {isAttachment(value) ? (
                              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-card text-card-foreground shadow-sm mt-1">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{String(value).split('/').pop()}</span>
                                    <span className="text-xs text-gray-450 dark:text-gray-500">245 KB</span>
                                  </div>
                                </div>
                                <a href={value} download className="text-gray-400 hover:text-gray-655 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0">
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            ) : (
                              <div className="text-sm font-normal text-gray-900 dark:text-gray-100 leading-relaxed bg-gray-50/50 dark:bg-gray-900/40 p-2.5 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
                                {typeof value === 'boolean' ? (
                                  value ? (
                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                                      {t('Yes')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20">
                                      {t('No')}
                                    </span>
                                  )
                                ) : value !== undefined && value !== null && value !== '' ? (
                                  String(value)
                                ) : (
                                  <span className="text-gray-400 italic">{t('No response')}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t('Delete Response')}
        message={t('Are you sure you want to delete this response? This action cannot be undone.')}
        confirmText={t('Delete')}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AuthenticatedLayout>
  );
}
