import Link from "next/link";

import { CommentsPanel } from "@/components/comments";
import { ExportPanel } from "@/components/export";
import { Logo } from "@/components/site/logo";
import { AppBackground } from "@/components/ui/app-background";
import { EmptyState, Pill, StatTile } from "@/components/ui/kit";
import { resolveSharedProjectByToken } from "@/lib/server/shareLinks";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedProjectPage({ params }: SharePageProps) {
  const { token } = await params;
  const shared = await resolveSharedProjectByToken(token);

  if (!shared) {
    return <BrandedNotFound />;
  }

  return (
    <main className="relative min-h-dvh bg-canvas text-ink">
      <AppBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8">
        <header className="grid gap-5 border-b border-hairline pb-7 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="min-w-0">
            <Link href="/" aria-label="MotionCode home">
              <Logo />
            </Link>
            <h1 className="mt-5 font-display text-3xl font-medium leading-[1.05] tracking-tightest text-balance sm:text-[2.6rem]">
              {shared.project.title}
            </h1>
            {shared.project.description ? (
              <p className="mt-3.5 max-w-2xl text-[15px] leading-7 text-ink-2 text-pretty">
                {shared.project.description}
              </p>
            ) : null}
          </div>
          <Pill tone={shared.share.accessMode === "comment" ? "accent" : "neutral"}>
            {shared.share.accessMode === "comment" ? "Comment access" : "Read-only"}
          </Pill>
        </header>

        {shared.analysis ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Intent"
              value={<span className="break-words text-xl line-clamp-4">{shared.analysis.spec.intent}</span>}
              accent
            />
            <StatTile
              label="Element"
              value={<span className="break-words text-xl line-clamp-4">{shared.analysis.spec.element}</span>}
            />
            <StatTile
              label="Duration"
              value={`${shared.analysis.spec.durationMs}ms`}
            />
            <StatTile
              label="Performance"
              value={String(shared.analysis.spec.performanceScore)}
            />
          </section>
        ) : null}

        <ExportPanel
          analysis={shared.analysis}
          projectTitle={shared.project.title}
        />

        <CommentsPanel
          canComment={shared.share.accessMode === "comment"}
          comments={shared.comments}
          publicIncluded={shared.commentsIncluded}
        />

        <footer className="border-t border-hairline pt-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Shared from MotionCode ·{" "}
            <Link href="/" className="text-ink-2 transition-colors hover:text-ink">
              Turn motion into code
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

function BrandedNotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-canvas px-5 text-ink">
      <AppBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/" aria-label="MotionCode home">
            <Logo />
          </Link>
        </div>
        <EmptyState
          title="Share link not found"
          description="This link may have expired, been revoked, or never existed."
        />
      </div>
    </main>
  );
}
