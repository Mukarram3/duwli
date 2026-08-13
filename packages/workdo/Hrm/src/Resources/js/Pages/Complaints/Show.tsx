import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Calendar, FileText, MessageSquareWarning, UserCheck, Tag, Download } from 'lucide-react';
import { Complaint } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';

interface ShowComplaintProps {
    complaint: Complaint;
    onClose?: () => void;
}

const getStatusBadge = (status: string, t: any) => {
    const normalized = status?.toLowerCase() || '';
    switch (normalized) {
        case 'resolved':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    {t('Resolved')}
                </span>
            );
        case 'in review':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                    {t('In Review')}
                </span>
            );
        case 'assigned':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20">
                    {t('Assigned')}
                </span>
            );
        case 'in progress':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20">
                    {t('In Progress')}
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

export default function Show({ complaint }: ShowComplaintProps) {
    const { t } = useTranslation();
    const againstObj = typeof complaint.against_employee === 'object' && complaint.against_employee !== null ? complaint.against_employee : complaint.againstEmployee;
    const typeObj = typeof complaint.complaint_type === 'object' && complaint.complaint_type !== null ? complaint.complaint_type : complaint.complaintType;
    const resolvedByObj = typeof complaint.resolved_by === 'object' && complaint.resolved_by !== null ? complaint.resolved_by : (complaint.resolvedBy || complaint.resolved_by_user);

    return (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <MessageSquareWarning className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {t('Complaint Details')}
                            </DialogTitle>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(complaint.status || 'pending', t)}
                    </div>
                </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
                {/* Employee vs Against Employee Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reporting Employee Box */}
                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                            {complaint.employee?.avatar ? (
                                <img src={getImagePath(complaint.employee.avatar)} alt={complaint.employee.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 capitalize tracking-wider block">
                                {t('Employee')}
                            </span>
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                {complaint.employee?.name || '-'}
                            </h3>
                            {complaint.employee?.email && (
                                <p className="text-xs text-muted-foreground">{complaint.employee.email}</p>
                            )}
                        </div>
                    </div>

                    {/* Against Employee Box */}
                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                            {againstObj?.avatar ? (
                                <img src={getImagePath(againstObj.avatar)} alt={againstObj.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 capitalize tracking-wider block">
                                {t('Against Employee')}
                            </span>
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                {againstObj?.name || '-'}
                            </h3>
                            {againstObj?.email && (
                                <p className="text-xs text-muted-foreground">{againstObj.email}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Complaint Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Complaint Type Card */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Complaint Type')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {typeObj?.complaint_type || '-'}
                        </p>
                    </div>

                    {/* Complaint Date Card */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Complaint Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {complaint.complaint_date ? formatDate(complaint.complaint_date) : '-'}
                        </p>
                    </div>

                    {/* Resolved By Card */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <UserCheck className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Resolved By')}
                        </label>
                        <div className="flex items-center gap-2 pt-0.5">
                            {resolvedByObj?.avatar && (
                                <img src={getImagePath(resolvedByObj.avatar)} alt={resolvedByObj.name} className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {resolvedByObj?.name || '-'}
                            </span>
                        </div>
                    </div>

                    {/* Resolution Date Card */}
                    {complaint.resolution_date && (
                        <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                {t('Resolution Date')}
                            </label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(complaint.resolution_date)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Subject Card */}
                {complaint.subject && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Subject')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {complaint.subject}
                        </p>
                    </div>
                )}

                {/* Description Card */}
                {complaint.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {complaint.description}
                        </p>
                    </div>
                )}

                {/* Document Download Card */}
                {complaint.document && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Document')}
                        </label>
                        <div>
                            <button
                                type="button"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = getImagePath(complaint.document);
                                    link.download = complaint.document?.split('/').pop() || 'complaint-document';
                                    link.click();
                                }}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-0.5"
                            >
                                <Download className="h-4 w-4" />
                                <span>{t('Download Document')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}