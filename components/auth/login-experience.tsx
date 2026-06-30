"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { MotionField } from "@/components/auth/motion-field";
import { LoginForm } from "@/components/dashboard/login-form";

const displayFont = { fontFamily: "var(--font-bridge-display)" } as const;
const monoFont = { fontFamily: "var(--font-bridge-mono)" } as const;

type LoginExperienceProps = {
  nextPath: string;
  signedOut?: boolean;
  authError?: boolean;
  /** Renders a close affordance when shown inside the landing-page modal. */
  onClose?: () => void;
};

export function LoginExperience({
  nextPath,
  signedOut = false,
  authError = false,
  onClose,
}: LoginExperienceProps) {
  const typingImpulseRef = useRef(0);

  return (
    <div className="grid w-full overflow-hidden rounded-2xl border border-[#56544966] bg-[#0a0c09] shadow-[0_40px_140px_rgba(0,0,0,0.72)] lg:grid-cols-[1.05fr_minmax(360px,460px)]">
      {/* left — the motion-capture figure */}
      <div className="relative hidden min-h-[560px] overflow-hidden border-[#56544933] border-r bg-[#070806] lg:block">
        <MotionField
          className="absolute inset-0"
          background="rgba(7, 8, 6, 1)"
          base="rgba(216, 207, 188, 1)"
          accent="rgba(0, 255, 136, 1)"
          sampleRadius={150}
          typingImpulseRef={typingImpulseRef}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,rgba(7,8,6,0)_55%,rgba(7,8,6,0.55)_100%)]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-8">
          <span
            className="flex items-center gap-2 text-[12px] uppercase tracking-[0.28em] text-[#d8cfbc]"
            style={monoFont}
          >
            <span className="inline-block size-2 rounded-full bg-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.8)]" />
            MotionCode
          </span>
          <span
            className="max-w-[150px] text-right text-[10px] leading-5 uppercase tracking-[0.22em] text-[#8f887a]"
            style={monoFont}
          >
            move the cursor to sample
          </span>
        </div>
      </div>

      {/* right — the form */}
      <div className="relative flex min-h-[560px] flex-col bg-[#0c0e0a] p-6 sm:p-8 lg:p-10">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in"
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-full border border-[#d8cfbc]/14 text-[#8f887a] transition-colors hover:border-[#00ff88]/40 hover:text-[#fffbf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff88]"
          >
            <X className="size-4" />
          </button>
        ) : null}

        <div className="relative mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-[#00c46a] transition-colors duration-200 hover:text-[#fffbf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00ff88]"
              style={monoFont}
            >
              ⟨/⟩ MotionCode
            </Link>
            <span
              className="border border-[#00ff88]/25 bg-[#00ff88]/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#00ff88]"
              style={monoFont}
            >
              auth kernel
            </span>
          </div>

          <p
            className="text-xs uppercase tracking-[0.24em] text-[#8f887a]"
            style={monoFont}
          >
            welcome back
          </p>
          <h1
            id="login-title"
            className="mt-3 text-4xl font-semibold leading-tight text-[#fffbf4]"
            style={displayFont}
          >
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#9a9488]">
            Access your workspaces, projects, and generated motion versions.
          </p>

          <div className="my-7 h-px w-full bg-[linear-gradient(90deg,rgba(0,255,136,0.55),rgba(216,207,188,0.12),transparent)]" />

          {signedOut ? (
            <p
              className="mb-5 border border-[#00a95a]/35 bg-[#00a95a]/10 px-3 py-2 text-xs text-[#5fe6a0]"
              style={monoFont}
            >
              Signed out.
            </p>
          ) : null}
          {authError ? (
            <p
              className="mb-5 border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
              style={monoFont}
            >
              Sign in could not be completed. Try again.
            </p>
          ) : null}

          <LoginForm nextPath={nextPath} typingImpulseRef={typingImpulseRef} />
        </div>
      </div>
    </div>
  );
}
