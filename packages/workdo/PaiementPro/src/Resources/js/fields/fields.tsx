import { SelectItem } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const paymentGateway = () => {
    const { t } = useTranslation();
    return [{
        id: 'paiementpro-gateway',
        order: 1800,
        component: (
            <SelectItem value="PaiementPro">{t('PaiementPro')}</SelectItem>
        )
    }];
};
