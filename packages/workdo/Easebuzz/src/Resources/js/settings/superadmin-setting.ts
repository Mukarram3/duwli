import { CreditCard } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getEasebuzzSuperAdminSettings = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 1380,
    title: t('Easebuzz Settings'),
    href: '#easebuzz-settings',
    icon: CreditCard,
    permission: 'manage-easebuzz-settings',
    component: 'easebuzz-settings'
  }
];