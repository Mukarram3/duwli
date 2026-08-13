import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {  Tag, Briefcase, Users, MessageSquare, Settings, Building, Lightbulb, ArrowRight, HelpCircle, FileQuestion, FileText , CheckSquare } from "lucide-react";

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
            key: 'job-types',
            label: t('Job Types'),
            icon: Briefcase,
            route: 'recruitment.job-types.index',
            permission: 'manage-job-types'
        },
        {
            key: 'candidate-sources',
            label: t('Candidate Sources'),
            icon: Users,
            route: 'recruitment.candidate-sources.index',
            permission: 'manage-candidate-sources'
        },
        {
            key: 'interview-types',
            label: t('Interview Types'),
            icon: MessageSquare,
            route: 'recruitment.interview-types.index',
            permission: 'manage-interview-types'
        },
        {
            key: 'onboarding-checklists',
            label: t('Onboarding Checklists'),
            icon: CheckSquare,
            route: 'recruitment.onboarding-checklists.index',
            permission: 'manage-onboarding-checklists'
        },
        {
            key: 'brand-settings',
            label: t('Brand Settings'),
            icon: Settings,
            route: 'recruitment.settings.index',
            permission: 'manage-recruitment-brand-settings'
        },
        {
            key: 'about-company',
            label: t('About Company Section'),
            icon: Building,
            route: 'recruitment.about-company.index',
            permission: 'manage-about-company'
        },
        {
            key: 'application-tips',
            label: t('Application Tips Section'),
            icon: Lightbulb,
            route: 'recruitment.application-tips.index',
            permission: 'manage-application-tips'
        },
        {
            key: 'what-happens-next',
            label: t('What Happens Next Section'),
            icon: ArrowRight,
            route: 'recruitment.what-happens-next.index',
            permission: 'manage-what-happens-next'
        },
        {
            key: 'need-help',
            label: t('Need Help Section'),
            icon: HelpCircle,
            route: 'recruitment.need-help.index',
            permission: 'manage-need-help'
        },
        {
            key: 'tracking-faq',
            label: t('Tracking FAQ'),
            icon: FileQuestion,
            route: 'recruitment.tracking-faq.index',
            permission: 'manage-tracking-faq'
        },
        {
            key: 'offer-letter-template',
            label: t('Offer Letter Template'),
            icon: FileText,
            route: 'recruitment.offer-letter-template.index',
            permission: 'manage-offer-letter-template'
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