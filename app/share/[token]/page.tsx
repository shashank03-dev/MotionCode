import Link from "next/link";

import { CommentsPanel } from "@/components/comments";
import { ExportPanel } from "@/components/export";
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm font-semibold text-emerald-300" href="/">
              MotionCode
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              {shared.project.title}
            </h1>
            {shared.project.description ? (
              <p className="mt-2 max-w-2xl text-zinc-400">
                {shared.project.description}
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400">
            {shared.share.accessMode === "comment" ? "Comment" : "Read-only"}
          </div>
        </header>

        {shared.analysis ? (
          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Intent" value={shared.analysis.spec.intent} />
            <Metric label="Element" value={shared.analysis.spec.element} />
            <Metric
              label="Duration"
              value={`${shared.analysis.spec.durationMs}ms`}
            />
            <Metric
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
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function BrandedNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 text-zinc-100">
      <section className="w-full max-w-md rounded-lg border border-zinc-800 p-6">
        <Link className="text-sm font-semibold text-emerald-300" href="/">
          MotionCode
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Share link not found</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          This link may have expired, been revoked, or never existed.
        </p>
      </section>
    </main>
  );
}
