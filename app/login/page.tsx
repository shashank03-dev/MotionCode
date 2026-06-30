import { LoginExperience } from "@/components/auth/login-experience";
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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#07080a] px-4 py-6 text-[#fffbf4] sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,251,244,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,251,244,0.018)_1px,transparent_1px)] bg-[size:54px_54px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,255,136,0.4),transparent)]" />
      </div>

      <div className="relative z-10 w-full max-w-[940px]">
        <LoginExperience
          nextPath={nextPath}
          signedOut={resolvedSearchParams?.signedOut === "1"}
          authError={Boolean(resolvedSearchParams?.auth)}
        />
      </div>
    </main>
  );
}
