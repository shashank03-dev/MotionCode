"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { MotionField } from "@/components/auth/motion-field";
import { Logo } from "@/components/chrono/logo";
import { LoginForm } from "@/components/dashboard/login-form";

const monoFont = { fontFamily: "var(--font-mono)" } as const;

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
    <div className="grid w-full overflow-hidden rounded-2xl border border-hairline-strong bg-surface shadow-[0_40px_140px_rgba(0,0,0,0.72)] lg:grid-cols-[1.05fr_minmax(360px,460px)]">
      {/* left — the motion-capture figure */}
      <div className="relative hidden min-h-[560px] overflow-hidden border-hairline border-r bg-carbon lg:block">
        <MotionField
          className="absolute inset-0"
          background="rgba(8,9,11, 1)"
          base="rgba(237, 235, 228, 1)"
          accent="rgba(255,91,31,1)"
          sampleRadius={30}
          typingImpulseRef={typingImpulseRef}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,rgba(11,11,10,0)_55%,rgba(11,11,10,0.6)_100%)]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-8">
          <span
            className="flex items-center gap-2 text-[12px] uppercase tracking-[0.28em] text-ink-2"
            style={monoFont}
          >
            <span className="inline-block size-2 rounded-full bg-accent shadow-[0_0_12px_rgba(255,91,31,0.8)]" />
            MotionCode
          </span>
          <span
            className="max-w-[150px] text-right text-[10px] leading-5 uppercase tracking-[0.22em] text-[#8a877e]"
            style={monoFont}
          >
            move the cursor to sample
          </span>
        </div>
      </div>

      {/* right — the form */}
      <div className="relative flex min-h-0 flex-col bg-surface p-6 sm:p-8 lg:p-10">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in"
            className="absolute top-4 right-4 grid size-11 sm:size-9 place-items-center rounded-full border border-ink-2/14 text-[#8a877e] transition-colors hover:border-accent/40 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="size-4" />
          </button>
        ) : null}

        <div className="relative mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="MotionCode home"
              className="inline-flex min-h-[44px] items-center transition-opacity duration-200 hover:opacity-80"
            >
              <Logo />
            </Link>
            <span
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-3"
              style={monoFont}
            >
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              secure session
            </span>
          </div>

          <p
            className="text-xs uppercase tracking-[0.24em] text-[#8a877e]"
            style={monoFont}
          >
            welcome back
          </p>
          <h1
            id="login-title"
            className="mt-3 text-[2.6rem] font-medium leading-none tracking-[-0.05em] text-ink sm:text-5xl"
          >
            Sign <span className="serif-em">in</span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#929086]">
            Access your workspaces, projects, and generated motion versions.
          </p>

          <div className="my-6 h-px w-full bg-[linear-gradient(90deg,rgba(255,91,31,0.55),rgba(237,235,228,0.12),transparent)]" />

          {signedOut ? (
            <p
              className="mb-5 border border-[#e64a12]/35 bg-[#e64a12]/10 px-3 py-2 text-xs text-[#ff8a5c]"
              style={monoFont}
            >
              Signed out.
            </p>
          ) : null}
          {authError ? (
            <p
              className="mb-5 border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
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
