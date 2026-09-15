import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0ea5e9] text-[hsl(222_47%_6%)]",
        secondary: "border-transparent bg-white/8 text-white",
        destructive: "border-transparent bg-red-500 text-white",
        outline: "text-white border-white/20",
        brand: "border-[#0ea5e9]/30 bg-[#0ea5e9]/10 text-[#38bdf8]",
        emerald: "border-[#10b981]/30 bg-[#10b981]/10 text-[#34d399]",
        amber: "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fbbf24]",
        red: "border-red-500/30 bg-red-500/10 text-red-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
