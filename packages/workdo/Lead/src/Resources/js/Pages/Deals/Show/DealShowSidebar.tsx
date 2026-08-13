import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { User, CheckSquare, Users, Package, Database, File, Phone, Activity } from 'lucide-react';

interface SidebarItem {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission: string;
}

interface DealShowSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function DealShowSidebar({ activeItem, onSectionChange }: DealShowSidebarProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;

    const sidebarItems: SidebarItem[] = [
        {
            key: 'general',
            label: t('General'),
            icon: User,
            permission: 'view-deals'
        },
        {
            key: 'tasks',
            label: t('Tasks'),
            icon: CheckSquare,
            permission: 'manage-deal-tasks'
        },
        {
            key: 'users',
            label: t('Users'),
            icon: Users,
            permission: 'manage-deal-users'
        },
        {
            key: 'products',
            label: t('Products'),
            icon: Package,
            permission: 'manage-deal-products'
        },
        {
            key: 'sources',
            label: t('Sources'),
            icon: Database,
            permission: 'manage-deal-sources'
        },
        {
            key: 'files',
            label: t('Files'),
            icon: File,
            permission: 'manage-deal-files'
        },
        {
            key: 'calls',
            label: t('Calls'),
            icon: Phone,
            permission: 'manage-deal-calls'
        },
        {
            key: 'clients',
            label: t('Clients'),
            icon: Users,
            permission: 'manage-deal-clients'
        },
        {
            key: 'activity',
            label: t('Activity'),
            icon: Activity,
            permission: 'manage-deal-activity'
        }
    ];

    const filteredItems = sidebarItems.filter(item =>
        auth.user?.permissions?.includes(item.permission)
    );

    return (
        <div className="sticky top-4 bg-card border border-border/80 shadow-sm rounded-xl p-3 z-20">
            <div className="space-y-1">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.key;

                    return (
                        <button
                            key={item.key}
                            onClick={() => onSectionChange?.(item.key)}
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