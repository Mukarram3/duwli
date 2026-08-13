import { CreditCard } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getPaiementProSuperAdminSettings = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 1290,
    title: t('PaiementPro Settings'),
    href: '#paiementpro-payment-settings',
    icon: CreditCard,
    permission: 'manage-paiement-pro-settings',
    component: 'paiementpro-payment-settings'
  }
];
