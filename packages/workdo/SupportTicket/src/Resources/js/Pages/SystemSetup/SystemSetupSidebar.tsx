import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Folder, BookOpen, HelpCircle, Library, Palette, FileEdit, Type, MousePointer, Link, Info, MapPin } from "lucide-react";

interface SidebarItem {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    route: string;
    permission: string;
}

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const currentRoute = route().current();

    const sidebarItems: SidebarItem[] = [
        {
            key: 'categories',
            label: t('Categories'),
            icon: Folder,
            route: 'ticket-category.index',
            permission: 'manage-ticket-categories'
        },
        {
            key: 'support-categories',
            label: t('Support Category'),
            icon: HelpCircle,
            route: 'support-category.index',
            permission: 'manage-support-categories'
        },
        {
            key: 'knowledge-categories',
            label: t('KnowledgeBase Category'),
            icon: Library,
            route: 'knowledge-category.index',
            permission: 'manage-knowledge-base'
        },
        {
            key: 'brand-settings',
            label: t('Brand Settings'),
            icon: Palette,
            route: 'support-ticket.settings.brand',
            permission: 'manage-support-settings'
        },

        {
            key: 'custom-pages',
            label: t('Custom Pages'),
            icon: FileEdit,
            route: 'support-ticket.custom-pages.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'title-sections',
            label: t('Title Sections'),
            icon: Type,
            route: 'support-ticket.title-sections.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'cta-sections',
            label: t('CTA Sections'),
            icon: MousePointer,
            route: 'support-ticket.cta-sections.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'quick-links',
            label: t('Quick Links'),
            icon: Link,
            route: 'support-ticket.quick-links.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'support-information',
            label: t('Support Information'),
            icon: Info,
            route: 'support-ticket.support-information.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'contact-information',
            label: t('Contact Information'),
            icon: MapPin,
            route: 'support-ticket.contact-information.index',
            permission: 'manage-support-settings'
        },
    ];

    const filteredItems = sidebarItems.filter(item =>
        auth.user?.permissions?.includes(item.permission)
    );

    return (
        <div className="sticky top-4 bg-card border border-border/80 shadow-sm rounded-xl p-3 z-20">
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hover-only pr-1">
                <div className="space-y-1">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.key || currentRoute === item.route;

                        return (
                            <button
                                key={item.key}
                                onClick={() => {
                                    router.get(route(item.route));
                                    onSectionChange?.(item.key);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ltr:text-left rtl:text-right outline-none ltr:border-l-[3px] rtl:border-r-[3px] ltr:border-r-0 rtl:border-l-0",
                                    isActive
                                        ? "bg-primary/10 text-primary border-primary ltr:rounded-r-lg ltr:rounded-l-none rtl:rounded-l-lg rtl:rounded-r-none"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent rounded-lg"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200", {
                                    "scale-110": isActive
                                })} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}