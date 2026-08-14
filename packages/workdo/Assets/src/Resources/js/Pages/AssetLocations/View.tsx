import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building } from "lucide-react";
import { AssetLocation } from './types';

interface ViewProps {
    assetLocation: AssetLocation;
}

export default function View({ assetLocation }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-primary/10 rounded">
                        <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-semibold">{assetLocation.name}</DialogTitle>
                        <p className="text-xs text-muted-foreground">{t('Location Details')}</p>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="space-y-4 p-4">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{t('Code')}</span>
                        <span className="text-sm text-gray-900">{assetLocation.code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{t('Type')}</span>
                        <span className="text-sm text-gray-900 capitalize">{assetLocation.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{t('Status')}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assetLocation.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {assetLocation.is_active ? t('Active') : t('Inactive')}
                        </span>
                    </div>
                </div>

                {(assetLocation.address || assetLocation.city || assetLocation.state || assetLocation.country) && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Address')}</h3>
                        <div className="space-y-2">
                            {assetLocation.address && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Address')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.address}</span>
                                </div>
                            )}
                            {assetLocation.city && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('City')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.city}</span>
                                </div>
                            )}
                            {assetLocation.state && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('State')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.state}</span>
                                </div>
                            )}
                            {assetLocation.country && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Country')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.country}</span>
                                </div>
                            )}
                            {assetLocation.postal_code && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Postal Code')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.postal_code}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {(assetLocation.contact_person || assetLocation.contact_phone || assetLocation.contact_email) && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Contact')}</h3>
                        <div className="space-y-2">
                            {assetLocation.contact_person && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Person')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.contact_person}</span>
                                </div>
                            )}
                            {assetLocation.contact_phone && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Phone')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.contact_phone}</span>
                                </div>
                            )}
                            {assetLocation.contact_email && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">{t('Email')}</span>
                                    <span className="text-sm text-gray-900">{assetLocation.contact_email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {assetLocation.description && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Description')}</h3>
                        <p className="text-sm text-gray-700">{assetLocation.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
