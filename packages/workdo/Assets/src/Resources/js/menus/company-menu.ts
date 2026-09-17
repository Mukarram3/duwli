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
            /*
             * ORDER IS EXPLICIT AND DELIBERATE.
             *
             * Maintenance, Locations and Depreciation were only reachable from
             * the "More" overflow on the Assets page — three clicks deep for
             * screens people use daily. They are sub-items of Fixed Assets now,
             * in the sequence asked for.
             *
             * `order` drives the sort, so the gaps between numbers are there to
             * let something be inserted later without renumbering the rest.
             */
            {
                title: t('Assets'),
                href: route('assets.assets.index'),
                permission: 'manage-assets',
                order: 5,
            },
            {
                title: t('Manage Maintenance'),
                href: route('assets.asset-maintenance.index'),
                permission: 'manage-asset-maintenance',
                order: 10,
            },
            {
                title: t('Manage Locations'),
                href: route('assets.asset-locations.index'),
                permission: 'manage-asset-locations',
                order: 15,
            },
            {
                title: t('Manage Depreciation'),
                href: route('assets.asset-depreciation.index'),
                permission: 'manage-asset-depreciation',
                order: 20,
            },
            {
                title: t('Assignments'),
                href: route('assets.asset-assignments.index'),
                permission: 'manage-asset-assignments',
                order: 25,
            },
            {
                title: t('Asset Classifications'),
                href: route('assets.categories.index'),
                permission: 'manage-asset-categories',
                order: 30,
            },
        ],
    }
];
