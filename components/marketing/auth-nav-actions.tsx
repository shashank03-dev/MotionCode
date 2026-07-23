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
};

type AuthState = "loading" | "signed-out" | "signed-in";

// The site header is a rounded glass pill with title-case ghost links
// (Features, Pricing). The auth cluster speaks the same language: neutral
// ghost pills that match those links, with the accent ButtonLink as the one
// CTA — instead of the square uppercase chips that clashed with the header.
const NAV_LINK =
  "rounded-full px-3.5 py-1.5 text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink";
const SIGN_OUT_LINK =
  "rounded-full border-transparent bg-transparent px-3.5 text-[14px] font-normal text-ink-2 transition-colors hover:text-ink";

export function MarketingAuthNavActions({
  variant,
}: MarketingAuthNavActionsProps) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

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
      <div className="flex items-center gap-1">
        <Link href="/dashboard" className={NAV_LINK}>
          Dashboard
        </Link>
        <Link
          href="/account"
          className={cn(NAV_LINK, "hidden sm:inline-block")}
        >
          Account
        </Link>
        <ButtonLink href="/app" variant="primary" size="sm" className="ml-1">
          Open App
        </ButtonLink>
        <SignOutButton className={SIGN_OUT_LINK} label="Sign out" />
      </div>
    );
  }

  if (variant === "landing") {
    return (
      <div className="motioncode-nav-actions" aria-label="Account actions">
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="motioncode-nav-auth"
        >
          Sign in
        </button>
        <Link href="/app" className="motioncode-nav-cta">
          Try Free
        </Link>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return (
    <ButtonLink href="/app" variant="primary" size="sm">
      {authState === "loading" ? "Loading…" : "Try Free"}
    </ButtonLink>
  );
}
