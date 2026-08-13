import { SelectItem } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const paymentGateway = () => {
    const { t } = useTranslation();
    return [{
        id: 'ozow-gateway',
        order: 1860,
        component: (
            <SelectItem value="Ozow">{t('Ozow')}</SelectItem>
        )
    }];
};