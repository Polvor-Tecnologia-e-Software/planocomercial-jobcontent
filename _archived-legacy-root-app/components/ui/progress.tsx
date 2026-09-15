"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showValue?: boolean;
  label?: string;
  color?: "brand" | "emerald" | "amber";
}

const colorMap = {
  brand: "from-[#0ea5e9] to-[#38bdf8]",
  emerald: "from-[#059669] to-[#34d399]",
  amber: "from-[#f59e0b] to-[#fbbf24]",
};

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, showValue, label, color = "brand", ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {(label || showValue) && (
        <div className="flex justify-between text-sm" style={{ color: "hsl(215 20% 55%)" }}>
          {label && <span>{label}</span>}
          {showValue && <span>{value}%</span>}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-white/8", className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn("h-full w-full flex-1 bg-gradient-to-r transition-all duration-500 ease-out", colorMap[color])}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
