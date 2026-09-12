"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TabsProps = {
  tabs: { id: string; label: string }[];
  value: string;
  onValueChange: (id: string) => void;
  layoutId?: string;
  className?: string;
};

export function Tabs({
  tabs,
  value,
  onValueChange,
  layoutId = "tab-pill",
  className,
}: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/[0.03] p-1 shadow-ring",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(tab.id)}
            className={cn(
              "relative min-h-[44px] rounded-full px-3.5 py-2.5 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors duration-200",
              active ? "text-black" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
