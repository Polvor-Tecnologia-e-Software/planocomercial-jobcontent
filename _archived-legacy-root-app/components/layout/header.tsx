"use client";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps { className?: string; minimal?: boolean; }

export function Header({ className, minimal = false }: HeaderProps) {
  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50", className)}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,14,23,0.85)", backdropFilter: "blur(16px)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)", fontWeight: 700 }}>
            Growth Planner{" "}
            <span style={{ color: "#38bdf8" }}>B2B</span>
            <sup style={{ fontSize: "10px", color: "hsl(215 20% 55%)", marginLeft: "2px" }}>™</sup>
          </span>
        </Link>
        {!minimal && (
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: "hsl(215 20% 55%)" }}>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#34d399" }} />
              Diagnóstico gratuito
            </span>
            <span>•</span>
            <span>Plano em 90 dias</span>
            <span>•</span>
            <span>Powered by IA</span>
          </nav>
        )}
      </div>
    </header>
  );
}
