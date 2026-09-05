// resources/js/components/duwli/empty-state.tsx
import * as React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FilterX, Plus, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * DUWLI EMPTY STATE
 * ----------------------------------------------------------------------------
 * Successor to `no-records-found.tsx` (used on 177 screens). That component
 * works, but it treats three different situations identically:
 *
 *   1. NOTHING EXISTS YET     → the user should be invited to create the first
 *                               record. This is an onboarding moment.
 *   2. FILTERS MATCHED NOTHING → the user should be told what is filtering and
 *                               offered a way out. Offering "Create" here is
 *                               actively wrong; they are looking, not adding.
 *   3. SEARCH MATCHED NOTHING  → same as 2, but the fix is clearing the term.
 *
 * Conflating them is why users hit an empty table, see a "Create" button, and
 * create a duplicate of a record that already exists behind a filter.
 *
 * This component picks the right message, icon and action from the variant.
 * The existing NoRecordsFound is left in place — pages migrate to this one as
 * they are converted, no big-bang replacement needed.
 */

export type EmptyVariant = 'empty' | 'filtered' | 'search' | 'error';

type Props = {
    /** Which situation this is. Default 'empty'. */
    variant?: EmptyVariant;
    /** Icon for the 'empty' variant — usually the module's own icon. */
    icon?: React.ComponentType<{ className?: string }>;
    /** Heading. Omit for a sensible default per variant. */
    title?: string;
    /** Supporting line. Omit for a sensible default per variant. */
    description?: string;

    /** Create action, shown only on the 'empty' variant. */
    onCreate?: () => void;
    createHref?: string;
    createLabel?: string;
    /** Permission required to see the create action. */
    createPermission?: string;

    /** Clears filters — shown on 'filtered'. */
    onClearFilters?: () => void;
    /** Clears the search term — shown on 'search'. */
    onClearSearch?: () => void;
    /** The term that returned nothing, echoed back to the user. */
    searchTerm?: string;

    /** Retry action for the 'error' variant. */
    onRetry?: () => void;

    /** Height of the block. Default fits a table body. */
    className?: string;
};

const defaults: Record<EmptyVariant, { title: string; description: string }> = {
    empty: {
        title: 'Nothing here yet',
        description: 'Create your first record to get started.',
    },
    filtered: {
        title: 'No matching records',
        description: 'No records match the filters currently applied.',
    },
    search: {
        title: 'No results found',
        description: 'Try a different term, or check the spelling.',
    },
    error: {
        title: 'Could not load records',
        description: 'Something went wrong while fetching this list.',
    },
};

export function EmptyState({
    variant = 'empty',
    icon: Icon,
    title,
    description,
    onCreate,
    createHref,
    createLabel = 'Create',
    createPermission,
    onClearFilters,
    onClearSearch,
    searchTerm,
    onRetry,
    className,
}: Props) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;

    const canCreate = createPermission
        ? Boolean(auth?.user?.permissions?.includes(createPermission))
        : true;

    const VariantIcon =
        variant === 'filtered' ? FilterX : variant === 'search' ? SearchX : Icon;

    const heading = title ?? defaults[variant].title;
    const body =
        description ??
        (variant === 'search' && searchTerm
            ? `${t('Nothing matched')} “${searchTerm}”.`
            : defaults[variant].description);

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center px-6 py-14 text-center',
                className,
            )}
        >
            {VariantIcon && (
                <span
                    className={cn(
                        'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
                        variant === 'error'
                            ? 'bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    <VariantIcon className="h-7 w-7" />
                </span>
            )}

            <h3 className="text-[15px] font-semibold text-foreground">{t(heading)}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t(body)}</p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {variant === 'empty' && canCreate && (createHref || onCreate) && (
                    createHref ? (
                        <Button asChild className="gap-1.5">
                            <Link href={createHref}>
                                <Plus className="h-4 w-4" />
                                {t(createLabel)}
                            </Link>
                        </Button>
                    ) : (
                        <Button onClick={onCreate} className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            {t(createLabel)}
                        </Button>
                    )
                )}

                {variant === 'filtered' && onClearFilters && (
                    <Button variant="outline" onClick={onClearFilters}>
                        {t('Clear filters')}
                    </Button>
                )}

                {variant === 'search' && onClearSearch && (
                    <Button variant="outline" onClick={onClearSearch}>
                        {t('Clear search')}
                    </Button>
                )}

                {variant === 'error' && onRetry && (
                    <Button variant="outline" onClick={onRetry}>
                        {t('Try again')}
                    </Button>
                )}
            </div>
        </div>
    );
}
