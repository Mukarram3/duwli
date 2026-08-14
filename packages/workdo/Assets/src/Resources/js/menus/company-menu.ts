import { Building2, FolderOpen, UserCheck, MapPin, Wrench, TrendingDown } from 'lucide-react';

declare global {
    function route(name: string): string;
}

export const assetsCompanyMenu = (t: (key: string) => string) => [
    {
        title: t('Assets'),
        icon: Building2,
        permission: 'manage-asset',
        name: 'Assets',
        order: 515,
        children: [
            {
                title: t('Assets'),
                href: route('assets.assets.index'),
                permission: 'manage-assets',
                order: 5,
            },
            {
                title: t('Assignments'),
                href: route('assets.asset-assignments.index'),
                permission: 'manage-asset-assignments',
                order: 10,
            },
            {
                title: t('Locations'),
                href: route('assets.asset-locations.index'),
                permission: 'manage-asset-locations',
                order: 15,
            },
            {
                title: t('Maintenance'),
                href: route('assets.asset-maintenance.index'),
                permission: 'manage-asset-maintenance',
                order: 20,
            },
            {
                title: t('Depreciation'),
                href: route('assets.asset-depreciation.index'),
                permission: 'manage-asset-depreciation',
                order: 25,
            },
            {
                title: t('Category'),
                href: route('assets.categories.index'),
                permission: 'manage-asset-categories',
                order: 30,
            },
        ],
    }
];
