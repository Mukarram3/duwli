import { LayoutGrid, Users, Settings, Image, Package, CreditCard, Mail, Bell, Headphones } from 'lucide-react';
import { NavItem } from '@/types';

export const getSuperAdminMenu = (t: (key: string) => string): NavItem[] => [
    // ── OVERVIEW ──────────────────────────────────────────────
    {
        title: t('Dashboard'),
        href: route('dashboard'),
        icon: LayoutGrid,
        permission: 'manage-dashboard',
        order: 1,
        group: 'Overview',
    },

    // ── MANAGEMENT ────────────────────────────────────────────
    {
        title: t('Users'),
        href: route('users.index'),
        icon: Users,
        permission: 'manage-users',
        order: 20,
        group: 'Management',
    },
    {
        title: t('Helpdesk'),
        icon: Headphones,
        permission: 'manage-helpdesk-tickets',
        order: 30,
        group: 'Management',
        children: [
            {
                title: t('Tickets'),
                href: route('helpdesk-tickets.index'),
                permission: 'manage-any-helpdesk-tickets',
            },
            {
                title: t('Categories'),
                href: route('helpdesk-categories.index'),
                permission: 'manage-helpdesk-categories',
            },
        ],
    },

    // ── COMMUNICATION ─────────────────────────────────────────
    {
        title: t('Email Templates'),
        href: route('email-templates.index'),
        icon: Mail,
        permission: 'manage-email-templates',
        order: 40,
        group: 'Communication',
    },
    {
        title: t('Notification Templates'),
        href: route('notification-templates.index'),
        icon: Bell,
        permission: 'manage-notification-templates',
        order: 50,
        group: 'Communication',
    },

    // ── BILLING & SUBSCRIPTION ────────────────────────────────
    {
        title: t('Subscription'),
        icon: CreditCard,
        permission: 'manage-plans',
        order: 60,
        group: 'Billing & Subscription',
        children: [
            {
                title: t('Subscription Setting'),
                href: route('plans.index'),
                permission: 'manage-plans',
            },
            {
                title: t('Coupons'),
                href: route('coupons.index'),
                permission: 'manage-coupons',
            },
            {
                title: t('Bank Transfer Requests'),
                href: route('bank-transfer.index'),
                permission: 'manage-bank-transfer-requests',
            },
            {
                title: t('Orders'),
                href: route('orders.index'),
                permission: 'manage-orders',
            },
        ],
    },

    // ── SYSTEM ────────────────────────────────────────────────
    {
        title: t('Media Library'),
        href: route('media-library'),
        icon: Image,
        permission: 'manage-media',
        order: 70,
        group: 'System',
    },
    {
        title: t('Add-ons Manager'),
        href: route('add-ons.index'),
        icon: Package,
        permission: 'manage-add-on',
        order: 80,
        group: 'System',
    },
    {
        title: t('Settings'),
        href: route('settings.index'),
        icon: Settings,
        permission: 'manage-settings',
        order: 90,
        group: 'System',
    },
];
