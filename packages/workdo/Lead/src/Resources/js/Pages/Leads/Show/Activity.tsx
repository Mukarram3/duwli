import { useTranslation } from 'react-i18next';
import { CheckSquare, Mail, Phone, Users, MessageSquare, Upload, Activity as ActivityIcon, Clock } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { formatDate, formatDateTime } from '@/utils/helpers';
import { Lead } from '../types';

interface ActivityProps {
    lead: Lead;
}

export default function Activity({ lead }: ActivityProps) {
    const { t } = useTranslation();

    const getActivityConfig = (remark: string) => {
        let text = remark || '';
        try {
            const parsed = JSON.parse(remark);
            if (parsed.title) text = parsed.title;
        } catch {}
        const lowerRemark = text.toLowerCase();
        
        if (lowerRemark.includes('task')) {
            return {
                icon: <CheckSquare className="h-4 w-4" />,
                wrapperClass: "text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-900/50 dark:text-indigo-400"
            };
        }
        if (lowerRemark.includes('email')) {
            return {
                icon: <Mail className="h-4 w-4" />,
                wrapperClass: "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400"
            };
        }
        if (lowerRemark.includes('call')) {
            return {
                icon: <Phone className="h-4 w-4" />,
                wrapperClass: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-400"
            };
        }
        if (lowerRemark.includes('user')) {
            return {
                icon: <Users className="h-4 w-4" />,
                wrapperClass: "text-sky-600 border-sky-200 bg-sky-50 dark:bg-sky-950/40 dark:border-sky-900/50 dark:text-sky-400"
            };
        }
        if (lowerRemark.includes('discussion')) {
            return {
                icon: <MessageSquare className="h-4 w-4" />,
                wrapperClass: "text-teal-600 border-teal-200 bg-teal-50 dark:bg-teal-950/40 dark:border-teal-900/50 dark:text-teal-400"
            };
        }
        if (lowerRemark.includes('file') || lowerRemark.includes('upload')) {
            return {
                icon: <Upload className="h-4 w-4" />,
                wrapperClass: "text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-900/50 dark:text-purple-400"
            };
        }
        return {
            icon: <ActivityIcon className="h-4 w-4" />,
            wrapperClass: "text-slate-600 border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-900/50 dark:text-slate-400"
        };
    };

    let lastDate = '';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Activity')}</h3>
            </div>
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[75vh] rounded-none w-full p-2 bg-background">
                {lead.activities && lead.activities.length > 0 ? (
                    <div className="relative py-4 w-full">
                        {/* Vertical Timeline Line */}
                        <div className="absolute ltr:left-[128px] rtl:right-[128px] top-6 bottom-10 w-0.5 bg-border z-0" />

                        <div className="relative z-10 flex flex-col">
                            {lead.activities.map((activity: any, index: number) => {
                                const config = getActivityConfig(activity.remark);
                                const title = (() => {
                                    try {
                                        const parsed = JSON.parse(activity.remark || '{}');
                                        return parsed.title || 'Activity';
                                    } catch {
                                        return activity.remark || 'Activity';
                                    }
                                })();

                                const currentDate = formatDate(activity.created_at);
                                const showDate = currentDate !== lastDate;
                                if (showDate) {
                                    lastDate = currentDate;
                                }

                                return (
                                    <div key={index} className="flex items-start w-full group">
                                        {/* Date column */}
                                        <div className="w-28 ltr:text-right ltr:pr-6 rtl:text-left rtl:pl-6 font-bold text-xs text-muted-foreground pt-3.5 flex-shrink-0 select-none">
                                            {showDate ? currentDate : ''}
                                        </div>

                                        {/* Center Node column */}
                                        <div className="w-8 flex justify-center flex-shrink-0">
                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm bg-background z-10 transition-all duration-200 hover:scale-110 mt-2 ${config.wrapperClass}`}>
                                                {config.icon}
                                            </div>
                                        </div>

                                        {/* Content column (in card) */}
                                        <div className="flex-1 ltr:pl-6 rtl:pr-6 pb-6 min-w-0">
                                            <div className="bg-card border border-border/80 shadow-sm rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                                                <h4 className="text-sm font-semibold text-foreground leading-relaxed">
                                                    {title}
                                                </h4>
                                                <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 flex items-center gap-1.5 select-none">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDateTime(activity.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <NoRecordsFound
                            icon={ActivityIcon}
                            title={t('No Activities found')}
                            description={t('Activities will appear here when actions are performed.')}
                            className="h-auto"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}