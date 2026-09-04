// resources/js/utils/menu.ts
import { NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { getSuperAdminMenu } from './menus/superadmin-menu';
import { getCompanyMenu } from './menus/company-menu';
import { applyQoyodStructure, translateStructure } from './menu-structure';
import * as LucideIcons from 'lucide-react';

/**
 * Set to false to fall back to the original per-module sidebar grouping.
 * Superadmin always uses the original layout — the Qoyod taxonomy is a
 * company-side (tenant) structure.
 */
const USE_QOYOD_STRUCTURE = true;

// Get role-based core menu items
const getCoreMenuItems = (userRoles: string[], t: (key: string) => string): NavItem[] => {
    // Same protection as the package menus below: the core menu resolves
    // dozens of routes, and one missing route would otherwise blank the whole
    // application rather than dropping a single entry.
    try {
        if (userRoles.includes('superadmin')) {
            return getSuperAdminMenu(t);
        }
        return getCompanyMenu(t);
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('[menu] Core menu failed to build — a route is missing.', error);
        }
        return [];
    }
};

// Auto-load package menus based on activated packages
const getPackageMenuItems = (userRoles: string[], activatedPackages: string[], t: (key: string) => string): NavItem[] => {
    const menuItems: NavItem[] = [];
    const menuType = userRoles.includes('superadmin') ? 'superadmin-menu' : 'company-menu';

    const allModules = import.meta.glob('../../../packages/workdo/*/src/Resources/js/menus/*.ts', { eager: true });

    // Ensure activatedPackages is an array before iterating
    if (!Array.isArray(activatedPackages)) {
        return menuItems;
    }

    activatedPackages.forEach(packageName => {
        const menuPath = `../../../packages/workdo/${packageName}/src/Resources/js/menus/${menuType}.ts`;
        const module = allModules[menuPath] as any;

        if (!module) return;

        Object.values(module).forEach((item: any) => {
            /**
             * Each package menu is isolated.
             *
             * Package menus call route() directly, and Ziggy THROWS when a
             * route is not registered — which happens whenever a module is
             * listed as active but its routes are not loaded (files not
             * deployed, provider not registered, module half-installed).
             *
             * Without this guard that single throw propagates out of
             * AppSidebar and blanks the entire application on every page. One
             * misconfigured module should cost its own menu entry, nothing
             * more.
             */
            try {
                const result = typeof item === 'function' ? item(t) : item;
                const items = Array.isArray(result) ? result : [result];
                menuItems.push(...items.filter(Boolean));
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.warn(
                        `[menu] Skipped "${packageName}" — its routes are not registered. ` +
                        `Check the module is enabled and its routes are deployed.`,
                        error,
                    );
                }
            }
        });
    });

    return menuItems;
};

// Get custom menu items from database
const getCustomMenuItems = (userRoles: string[], t: (key: string) => string): NavItem[] => {
    const { auth } = usePage().props as any;
    const customMenus = auth?.customMenus || [];
    
    return customMenus.map((menu: any) => {
        // Convert string icon to Lucide icon component
        let iconComponent = null;
        if (menu.icon && typeof menu.icon === 'string') {
            const IconComponent = (LucideIcons as any)[menu.icon];
            if (IconComponent) {
                iconComponent = IconComponent;
            }
        }
        
        return {
            ...menu,
            icon: iconComponent,
        };
    });
};

// Group menu items by parent
const groupMenusByParent = (menuItems: NavItem[], packageMenuItems: NavItem[]): NavItem[] => {
    const groupedItems = [...menuItems];

    packageMenuItems.forEach(packageItem => {
        if (packageItem.parent) {
            const parentMenu = groupedItems.find(item =>
                item.name === packageItem.parent
            );

            if (parentMenu) {
                if (!parentMenu.children) {
                    parentMenu.children = [];
                }
                parentMenu.children.push({
                    ...packageItem,
                    parent: undefined,
                    group: undefined,
                });

                // Sort children by order
                if (parentMenu.children) {
                    parentMenu.children.sort((a, b) => (a.order || 999) - (b.order || 999));
                }
            } else {
                groupedItems.push(packageItem);
            }
        } else {
            groupedItems.push(packageItem);
        }
    });

    return groupedItems;
};

// Filter menu items based on permissions
const filterByPermission = (items: NavItem[], userPermissions: string[]): NavItem[] => {
    return items.filter(item => {
        if (!item.permission) {
            if (item.children) {
                item.children = filterByPermission(item.children, userPermissions);
            }
            return true;
        }

        if (!userPermissions.includes(item.permission)) {
            return false;
        }

        if (item.children) {
            item.children = filterByPermission(item.children, userPermissions);
            return item.children.length > 0;
        }

        return true;
    });
};

// Main function to get filtered menu items
export const allMenuItems = (): NavItem[] => {
    const { auth } = usePage().props as any;
    const { t } = useTranslation();
    const userPermissions = auth?.user?.permissions || [];
    const userRoles = auth?.user?.roles || [];
    const activatedPackages = auth?.user?.activatedPackages || [];

    const coreMenuItems = getCoreMenuItems(userRoles, t);

    const packageMenuItems = getPackageMenuItems(userRoles, activatedPackages, t);
    
    const customMenuItems = getCustomMenuItems(userRoles, t);
    
    // Separate custom menus into parents and children
    const customParentMenus = customMenuItems.filter(menu => !menu.parent);
    const customChildMenus = customMenuItems.filter(menu => menu.parent);
    
    // First add custom parent menus to core menus
    const coreWithCustomParents = [...coreMenuItems, ...customParentMenus];
    
    // Then group all children (package + custom children) with their parents
    const allChildMenus = [...packageMenuItems, ...customChildMenus];
    const finalGroupedMenuItems = groupMenusByParent(coreWithCustomParents, allChildMenus);

    const sortedMenuItems = finalGroupedMenuItems.sort((a, b) => (a.order || 999) - (b.order || 999));

    const finalMenuItems = filterByPermission(sortedMenuItems, userPermissions);

    // Re-file the permission-filtered menu into the fixed Qoyod section
    // structure. Runs last so that sections left empty by a user's permissions
    // are dropped rather than rendered as empty dropdowns.
    if (USE_QOYOD_STRUCTURE && !userRoles.includes('superadmin')) {
        return translateStructure(applyQoyodStructure(finalMenuItems), t);
    }

    return finalMenuItems;
};