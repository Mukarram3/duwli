// resources/js/components/charts/kanakku-charts.tsx
import { useId, useMemo } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    AreaChart,
    Area,
    LineChart,
    Line,
    PieChart,
    Pie,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    Legend,
} from 'recharts';

/**
 * KANAKKU CHART SET
 * ----------------------------------------------------------------------------
 * The template's chart shapes, rebuilt on Recharts so every screen in the
 * system can use them instead of the plain default charts.
 *
 * What actually makes these read as "Kanakku" rather than stock Recharts:
 *
 *   - bars sit on a pale full-height TRACK, so the chart has a visible frame
 *     even where values are small
 *   - bars are fully rounded pills with a vertical gradient
 *   - no Y axis, no vertical grid lines — the track carries the scale
 *   - areas use a strong top stop fading to nothing
 *   - rings are thin with a large centre label
 *
 * Colours default to the theme's --primary, so these follow whatever brand
 * colour a company sets rather than hard-coding the template's violet.
 */

const CHART_COLOR = 'hsl(var(--primary))';
const TRACK_COLOR = 'hsl(var(--muted))';

const tooltipStyle = {
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    fontSize: 12,
    padding: '8px 10px',
};

/* ------------------------------------------------------------------ */
/* Tracked bar chart — the template's signature shape                   */
/* ------------------------------------------------------------------ */

type TrackedBarProps = {
    data: Array<Record<string, any>>;
    /** Category key, e.g. 'month'. */
    xKey: string;
    /** Value key, e.g. 'sales'. */
    yKey: string;
    height?: number;
    color?: string;
    /** Formats the tooltip value. */
    format?: (value: any) => string;
    /** Show the pale track behind each bar. */
    track?: boolean;
};

export function TrackedBarChart({
    data,
    xKey,
    yKey,
    height = 300,
    color = CHART_COLOR,
    format,
    track = true,
}: TrackedBarProps) {
    const gradientId = useId().replace(/:/g, '');

    // The track is a second bar drawn at the chart's maximum, behind the real
    // one. Computing it here keeps every bar's track the same full height.
    const trackValue = useMemo(() => {
        const max = Math.max(...data.map((d) => Number(d[yKey]) || 0), 0);
        return max > 0 ? max : 1;
    }, [data, yKey]);

    const withTrack = useMemo(
        () => data.map((d) => ({ ...d, __track: trackValue })),
        [data, trackValue],
    );

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={withTrack} barGap={-9999} barCategoryGap="30%">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                    </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="transparent" />
                <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    dy={6}
                />
                <YAxis hide domain={[0, trackValue]} />
                <ReTooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) =>
                        name === '__track' ? null : [format ? format(value) : value, '']
                    }
                />

                {track && (
                    <Bar
                        dataKey="__track"
                        fill={TRACK_COLOR}
                        radius={[20, 20, 20, 20]}
                        maxBarSize={30}
                        isAnimationActive={false}
                    />
                )}

                <Bar dataKey={yKey} radius={[20, 20, 20, 20]} maxBarSize={30}>
                    {withTrack.map((_, index) => (
                        <Cell key={index} fill={`url(#${gradientId})`} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

/* ------------------------------------------------------------------ */
/* Gradient area — used for growth and trend panels                     */
/* ------------------------------------------------------------------ */

type GradientAreaProps = {
    data: Array<Record<string, any>>;
    xKey: string;
    /** One or more value keys. The first uses the theme colour. */
    series: Array<{ key: string; label: string; color?: string }>;
    height?: number;
    format?: (value: any) => string;
    showAxis?: boolean;
};

export function GradientAreaChart({
    data,
    xKey,
    series,
    height = 260,
    format,
    showAxis = true,
}: GradientAreaProps) {
    const base = useId().replace(/:/g, '');

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ left: showAxis ? 0 : -30, right: 8, top: 8 }}>
                <defs>
                    {series.map((s, i) => (
                        <linearGradient key={s.key} id={`${base}-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={s.color || CHART_COLOR} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={s.color || CHART_COLOR} stopOpacity={0} />
                        </linearGradient>
                    ))}
                </defs>

                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    hide={!showAxis}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={64}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    hide={!showAxis}
                />
                <ReTooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any) => (format ? format(value) : value)}
                />
                {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}

                {series.map((s, i) => (
                    <Area
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color || CHART_COLOR}
                        strokeWidth={2}
                        fill={`url(#${base}-${i})`}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}

/* ------------------------------------------------------------------ */
/* Ring — thin donut with a large centre label                          */
/* ------------------------------------------------------------------ */

type RingProps = {
    slices: Array<{ name: string; value: number; color?: string }>;
    centerValue?: string;
    centerLabel?: string;
    height?: number;
    format?: (value: any) => string;
};

export function RingChart({ slices, centerValue, centerLabel, height = 260, format }: RingProps) {
    return (
        <div className="relative" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={slices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="70%"
                        outerRadius="100%"
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                    >
                        {slices.map((slice, i) => (
                            <Cell key={i} fill={slice.color || CHART_COLOR} />
                        ))}
                    </Pie>
                    <ReTooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: any) => (format ? format(value) : value)}
                    />
                </PieChart>
            </ResponsiveContainer>

            {(centerValue || centerLabel) && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    {centerValue && <span className="text-3xl font-semibold">{centerValue}</span>}
                    {centerLabel && (
                        <span className="text-sm text-muted-foreground">{centerLabel}</span>
                    )}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Gauge — half ring with a value beside it                             */
/* ------------------------------------------------------------------ */

export function GaugeChart({
    percent,
    height = 130,
    color = CHART_COLOR,
}: {
    percent: number;
    height?: number;
    color?: string;
}) {
    const data = [{ name: 'value', value: percent, fill: color }];

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="72%"
                    outerRadius="100%"
                    data={data}
                    startAngle={200}
                    endAngle={-20}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background={{ fill: TRACK_COLOR }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Sparkline — a bare trend line for compact cards                      */
/* ------------------------------------------------------------------ */

export function Sparkline({
    data,
    yKey,
    height = 60,
    color = CHART_COLOR,
}: {
    data: Array<Record<string, any>>;
    yKey: string;
    height?: number;
    color?: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
                <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

/* ------------------------------------------------------------------ */
/* Segmented status bar — Paid / Refunded / Cancelled                   */
/* ------------------------------------------------------------------ */

export function SegmentedBar({
    segments,
}: {
    segments: Array<{ label: string; value: number; color: string }>;
}) {
    const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

    return (
        <div>
            <div className="mb-4 flex h-3 overflow-hidden rounded-full">
                {segments.map((s) => (
                    <span
                        key={s.label}
                        className={s.color}
                        style={{ width: `${(s.value / total) * 100}%` }}
                    />
                ))}
            </div>
            {segments.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-1 text-sm">
                    <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${s.color}`} />
                        {s.label}
                    </span>
                    <span className="font-medium">{Math.round((s.value / total) * 100)}%</span>
                </div>
            ))}
        </div>
    );
}
