import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { getAdminSetting, getCompanySetting, getPackageFavicon } from '@/utils/helpers';

export const paymentMethodBtn = (data?: any) => {
    const { t } = useTranslation();
    const mercadoEnabled = getAdminSetting('mercado_enabled');

    if (mercadoEnabled === 'on') {
        return [{
            id: 'mercado-payment',
            dataUrl: route('mercado.plan.store'),
            onFormSubmit: data?.onFormSubmit,
            component: (
                <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg w-full">
                    <RadioGroupItem value="mercado" id="mercado" />
                    <Label htmlFor="mercado" className="cursor-pointer flex items-center space-x-2">
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{t('Mercado')}</div>
                        </div>
                        <img src={getPackageFavicon('Mercado')} alt="Mercado" className="h-10 w-10" />
                    </Label>
                </div>
            )
        }];
    }
    return [];
};
