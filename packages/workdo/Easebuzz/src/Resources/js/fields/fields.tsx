import { SelectItem } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const paymentGateway = () => {
    const { t } = useTranslation();
    return [{
        id: 'easebuzz-gateway',
        order: 1890,
        component: (
            <SelectItem value="Easebuzz">{t('Easebuzz')}</SelectItem>
        )
    }];
};