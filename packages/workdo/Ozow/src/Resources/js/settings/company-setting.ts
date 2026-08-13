import { CreditCard } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getOzowCompanySettings = (t: (key: string) => string): SettingMenuItem[] => [
  // {
  //   order: 1350,
  //   title: t('Ozow Settings'),
  //   href: '#ozow-settings',
  //   icon: CreditCard,
  //   permission: 'manage-ozow-settings',
  //   component: 'ozow-settings'
  // }
];
