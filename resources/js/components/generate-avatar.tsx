import React from 'react';
import { cn } from "@/lib/utils";

interface GenerateAvatarProps {
    name: string;
    className?: string;
}

const pastelColors = [
    { bg: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400', border: 'border-red-200 dark:border-red-800/40' },
    { bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/40' },
    { bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40' },
    { bg: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800/40' },
    { bg: 'bg-lime-50 text-lime-700 dark:bg-lime-950/30 dark:text-lime-400', border: 'border-lime-200 dark:border-lime-800/40' },
    { bg: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400', border: 'border-green-200 dark:border-green-800/40' },
    { bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40' },
    { bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/40' },
    { bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/40' },
    { bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800/40' },
    { bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/40' },
    { bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/40' },
    { bg: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/40' },
    { bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/40' },
    { bg: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400', border: 'border-fuchsia-200 dark:border-fuchsia-800/40' },
    { bg: 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800/40' },
    { bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40' }
];

export default function GenerateAvatar({ name, className }: GenerateAvatarProps) {
    const trimmedName = (name || '').trim();

    // Get initials
    let initials = '?';
    if (trimmedName) {
        const parts = trimmedName.split(/\s+/);
        if (parts.length >= 2) {
            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1 && parts[0]) {
            initials = parts[0].substring(0, Math.min(parts[0].length, 2)).toUpperCase();
        }
    }

    // Hash name to get stable color selection
    let hash = 0;
    for (let i = 0; i < trimmedName.length; i++) {
        hash = trimmedName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % pastelColors.length;
    const color = pastelColors[colorIndex];

    return (
        <div
            className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase select-none border tracking-wider",
                color.bg,
                color.border,
                className
            )}
        >
            {initials}
        </div>
    );
}
