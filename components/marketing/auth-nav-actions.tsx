"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LoginModal } from "@/components/auth/login-modal";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/ui/site-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

import { AccountMenu } from "./account-menu";

type MarketingAuthNavActionsProps = {
  variant: "landing" | "site";
  layout?: "inline" | "menu";
  onNavigate?: () => void;
};

type AuthState = "loading" | "signed-out" | "signed-in";

// The auth cluster speaks the nav's language: quiet ghost links with the
// safelight ButtonLink as the one CTA.
const NAV_LINK =
  "rounded-full px-3.5 text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink";
const SIGN_OUT_LINK =
  "rounded-full border-transparent bg-transparent px-3.5 text-[14px] font-normal text-ink-2 transition-colors hover:text-ink";

export function MarketingAuthNavActions({
  variant,
  layout = "inline",
  onNavigate,
}: MarketingAuthNavActionsProps) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const applyUserState = (user: User | null) => {
    setAuthState(user ? "signed-in" : "signed-out");
    setUserEmail(user?.email?.trim() || null);
  };

  const [supabase] = useState(() => {
    try {
      return createSupabaseBrowserClient();
    } catch (err) {
      console.error("[auth] client init failed", err);
      return null;
    }
  });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isCurrent = true;

    void supabase.auth.getUser().then(({ data, error }) => {
        if (!isCurrent) {
          return;
        }

        applyUserState(error ? null : data.user);
      }).catch((err) => {
        console.error("[auth] getUser failed", err);
        if (isCurrent) {
          applyUserState(null);
        }
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
  }, [supabase]);

  // Null client (missing env) renders as signed-out instead of stuck "loading".
  const effectiveAuthState = supabase === null ? "signed-out" : authState;

  if (layout === "menu") {
    if (effectiveAuthState === "signed-in") {
      return (
        <div className="grid gap-1" role="group" aria-label="Account actions">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-[15px] text-ink-2 transition-colors hover:bg-bone/[0.05] hover:text-ink"
          >
            Dashboard
          </Link>
          <Link
            href="/account"
            onClick={onNavigate}
            className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-[15px] text-ink-2 transition-colors hover:bg-bone/[0.05] hover:text-ink"
          >
            Account
          </Link>
          <ButtonLink
            href="/app"
            variant="primary"
            size="sm"
            className="mt-1 w-full"
            onClick={onNavigate}
          >
            Open App
          </ButtonLink>
          <div onClick={(event) => event.stopPropagation()}>
            <SignOutButton
              className="mt-1 min-h-[44px] w-full rounded-xl border-hairline px-4 text-[15px] text-ink-2 hover:border-accent-border hover:text-ink"
              label="Sign out"
            />
          </div>
        </div>
      );
    }
    if (variant === "landing") {
      return (
        <div className="grid gap-1" role="group" aria-label="Account actions">
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              setLoginOpen(true);
            }}
            className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-left text-[15px] text-ink-2 transition-colors hover:bg-bone/[0.05] hover:text-ink"
          >
            Sign in
          </button>
          <ButtonLink
            href="/app"
            variant="primary"
            size="sm"
            className="mt-1 w-full"
            onClick={onNavigate}
          >
            Try Free
          </ButtonLink>
          <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
      );
    }
    return (
      <div className="grid gap-1" role="group" aria-label="Account actions">
        <ButtonLink
          href="/app"
          variant="primary"
          size="sm"
          className="w-full"
          onClick={onNavigate}
        >
          {effectiveAuthState === "loading" ? "Loading…" : "Try Free"}
        </ButtonLink>
      </div>
    );
  }

  if (effectiveAuthState === "signed-in") {
    return variant === "landing" ? (
      <div className="flex items-center gap-1 whitespace-nowrap" aria-label="Account actions">
        <Link
          href="/dashboard"
          className={cn(NAV_LINK, "hidden min-h-[44px] items-center sm:inline-flex")}
        >
          Dashboard
        </Link>
        <ButtonLink href="/app" variant="primary" size="sm" className="ml-1">
          Open App
        </ButtonLink>
        <AccountMenu email={userEmail} />
      </div>
    ) : (
      <div className="flex items-center gap-1 whitespace-nowrap">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            NAV_LINK,
            "hidden min-h-[44px] items-center md:inline-flex",
          )}
        >
          Dashboard
        </Link>
        <Link
          href="/account"
          onClick={onNavigate}
          className={cn(
            NAV_LINK,
            "hidden min-h-[44px] items-center md:inline-flex",
          )}
        >
          Account
        </Link>
        <ButtonLink href="/app" variant="primary" size="sm" className="ml-1">
          Open App
        </ButtonLink>
        <div className="hidden md:inline">
          <SignOutButton className={SIGN_OUT_LINK} label="Sign out" />
        </div>
      </div>
    );
  }

  if (variant === "landing") {
    return (
      <div className="flex items-center gap-1 whitespace-nowrap" aria-label="Account actions">
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className={cn(NAV_LINK, "hidden min-h-[44px] items-center sm:inline-flex")}
        >
          Sign in
        </button>
        <ButtonLink href="/app" variant="primary" size="sm" className="ml-1">
          Try Free
        </ButtonLink>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return (
    <ButtonLink href="/app" variant="primary" size="sm">
      {effectiveAuthState === "loading" ? "Loading…" : "Try Free"}
    </ButtonLink>
  );
}
