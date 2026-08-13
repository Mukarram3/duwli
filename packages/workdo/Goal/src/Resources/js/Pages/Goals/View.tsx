import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { Goal } from './types';
import { cn } from '@/lib/utils';

const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        savings: 'Savings',
        expense_reduction: 'Expense Reduction',
        debt_reduction: 'Debt Reduction'
    };
    return labels[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getGoalTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        savings: 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-950/20 dark:text-pink-400 dark:ring-pink-800/30',
        expense_reduction: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/20 dark:text-orange-400 dark:ring-orange-800/30',
        debt_reduction: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/20 dark:text-purple-400 dark:ring-purple-800/30'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
};

interface ViewGoalProps {
    goal: Goal;
}

export default function View({ goal }: ViewGoalProps) {
    const { t } = useTranslation();

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30',
            active: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-800/30',
            draft: 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-zinc-800/40 dark:text-gray-400 dark:ring-zinc-700/30'
        };
        const colorClass = colors[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
        return (
            <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", colorClass)}>
                {t(status.charAt(0).toUpperCase() + status.slice(1))}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const colors: Record<string, string> = {
            critical: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-800/30',
            high: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/20 dark:text-orange-400 dark:ring-orange-800/30',
            medium: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-800/30',
            low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30'
        };
        const colorClass = colors[priority] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
        return (
            <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", colorClass)}>
                {t(priority.charAt(0).toUpperCase() + priority.slice(1))}
            </span>
        );
    };

    const progressPercentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

    return (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{t('Goal Details')} - {goal.goal_name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex justify-between items-center">
                            {t('Goal Information')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold">{t('Goal Name')}</span>
                                <p className="mt-1 text-gray-500">{goal.goal_name}</p>
                            </div>
                            <div>
                                <span className="font-semibold">{t('Category')}</span>
                                <p className="mt-1 text-gray-500">{goal.category?.category_name || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold">{t('Goal Type')}</span>
                                <div className="mt-1">
                                    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", getGoalTypeColor(goal.goal_type))}>
                                        {t(getGoalTypeLabel(goal.goal_type))}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="font-semibold">{t('Priority')}</span>
                                <div className="mt-1">{getPriorityBadge(goal.priority)}</div>
                            </div>
                            <div>
                                <span className="font-semibold">{t('Status')}</span>
                                <div className="mt-1">{getStatusBadge(goal.status)}</div>
                            </div>
                            <div>
                                <span className="font-semibold">{t('Chart of Account')}</span>
                                <p className="mt-1 text-gray-500">{goal.account?.account_name || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold">{t('Start Date')}</span>
                                <p className="mt-1 text-gray-500">{formatDate(goal.start_date)}</p>
                            </div>
                            <div>
                                <span className="font-semibold">{t('Target Date')}</span>
                                <p className="mt-1 text-gray-500">{formatDate(goal.target_date)}</p>
                            </div>
                        </div>
                        {goal.goal_description && (
                            <div className="text-sm mt-4">
                                <span className="font-semibold">{t('Description')}</span>
                                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{goal.goal_description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t('Financial Progress')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-semibold text-sm">{t('Target Amount')}</span>
                                    <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(goal.target_amount)}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-sm">{t('Current Amount')}</span>
                                    <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(goal.current_amount)}</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-sm">{t('Progress')}</span>
                                    <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/10">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-300",
                                            progressPercentage >= 100 || goal.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'
                                        )}
                                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DialogContent>
    );
}
