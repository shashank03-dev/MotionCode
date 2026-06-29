"use client";

import { Eye, EyeOff, Lock, Mail, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  DEFAULT_AUTH_NEXT_PATH,
  buildAuthCallbackUrl,
  getAuthRedirectOrigin,
  normalizeAuthNextPath,
} from "@/lib/auth/redirects";
import { isSupabaseExternalProviderEnabled } from "@/lib/supabase/auth-settings";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormState =
  | "idle"
  | "redirecting"
  | "sending"
  | "sent"
  | "authenticating"
  | "error";
type GoogleProviderState = "checking" | "enabled" | "disabled" | "unavailable";

type LoginFormProps = {
  nextPath?: string;
};

const GOOGLE_PROVIDER_DISABLED_MESSAGE =
  "Google sign-in is not enabled for this Supabase project. Use email sign-in while the Supabase Google provider is configured.";
const GOOGLE_PROVIDER_UNAVAILABLE_MESSAGE =
  "Google sign-in cannot be verified right now. Use email sign-in while Supabase Auth settings are checked.";

export function LoginForm({
  nextPath = DEFAULT_AUTH_NEXT_PATH,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<LoginFormState>("idle");
  const [googleProviderState, setGoogleProviderState] =
    useState<GoogleProviderState>("checking");
  const normalizedNextPath = normalizeAuthNextPath(nextPath);
  const googleProviderMessage =
    googleProviderState === "disabled"
      ? GOOGLE_PROVIDER_DISABLED_MESSAGE
      : googleProviderState === "unavailable"
        ? GOOGLE_PROVIDER_UNAVAILABLE_MESSAGE
        : null;

  useEffect(() => {
    let isCurrent = true;

    isSupabaseExternalProviderEnabled("google")
      .then((enabled) => {
        if (isCurrent) {
          setGoogleProviderState(enabled ? "enabled" : "disabled");
        }
      })
      .catch(() => {
        if (isCurrent) {
          setGoogleProviderState("unavailable");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function buildRedirectTo() {
    return buildAuthCallbackUrl(
      getAuthRedirectOrigin(window.location.origin),
      normalizedNextPath,
    );
  }

  async function handleGoogleSignIn() {
    if (googleProviderState !== "enabled") {
      setState("error");
      setMessage(googleProviderMessage ?? GOOGLE_PROVIDER_UNAVAILABLE_MESSAGE);
      return;
    }

    setState("redirecting");
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          prompt: "select_account",
        },
        redirectTo: buildRedirectTo(),
      },
    });

    if (error) {
      setState("error");
      setMessage(getGoogleSignInErrorMessage(error.message));
    }
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("authenticating");
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setState("error");
      setMessage(
        /invalid login credentials/i.test(error.message)
          ? "Incorrect email or password. You can also use a one-time link below."
          : error.message,
      );
      return;
    }

    window.location.assign(normalizedNextPath);
  }

  async function handleMagicLink() {
    setState("sending");
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = buildRedirectTo();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
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
        aria-describedby={
          googleProviderMessage ? "google-auth-provider-status" : undefined
        }
        disabled={
          state === "redirecting" ||
          state === "sending" ||
          googleProviderState !== "enabled"
        }
        onClick={handleGoogleSignIn}
        className="group inline-flex h-12 w-full items-center justify-center gap-3 border border-[#11120d]/18 bg-[#11120d] px-4 text-sm font-semibold text-[#fffbf4] shadow-[0_12px_28px_rgba(17,18,13,0.16)] transition-[background-color,border-color,transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1b1d15] hover:shadow-[0_16px_34px_rgba(17,18,13,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#126137] active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
      >
        <span
          className="grid size-5 place-items-center rounded-full bg-[#fffbf4] font-mono text-[13px] font-bold text-[#11120d]"
          aria-hidden="true"
        >
          G
        </span>
        {state === "redirecting"
          ? "Redirecting"
          : googleProviderState === "checking"
            ? "Checking Google"
            : "Continue with Google"}
      </button>
      {googleProviderMessage ? (
        <p
          id="google-auth-provider-status"
          className="border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-700"
        >
          {googleProviderMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-[#11120d]/12" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#565449]">
          or
        </span>
        <div className="h-px flex-1 bg-[#11120d]/12" />
      </div>

      <form onSubmit={handlePasswordSignIn} className="space-y-4">
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
        <label
          className="block font-mono text-[11px] uppercase tracking-[0.14em] text-[#565449]"
          htmlFor="password"
        >
          Password
        </label>
        <div className="flex min-h-12 items-center border border-[#11120d]/14 bg-[#fffbf4]/76 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] transition-[border-color,box-shadow,background-color] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] focus-within:border-[#126137]/55 focus-within:bg-[#fffbf4] focus-within:shadow-[0_0_0_3px_rgba(18,97,55,0.09),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <Lock className="mr-2 size-4 text-[#565449]" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#11120d] outline-none placeholder:text-[#8f887a]"
            placeholder="Your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="ml-2 text-[#565449] transition-colors hover:text-[#11120d]"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <button
          type="submit"
          disabled={
            state === "authenticating" ||
            state === "sending" ||
            state === "redirecting" ||
            email.trim().length === 0 ||
            password.length === 0
          }
          className="inline-flex h-11 w-full items-center justify-center gap-2 border border-[#126137]/35 bg-[#126137] px-4 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#fffbf4] transition-[background-color,border-color,transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-[#0f4f2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#126137] active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
        >
          <Lock className="size-4" />
          {state === "authenticating" ? "Signing in" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={
            state === "sending" ||
            state === "redirecting" ||
            state === "authenticating" ||
            email.trim().length === 0
          }
          className="inline-flex h-10 w-full items-center justify-center gap-2 border border-[#11120d]/14 bg-transparent px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#565449] transition-colors duration-200 hover:border-[#126137]/45 hover:text-[#11120d] disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="size-3.5" />
          {state === "sending" ? "Sending link" : "Email me a one-time link"}
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

function getGoogleSignInErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("unsupported provider") ||
    (normalized.includes("provider") && normalized.includes("not enabled"))
  ) {
    return GOOGLE_PROVIDER_DISABLED_MESSAGE;
  }

  return message;
}
