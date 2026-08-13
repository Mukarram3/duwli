// resources/js/components/page-action-bar.tsx
import * as React from 'react';
import { router } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBrand } from '@/contexts/brand-context';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * QOYOD-STYLE PAGE ACTION BAR
 * ----------------------------------------------------------------------------
 * A single row of labelled rectangular buttons above the page content, e.g.
 *
 *   [ Manage Receipts ] [ Manage Credit Notes ] [ + New Invoice ] [ More ▾ ]
 *
 * Two jobs:
 *   1. Replaces the icon-only tooltip buttons used across index pages, which
 *      force the user to hover to discover what each control does.
 *   2. Lets related destinations (Receipts, Credit Notes, Returns) live on the
 *      page they belong to instead of occupying their own sidebar rows — this
 *      is how Qoyod keeps its navigation short.
 *
 * Anything past `maxVisible` collapses into a "More" dropdown so the row never
 * wraps or overruns the header on smaller screens.
 */

export type PageAction = {
    /** Button label. Pass an already-translated string. */
    label: string;
    /** Destination. Use this OR onClick. */
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    /** 'primary' = filled brand colour (default), 'outline' = bordered. */
    variant?: 'primary' | 'outline' | 'destructive';
    /** Permission string. When set, the action renders only if the user holds it. */
    permission?: string;
    /** Force into the overflow menu regardless of position. */
    overflow?: boolean;
    /** Opens in a new tab instead of an Inertia visit. */
    external?: boolean;
    disabled?: boolean;
};

type Props = {
    actions: PageAction[];
    /** User permissions, normally auth.user.permissions. Omit to skip filtering. */
    permissions?: string[];
    /** How many buttons stay visible before the rest collapse. Default 4. */
    maxVisible?: number;
    className?: string;
    /** Extra nodes (module-injected buttons) appended before the overflow menu. */
    children?: React.ReactNode;
};

const variantClasses: Record<NonNullable<PageAction['variant']>, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent',
    outline: 'bg-background text-foreground border border-input hover:bg-accent',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent',
};

export function PageActionBar({
    actions,
    permissions,
    maxVisible = 4,
    className,
    children,
}: Props) {
    const { t } = useTranslation();
    const { settings } = useBrand();
    const isRtl = settings.layoutDirection === 'rtl';

    const go = React.useCallback((action: PageAction) => {
        if (action.onClick) return action.onClick();
        if (!action.href) return;
        if (action.external) {
            window.open(action.href, '_blank');
            return;
        }
        router.visit(action.href);
    }, []);

    // Drop actions the user has no permission for, and any whose destination
    // could not be resolved (module not installed).
    const allowed = actions.filter((action) => {
        if (!action.href && !action.onClick) return false;
        if (!action.permission) return true;
        if (!permissions) return true;
        return permissions.includes(action.permission);
    });

    const inline = allowed.filter((a) => !a.overflow).slice(0, maxVisible);
    const collapsed = allowed.filter((a) => !inline.includes(a));

    if (allowed.length === 0 && !children) return null;

    return (
        <div
            className={cn('flex items-center gap-2 flex-wrap justify-end', className)}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {inline.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.label}
                        type="button"
                        disabled={action.disabled}
                        onClick={() => go(action)}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md',
                            'text-[13px] font-semibold leading-none whitespace-nowrap',
                            'transition-colors focus-visible:outline-none focus-visible:ring-2',
                            'focus-visible:ring-ring focus-visible:ring-offset-2',
                            'disabled:pointer-events-none disabled:opacity-50',
                            variantClasses[action.variant || 'primary'],
                        )}
                    >
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        <span>{action.label}</span>
                    </button>
                );
            })}

            {children}

            {collapsed.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-9 px-3 text-[13px] font-semibold"
                        >
                            <MoreHorizontal className="h-4 w-4 mr-1.5" />
                            {t('More')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-56">
                        {collapsed.map((action) => {
                            const Icon = action.icon;
                            return (
                                <DropdownMenuItem
                                    key={action.label}
                                    disabled={action.disabled}
                                    onClick={() => go(action)}
                                    className="cursor-pointer gap-2"
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span>{action.label}</span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

/**
 * Resolve a route name, returning undefined when the route does not exist
 * (i.e. the owning package is not installed). Actions built with this are
 * dropped from the bar automatically rather than throwing.
 */
export const actionRoute = (name: string, ...params: any[]): string | undefined => {
    try {
        const fn = (window as any).route;
        if (typeof fn !== 'function') return undefined;
        return params.length ? fn(name, ...params) : fn(name);
    } catch {
        return undefined;
    }
};
