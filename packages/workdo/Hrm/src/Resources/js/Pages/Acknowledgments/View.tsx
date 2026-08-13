import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { FileCheck, User, FileText, Calendar, CheckCircle } from 'lucide-react';
import { Acknowledgment } from './types';
import { formatDate } from '@/utils/helpers';

interface ViewProps {
    acknowledgment: Acknowledgment;
}

export default function View({ acknowledgment }: ViewProps) {
    const { t } = useTranslation();

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'acknowledged':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
            case 'pending':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';
        }
    };

    const assignedByName = (acknowledgment.assignedBy || acknowledgment.assigned_by as any)?.name || '-';

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {t('Acknowledgment Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
                {/* Employee Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Employee')}
                    </label>
                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                        {acknowledgment.employee?.name || '-'}
                    </p>
                </div>

                {/* Document Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Document')}
                    </label>
                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                        {acknowledgment.document?.title || '-'}
                    </p>
                </div>

                {/* Assigned By, Acknowledged At & Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Assigned By')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {assignedByName}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Acknowledged At')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {acknowledgment.acknowledged_at ? formatDate(acknowledgment.acknowledged_at) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Status')}
                        </label>
                        <div>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(acknowledgment.status)}`}>
                                {t(acknowledgment.status === 'pending' ? 'Pending' : acknowledgment.status === 'acknowledged' ? 'Acknowledged' : acknowledgment.status || '-')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Acknowledgment Note Card */}
                {acknowledgment.acknowledgment_note && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Acknowledgment Note')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {acknowledgment.acknowledgment_note}
                        </p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}