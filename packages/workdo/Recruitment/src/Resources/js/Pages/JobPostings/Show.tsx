import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { 
    Megaphone, 
    Calendar, 
    MapPin, 
    Building2, 
    DollarSign, 
    Clock, 
    Users, 
    FileText, 
    CheckCircle, 
    Check,
    Star, 
    Briefcase,
    HelpCircle,
    Activity,
    Info
} from 'lucide-react';
import { JobPosting, JobPostingShowProps } from './types';
import { formatCurrency, formatDate } from '@/utils/helpers';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function Show() {
    const { t } = useTranslation();
    const { jobposting, customQuestions: propCustomQuestions } = usePage<any>().props;

    const [customQuestions, setCustomQuestions] = useState<any[]>(propCustomQuestions || []);

    useEffect(() => {
        if (!propCustomQuestions && jobposting && jobposting.id) {
            axios.get(route('recruitment.job-postings.custom-questions', jobposting.id))
                .then(response => {
                    setCustomQuestions(response.data || []);
                })
                .catch(error => {
                    console.error("Error fetching custom questions:", error);
                });
        }
    }, [jobposting, propCustomQuestions]);

    const formatDateTime = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        try {
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) return dateStr;
            const timePart = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: false});
            return `${formatDate(dateStr)} ${timePart}`;
        } catch (e) {
            return dateStr;
        }
    };

    // FormBuilder-styled Badge status configurations (ring-1 ring-inset)
    const statusConfig: any = {
        "0": { 
            label: "Draft", 
            ringClass: "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 ring-gray-600/20 dark:ring-zinc-800" 
        },
        "1": { 
            label: "Published", 
            ringClass: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/30" 
        },
        "2": { 
            label: "Closed", 
            ringClass: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-500/30" 
        },
        "draft": { 
            label: "Draft", 
            ringClass: "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 ring-gray-600/20 dark:ring-zinc-800" 
        },
        "active": { 
            label: "Published", 
            ringClass: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/30" 
        },
        "closed": { 
            label: "Closed", 
            ringClass: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-500/30" 
        }
    };
    const statusInfo = statusConfig[jobposting.status] || { 
        label: jobposting.status || '-', 
        ringClass: 'bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 ring-gray-600/20' 
    };

    // Priority configurations mapping (ring-1 ring-inset)
    const priorityConfig: any = {
        "0": { label: t("Low"), class: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/30" },
        "1": { label: t("Medium"), class: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/30" },
        "2": { label: t("High"), class: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-500/30" }
    };
    const priorityInfo = priorityConfig[jobposting.priority] || { 
        label: jobposting.priority || '-', 
        class: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 ring-purple-600/20 dark:ring-purple-500/30" 
    };

    // Check if the application deadline has expired
    const isExpired = jobposting.application_deadline ? new Date(jobposting.application_deadline) < new Date() : false;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Job Postings'), url: route('recruitment.job-postings.index') },
                { label: jobposting.title }
            ]}
            pageTitle={jobposting.title}
            pageDescription={t('View full details, applicants, and activity for this job posting.')}
            backUrl={route('recruitment.job-postings.index')}
        >
            <Head title={`${t('Job Posting Details')} - ${jobposting.title}`} />

            <div className="space-y-6">
                {/* Header Card with job information pills */}
                <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 p-6 rounded-2xl">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{jobposting.title}</h2>
                            {(jobposting.is_featured === true || jobposting.is_featured == 1 || jobposting.is_featured === '1') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md ring-1 ring-inset bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/30">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                    {t('Featured')}
                                </span>
                            )}
                        </div>
                        
                        {/* Information pills row */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Job Type Pill */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-md ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30">
                                <Briefcase className="h-3.5 w-3.5" />
                                {jobposting.jobType?.name || jobposting.job_type?.name || '-'}
                            </span>

                            {/* Location Pill */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-md ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30">
                                <MapPin className="h-3.5 w-3.5" />
                                {jobposting.location?.name || '-'}
                            </span>

                            {/* Branch/Department Pill */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-md ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30">
                                <Building2 className="h-3.5 w-3.5" />
                                {jobposting.branch_name || '-'}
                            </span>

                            {/* Positions Pill */}
                            {jobposting.position && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-md ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30">
                                    <Users className="h-3.5 w-3.5" />
                                    {jobposting.position} {t('positions')}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Experience & Compensation Card */}
                        <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                    {t('Experience & Compensation')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left: Experience */}
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                                {t('Required Experience')}
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">
                                                {jobposting.min_experience || 0} - {jobposting.max_experience || 0} {t('years')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Salary Range */}
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                            <DollarSign className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                                {t('Salary Range')}
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">
                                                {formatCurrency(jobposting.min_salary) || 0} - {formatCurrency(jobposting.max_salary) || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Description Card */}
                        {jobposting.description && (
                            <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                        <FileText className="h-4 w-4 text-emerald-500" />
                                        {t('Job Description')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div 
                                        className="prose prose-zinc dark:prose-invert max-w-none text-sm text-gray-700 dark:text-zinc-300 leading-relaxed" 
                                        dangerouslySetInnerHTML={{ __html: jobposting.description }} 
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Requirements Card */}
                        {jobposting.requirements && (
                            <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        {t('Requirements')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div 
                                        className="prose prose-zinc dark:prose-invert max-w-none text-sm text-gray-700 dark:text-zinc-300 leading-relaxed" 
                                        dangerouslySetInnerHTML={{ __html: jobposting.requirements }} 
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Benefits Card */}
                        {jobposting.benefits && (
                            <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                        <Star className="h-4 w-4 text-emerald-500" />
                                        {t('Benefits')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div 
                                        className="prose prose-zinc dark:prose-invert max-w-none text-sm text-gray-700 dark:text-zinc-300 leading-relaxed" 
                                        dangerouslySetInnerHTML={{ __html: jobposting.benefits }} 
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Required Skills Card */}
                        {jobposting.skills && (
                            <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                        <Megaphone className="h-4 w-4 text-emerald-500" />
                                        {t('Required Skills')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(jobposting.skills) ? (
                                            jobposting.skills.map((skill: string, index: number) => (
                                                <span key={index} className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/30">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            jobposting.skills.split(',').map((skill: string, index: number) => (
                                                <span key={index} className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/30">
                                                    {skill.trim()}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Terms & Conditions Card */}
                        {jobposting.terms_condition && (
                            <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                        <FileText className="h-4 w-4 text-emerald-500" />
                                        {t('Terms & Conditions')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div 
                                        className="prose prose-zinc dark:prose-invert max-w-none text-sm text-gray-700 dark:text-zinc-300 leading-relaxed" 
                                        dangerouslySetInnerHTML={{ __html: jobposting.terms_condition }} 
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Summary & Dates (Sticky Column) */}
                    <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                        {/* Posting Status & Attributes */}
                        <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                    <Info className="h-4 w-4 text-emerald-500" />
                                    {t('Posting Status & Attributes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 divide-y divide-gray-100 dark:divide-zinc-800">
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Job Code')}</span>
                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-mono font-semibold ring-1 ring-inset bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 ring-gray-600/20 dark:ring-zinc-800">
                                        {jobposting.code || jobposting.posting_code || '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Status')}</span>
                                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusInfo.ringClass}`}>
                                        {t(statusInfo.label)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Priority')}</span>
                                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${priorityInfo.class}`}>
                                        {priorityInfo.label}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Featured Job')}</span>
                                    {(jobposting.is_featured === true || jobposting.is_featured == 1 || jobposting.is_featured === '1') ? (
                                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/30">
                                            <Check className="h-3 w-3" />
                                            {t('Yes')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-400 ring-gray-600/20 dark:ring-zinc-800">
                                            {t('No')}
                                        </span>
                                    )}
                                </div>
                                {jobposting.application_deadline && (
                                    <div className="flex items-center justify-between py-3">
                                        <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Application Deadline')}</span>
                                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/30">
                                            {formatDate(jobposting.application_deadline)}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Custom Questions Card */}
                        <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                    <HelpCircle className="h-4 w-4 text-emerald-500" />
                                    {t('Custom Questions')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {customQuestions.length > 0 ? (
                                    <div className="space-y-3">
                                        {customQuestions.map((question: any, index: number) => (
                                            <div 
                                                key={question.id || index}
                                                className="p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-start justify-between gap-3"
                                            >
                                                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 leading-normal">
                                                    {question.question}
                                                </span>
                                                {question.is_required && (
                                                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-500/30">
                                                        {t('Required')}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-400 dark:text-zinc-500 py-2 text-center">
                                        {t('No custom questions selected for this job posting.')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Important Dates Card */}
                        <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                    <Calendar className="h-4 w-4 text-emerald-500" />
                                    {t('Important Dates')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 divide-y divide-gray-100 dark:divide-zinc-800">
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Start Date')}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                        {jobposting.publish_date ? formatDate(jobposting.publish_date) : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Application Deadline')}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                        {jobposting.application_deadline ? formatDate(jobposting.application_deadline) : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Published Date')}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                        {jobposting.publish_date ? formatDate(jobposting.publish_date) : '-'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit Log Card */}
                        <Card className="border border-slate-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900/90 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-slate-300 dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/50">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-50">
                                    <Clock className="h-4 w-4 text-emerald-500" />
                                    {t('Audit Log')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 divide-y divide-gray-100 dark:divide-zinc-800">
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Created At')}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                        {formatDateTime(jobposting.created_at)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-500 dark:text-zinc-400">{t('Updated At')}</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                        {formatDateTime(jobposting.updated_at || jobposting.created_at)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
