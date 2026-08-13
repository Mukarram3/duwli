import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Calendar, FileText, User, Clock, MapPin, CheckCircle, Tag, Building2 } from 'lucide-react';
import { Event } from './types';
import { formatDate, formatTime } from '@/utils/helpers';

interface ViewProps {
    event: Event;
}

export default function View({ event }: ViewProps) {
    const { t } = useTranslation();

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
            case 'pending':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
            case 'reject':
            case 'rejected':
                return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20';
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';
        }
    };

    const isOverdue = event.end_date && new Date(event.end_date) < new Date();
    const eventTypeName = event.event_type?.event_type || (event as any).eventType?.event_type;
    const approvedByUser = event.approved_by || (event as any).approvedBy;

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {t('Event Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
                {/* Title Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Title')}
                    </label>
                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-snug">
                        {event.title || '-'}
                    </p>
                </div>

                {/* Event Type Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Event Type')}
                    </label>
                    <div>
                        {eventTypeName ? (
                            <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20">
                                {eventTypeName}
                            </span>
                        ) : '-'}
                    </div>
                </div>

                {/* Dates & Times Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Start Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {event.start_date ? formatDate(event.start_date) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('End Date')}
                        </label>
                        <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {event.end_date ? formatDate(event.end_date) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Start Time')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {event.start_time ? formatTime(event.start_time) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('End Time')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {event.end_time ? formatTime(event.end_time) : '-'}
                        </p>
                    </div>
                </div>

                {/* Location, Approved By & Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Location')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {event.location || '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Approved By')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {approvedByUser?.name || '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Status')}
                        </label>
                        <div>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(event.status)}`}>
                                {t(event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : '-')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Target Departments */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Departments')}
                    </label>
                    <div className="pt-1">
                        {event.departments && event.departments.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {event.departments.map((dept: any) => (
                                    <span key={dept.id} className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                                        {dept.department_name} {dept.branch?.branch_name ? `(${dept.branch.branch_name})` : ''}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                        )}
                    </div>
                </div>

                {/* Description Card */}
                {event.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}