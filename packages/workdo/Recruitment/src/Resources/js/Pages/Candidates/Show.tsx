import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Separator } from '@/components/ui/separator';
import {
    Mail, Phone, MapPin, Briefcase, DollarSign, Calendar,
    FileText, Download, User, Hash, Clock, Building2,
    MessageSquare, CheckCircle2, Link2, Linkedin
} from 'lucide-react';
import { Candidate, CandidateShowProps } from './types';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import GenerateAvatar from '@/components/generate-avatar';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

export default function Show() {
    const { t } = useTranslation();
    const { candidate, customQuestions } = usePage<CandidateShowProps>().props;
    const pageProps = usePage().props as any;
    const { imageUrlPrefix } = pageProps;

    const downloadFile = (filePath: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = `${imageUrlPrefix}/${filePath}`;
        link.download = filePath.split('/').pop() || fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const statusOptions: any = { "0": "New", "1": "Screening", "2": "Interview", "3": "Offer", "4": "Hired", "5": "Rejected" };
    const statusConfig: any = {
        "0": { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "ring-blue-600/20 dark:ring-blue-500/30" },
        "1": { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "ring-amber-600/20 dark:ring-amber-500/30" },
        "2": { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "ring-indigo-600/20 dark:ring-indigo-500/30" },
        "3": { bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "ring-orange-600/20 dark:ring-orange-500/30" },
        "4": { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "ring-emerald-600/20 dark:ring-emerald-500/30" },
        "5": { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "ring-red-600/20 dark:ring-red-500/30" },
    };

    const candidateAnswers = (() => {
        try {
            return candidate.custom_question ? JSON.parse(candidate.custom_question) : {};
        } catch (error) {
            return {};
        }
    })();

    const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'N/A';
    const location = [candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ');
    const statusLabel = statusOptions[candidate.status] || candidate.status || 'Unknown';
    const statusStyle = statusConfig[candidate.status] || { bg: "bg-zinc-50 dark:bg-zinc-500/10", text: "text-zinc-700 dark:text-zinc-400", border: "ring-zinc-600/20 dark:ring-zinc-500/30" };

    const SectionHeading = ({ icon: Icon, title }: { icon: any; title: string }) => (
        <div className="flex items-center gap-2 mb-3">
            <Icon className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
    );

    const DetailItem = ({ label, value }: { label: string; value?: React.ReactNode }) => (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value || '-'}</p>
        </div>
    );

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Candidates'), url: route('recruitment.candidates.index') },
                { label: t('Candidate Details') },
            ]}
            pageTitle={t('Candidate Details')}
            pageDescription={`${fullName} · ${t('Candidate profile')}`}
            backUrl={route('recruitment.candidates.index')}
        >
            <Head title={`${t('Candidate Details')} - ${fullName}`} />

            {/* Centered container matching reference width */}
            <div className="max-w-5xl mx-auto">
                <div className="bg-card rounded-2xl border border-gray-300 dark:border-zinc-600 shadow-md overflow-hidden">

                    {/* ══ HEADER ══ */}
                    <div className="px-6 pt-6 pb-5 border-b border-gray-300 dark:border-zinc-600">
                        {/* Avatar + Name + Status */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {/* Square avatar */}
                                <div className="w-[72px] h-[72px] rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                                    {candidate.profile_path ? (
                                        <img
                                            src={getImagePath(candidate.profile_path)}
                                            alt={fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <GenerateAvatar name={fullName} className="w-full h-full rounded-none text-2xl font-bold" />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-foreground leading-tight">{fullName}</h1>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {[candidate.current_position, candidate.current_company]
                                            .filter(Boolean).join(' · ')
                                            || (candidate as any).job_posting?.title
                                            || ''}
                                    </p>
                                </div>
                            </div>
                            {/* Status badge */}
                            <BadgeUI className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                {t(statusLabel)}
                            </BadgeUI>
                        </div>

                        {/* Contact row — no location here, it's shown in Address section */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                            {candidate.email && (
                                <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{candidate.email}</span>
                                </a>
                            )}
                            {candidate.phone && (
                                <a href={`tel:${candidate.phone}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{candidate.phone}</span>
                                </a>
                            )}
                            {candidate.linkedin_url && (
                                <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <Linkedin className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{t('LinkedIn')}</span>
                                </a>
                            )}
                            {candidate.portfolio_url && (
                                <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{t('Portfolio')}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* ══ BODY: 2-COLUMN ══ */}
                    <div className="flex flex-col lg:flex-row">

                        {/* ── LEFT PANEL ── */}
                        <div className="lg:w-[38%] border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-gray-300 dark:border-zinc-600 p-6 space-y-5">

                            {/* Applied For — shows job posting details only */}
                            <div>
                                <SectionHeading icon={Briefcase} title={t('Applied For')} />
                                {(candidate as any).job_posting?.title ? (
                                    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-800/40 p-4 space-y-2">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{(candidate as any).job_posting.title}</p>
                                            {(candidate as any).job_posting?.posting_code && (
                                                <p className="text-xs font-mono text-muted-foreground mt-0.5">{(candidate as any).job_posting.posting_code}</p>
                                            )}
                                        </div>
                                        {(candidate as any).job_posting?.jobType?.name && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>{(candidate as any).job_posting.jobType.name}</span>
                                            </div>
                                        )}
                                        {(candidate as any).job_posting?.location?.name && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>{(candidate as any).job_posting.location.name}</span>
                                            </div>
                                        )}
                                        {(candidate as any).job_posting?.branch?.branch_name && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>{(candidate as any).job_posting.branch.branch_name}</span>
                                            </div>
                                        )}
                                        {((candidate as any).job_posting?.min_experience || (candidate as any).job_posting?.max_experience) && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>
                                                    {(candidate as any).job_posting.min_experience}
                                                    {(candidate as any).job_posting.max_experience ? ` - ${(candidate as any).job_posting.max_experience}` : '+'} {t('yrs exp')}
                                                </span>
                                            </div>
                                        )}
                                        {(candidate as any).job_posting?.position && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>{(candidate as any).job_posting.position} {t('position(s)')}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t('No job applied')}</p>
                                )}
                            </div>

                            <Separator className="bg-gray-200 dark:bg-zinc-700" />

                            {/* Salary */}
                            <div>
                                <SectionHeading icon={DollarSign} title={t('Salary')} />
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('Current')}</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            {candidate.current_salary ? formatCurrency(candidate.current_salary) : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('Expected')}</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            {candidate.expected_salary ? formatCurrency(candidate.expected_salary) : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-gray-200 dark:bg-zinc-700" />

                            {/* Application */}
                            <div>
                                <SectionHeading icon={Calendar} title={t('Application')} />
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('Applied')}</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            {candidate.application_date ? formatDate(candidate.application_date) : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('Source')}</p>
                                        <div className="mt-1">
                                            {(candidate as any).candidate_source?.name
                                                ? <RandomBadgeUI name={(candidate as any).candidate_source.name} />
                                                : <span className="text-sm font-semibold text-foreground">-</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            {candidate.skills && (
                                <>
                                    <Separator className="bg-gray-200 dark:bg-zinc-700" />
                                    <div>
                                        <SectionHeading icon={FileText} title={t('Skills')} />
                                        <div className="flex flex-wrap gap-1.5">
                                            {candidate.skills.split(',').map((skill: string, i: number) =>
                                                skill.trim() ? (
                                                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/20 text-xs font-medium text-primary dark:bg-primary/10">
                                                        {skill.trim()}
                                                    </span>
                                                ) : null
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Education */}
                            {candidate.education && (
                                <>
                                    <Separator className="bg-gray-200 dark:bg-zinc-700" />
                                    <div>
                                        <SectionHeading icon={FileText} title={t('Education')} />
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{candidate.education}</p>
                                    </div>
                                </>
                            )}

                            {/* Notes */}
                            {candidate.notes && (
                                <>
                                    <Separator className="bg-gray-200 dark:bg-zinc-700" />
                                    <div>
                                        <SectionHeading icon={CheckCircle2} title={t('Notes')} />
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{candidate.notes}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ── RIGHT PANEL ── */}
                        <div className="flex-1 p-6 space-y-6">

                            {/* Personal Details */}
                            <div>
                                <SectionHeading icon={User} title={t('Personal Details')} />
                                <Separator className="mb-4 bg-gray-200 dark:bg-zinc-700" />
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <DetailItem label={t('Gender')} value={candidate.gender ? t(candidate.gender.charAt(0).toUpperCase() + candidate.gender.slice(1)) : '-'} />
                                    <DetailItem label={t('Date of Birth')} value={candidate.dob ? formatDate(candidate.dob) : '-'} />
                                    <DetailItem label={t('Notice Period')} value={candidate.notice_period || '-'} />
                                    <DetailItem label={t('Experience')} value={candidate.experience_years ? `${candidate.experience_years} ${t('years')}` : '-'} />
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <SectionHeading icon={MapPin} title={t('Address')} />
                                <Separator className="mb-4 bg-gray-200 dark:bg-zinc-700" />
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <DetailItem label={t('City')} value={candidate.city || '-'} />
                                    <DetailItem label={t('State')} value={candidate.state || '-'} />
                                    <DetailItem label={t('Country')} value={candidate.country || '-'} />
                                </div>
                            </div>

                            {/* Screening Questions */}
                            {Object.keys(candidateAnswers).length > 0 && (
                                <div>
                                    <SectionHeading icon={MessageSquare} title={t('Screening Questions')} />
                                    <Separator className="mb-4 bg-gray-200 dark:bg-zinc-700" />
                                    <div className="space-y-3">
                                        {Object.entries(candidateAnswers).map(([questionId, answer]) => {
                                            const questionIdNum = questionId.replace('custom_question_', '');
                                            const questionText = (customQuestions as any)?.[questionIdNum]?.question || `${t('Question')} #${questionIdNum}`;
                                            return (
                                                <div key={questionId}>
                                                    <p className="text-sm font-semibold text-foreground">{questionText}</p>
                                                    <p className="text-sm text-muted-foreground mt-0.5">{answer as string || '-'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Documents */}
                            {(candidate.resume_path || candidate.cover_letter_path) && (
                                <div>
                                    <SectionHeading icon={FileText} title={t('Documents')} />
                                    <Separator className="mb-4 bg-gray-200 dark:bg-zinc-700" />
                                    <div className="space-y-2">
                                        {candidate.resume_path && (
                                            <button
                                                onClick={() => downloadFile(candidate.resume_path, 'resume')}
                                                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-700/60 hover:border-gray-300 dark:hover:border-zinc-600 transition-all group text-start"
                                            >
                                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex-shrink-0">
                                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground">{t('Resume')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('Click to download')}</p>
                                                </div>
                                                <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                            </button>
                                        )}
                                        {candidate.cover_letter_path && (
                                            <button
                                                onClick={() => downloadFile(candidate.cover_letter_path, 'cover_letter')}
                                                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-700/60 hover:border-gray-300 dark:hover:border-zinc-600 transition-all group text-start"
                                            >
                                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex-shrink-0">
                                                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground">{t('Cover Letter')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('Click to download')}</p>
                                                </div>
                                                <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
