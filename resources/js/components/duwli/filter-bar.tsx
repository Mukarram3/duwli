// resources/js/components/duwli/filter-bar.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useBrand } from '@/contexts/brand-context';
import { cn } from '@/lib/utils';

/**
 * DUWLI FILTER BAR
 * ----------------------------------------------------------------------------
 * The row between the KPI strip and the table: search, a filter popover, and
 * chips showing what is currently applied.
 *
 * Audit finding this replaces: filters appear on ~50% of list screens and the
 * rest have search only. Where filters do exist, applied values are hidden
 * inside a collapsed panel, so a user who filtered ten minutes ago sees an
 * unexplained empty table and reports it as a bug. This is the single most
 * common support complaint pattern in ERP list screens.
 *
 * The fix is the ACTIVE FILTER CHIPS row: whatever is applied is always visible
 * as a removable chip, plus a "Clear all". Nothing is ever silently filtering.
 *
 * The component is deliberately UNCONTROLLED about filter STATE — the page owns
 * its filter object and its Inertia reload. This only renders the shell, the
 * chips, and the search box, so it drops into pages that already have their own
 * filter logic without rewriting it.
 *
 * USAGE
 *   <FilterBar
 *     search={filters.search}
 *     onSearchChange={(v) => setFilters({ ...filters, search: v })}
 *     activeFilters={[
 *       { key: 'status', label: 'Status', value: 'Overdue' },
 *       { key: 'from',   label: 'From',   value: '2026-01-01' },
 *     ]}
 *     onRemoveFilter={(key) => clearOne(key)}
 *     onClearAll={clearAll}
 *   >
 *     ...your existing filter inputs, rendered inside the popover...
 *   </FilterBar>
 */

export type ActiveFilter = {
    /** Stable key used to remove this filter. */
    key: string;
    /** Field name, e.g. "Status". Untranslated. */
    label: string;
    /** Applied value shown after the label, e.g. "Overdue". Already formatted. */
    value: string;
};

type Props = {
    /** Current search term. */
    search?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;

    /** Chips for everything currently applied. */
    activeFilters?: ActiveFilter[];
    onRemoveFilter?: (key: string) => void;
    onClearAll?: () => void;

    /** Filter inputs, rendered inside the popover. Omit to hide the button. */
    children?: React.ReactNode;
    /** Width of the filter popover. Default 'w-80'. */
    popoverWidth?: string;

    /** Extra controls rendered on the right, e.g. PerPageSelector, view toggle. */
    trailing?: React.ReactNode;
    className?: string;
};

export function FilterBar({
    search,
    onSearchChange,
    searchPlaceholder = 'Search...',
    activeFilters = [],
    onRemoveFilter,
    onClearAll,
    children,
    popoverWidth = 'w-80',
    trailing,
    className,
}: Props) {
    const { t } = useTranslation();
    const { settings } = useBrand();
    const isRtl = settings.layoutDirection === 'rtl';

    const hasFilters = activeFilters.length > 0;

    return (
        <div className={cn('mb-4 space-y-3', className)}>
            <div className="flex flex-wrap items-center gap-2">
                {onSearchChange && (
                    <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                        <Search
                            className={cn(
                                'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
                                isRtl ? 'right-3' : 'left-3',
                            )}
                        />
                        <Input
                            value={search ?? ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={t(searchPlaceholder)}
                            className={cn('h-9', isRtl ? 'pr-9' : 'pl-9')}
                        />
                    </div>
                )}

                {children && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 gap-1.5">
                                <SlidersHorizontal className="h-4 w-4" />
                                {t('Filters')}
                                {hasFilters && (
                                    <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                                        {activeFilters.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align={isRtl ? 'end' : 'start'}
                            className={cn('p-4', popoverWidth)}
                        >
                            <div className="space-y-3">{children}</div>
                        </PopoverContent>
                    </Popover>
                )}

                <div className="ms-auto flex items-center gap-2">{trailing}</div>
            </div>

            {/* Active filter chips — always visible, never collapsed. */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {t('Filtered by')}:
                    </span>

                    {activeFilters.map((filter) => (
                        <span
                            key={filter.key}
                            className="inline-flex items-center gap-1.5 rounded-md bg-muted py-1 ps-2.5 pe-1 text-xs"
                        >
                            <span className="text-muted-foreground">{t(filter.label)}:</span>
                            <span className="font-medium text-foreground">{filter.value}</span>
                            {onRemoveFilter && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveFilter(filter.key)}
                                    aria-label={`${t('Remove')} ${t(filter.label)}`}
                                    className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}

                    {onClearAll && (
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                            {t('Clear all')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
