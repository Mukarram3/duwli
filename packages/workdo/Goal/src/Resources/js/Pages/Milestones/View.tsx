import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { Milestone } from './types';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewMilestoneProps {
    milestone: Milestone;
}

export default function View({ milestone }: ViewMilestoneProps) {
    const { t } = useTranslation();

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            achieved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30',
            pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-800/30',
            overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-800/30'
        };
        const colorClass = colors[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
        return (
            <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", colorClass)}>
                {t(status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1))}
            </span>
        );
    };

    return (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{t('Milestone Details')} - {milestone.milestone_name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
                <Card className="border border-border shadow-sm rounded-lg">
                    <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-base font-semibold">
                            {t('Milestone Information')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-muted-foreground block text-xs">{t('Milestone Name')}</span>
                                <p className="mt-1 text-foreground font-semibold text-base">{milestone.milestone_name}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-muted-foreground block text-xs">{t('Goal')}</span>
                                <p className="mt-1 text-foreground font-medium text-base">{milestone.goal?.goal_name || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-muted-foreground block text-xs">{t('Status')}</span>
                                <div className="mt-1">{getStatusBadge(milestone.status)}</div>
                            </div>
                            <div>
                                <span className="font-semibold text-muted-foreground block text-xs">{t('Target Date')}</span>
                                <div className="flex items-center gap-1.5 mt-1 text-sm font-medium">
                                    <Calendar className={cn("h-4 w-4 flex-shrink-0", milestone.status !== 'achieved' && new Date(milestone.target_date) < new Date() ? "text-rose-500" : "text-gray-400")} />
                                    <span className={cn(milestone.status !== 'achieved' && new Date(milestone.target_date) < new Date() ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-foreground")}>
                                        {formatDate(milestone.target_date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <span className="font-semibold text-muted-foreground block text-xs mb-2">{t('Progress Information')}</span>
                            <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 border border-border/50 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-muted-foreground text-xs">{t('Target Amount')}</span>
                                        <p className="text-lg font-bold text-primary mt-0.5">{formatCurrency(milestone.target_amount)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground text-xs">{t('Achieved Amount')}</span>
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(milestone.achieved_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground text-xs">{t('Progress')}</span>
                                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                                            {milestone.target_amount > 0 ? Math.min(Math.round(((milestone.achieved_amount || 0) / milestone.target_amount) * 100), 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3.5">
                                    <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-300",
                                                milestone.status === 'achieved' ? "bg-emerald-500" : "bg-primary"
                                            )}
                                            style={{
                                                width: `${milestone.target_amount > 0 ? Math.min(((milestone.achieved_amount || 0) / milestone.target_amount) * 100, 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>
                             </div>
                         </div>
                        {milestone.milestone_description && (
                            <div className="text-sm mt-4">
                                <span className="font-semibold text-muted-foreground block text-xs mb-1.5">{t('Description')}</span>
                                <p className="p-3 bg-slate-50 dark:bg-zinc-800/40 border border-border/50 rounded-xl text-foreground/80 leading-relaxed font-normal">{milestone.milestone_description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DialogContent>
    );
}
