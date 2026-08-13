import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {       Building, Building2, Users, FileText, Settings, AlertTriangle,ShieldAlert,AlertOctagon , Calendar , Tag , DollarSign , Minus , CreditCard, Clock , Shield } from "lucide-react";

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
            key: 'branches',
            label: t('Branches'),
            icon: Building,
            route: 'hrm.branches.index',
            permission: 'manage-branches'
        },
        {
            key: 'departments',
            label: t('Departments'),
            icon: Building2,
            route: 'hrm.departments.index',
            permission: 'manage-departments'
        },
        {
            key: 'designations',
            label: t('Designations'),
            icon: Users,
            route: 'hrm.designations.index',
            permission: 'manage-designations'
        },
        {
            key: 'employee-document-types',
            label: t('Document Types'),
            icon: FileText,
            route: 'hrm.employee-document-types.index',
            permission: 'manage-employee-document-types'
        },
        {
            key: 'award-types',
            label: t('Award Types'),
            icon: Settings,
            route: 'hrm.award-types.index',
            permission: 'manage-award-types'
        },
        {
            key: 'termination-types',
            label: t('Termination Types'),
            icon: AlertTriangle,
            route: 'hrm.termination-types.index',
            permission: 'manage-termination-types'
        },
        {
            key: 'warning-types',
            label: t('Warning Types'),
            icon: ShieldAlert,
            route: 'hrm.warning-types.index',
            permission: 'manage-warning-types'
        },
        {
            key: 'complaint-types',
            label: t('Complaint Types'),
            icon: AlertOctagon,
            route: 'hrm.complaint-types.index',
            permission: 'manage-complaint-types'
        },
        {
            key: 'holiday-types',
            label: t('Holiday Types'),
            icon: Calendar,
            route: 'hrm.holiday-types.index',
            permission: 'manage-holiday-types'
        },
        {
            key: 'document-categories',
            label: t('Document Categories'),
            icon: FileText,
            route: 'hrm.document-categories.index',
            permission: 'manage-document-categories'
        },
        {
            key: 'announcement-categories',
            label: t('Announcement Categories'),
            icon: Tag,
            route: 'hrm.announcement-categories.index',
            permission: 'manage-announcement-categories'
        },
        {
            key: 'event-types',
            label: t('Event Types'),
            icon: Calendar,
            route: 'hrm.event-types.index',
            permission: 'manage-event-types'
        },
        {
            key: 'allowance-types',
            label: t('Allowance Types'),
            icon: DollarSign,
            route: 'hrm.allowance-types.index',
            permission: 'manage-allowance-types'
        },
        {
            key: 'deduction-types',
            label: t('Deduction Types'),
            icon: Minus,
            route: 'hrm.deduction-types.index',
            permission: 'manage-deduction-types'
        },
        {
            key: 'loan-types',
            label: t('Loan Types'),
            icon: CreditCard,
            route: 'hrm.loan-types.index',
            permission: 'manage-loan-types'
        },
        {
            key: 'working-days',
            label: t('Working Days'),
            icon: Clock,
            route: 'hrm.working-days.index',
            permission: 'manage-working-days'
        },
        {
            key: 'ip-restricts',
            label: t('Ip Restricts'),
            icon: Shield,
            route: 'hrm.ip-restricts.index',
            permission: 'manage-ip-restricts'
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