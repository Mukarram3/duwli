// resources/js/pages/sections/hub.tsx
import { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card } from '@/components/ui/card';
import { allMenuItems } from '@/utils/menu';
import { RELATED_ACTIONS } from '@/utils/page-actions';
import { NavItem } from '@/types';
import * as LucideIcons from 'lucide-react';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SECTION HUB
 * ----------------------------------------------------------------------------
 * One landing page per top-level section (HR, Sales, Accounting, ...) showing
 * every function in that section as a labelled icon card.
 *
 * This exists because moving sub-sections onto their parent pages made the
 * sidebar short but made individual screens harder to FIND — you had to know
 * that Promotions lives on the Employees page to reach it. The hub puts
 * everything on one screen again, without putting it all back in the nav.
 *
 * It is derived from the SAME menu the sidebar is built from, plus the related-
 * actions registry, so it can never drift out of step: add a route anywhere and
 * it appears here automatically, with the user's permissions already applied.
 */

type HubCard = {
    title: string;
    href: string;
    icon: any;
    /** Set when this function lives as a button on another page. */
    parent?: string;
};

type HubGroup = {
    title: string | null;
    cards: HubCard[];
};

const resolve = (name: string): string | undefined => {
    try {
        const fn = (window as any).route;
        return typeof fn === 'function' ? fn(name) : undefined;
    } catch {
        return undefined;
    }
};

/** Pick a Lucide icon by name, falling back to a neutral one. */
const iconFor = (name?: string): any => {
    if (!name) return LayoutGrid;
    const found = (LucideIcons as any)[name];
    return found || LayoutGrid;
};

export default function SectionHub() {
    const { t } = useTranslation();
    const { section } = usePage<any>().props;

    const { sectionItem, groups } = useMemo(() => {
        const menu = allMenuItems();
        const found = menu.find((item) => item.name === section);

        if (!found || !found.children) {
            return { sectionItem: found, groups: [] as HubGroup[] };
        }

        const built: HubGroup[] = [];

        /**
         * Walk the section's children. A child with an href is a function card.
         * A child with children is a sub-group (e.g. HR > System Setup) and
         * becomes its own headed block.
         */
        const topCards: HubCard[] = [];

        const cardFor = (item: NavItem, parent?: string): HubCard | null => {
            if (!item.href) return null;
            return {
                title: item.title,
                href: item.href,
                icon: item.icon || LayoutGrid,
                parent,
            };
        };

        found.children.forEach((child) => {
            if (child.children && child.children.length > 0) {
                const cards = child.children
                    .map((grandchild) => cardFor(grandchild))
                    .filter((c): c is HubCard => c !== null);

                if (cards.length > 0) {
                    built.push({ title: child.title, cards });
                }
                return;
            }

            const card = cardFor(child);
            if (card) topCards.push(card);
        });

        /**
         * Pull in everything demoted to a page action bar. These are the screens
         * that vanished from the sidebar — the whole reason this page exists.
         * Each is labelled with the page it lives on, so the user learns where
         * it is rather than only how to reach it.
         */
        const relatedCards: HubCard[] = [];
        const sectionHrefs = new Set(
            found.children.flatMap((c) => [
                c.href,
                ...(c.children || []).map((g) => g.href),
            ]).filter(Boolean) as string[],
        );

        Object.entries(RELATED_ACTIONS).forEach(([pageRoute, actions]) => {
            const pageHref = resolve(pageRoute);
            if (!pageHref || !sectionHrefs.has(pageHref)) return;

            const parentTitle =
                found.children?.find((c) => c.href === pageHref)?.title || '';

            actions.forEach((action) => {
                const href = resolve(action.route);
                if (!href || sectionHrefs.has(href)) return;
                if (relatedCards.some((c) => c.href === href)) return;

                relatedCards.push({
                    title: t(action.label),
                    href,
                    icon: action.icon || LayoutGrid,
                    parent: parentTitle,
                });
            });
        });

        const allGroups: HubGroup[] = [];
        if (topCards.length > 0) allGroups.push({ title: null, cards: topCards });
        if (relatedCards.length > 0) {
            allGroups.push({ title: t('More functions'), cards: relatedCards });
        }
        allGroups.push(...built);

        return { sectionItem: found, groups: allGroups };
    }, [section, t]);

    const heading = sectionItem?.title || t('Section');

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: heading }]}
            pageTitle={heading}
            pageDescription={t('Choose a function to get started.')}
        >
            <Head title={heading} />

            {groups.length === 0 ? (
                <Card className="p-10 text-center text-muted-foreground">
                    {t('No functions are available to you in this section.')}
                </Card>
            ) : (
                <div className="space-y-8">
                    {groups.map((group, index) => (
                        <div key={group.title || `main-${index}`}>
                            {group.title && (
                                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    {group.title}
                                </h2>
                            )}

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {group.cards.map((card) => {
                                    const Icon = card.icon;
                                    return (
                                        <Link
                                            key={card.href}
                                            href={card.href}
                                            className={cn(
                                                'group flex flex-col gap-3 rounded-lg border bg-card p-4',
                                                'transition-all hover:-translate-y-0.5 hover:border-[#1E3A6F]/40 hover:shadow-md',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A6F]',
                                            )}
                                        >
                                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1E3A6F]/10 text-[#1E3A6F]">
                                                <Icon className="h-5 w-5" />
                                            </span>

                                            <span className="flex-1">
                                                <span className="block text-sm font-semibold leading-snug">
                                                    {card.title}
                                                </span>
                                                {card.parent && (
                                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                                        {t('on')} {card.parent}
                                                    </span>
                                                )}
                                            </span>

                                            <ChevronRight className="h-4 w-4 self-end text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
