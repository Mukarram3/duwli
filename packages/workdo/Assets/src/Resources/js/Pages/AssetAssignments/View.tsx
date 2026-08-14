import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileImage, Package, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate, getImagePath, formatCurrency } from '@/utils/helpers';

interface AssetAssignment {
    id: number;
    asset: {
        id: number;
        name: string;
        image?: string;
        serial_code?: string;
        category?: {
            name: string;
        };
    };
    user: {
        id: number;
        name: string;
        email: string;
    };
    assigned_date: string;
    expected_return_date?: string;
    returned_date?: string;
    status: 'active' | 'returned' | 'overdue';
    condition_on_assignment: 'excellent' | 'good' | 'fair' | 'poor';
    condition_on_return?: 'excellent' | 'good' | 'fair' | 'poor';
    assignment_notes?: string;
    return_notes?: string;
    assigned_by: {
        name: string;
    };
    returned_by?: {
        name: string;
    };
}

interface ViewProps {
    assignment: AssetAssignment;
}

export default function View({ assignment }: ViewProps) {
    const { t } = useTranslation();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-100 text-blue-800';
            case 'returned': return 'bg-green-100 text-green-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'excellent': return 'text-green-600 bg-green-50';
            case 'good': return 'text-blue-600 bg-blue-50';
            case 'fair': return 'text-yellow-600 bg-yellow-50';
            case 'poor': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">{t('Assignment Details')}</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {assignment.asset.name} → {assignment.user.name}
                            </p>
                        </div>
                    </div>
                    <Badge className={`${getStatusColor(assignment.status)}`}>
                        {assignment.status === 'active' && <Clock className="w-3 h-3 mr-1" />}
                        {assignment.status === 'returned' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {assignment.status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {t(assignment.status)}
                    </Badge>
                </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Asset and User Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-gray-900">{t('Asset Information')}</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Asset Name')}</span>
                                    <span className="text-sm font-semibold text-gray-900 text-right">{assignment.asset.name}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Serial Code')}</span>
                                    <span className="text-sm text-gray-900 text-right">{assignment.asset.serial_code || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Category')}</span>
                                    <span className="text-sm text-gray-900 text-right">{assignment.asset.category?.name || '-'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-gray-900">{t('Assignment Information')}</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Assigned To')}</span>
                                    <span className="text-sm font-semibold text-gray-900 text-right">{assignment.user.name}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Email')}</span>
                                    <span className="text-sm text-gray-900 text-right">{assignment.user.email}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Assigned By')}</span>
                                    <span className="text-sm text-gray-900 text-right">{assignment.assigned_by.name}</span>
                                </div>
                                {assignment.returned_by && (
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm text-gray-600 font-medium">{t('Returned By')}</span>
                                        <span className="text-sm text-gray-900 text-right">{assignment.returned_by.name}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-gray-900">{t('Timeline')}</h3>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-blue-700">{t('Assigned Date')}</span>
                                </div>
                                <p className="text-sm font-semibold text-blue-900">{formatDate(assignment.assigned_date)}</p>
                            </div>

                            {assignment.expected_return_date && (
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-yellow-700">{t('Expected Return')}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-yellow-900">{formatDate(assignment.expected_return_date)}</p>
                                </div>
                            )}

                            {assignment.returned_date && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-green-700">{t('Returned Date')}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-green-900">{formatDate(assignment.returned_date)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                {(assignment.assignment_notes || assignment.return_notes) && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <FileImage className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-gray-900">{t('Notes')}</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                {assignment.assignment_notes && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('Assignment Notes')}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{assignment.assignment_notes}</p>
                                    </div>
                                )}
                                {assignment.return_notes && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('Return Notes')}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{assignment.return_notes}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DialogContent>
    );
}
