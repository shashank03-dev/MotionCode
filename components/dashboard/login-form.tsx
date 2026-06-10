"use client";

import { Mail, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  buildAuthCallbackUrl,
  normalizeAuthNextPath,
} from "@/lib/auth/redirects";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormState = "idle" | "redirecting" | "sending" | "sent" | "error";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath = "/dashboard" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<LoginFormState>("idle");
  const normalizedNextPath = normalizeAuthNextPath(nextPath);

  async function handleGoogleSignIn() {
    setState("redirecting");
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildAuthCallbackUrl(
          window.location.origin,
          normalizedNextPath,
        ),
      },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = buildAuthCallbackUrl(
      window.location.origin,
      normalizedNextPath,
    );
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    setState("sent");
    setMessage("Magic link sent.");
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        disabled={state === "redirecting" || state === "sending"}
        onClick={handleGoogleSignIn}
        className="group inline-flex h-12 w-full items-center justify-center gap-3 border border-[#11120d]/18 bg-[#11120d] px-4 text-sm font-semibold text-[#fffbf4] shadow-[0_12px_28px_rgba(17,18,13,0.16)] transition-[background-color,border-color,transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1b1d15] hover:shadow-[0_16px_34px_rgba(17,18,13,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#126137] active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
      >
        <span
          className="grid size-5 place-items-center rounded-full bg-[#fffbf4] font-mono text-[13px] font-bold text-[#11120d]"
          aria-hidden="true"
        >
          G
        </span>
        {state === "redirecting" ? "Redirecting" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-[#11120d]/12" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#565449]">
          or
        </span>
        <div className="h-px flex-1 bg-[#11120d]/12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label
          className="block font-mono text-[11px] uppercase tracking-[0.14em] text-[#565449]"
          htmlFor="email"
        >
          Email
        </label>
        <div className="flex min-h-12 items-center border border-[#11120d]/14 bg-[#fffbf4]/76 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] transition-[border-color,box-shadow,background-color] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] focus-within:border-[#126137]/55 focus-within:bg-[#fffbf4] focus-within:shadow-[0_0_0_3px_rgba(18,97,55,0.09),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <Mail className="mr-2 size-4 text-[#565449]" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#11120d] outline-none placeholder:text-[#8f887a]"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={state === "sending" || state === "redirecting"}
          className="inline-flex h-11 w-full items-center justify-center gap-2 border border-[#126137]/35 bg-[#126137] px-4 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#fffbf4] transition-[background-color,border-color,transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-[#0f4f2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#126137] active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
        >
          <Send className="size-4" />
          {state === "sending" ? "Sending" : "Send magic link"}
        </button>
        {message ? (
          <p
            className={
              state === "error"
                ? "border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-700"
                : "border border-[#126137]/25 bg-[#126137]/10 px-3 py-2 font-mono text-xs text-[#126137]"
            }
          >
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
