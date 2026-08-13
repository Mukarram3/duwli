import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { getAdminSetting, getPackageFavicon } from '@/utils/helpers';

export const paymentMethodBtn = (data?: any) => {
    const { t } = useTranslation();
    const payhereEnabled = getAdminSetting('payhere_enabled');

    if (payhereEnabled === 'on') {
        return [{
            id: 'payhere-payment',
            dataUrl: route('payhere.plan.pay'),
            onFormSubmit: data?.onFormSubmit,
            component: (
                <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg w-full">
                    <RadioGroupItem value="payhere" id="payhere" />
                    <Label htmlFor="payhere" className="cursor-pointer flex items-center space-x-2">
                        <div className="font-medium text-gray-900 dark:text-white">{t('PayHere')}</div>
                        <img src={getPackageFavicon('PayHere')} alt="PayHere" className="h-10 w-10" />
                    </Label>
                </div>
            )
        }];
    }
    return [];
};
