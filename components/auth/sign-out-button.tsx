"use client";

import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({
  className,
  label = "Sign out",
}: SignOutButtonProps) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 border px-3 text-sm transition",
          className,
        )}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}
