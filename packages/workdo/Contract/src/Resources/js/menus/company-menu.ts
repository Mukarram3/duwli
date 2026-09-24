import { FileSignature } from 'lucide-react';

declare global {
    function route(name: string): string;
}

export const contractCompanyMenu = (t: (key: string) => string) => [
    {
        title: t('Contract'),
        icon: FileSignature,
        permission: 'manage-contracts',
        order: 725,
        name: 'contract',
        group: 'Sales & Revenue',
        /*
         * Only Contracts. "Contract Types" moved to an action icon in the
         * Contracts page header, so it is not a menu row any more.
         */
        children: [
            {
                title: t('Contracts'),
                href: route('contract.index'),
                permission: 'manage-contracts',
                order: 10,
            },
        ],
    },
];
