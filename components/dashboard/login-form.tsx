"use client";

import { Mail, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormState = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<LoginFormState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
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
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block text-sm text-[#d8cfbc]" htmlFor="email">
        Email
      </label>
      <div className="flex min-h-11 items-center border border-[#56544966] bg-[#15160f] px-3 focus-within:border-[#d8cfbc]">
        <Mail className="mr-2 size-4 text-[#8f887a]" />
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#fffbf4] outline-none placeholder:text-[#6f695c]"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex h-10 w-full items-center justify-center gap-2 bg-[#d8cfbc] px-4 text-sm font-semibold text-[#11120d] disabled:opacity-60"
      >
        <Send className="size-4" />
        {state === "sending" ? "Sending" : "Send magic link"}
      </button>
      {message ? (
        <p
          className={
            state === "error" ? "text-sm text-red-300" : "text-sm text-[#b8af9d]"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
