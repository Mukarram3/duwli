import { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Megaphone as MegaphoneIcon, Download, FileImage, Upload, Star, Briefcase, FileText, CheckCircle, XCircle, Globe, Users, Timer, Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Create from './Create';
import EditJobPosting from './Edit';
import BadgeUI from '@/components/badge-ui';

import NoRecordsFound from '@/components/no-records-found';
import { JobPosting, JobPostingsIndexProps, JobPostingFilters, JobPostingModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';

export default function Index() {
    const { t } = useTranslation();
    const { jobpostings, auth, jobtypes, joblocations, branches, stats } = usePage<JobPostingsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<JobPostingFilters>({
        title: urlParams.get('title') || '',
        description: urlParams.get('description') || '',
        job_type_id: urlParams.get('job_type_id') || 'all',
        location_id: urlParams.get('location_id') || 'all',
        branch_id: urlParams.get('branch_id') || 'all',
        status: urlParams.get('status') || 'all',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [activeTab, setActiveTab] = useState(filters.status || 'all');
    const [modalState, setModalState] = useState<JobPostingModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const [filteredJobTypes, setFilteredJobTypes] = useState(jobtypes || []);
    const [filteredLocations, setFilteredLocations] = useState(joblocations || []);
    const [showFilters, setShowFilters] = useState(false);
    const [copied, setCopied] = useState(false);

    const bubbles = useMemo(() => {
        return Array.from({ length: 25 }).map((_, i) => {
            const directions = ['up', 'down', 'left', 'right'];
            const dir = directions[i % 4];
            const size = (i % 3 === 0) ? 'w-2 h-2' : (i % 3 === 1) ? 'w-3 h-3' : 'w-1.5 h-1.5';
            const delay = `${(i * 0.35).toFixed(2)}s`;
            const duration = `${(4 + (i % 5) * 1.2).toFixed(2)}s`;

            // Positions depending on direction
            let posStyles: React.CSSProperties = {};
            if (dir === 'up' || dir === 'down') {
                posStyles = { left: `${5 + (i * 19) % 90}%` };
            } else {
                posStyles = { top: `${5 + (i * 23) % 90}%` };
            }

            return {
                id: i,
                className: `absolute rounded-full bg-violet-400/20 dark:bg-violet-400/10 animate-bubble-${dir} ${size}`,
                style: {
                    ...posStyles,
                    animationDelay: delay,
                    animationDuration: duration,
                }
            };
        });
    }, []);

    // Initialize filtered options without dependency
    useEffect(() => {
        setFilteredJobTypes(jobtypes || []);
        setFilteredLocations(joblocations || []);
    }, [jobtypes, joblocations]);

    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Job Posting', settingKey: 'Dropbox Job Posting' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.job-postings.destroy',
        defaultMessage: t('Are you sure you want to delete this job posting?')
    });

    const handleFilter = () => {
        router.get(route('recruitment.job-postings.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (status: string) => {
        setActiveTab(status);
        const newFilters = { ...filters, status };
        setFilters(newFilters);
        router.get(route('recruitment.job-postings.index'), {
            ...newFilters,
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
        router.get(route('recruitment.job-postings.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            title: '',
            description: '',
            job_type_id: 'all',
            location_id: 'all',
            branch_id: 'all',
            status: 'all',
        });
        setActiveTab('all');
        router.get(route('recruitment.job-postings.index'), { per_page: perPage });
    };

    const openModal = (mode: 'add' | 'edit', data: JobPosting | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            sortable: true,
            render: (value: string, jobposting: JobPosting) => (
                <div className="flex flex-col gap-1.5 py-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{value}</span>
                    <div className="flex items-center gap-2">
                        {auth.user?.permissions?.includes('view-job-postings') ? (
                            <span
                                className="inline-flex items-center w-max px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/60"
                                onClick={() => router.get(route('recruitment.job-postings.show', jobposting.id))}
                            >
                                {jobposting.posting_code}
                            </span>
                        ) : (
                            <span className="inline-flex items-center w-max px-2 py-0.5 rounded text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                {jobposting.posting_code}
                            </span>
                        )}
                        {jobposting.is_featured && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                                {t('Featured')}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'jobType.name',
            header: t('Type'),
            sortable: false,
            render: (value: any, row: any) => {
                const typeName = row.jobType?.name || row.job_type?.name || row.jobtype?.name || '';
                if (!typeName) return '-';

                const normalized = typeName.toLowerCase().replace(/[^a-z0-9]/g, '');

                const typeConfigs: Record<string, { label: string; class: string }> = {
                    fulltime: { label: typeName, class: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20" },
                    parttime: { label: typeName, class: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20" },
                    contract: { label: typeName, class: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20" },
                    remote: { label: typeName, class: "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20" },
                    hybrid: { label: typeName, class: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20" },
                    internship: { label: typeName, class: "bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/10 dark:text-pink-400 dark:ring-pink-500/20" },
                };

                const config = typeConfigs[normalized] || { label: typeName, class: "bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20" };

                return (
                    <BadgeUI className={`${config.class}`}>
                        {t(config.label)}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'location.name',
            header: t('Location'),
            sortable: false,
            render: (value: any, row: any) => row.location?.name || '-'
        },
        {
            key: 'salary_range',
            header: t('Salary Range'),
            sortable: true,
            render: (value: any, row: any) => {
                if (row.min_salary && row.max_salary) {
                    return `${formatCurrency(row.min_salary)} - ${formatCurrency(row.max_salary)}`;
                }
                return '-';
            }
        },
        {
            key: 'candidates_count',
            header: t('Applications'),
            sortable: false,
            render: (value: number) => (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold">
                    {value ?? 0}
                </span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const statusConfig: any = {
                    "0": { label: "Draft", class: "bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20" },
                    "1": { label: "Published", class: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" },
                    "2": { label: "Closed", class: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20" },
                    "draft": { label: "Draft", class: "bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20" },
                    "active": { label: "Published", class: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" },
                    "closed": { label: "Closed", class: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20" }
                };
                const config = statusConfig[value] || { label: value || '-', class: 'bg-zinc-50 text-zinc-700 ring-zinc-600/20' };
                return (
                    <BadgeUI className={`${config.class}`}>
                        {t(config.label)}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'application_deadline',
            header: t('Deadline'),
            sortable: true,
            render: (value: string) => {
                if (!value) return '-';
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const deadlineDate = new Date(value);
                deadlineDate.setHours(0, 0, 0, 0);
                const isExpired = deadlineDate < today;
                return (
                    <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                        {formatDate(value)}
                    </span>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['publish-job-postings', 'view-job-postings', 'edit-job-postings', 'delete-job-postings'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, jobposting: JobPosting) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('publish-job-postings') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.post(route('recruitment.job-postings.toggle-publish', jobposting.id))}
                                        className={`h-8 w-8 p-0 rounded-md transition-colors ${(jobposting.status === 'draft' || jobposting.status === '0' || String(jobposting.status) === 'false')
                                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                            : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                            }`}
                                    >
                                        {(jobposting.status === 'draft' || jobposting.status === '0' || String(jobposting.status) === 'false') ? (
                                            <Upload className="h-4 w-4" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{(jobposting.status === 'draft' || jobposting.status === '0' || String(jobposting.status) === 'false') ? t('Publish') : t('Unpublish')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-job-postings') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('recruitment.job-postings.show', jobposting.id))} className="h-8 w-8 p-0 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-md transition-colors">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-job-postings') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('recruitment.job-postings.edit', jobposting.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-job-postings') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(jobposting.id)}
                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Delete')}</p>
                                </TooltipContent>
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
                { label: t('Job Postings') }
            ]}
            pageTitle={t('Manage Job Postings')}
            pageDescription={t('Manage recruitment postings, application details, and requirements.')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {dropboxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-job-postings') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.get(route('recruitment.job-postings.create'))}>
                                        <Plus className="h-4 w-4" />
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
            <Head title={t('Job Postings')} />

            <style>{`
                @keyframes wave-move {
                    0% { transform: translateX(0) translateZ(0) scaleY(1); }
                    50% { transform: translateX(-25%) translateZ(0) scaleY(0.8); }
                    100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
                }
                @keyframes bubble-up {
                    0% { top: 110%; opacity: 0; transform: scale(0.5); }
                    30% { opacity: 0.6; }
                    80% { opacity: 0.6; }
                    100% { top: -10%; opacity: 0; transform: scale(1.2); }
                }
                @keyframes bubble-down {
                    0% { top: -10%; opacity: 0; transform: scale(0.5); }
                    30% { opacity: 0.6; }
                    80% { opacity: 0.6; }
                    100% { top: 110%; opacity: 0; transform: scale(1.2); }
                }
                @keyframes bubble-right {
                    0% { left: -10%; opacity: 0; transform: scale(0.5); }
                    30% { opacity: 0.6; }
                    80% { opacity: 0.6; }
                    100% { left: 110%; opacity: 0; transform: scale(1.2); }
                }
                @keyframes bubble-left {
                    0% { left: 110%; opacity: 0; transform: scale(0.5); }
                    30% { opacity: 0.6; }
                    80% { opacity: 0.6; }
                    100% { left: -10%; opacity: 0; transform: scale(1.2); }
                }
                .animate-wave-1 {
                    animation: wave-move 12s linear infinite;
                }
                .animate-wave-2 {
                    animation: wave-move 8s linear infinite;
                }
                .animate-bubble-up {
                    animation: bubble-up 6s infinite ease-in-out;
                }
                .animate-bubble-down {
                    animation: bubble-down 7s infinite ease-in-out;
                }
                .animate-bubble-right {
                    animation: bubble-right 5s infinite ease-in-out;
                }
                .animate-bubble-left {
                    animation: bubble-left 8s infinite ease-in-out;
                }
            `}</style>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 p-3 flex flex-col justify-between h-[100px]">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 capitalize tracking-wider">{t('Total Jobs')}</span>
                        <Briefcase className="h-5 w-5 text-blue-700 dark:text-blue-300 opacity-80" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats?.all ?? 0}</div>
                        <p className="text-[10px] text-blue-700 dark:text-blue-400 opacity-80">{t('All time postings')}</p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 p-3 flex flex-col justify-between h-[100px]">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 capitalize tracking-wider">{t('Active Jobs')}</span>
                        <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.active ?? 0}</div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 opacity-80">
                            {stats?.all > 0 ? Math.round(((stats?.active ?? 0) / stats.all) * 100) : 0}% {t('of total')}
                        </p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 p-3 flex flex-col justify-between h-[100px]">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 capitalize tracking-wider">{t('Applications')}</span>
                        <Users className="h-5 w-5 text-amber-700 dark:text-amber-300 opacity-80" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats?.candidates ?? 0}</div>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 opacity-80">{t('Candidates applied')}</p>
                    </div>
                </Card>
                <Card
                    className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 dark:from-violet-950/20 dark:to-indigo-950/20 dark:border-violet-900/50 col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between p-3 group cursor-pointer h-[100px]"
                    onClick={() => {
                        const userSlug = auth.user?.slug ?? 'demo';
                        window.open(route('recruitment.frontend.careers.jobs.index', { userSlug }), '_blank');
                    }}
                >
                    {/* SVG Wave Backgrounds */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-65">
                        <svg className="absolute bottom-0 w-[200%] h-8 animate-wave-1 fill-violet-400/35 dark:fill-violet-800/40" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1150,90 1350,30 1500,60 L1500,120 L0,120 Z" />
                        </svg>
                        <svg className="absolute bottom-0 w-[200%] h-10 animate-wave-2 fill-indigo-400/35 dark:fill-indigo-800/40 opacity-70" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M0,50 C100,20 250,80 400,50 C550,20 700,80 850,50 C1000,20 1150,80 1300,50 L1300,120 L0,120 Z" />
                        </svg>
                    </div>

                    {/* Animated Bubbles from different directions */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        {bubbles.map((bubble) => (
                            <div key={bubble.id} className={bubble.className} style={bubble.style} />
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-row items-center justify-between h-full gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-950/60 rounded-lg">
                                <Globe className="h-5 w-5 text-violet-600 dark:text-violet-400 group-hover:rotate-12 transition-transform duration-300" />
                            </div>
                            <div>
                                <div className="text-[10px] font-semibold text-violet-800 dark:text-violet-400 capitalize tracking-wider">{t('Careers Page')}</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('Public Job Portal')}</div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{t('Manage public recruitment listings')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-violet-200 hover:border-violet-300 dark:border-violet-800 dark:hover:border-violet-750 bg-white/80 dark:bg-zinc-900/80 text-violet-700 dark:text-violet-300 text-xs font-semibold h-8 px-3 flex items-center gap-1.5 transition-colors z-20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const userSlug = auth.user?.slug ?? 'demo';
                                    const careerUrl = route('recruitment.frontend.careers.jobs.index', { userSlug });
                                    navigator.clipboard.writeText(careerUrl).then(() => {
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2500);
                                    });
                                }}
                            >
                                <Copy className="h-3.5 w-3.5" />
                                {copied ? t('Copied!') : t('Copy Link')}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="shadow-sm border border-gray-300 dark:border-zinc-800">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b border-gray-300 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.title}
                                onChange={(value) => setFilters({ ...filters, title: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Job Postings...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="recruitment.job-postings.index"
                                filters={filters}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.job_type_id !== 'all' ? filters.job_type_id : '', filters.location_id !== 'all' ? filters.location_id : '', filters.branch_id !== 'all' ? filters.branch_id : '', filters.status !== 'all' ? filters.status : ''].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Status Tabs Bar */}
                <CardContent className="px-6 py-0 border-b border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                            { key: 'all', label: t('All'), icon: Briefcase, count: stats?.all ?? 0 },
                            { key: 'draft', label: t('Draft'), icon: FileText, count: stats?.draft ?? 0 },
                            { key: 'active', label: t('Published'), icon: CheckCircle, count: stats?.active ?? 0 },
                            { key: 'closed', label: t('Closed'), icon: XCircle, count: stats?.closed ?? 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${activeTab === tab.key
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Job type')}</label>
                                <Select value={filters.job_type_id} onValueChange={(value) => setFilters({ ...filters, job_type_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Jobtypes')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Job Types')}</SelectItem>
                                        {filteredJobTypes?.map((jobType: any) => (
                                            <SelectItem key={jobType.id} value={jobType.id.toString()}>
                                                {jobType.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Location')}</label>
                                <Select value={filters.location_id} onValueChange={(value) => setFilters({ ...filters, location_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Locations')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Locations')}</SelectItem>
                                        {filteredLocations?.map((location: any) => (
                                            <SelectItem key={location.id} value={location.id.toString()}>
                                                {location.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Branch')}</label>
                                <Select value={filters.branch_id} onValueChange={(value) => setFilters({ ...filters, branch_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Branches')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Branches')}</SelectItem>
                                        {branches?.map((branch: any) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {branch.branch_name}
                                            </SelectItem>
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

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <div className="min-w-[800px]">
                            <DataTable
                                data={jobpostings?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={MegaphoneIcon}
                                        title={t('No Job Postings found')}
                                        description={t('Get started by creating your first Job Posting.')}
                                        hasFilters={!!(filters.title || filters.description || (filters.job_type_id !== 'all' && filters.job_type_id) || (filters.location_id !== 'all' && filters.location_id) || (filters.branch_id !== 'all' && filters.branch_id) || (filters.status !== 'all' && filters.status))}
                                        onClearFilters={clearFilters}
                                        createPermission="create-job-postings"
                                        onCreateClick={() => router.get(route('recruitment.job-postings.create'))}
                                        createButtonText={t('Create Job Posting')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={jobpostings || { data: [], links: [], meta: {} }}
                        routeName="recruitment.job-postings.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditJobPosting
                        jobposting={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>



            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Job Posting')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
