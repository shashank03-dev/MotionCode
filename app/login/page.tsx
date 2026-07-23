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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-canvas px-4 py-6 text-ink sm:px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-fade opacity-70" />
        {/* single accent hairline at the top edge — the only color in the room */}
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent-glow),transparent)]" />
        <div className="absolute left-1/2 top-[-18rem] size-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--accent-dim),transparent_70%)] blur-2xl" />
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
