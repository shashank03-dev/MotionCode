"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import { AccountMenu } from "./account-menu";

type MarketingAuthNavActionsProps = {
  variant: "landing" | "site";
};

type AuthState = "loading" | "signed-out" | "signed-in";

export function MarketingAuthNavActions({
  variant,
}: MarketingAuthNavActionsProps) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const applyUserState = (user: User | null) => {
    setAuthState(user ? "signed-in" : "signed-out");
    setUserEmail(user?.email?.trim() || null);
  };

  useEffect(() => {
    let isCurrent = true;

    try {
      const supabase = createSupabaseBrowserClient();

      void supabase.auth.getUser().then(({ data, error }) => {
        if (!isCurrent) {
          return;
        }

        applyUserState(error ? null : data.user);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isCurrent) {
          return;
        }

        applyUserState(session?.user ?? null);
      });

      return () => {
        isCurrent = false;
        subscription.unsubscribe();
      };
    } catch {
      return () => {
        isCurrent = false;
      };
    }
  }, []);

  if (authState === "signed-in") {
    return variant === "landing" ? (
      <div className="motioncode-nav-actions" aria-label="Account actions">
        <Link href="/dashboard" className="motioncode-nav-auth">
          Dashboard
        </Link>
        <Link href="/app" className="motioncode-nav-cta">
          Open App
        </Link>
        <AccountMenu email={userEmail} />
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center border border-[#1a1a1a] px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#d8cfbc] transition-colors hover:border-[#00ff88] hover:text-[#fffbf4]"
        >
          Dashboard
        </Link>
        <Link
          href="/account"
          className="hidden h-9 items-center border border-[#1a1a1a] px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#565449] transition-colors hover:border-[#00ff88] hover:text-[#fffbf4] sm:inline-flex"
        >
          Account
        </Link>
        <Link
          href="/app"
          className="inline-flex h-9 items-center border border-[#00ff88] px-4 font-mono text-xs font-bold text-[#00ff88] transition-colors hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff88]"
        >
          Open App
        </Link>
        <SignOutButton
          className="border-[#1a1a1a] px-3 font-mono text-xs text-[#565449] hover:border-[#00ff88] hover:text-[#fffbf4]"
          label="Out"
        />
      </div>
    );
  }

  if (variant === "landing") {
    return (
      <div className="motioncode-nav-actions" aria-label="Account actions">
        <Link href="/login" className="motioncode-nav-auth">
          Sign in
        </Link>
        <Link href="/app" className="motioncode-nav-cta">
          Try Free
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/app"
      className="inline-flex h-9 items-center border border-[#00ff88] px-4 font-mono text-xs font-bold text-[#00ff88] transition-colors hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff88]"
    >
      {authState === "loading" ? "Loading..." : "Try Free →"}
    </Link>
  );
}
