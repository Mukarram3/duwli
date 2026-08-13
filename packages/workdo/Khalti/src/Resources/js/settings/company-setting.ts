import { CreditCard } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getKhaltiCompanySettings = (t: (key: string) => string): SettingMenuItem[] => [
  // {
  //   order: 1250,
  //   title: t('Khalti Settings'),
  //   href: '#khalti-settings',
  //   icon: CreditCard,
  //   permission: 'manage-khalti-settings',
  //   component: 'khalti-settings'
  // }
];
