// resources/js/components/stat-card.tsx
import * as React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * KANAKKU-STYLE STAT CARD
 * ----------------------------------------------------------------------------
 * Ported from the template's dashboard KPI markup:
 *
 *   label + large value on the left, a pill-shaped delta badge on the right,
 *   optional supporting line beneath, on either a gradient or a plain surface.
 *
 * The Bootstrap original used `bg-primary-gradient-200` with hard-coded white
 * text. Here the gradient is expressed in theme tokens, so a change of primary
 * colour flows through instead of needing the class rewritten.
 */

export type StatTone = 'gradient' | 'plain' | 'success' | 'warning' | 'danger';

type Props = {
    label: string;
    value: string;
    /** Percentage change, e.g. 20 or -4.5. Omit to hide the badge. */
    delta?: number;
    /** Text under the value, e.g. "vs last month". */
    caption?: string;
    icon?: React.ComponentType<{ className?: string }>;
    tone?: StatTone;
    /** Makes the whole card a link. */
    href?: string;
    className?: string;
};

const toneStyles: Record<StatTone, string> = {
    // The template's hero card: a soft primary gradient with white type.
    gradient:
        'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-transparent',
    plain: 'bg-card text-card-foreground',
    success: 'bg-card text-card-foreground',
    warning: 'bg-card text-card-foreground',
    danger: 'bg-card text-card-foreground',
};

const iconStyles: Record<StatTone, string> = {
    gradient: 'bg-white/15 text-white',
    plain: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
};

export function StatCard({
    label,
    value,
    delta,
    caption,
    icon: Icon,
    tone = 'plain',
    href,
    className,
}: Props) {
    const onGradient = tone === 'gradient';
    const rising = (delta ?? 0) >= 0;

    const body = (
        <div
            className={cn(
                'rounded-lg border p-5 shadow-[0_1px_2px_0_rgb(5_19_33/0.04)]',
                'transition-shadow hover:shadow-md',
                toneStyles[tone],
                className,
            )}
        >
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p
                        className={cn(
                            'mb-1 truncate text-sm',
                            onGradient ? 'text-white/80' : 'text-muted-foreground',
                        )}
                    >
                        {label}
                    </p>
                    <p className="text-2xl font-semibold leading-tight">{value}</p>
                </div>

                {Icon && (
                    <span
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
                            iconStyles[tone],
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {typeof delta === 'number' && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                            onGradient
                                ? 'bg-white/15 text-white'
                                : rising
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700',
                        )}
                    >
                        {Math.abs(delta)}%
                        {rising ? (
                            <ArrowUp className="h-3 w-3" />
                        ) : (
                            <ArrowDown className="h-3 w-3" />
                        )}
                    </span>
                )}

                {caption && (
                    <span
                        className={cn(
                            'truncate text-xs',
                            onGradient ? 'text-white/70' : 'text-muted-foreground',
                        )}
                    >
                        {caption}
                    </span>
                )}
            </div>
        </div>
    );

    return href ? (
        <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            {body}
        </Link>
    ) : (
        body
    );
}
