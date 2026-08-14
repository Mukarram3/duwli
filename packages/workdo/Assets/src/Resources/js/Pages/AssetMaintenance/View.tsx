import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Wrench } from "lucide-react";
import { formatDate, formatCurrency } from '@/utils/helpers';
import { AssetMaintenance } from './types';

interface ViewProps {
    maintenance: AssetMaintenance;
}

export default function View({ maintenance }: ViewProps) {
    const { t } = useTranslation();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800';
            case 'medium': return 'bg-blue-100 text-blue-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'critical': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-primary/10 rounded">
                        <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-semibold">{maintenance.title}</DialogTitle>
                        <p className="text-xs text-muted-foreground">{t('Maintenance Details')}</p>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="space-y-4 p-4">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{t('Asset')}</span>
                        <span className="text-sm text-gray-900">{maintenance.asset?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{t('Type')}</span>
                        <span className="text-sm text-gray-900 capitalize">{maintenance.maintenance_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{t('Status')}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(maintenance.status)}`}>
                            {t(maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1))}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{t('Priority')}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(maintenance.priority)}`}>
                            {t(maintenance.priority.charAt(0).toUpperCase() + maintenance.priority.slice(1))}
                        </span>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Schedule')}</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">{t('Scheduled Date')}</span>
                            <span className="text-sm text-gray-900">{formatDate(maintenance.scheduled_date)}</span>
                        </div>
                        {maintenance.completed_date && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">{t('Completed Date')}</span>
                                <span className="text-sm text-gray-900">{formatDate(maintenance.completed_date)}</span>
                            </div>
                        )}
                        {maintenance.next_maintenance_date && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">{t('Next Maintenance')}</span>
                                <span className="text-sm text-gray-900">{formatDate(maintenance.next_maintenance_date)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {(maintenance.cost || maintenance.technician_name) && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Details')}</h3>
                        <div className="space-y-2">
                            {maintenance.cost && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Cost')}</span>
                                    <span className="text-sm text-gray-900 font-medium">{formatCurrency(maintenance.cost)}</span>
                                </div>
                            )}
                            {maintenance.technician_name && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Technician')}</span>
                                    <span className="text-sm text-gray-900">{maintenance.technician_name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {maintenance.description && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Description')}</h3>
                        <p className="text-sm text-gray-700">{maintenance.description}</p>
                    </div>
                )}

                {maintenance.notes && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Notes')}</h3>
                        <p className="text-sm text-gray-700">{maintenance.notes}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}