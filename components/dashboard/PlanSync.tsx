"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type PlanSyncProps = {
  /** Current user's id; when absent (signed out) no subscription is opened. */
  userId?: string | null;
};

/**
 * Keeps the rendered plan tier in sync with the database without a manual
 * reload. Two complementary triggers, both calling router.refresh() (which
 * re-runs the server components that read the plan from Supabase):
 *
 *  1. Supabase Realtime — fires when this user's `profiles` row (admin plan
 *     override) or `subscriptions` row (Razorpay lifecycle) changes while the
 *     tab is open. Respects RLS via the user's session. If Realtime isn't
 *     enabled for those tables the channel simply receives nothing.
 *  2. Focus / visibility — covers the common case of returning to the tab after
 *     completing checkout or an admin change elsewhere, and is the fallback when
 *     Realtime is unavailable.
 *
 * Renders nothing.
 */
export function PlanSync({ userId }: PlanSyncProps) {
  const router = useRouter();

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const supabase = (() => {
      try {
        return createSupabaseBrowserClient();
      } catch {
        // Missing public Supabase config; focus-refresh still covers updates.
        return null;
      }
    })();
    if (!supabase) return;

    const onChange = () => router.refresh();

    const channel = supabase
      .channel(`plan-sync:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        onChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        onChange,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
