import { SelectItem } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const paymentGateway = () => {
    const { t } = useTranslation();
    return [{
        id: 'mercado-gateway',
        order: 1700,
        component: (
            <SelectItem value="Mercado">{t('Mercado')}</SelectItem>
        )
    }];
};