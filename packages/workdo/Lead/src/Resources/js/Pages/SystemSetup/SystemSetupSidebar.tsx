import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { GitBranch, Layers, Target, Tag, Globe } from "lucide-react";

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
            key: 'pipelines',
            label: t('Pipelines'),
            icon: GitBranch,
            route: 'lead.pipelines.index',
            permission: 'manage-pipelines'
        },
        {
            key: 'lead-stages',
            label: t('Lead Stages'),
            icon: Layers,
            route: 'lead.lead-stages.index',
            permission: 'manage-lead-stages'
        },
        {
            key: 'deal-stages',
            label: t('Deal Stages'),
            icon: Target,
            route: 'lead.deal-stages.index',
            permission: 'manage-deal-stages'
        },
        {
            key: 'labels',
            label: t('Labels'),
            icon: Tag,
            route: 'lead.labels.index',
            permission: 'manage-labels'
        },
        {
            key: 'sources',
            label: t('Sources'),
            icon: Globe,
            route: 'lead.sources.index',
            permission: 'manage-sources'
        },
    ];

    const filteredItems = sidebarItems.filter(item =>
        auth.user?.permissions?.includes(item.permission)
    );

    return (
        <div className="sticky top-4 bg-card border border-border/80 shadow-sm rounded-xl p-3 z-20">
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
    );
}