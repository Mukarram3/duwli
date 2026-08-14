import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileImage, Package, Info, DollarSign, Calendar, MapPin, Hash, Tag } from 'lucide-react';
import { formatDate, getImagePath, formatCurrency } from '@/utils/helpers';
import { Asset } from './types';

interface ViewProps {
    asset: Asset;
}

export default function View({ asset }: ViewProps) {
    const { t } = useTranslation();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-red-100 text-red-800';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">{asset.name}</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">{t('Asset Details')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            <Hash className="w-3 h-3 mr-1" />
                            {asset.serial_code || t('No Serial')}
                        </Badge>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Asset Image and Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image */}
                    <Card className="flex flex-col shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <FileImage className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-gray-900">{t('Asset Image')}</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 h-full">
                            <div className="flex justify-center h-full">
                                {asset.image ? (
                                    <img 
                                        src={getImagePath(asset.image)} 
                                        alt={asset.name} 
                                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm" 
                                        onClick={() => window.open(getImagePath(asset.image), '_blank')} 
                                    />
                                ) : (
                                    <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                        <FileImage className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-gray-900">{t('Basic Information')}</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Asset Name')}</span>
                                    <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{asset.name}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {t('Category')}
                                    </span>
                                    <span className="text-sm text-gray-900 text-right">{asset.category?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {t('Location')}
                                    </span>
                                    <span className="text-sm text-gray-900 text-right">{asset.location?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-gray-600 font-medium">{t('Quantity')}</span>
                                    <Badge variant="secondary">{asset.quantity || 0}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Information */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-gray-900">{t('Financial Information')}</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 font-medium">{t('Unit Price')}</span>
                                        <span className="text-lg font-bold text-green-800">
                                            {asset.unit_price ? formatCurrency(asset.unit_price) : '-'}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700 font-medium">{t('Purchase Cost')}</span>
                                        <span className="text-lg font-bold text-blue-800">
                                            {asset.purchase_cost ? formatCurrency(asset.purchase_cost) : '-'}
                                        </span>
                                    </div>
                                </div>
                                <div className="border rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 font-medium">{t('Warranty Period')}</span>
                                        <span className="text-sm font-semibold text-gray-900">{asset.warranty_period || '-'}</span>
                                    </div>
                                </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {asset.purchase_date && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-blue-700">{t('Purchase Date')}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-blue-900">{formatDate(asset.purchase_date)}</p>
                                </div>
                            )}
                            
                            {asset.supported_date && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-green-700">{t('Supported Date')}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-green-900">{formatDate(asset.supported_date)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                {asset.description && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <FileImage className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-gray-900">{t('Description')}</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-700 leading-relaxed">{asset.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DialogContent>
    );
}