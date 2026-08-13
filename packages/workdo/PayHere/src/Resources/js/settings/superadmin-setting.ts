import { CreditCard } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getPayHereSuperAdminSettings = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 1280,
    title: t('PayHere Settings'),
    href: '#payhere-settings',
    icon: CreditCard,
    permission: 'manage-payhere-settings',
    component: 'payhere-settings'
  }
];