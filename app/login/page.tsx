import Link from "next/link";

import { LoginForm } from "@/components/dashboard/login-form";
import { normalizeAuthNextPath } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    auth?: string;
    next?: string;
    signedOut?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps = {}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizeAuthNextPath(resolvedSearchParams?.next);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#050604] px-4 py-5 text-[#fffbf4] sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,251,244,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,251,244,0.028)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,255,136,0.42),transparent)]" />
        <div className="absolute bottom-[-18%] left-[-12%] h-[46rem] w-[46rem] rotate-[-18deg] bg-[conic-gradient(from_130deg_at_50%_50%,transparent_0_18%,rgba(0,255,136,0.13)_20%,rgba(255,251,244,0.035)_27%,transparent_38%_100%)] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-[#56544966] bg-[#0b0d09]/92 shadow-[0_36px_120px_rgba(0,0,0,0.62)] lg:min-h-[680px] lg:grid-cols-[1fr_minmax(360px,480px)]">
          <MotionLabPreview />
          <div className="relative flex min-h-[620px] flex-col bg-[#f7f2e8] p-6 text-[#11120d] sm:p-8 lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.42]"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(17,18,13,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(17,18,13,0.04)_1px,transparent_1px)] bg-[size:38px_38px]" />
              <div className="absolute right-[-18%] top-[-22%] h-[32rem] w-[32rem] rotate-12 bg-[conic-gradient(from_210deg_at_50%_50%,transparent_0_16%,rgba(0,255,136,0.20)_18%,rgba(255,0,128,0.12)_25%,rgba(0,174,255,0.14)_33%,transparent_47%_100%)] blur-2xl" />
            </div>

            <div className="relative mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center">
              <div className="mb-10 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="font-mono text-sm text-[#126137] transition-colors duration-200 hover:text-[#11120d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#126137]"
                >
                  ⟨/⟩ MotionCode
                </Link>
                <span className="border border-[#126137]/25 bg-[#126137]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#126137]">
                  auth kernel
                </span>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#126137]">
                production workspace
              </p>
              <h1 className="mt-4 font-mono text-4xl font-semibold leading-tight text-[#11120d]">
                Sign in
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#565449]">
                Access your workspaces, projects, and generated motion versions.
              </p>

              <div className="my-7 h-px w-full bg-[linear-gradient(90deg,rgba(18,97,55,0.65),rgba(17,18,13,0.14),transparent)]" />

              {resolvedSearchParams?.signedOut === "1" ? (
                <p className="mb-5 border border-[#00a95a]/35 bg-[#00a95a]/10 px-3 py-2 font-mono text-xs text-[#126137]">
                  Signed out.
                </p>
              ) : null}
              {resolvedSearchParams?.auth ? (
                <p className="mb-5 border border-red-500/35 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-700">
                  Sign in could not be completed. Try again.
                </p>
              ) : null}
              <LoginForm nextPath={nextPath} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MotionLabPreview() {
  const frames = ["scale", "fade", "ease", "ship"];
  const exports = [
    { label: "React", value: "82%" },
    { label: "CSS", value: "64%" },
    { label: "Tokens", value: "74%" },
  ];

  return (
    <div className="relative hidden min-h-[620px] overflow-hidden bg-[#080908] p-8 text-[#fffbf4] lg:block">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,251,244,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,251,244,0.04)_1px,transparent_1px)] bg-[size:34px_34px] opacity-70" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,255,136,0.64),transparent)]" />
      <div className="absolute -right-24 top-10 h-[34rem] w-[34rem] rotate-12 bg-[conic-gradient(from_210deg_at_50%_50%,transparent_0_14%,rgba(0,255,136,0.22)_18%,rgba(255,0,128,0.17)_25%,rgba(0,174,255,0.18)_33%,transparent_47%_100%)] blur-2xl" />
      <div className="absolute -left-24 bottom-[-10rem] h-[28rem] w-[28rem] rotate-[-14deg] bg-[conic-gradient(from_120deg_at_50%_50%,transparent_0_20%,rgba(216,207,188,0.13)_24%,rgba(0,255,136,0.14)_34%,transparent_48%_100%)] blur-xl" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00ff88]">
            motion lab
          </p>
          <h2 className="mt-5 max-w-xl font-mono text-5xl font-semibold leading-[0.95] tracking-normal text-[#fffbf4]">
            Convert motion references into shippable code.
          </h2>
        </div>

        <div className="relative mt-10 h-[390px]">
          <div className="absolute left-0 top-12 w-[330px] border border-[#d8cfbc33] bg-[#0a0c09]/82 shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-md">
            <div className="flex h-10 items-center justify-between border-b border-[#d8cfbc22] px-4">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="size-2 rounded-full bg-[#ff5f57]" />
                <span className="size-2 rounded-full bg-[#ffbd2e]" />
                <span className="size-2 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-[10px] text-[#8f887a]">
                analysis.ts
              </span>
            </div>
            <div className="space-y-2.5 p-5 font-mono text-xs leading-6">
              <p className="text-[#8f887a]">$ motioncode analyze hover.mp4</p>
              <p className="text-[#d8cfbc]">&gt; extracting 8 keyframes</p>
              <p className="text-[#00ff88]">&gt; easing cubic-bezier locked</p>
              <p className="text-[#d8cfbc]">&gt; reduced motion fallback</p>
              <p className="text-[#00ff88]">&gt; export ready</p>
            </div>
          </div>

          <div className="absolute right-0 top-0 w-[178px] border border-[#d8cfbc33] bg-[#10120d]/84 p-4 shadow-[0_20px_56px_rgba(0,0,0,0.42)] backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d8cfbc]">
              frame sampler
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {frames.map((frame, index) => (
                <div
                  key={frame}
                  className="h-12 border border-[#d8cfbc22] bg-[#fffbf40d] p-2"
                >
                  <span className="block h-1.5 rounded-full bg-[#00ff88]/70" />
                  <span className="mt-2 block font-mono text-[9px] text-[#8f887a]">
                    {index + 1} {frame}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-20 right-8 w-[210px] border border-[#d8cfbc33] bg-[#10120d]/88 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.44)] backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d8cfbc]">
              curve solver
            </p>
            <div className="mt-4 h-24 border border-[#d8cfbc22] bg-[#fffbf408]">
              <svg
                aria-hidden="true"
                viewBox="0 0 180 86"
                className="h-full w-full"
              >
                <path
                  d="M10 66 C48 18, 82 78, 122 32 S160 18, 170 20"
                  fill="none"
                  stroke="#00ff88"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <circle cx="10" cy="66" fill="#fffbf4" r="3" />
                <circle cx="122" cy="32" fill="#fffbf4" r="3" />
                <circle cx="170" cy="20" fill="#fffbf4" r="3" />
              </svg>
            </div>
          </div>

          <div className="absolute bottom-0 left-16 w-[270px] border border-[#d8cfbc33] bg-[#10120d]/86 p-4 shadow-[0_24px_72px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d8cfbc]">
              export stack
            </p>
            <div className="mt-4 space-y-3">
              {exports.map((item) => (
                <div key={item.label} className="grid grid-cols-[58px_1fr] items-center gap-3">
                  <span className="font-mono text-[10px] text-[#8f887a]">
                    {item.label}
                  </span>
                  <span className="h-1.5 overflow-hidden bg-[#fffbf414]">
                    <span
                      className="block h-full bg-[#00ff88]"
                      style={{ width: item.value }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute left-28 right-28 top-[205px] h-px bg-[linear-gradient(90deg,transparent,rgba(0,255,136,0.78),transparent)] shadow-[0_0_22px_rgba(0,255,136,0.54)]" />
        </div>
      </div>
    </div>
  );
}
