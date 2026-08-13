import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { User, Calendar, FileText, UserX, CheckCircle2, XCircle, Download } from 'lucide-react';
import { Termination } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';

const getStatusBadge = (status: string, t: any) => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    {t('Approved')}
                </span>
            );
        case 'rejected':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
                    {t('Rejected')}
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                    {t('Pending')}
                </span>
            );
    }
};

interface ViewProps {
    termination: Termination;
}

export default function View({ termination }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <UserX className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {t('Termination Details')}
                            </DialogTitle>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(termination.status || 'pending', t)}
                    </div>
                </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
                {/* Employee Info Box */}
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                            {termination.employee?.avatar ? (
                                <img src={getImagePath(termination.employee.avatar)} alt={termination.employee.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                {termination.employee?.name || '-'}
                            </h3>
                            {termination.employee?.email && (
                                <p className="text-xs text-muted-foreground">{termination.employee.email}</p>
                            )}
                        </div>
                    </div>

                    {/* Rejected Stamp inside Employee Card when Rejected */}
                    {termination.status?.toLowerCase() === 'rejected' && (
                        <div className="flex-shrink-0 relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-red-600 dark:border-red-400 p-0.5 bg-red-100/40 dark:bg-red-950/40 rotate-[-12deg] shadow-sm select-none">
                            <div className="w-full h-full rounded-full border border-dashed border-red-600 dark:border-red-400 flex flex-col items-center justify-center p-1 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px]">
                                <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                                    <span className="text-[6px]">★</span>
                                    <XCircle className="w-3 h-3" />
                                    <span className="text-[6px]">★</span>
                                </div>
                                <span className="font-black text-[8px] text-red-700 dark:text-red-300 uppercase tracking-widest leading-none mt-0.5">
                                    {t('REJECTED')}
                                </span>
                                <span className="text-[6px] font-bold text-red-600/80 dark:text-red-400/80 tracking-tighter uppercase leading-none mt-0.5">
                                    {t('DECLINED')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Notice Date */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Notice Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {termination.notice_date ? formatDate(termination.notice_date) : '-'}
                        </p>
                    </div>

                    {/* Termination Date */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Termination Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {termination.termination_date ? formatDate(termination.termination_date) : '-'}
                        </p>
                    </div>

                    {/* Termination Type */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Termination Type')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {termination.termination_type?.termination_type || '-'}
                        </p>
                    </div>

                    {/* Document */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Document')}
                        </label>
                        <div>
                            {termination.document ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = getImagePath(termination.document);
                                        link.download = termination.document?.split('/').pop() || 'termination-document';
                                        link.click();
                                    }}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-0.5"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>{t('Download Document')}</span>
                                </button>
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reason Card */}
                {termination.reason && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Reason')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {termination.reason}
                        </p>
                    </div>
                )}

                {/* Description Card */}
                {termination.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {termination.description}
                        </p>
                    </div>
                )}

                {/* Approved By Box with Official Stamp (Shown only when approved) */}
                {termination.status?.toLowerCase() === 'approved' && (
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-4 relative overflow-hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                                {termination.approved_by?.avatar ? (
                                    <img src={getImagePath(termination.approved_by.avatar)} alt={termination.approved_by.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-xs font-medium text-emerald-800/70 dark:text-emerald-400/70 block capitalize tracking-wider">
                                    {t('Approved By')}
                                </span>
                                <p className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                                    {termination.approved_by?.name || t('Company Admin')}
                                </p>
                            </div>
                        </div>

                        {/* Official Approved Stamp Badge */}
                        <div className="flex-shrink-0 relative flex items-center justify-center w-16 h-16 rounded-full border-2 border-emerald-600 dark:border-emerald-400 p-0.5 bg-emerald-100/40 dark:bg-emerald-950/40 rotate-[-12deg] shadow-sm select-none">
                            <div className="w-full h-full rounded-full border border-dashed border-emerald-600 dark:border-emerald-400 flex flex-col items-center justify-center p-1 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px]">
                                <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="text-[7px]">★</span>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-[7px]">★</span>
                                </div>
                                <span className="font-black text-[9px] text-emerald-700 dark:text-emerald-300 uppercase tracking-widest leading-none mt-0.5">
                                    {t('APPROVED')}
                                </span>
                                <span className="text-[7px] font-bold text-emerald-600/80 dark:text-emerald-400/80 tracking-tighter uppercase leading-none mt-0.5">
                                    {t('VERIFIED')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}