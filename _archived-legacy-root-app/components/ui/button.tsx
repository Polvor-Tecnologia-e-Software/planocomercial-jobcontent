"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#0ea5e9] text-[hsl(222_47%_6%)] hover:bg-[#0284c7] shadow-lg shadow-[#0ea5e9]/20 hover:-translate-y-0.5",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
        secondary: "bg-white/8 text-white hover:bg-white/12",
        ghost: "hover:bg-white/6 text-white",
        link: "text-[#38bdf8] underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8] text-white shadow-lg shadow-[#0ea5e9]/25 hover:shadow-[#0ea5e9]/40 hover:-translate-y-0.5",
        "gradient-emerald": "bg-gradient-to-r from-[#059669] to-[#10b981] text-white shadow-lg shadow-[#10b981]/25 hover:-translate-y-0.5",
        glass: "glass text-white hover:bg-white/8",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
