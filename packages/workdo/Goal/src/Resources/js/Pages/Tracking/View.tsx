import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Target, TrendingUp, Clock, DollarSign } from "lucide-react";
import { GoalTracking } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface ViewProps {
    tracking: GoalTracking;
}

export default function View() {
    const { t } = useTranslation();
    const { tracking } = usePage<ViewProps>().props;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ahead: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30',
            on_track: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-800/30',
            behind: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-800/30',
            critical: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-800/30'
        };
        return colors[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Goal'), url: route('goal.goals.index')},
                {label: t('Tracking'), url: route('goal.tracking.index')},
                {label: t('View')}
            ]}
            pageTitle={t('Tracking Details')}
            backUrl={route('goal.tracking.index')}
        >
            <Head title={t('Tracking Details')} />

            <div className="space-y-6 w-full">
                {/* Header Card */}
                <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                    <CardHeader className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl font-bold text-foreground">{tracking.goal?.goal_name}</CardTitle>
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground capitalize mt-1.5 flex items-center gap-1.5">
                                    <span>{t('Tracking Date')}:</span>
                                    <span className="text-foreground font-bold">{formatDate(tracking.tracking_date)}</span>
                                </p>
                            </div>
                            <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", getStatusColor(tracking.on_track_status))}>
                                {t(tracking.on_track_status.replace('_', ' ').charAt(0).toUpperCase() + tracking.on_track_status.replace('_', ' ').slice(1))}
                            </span>
                        </div>
                    </CardHeader>
                </Card>

                {/* Progress Overview */}
                <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                    <CardHeader className="p-6 pb-4 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            {t('Progress Overview')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 rounded-xl border border-border bg-muted/[0.02]">
                                <DollarSign className="h-7 w-7 text-primary mx-auto mb-2" />
                                <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide">{t('Target Amount')}</p>
                                <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(tracking.goal?.target_amount || 0)}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl border border-border bg-muted/[0.02]">
                                <Target className="h-7 w-7 text-primary mx-auto mb-2" />
                                <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide">{t('Current Amount')}</p>
                                <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(tracking.current_amount)}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl border border-border bg-muted/[0.02]">
                                <TrendingUp className="h-7 w-7 text-primary mx-auto mb-2" />
                                <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide">{t('Progress')}</p>
                                <p className="text-xl font-bold text-foreground mt-1">{tracking.progress_percentage}%</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2 mt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('Progress')}</span>
                                <span className="font-semibold text-foreground">{tracking.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-primary h-full rounded-full transition-all duration-300" 
                                    style={{ width: `${Math.min(tracking.progress_percentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tracking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Financial Details */}
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="p-6 pb-4 border-b border-border">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                                <DollarSign className="h-5 w-5 text-primary" />
                                {t('Financial Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">{t('Previous Amount')}</span>
                                <span className="font-semibold text-foreground">{formatCurrency(tracking.previous_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">{t('Contribution Amount')}</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(tracking.contribution_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">{t('Current Amount')}</span>
                                <span className="font-bold text-foreground text-base">{formatCurrency(tracking.current_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">{t('Remaining Amount')}</span>
                                <span className="font-semibold text-primary">
                                    {formatCurrency(Math.max(0, (tracking.goal?.target_amount || 0) - tracking.current_amount))}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline Details */}
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="p-6 pb-4 border-b border-border">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                                <Clock className="h-5 w-5 text-primary" />
                                {t('Timeline Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">{t('Tracking Date')}</span>
                                <span className="font-semibold text-foreground">{formatDate(tracking.tracking_date)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">{t('Days Remaining')}</span>
                                <span className={cn(
                                    "font-semibold",
                                    tracking.days_remaining < 0 
                                        ? 'text-rose-600 dark:text-rose-400' 
                                        : tracking.days_remaining < 30 
                                            ? 'text-amber-600 dark:text-amber-400' 
                                            : 'text-emerald-600 dark:text-emerald-400'
                                )}>
                                    {tracking.days_remaining < 0 
                                        ? t('Overdue by {{days}} days', { days: Math.abs(tracking.days_remaining) }) 
                                        : t('{{days}} days', { days: tracking.days_remaining })}
                                </span>
                            </div>
                            {tracking.projected_completion_date && (
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-sm text-muted-foreground">{t('Projected Completion')}</span>
                                    <span className="font-semibold text-foreground">{formatDate(tracking.projected_completion_date)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">{t('Status')}</span>
                                <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", getStatusColor(tracking.on_track_status))}>
                                    {t(tracking.on_track_status.replace('_', ' ').charAt(0).toUpperCase() + tracking.on_track_status.replace('_', ' ').slice(1))}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Goal Information */}
                {tracking.goal && (
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="p-6 pb-4 border-b border-border">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                {t('Goal Information')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border-b border-border md:border-b-0 pb-3 md:pb-0">
                                    <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide mb-1.5">{t('Goal Name')}</p>
                                    <p className="font-semibold text-foreground text-sm">{tracking.goal.goal_name}</p>
                                </div>
                                <div className="border-b border-border md:border-b-0 pb-3 md:pb-0">
                                    <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide mb-1.5">{t('Goal Type')}</p>
                                    <p className="font-semibold text-foreground text-sm capitalize">{tracking.goal.goal_type?.replace('_', ' ')}</p>
                                </div>
                                <div className="border-b border-border md:border-b-0 pb-3 md:pb-0">
                                    <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide mb-1.5">{t('Start Date')}</p>
                                    <p className="font-semibold text-foreground text-sm">{formatDate(tracking.goal.start_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide mb-1.5">{t('Target Date')}</p>
                                    <p className="font-semibold text-foreground text-sm">{formatDate(tracking.goal.target_date)}</p>
                                </div>
                            </div>
                            {tracking.goal.goal_description && (
                                <div className="pt-4 border-t border-border">
                                    <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide mb-1.5">{t('Description')}</p>
                                    <p className="text-sm text-foreground leading-relaxed">{tracking.goal.goal_description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}