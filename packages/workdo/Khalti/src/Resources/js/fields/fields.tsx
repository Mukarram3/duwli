import { SelectItem } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const paymentGateway = () => {
    const { t } = useTranslation();
    return [{
        id: 'khalti-gateway',
        order: 1760,
        component: (
            <SelectItem value="Khalti">{t('Khalti')}</SelectItem>
        )
    }];
};
