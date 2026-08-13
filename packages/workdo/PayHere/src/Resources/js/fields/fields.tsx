import { SelectItem } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const paymentGateway = () => {
    const { t } = useTranslation();
    return [{
        id: 'payhere-gateway',
        order: 1790,
        component: (
            <SelectItem value="PayHere">{t('PayHere')}</SelectItem>
        )
    }];
};