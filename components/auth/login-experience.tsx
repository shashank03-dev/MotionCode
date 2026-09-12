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
    <div className="grid w-full overflow-hidden rounded-2xl border border-[#565a6066] bg-[#0a0b0d] shadow-[0_40px_140px_rgba(0,0,0,0.72)] lg:grid-cols-[1.05fr_minmax(360px,460px)]">
      {/* left — the motion-capture figure */}
      <div className="relative hidden min-h-[560px] overflow-hidden border-[#565a6033] border-r bg-[#060709] lg:block">
        <MotionField
          className="absolute inset-0"
          background="rgba(8, 9, 11, 1)"
          base="rgba(255, 255, 255, 1)"
          accent="rgba(0, 153, 255, 1)"
          sampleRadius={150}
          typingImpulseRef={typingImpulseRef}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,rgba(8, 9, 11,0)_55%,rgba(8, 9, 11,0.55)_100%)]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-8">
          <span
            className="flex items-center gap-2 text-[12px] uppercase tracking-[0.28em] text-ink-2"
            style={monoFont}
          >
            <span className="inline-block size-2 rounded-full bg-accent shadow-[0_0_12px_rgba(0, 153, 255, 0.8)]" />
            MotionCode
          </span>
          <span
            className="max-w-[150px] text-right text-[10px] leading-5 uppercase tracking-[0.22em] text-[#8a9099]"
            style={monoFont}
          >
            move the cursor to sample
          </span>
        </div>
      </div>

      {/* right — the form */}
      <div className="relative flex min-h-0 flex-col bg-[#0a0b0d] p-6 sm:p-8 lg:p-10">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in"
            className="absolute top-4 right-4 grid size-11 sm:size-9 place-items-center rounded-full border border-ink-2/14 text-[#8a9099] transition-colors hover:border-accent/40 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="size-4" />
          </button>
        ) : null}

        <div className="relative mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-accent transition-colors duration-200 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              style={monoFont}
            >
              ⟨/⟩ MotionCode
            </Link>
            <span
              className="border border-accent/25 bg-accent/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-accent"
              style={monoFont}
            >
              auth kernel
            </span>
          </div>

          <p
            className="text-xs uppercase tracking-[0.24em] text-[#8a9099]"
            style={monoFont}
          >
            welcome back
          </p>
          <h1
            id="login-title"
            className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl"
            style={displayFont}
          >
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#9296a0]">
            Access your workspaces, projects, and generated motion versions.
          </p>

          <div className="my-5 h-px w-full bg-[linear-gradient(90deg,rgba(0, 153, 255, 0.55),rgba(255,255,255,0.12),transparent)]" />

          {signedOut ? (
            <p
              className="mb-5 border border-[#0088e6]/35 bg-[#0088e6]/10 px-3 py-2 text-xs text-[#5fa0e6]"
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
