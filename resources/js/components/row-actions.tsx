// resources/js/components/row-actions.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * CONSISTENT ROW ACTIONS
 * ----------------------------------------------------------------------------
 * Document tables previously HID actions that did not apply to a row — Post,
 * Edit and Delete vanish once an invoice leaves draft. The result is a ragged
 * Actions column where one row shows two icons and the next shows five, and the
 * user cannot tell whether an action is missing because it is forbidden or
 * because the row is different.
 *
 * Qoyod keeps the same icons on every row and greys out what does not apply.
 * This component does that: an action the user LACKS PERMISSION for is removed
 * entirely (it is none of their business), while an action that is merely
 * unavailable FOR THIS ROW is shown disabled, with a tooltip explaining why.
 *
 * The distinction matters — "you can't do this" and "this can't be done yet"
 * are different messages.
 */

export type RowAction = {
    /** Tooltip label. Pass an already-translated string. */
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    /** Tailwind text colour class for the icon, e.g. 'text-green-600'. */
    className?: string;
    /**
     * Whether the user may perform this action at all. False removes the icon.
     * Omit for actions everyone with table access may perform.
     */
    permitted?: boolean;
    /**
     * Whether this row currently allows the action. False greys the icon out
     * and shows `disabledReason` instead of `label`.
     */
    available?: boolean;
    /** Why the action is unavailable for this row. Shown when disabled. */
    disabledReason?: string;
};

type Props = {
    actions: RowAction[];
    className?: string;
};

export function RowActions({ actions, className }: Props) {
    const { t } = useTranslation();

    // Permission removes an action; availability only disables it.
    const visible = actions.filter((action) => action.permitted !== false);

    if (visible.length === 0) return null;

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            <TooltipProvider>
                {visible.map((action) => {
                    const Icon = action.icon;
                    const disabled = action.available === false;

                    return (
                        <Tooltip key={action.label} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={disabled}
                                        onClick={action.onClick}
                                        aria-label={action.label}
                                        className={cn(
                                            'h-8 w-8 p-0',
                                            disabled
                                                ? 'cursor-not-allowed text-muted-foreground/40'
                                                : action.className,
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {disabled
                                        ? action.disabledReason || t('Not available for this record')
                                        : action.label}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </TooltipProvider>
        </div>
    );
}
