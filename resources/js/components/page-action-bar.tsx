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

/**
 * Qoyod renders page actions as a row of solid navy-blue rectangles. That blue
 * is fixed rather than taken from the tenant's theme colour, so the accounting
 * screens stay visually consistent whatever brand colour a company sets.
 */
/*
 * PILL BUTTONS — white capsule, soft shadow, blue icon separated by a hairline.
 *
 * Every action now uses the same treatment, including what used to be the
 * filled "primary". With one button filled navy and five white, the row read
 * as though the first action mattered most; the reference treats them as peers
 * and lets the ICON carry the meaning. Same reasoning as the KPI cards.
 *
 * `destructive` keeps a red tint, because a delete that looks identical to an
 * export is a genuine hazard rather than an aesthetic preference.
 */
const variantClasses: Record<NonNullable<PageAction['variant']>, string> = {
    /*
     * SOFT BLUE, SEMI-TRANSPARENT — the reference treatment.
     *
     * The tint is an alpha on the brand colour (`primary/[0.06]`) rather than a
     * fixed blue. That matters: change the brand token and every pill follows,
     * where a hard-coded #EFF6FF would strand them all on the old palette.
     *
     * Text stays near-black. A blue label on a blue field loses contrast, and
     * the reference keeps the wording dark for exactly that reason.
     */
    primary: 'bg-card text-slate-800 dark:text-slate-100',
    outline: 'bg-card text-slate-800 dark:text-slate-100',
    /* Destructive keeps a red tint — a delete that looks identical to an
       export is a hazard, not an inconsistency. */
    destructive: 'bg-card text-red-600',
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
            className={cn(
                // flex-wrap, so six wide buttons drop to a second line instead
                // of the last one being cut off at the viewport edge — which is
                // what was happening.
                'flex items-center gap-2.5 flex-wrap',
                /*
                 * Only default to right-alignment when the caller has not
                 * chosen its own. twMerge resolves `justify-center` against
                 * `justify-end`, but NOT an arbitrary
                 * `[justify-content:safe_center]` — that is a different group,
                 * so both would land and the base would win. Checking here
                 * keeps the caller's choice authoritative either way.
                 */
                !/justify|\[justify-content/.test(className ?? '') && 'justify-end',
                className,
            )}
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
                            /*
                             * TWO-ZONE BUTTON: a solid blue block holding the
                             * icon, curving into a white panel holding the
                             * label.
                             *
                             * No gap and no padding on the shell — each zone
                             * supplies its own, or the blue block would float
                             * inside a white border instead of forming the
                             * button's leading edge.
                             *
                             * overflow-hidden is what clips the icon block to
                             * the button's rounded corners.
                             */
                            /*
                             * ONE cohesive button: a white panel with a blue
                             * block flush against its leading edge.
                             *
                             * The previous version floated the blue square away
                             * from the label because the icon zone carried its
                             * own rounding and the label was pulled back over
                             * it. Both are gone — the shell rounds and clips,
                             * the zones just sit inside it.
                             */
                            'inline-flex items-stretch h-11 shrink-0 overflow-hidden rounded-xl',
                            'border border-slate-200/80 dark:border-slate-700',
                            'shadow-[0_2px_10px_-2px_rgb(37_99_235/0.20)] hover:shadow-[0_4px_16px_-2px_rgb(37_99_235/0.30)]',
                            'transition-shadow',
                            'text-[13px] font-semibold leading-none whitespace-nowrap',
                            'transition-colors focus-visible:outline-none focus-visible:ring-2',
                            'focus-visible:ring-ring focus-visible:ring-offset-2',
                            'disabled:pointer-events-none disabled:opacity-50',
                            variantClasses[action.variant || 'primary'],
                        )}
                    >
                        {/*
                          Icons take the THEME colour on outline buttons.
                          A filled (primary) button already sits on the brand
                          colour, so its icon stays white — colouring it there
                          would make it invisible.

                          `gap-1.5` on the button (above) rather than a margin
                          on the icon: a margin does not flip under RTL and
                          leaves the spacing lopsided in Arabic.
                        */}
                        {Icon && (
                            <span
                                className={cn(
                                    // Flush against the shell's leading edge —
                                    // no rounding of its own, the shell clips it.
                                    'flex w-11 shrink-0 items-center justify-center',
                                    /*
                                     * FIXED BLUE, not the brand token.
                                     *
                                     * The theme primary is near-black, so
                                     * `bg-primary` rendered these blocks black.
                                     * The reference is explicitly blue, so the
                                     * blue is stated here rather than inherited
                                     * from a token that is not blue.
                                     */
                                    action.variant === 'destructive'
                                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                                        : 'bg-gradient-to-br from-[#2f7fd6] to-[#1f63b8]',
                                )}
                            >
                                <Icon className="h-[19px] w-[19px] text-white" />
                            </span>
                        )}
                        <span className="flex items-center whitespace-nowrap px-4">
                            {action.label}
                        </span>
                    </button>
                );
            })}

            {children}

            {collapsed.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-9 gap-1.5 px-3 text-[13px] font-semibold"
                        >
                            {/* gap on the parent, not a margin — mr- does not flip in RTL. */}
                            <MoreHorizontal className="h-4 w-4 shrink-0" />
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
                                    {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
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
