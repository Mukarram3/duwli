import { CreditCard } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getMercadoSuperAdminSettings = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 1190,
    title: t('Mercado Settings'),
    href: '#mercado-settings',
    icon: CreditCard,
    permission: 'manage-mercado-settings',
    component: 'mercado-settings'
  }
];
