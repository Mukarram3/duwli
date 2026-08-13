import React from 'react';
import { cn } from "@/lib/utils";

interface BadgeUIProps {
    children: React.ReactNode;
    className?: string;
}

export default function BadgeUI({
    children,
    className
}: BadgeUIProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-zinc-50 text-zinc-700 ring-zinc-600/20",
                className
            )}
        >
            {children}
        </span>
    );
}

