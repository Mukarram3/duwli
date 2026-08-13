import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Calendar, Tag, FileText, Globe, Clock } from 'lucide-react';
import { Holiday } from './types';
import { formatDate } from '@/utils/helpers';

interface ViewProps {
    holiday: Holiday;
}

export default function View({ holiday }: ViewProps) {
    const { t } = useTranslation();

    const calculateDays = (startDate: string, endDate: string) => {
        if (!startDate || !endDate) return '-';
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} ${diffDays === 1 ? t('Day') : t('Days')}`;
    };

    const getHolidayTypeBadgeClass = (id?: number | string) => {
        const colorClasses = [
            'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20',
            'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20',
            'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
            'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
            'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
            'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20',
            'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-500/20',
            'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
            'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:ring-fuchsia-500/20',
            'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20',
        ];
        if (!id) return colorClasses[0];
        const numericId = typeof id === 'number' ? id : String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colorClasses[numericId % colorClasses.length];
    };

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {t('Holiday Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
                {/* Holiday Name Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Holiday Name')}
                    </label>
                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-snug">
                        {holiday.name || '-'}
                    </p>
                </div>

                {/* Holiday Type Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Holiday Type')}
                    </label>
                    <div>
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getHolidayTypeBadgeClass(holiday.holiday_type_id || holiday.holiday_type?.id || holiday.holiday_type?.holiday_type)}`}>
                            {holiday.holiday_type?.holiday_type || '-'}
                        </span>
                    </div>
                </div>

                {/* Dates & Duration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Start Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {holiday.start_date ? formatDate(holiday.start_date) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('End Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {holiday.end_date ? formatDate(holiday.end_date) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Total Days')}
                        </label>
                        <div>
                            <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                                {calculateDays(holiday.start_date, holiday.end_date)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status & Sync Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Paid Status')}
                        </label>
                        <div>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                holiday.is_paid 
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' 
                                    : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                            }`}>
                                {holiday.is_paid ? t('Paid') : t('Unpaid')}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Google Calendar Sync')}
                        </label>
                        <div>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                holiday.is_sync_google_calendar 
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' 
                                    : 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
                            }`}>
                                {holiday.is_sync_google_calendar ? t('Yes') : t('No')}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Outlook Calendar Sync')}
                        </label>
                        <div>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                holiday.is_sync_outlook_calendar 
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' 
                                    : 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
                            }`}>
                                {holiday.is_sync_outlook_calendar ? t('Yes') : t('No')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description Card */}
                {holiday.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {holiday.description}
                        </p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}