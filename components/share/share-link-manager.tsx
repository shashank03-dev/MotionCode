"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2, MessageCircle, RotateCcw } from "lucide-react";

import type { PlanTier } from "@/lib/contracts/plans";
import type { ShareAccessMode, ShareLinkSummary } from "@/lib/server/shareLinks";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type CreatedShareLink = ShareLinkSummary & {
  token: string;
  url: string;
};

type ShareLinkManagerProps = {
  className?: string;
  existingLinks?: ShareLinkSummary[];
  planTier: PlanTier;
  projectId: string;
};

export function ShareLinkManager({
  className,
  existingLinks = [],
  planTier,
  projectId,
}: ShareLinkManagerProps) {
  const [accessMode, setAccessMode] = useState<ShareAccessMode>("read");
  const [includeComments, setIncludeComments] = useState(planTier === "studio");
  const [expiresAt, setExpiresAt] = useState("");
  const [createdLink, setCreatedLink] = useState<CreatedShareLink | null>(null);
  const [links, setLinks] = useState(existingLinks);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entitlement = useMemo(() => {
    if (planTier === "free") {
      return {
        canCreate: false,
        helper: "Free workspaces cannot create share links.",
      };
    }

    if (planTier === "pro") {
      return {
        canCreate: true,
        helper: "Pro share links are read-only.",
      };
    }

    return {
      canCreate: true,
      helper: "Studio share links can include comments.",
    };
  }, [planTier]);

  async function createShareLink() {
    if (!entitlement.canCreate) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/share/create", {
        body: JSON.stringify({
          accessMode: planTier === "studio" ? accessMode : "read",
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          includeComments: planTier === "studio" ? includeComments : false,
          projectId,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "Failed to create share link.");
      }

      setCreatedLink(json.data);
      setLinks((current) => [json.data, ...current]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create share link.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeShareLink(id: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/share/revoke", {
        body: JSON.stringify({ shareLinkId: id }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "Failed to revoke share link.");
      }

      setLinks((current) =>
        current.map((link) => (link.id === id ? json.data : link)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to revoke share link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!createdLink) {
      return;
    }

    await navigator.clipboard.writeText(createdLink.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className={cn("rounded-lg border border-zinc-800 p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Share</h2>
          <p className="text-sm text-zinc-400">{entitlement.helper}</p>
        </div>
        <Button
          disabled={!entitlement.canCreate || busy}
          onClick={createShareLink}
          type="button"
        >
          <Link2 data-icon="inline-start" />
          Create
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-zinc-300">
          Mode
          <select
            className="mt-1 h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100"
            disabled={planTier !== "studio"}
            onChange={(event) => setAccessMode(event.target.value as ShareAccessMode)}
            value={planTier === "studio" ? accessMode : "read"}
          >
            <option value="read">Read</option>
            <option value="comment">Comment</option>
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          Expiration
          <input
            className="mt-1 h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100"
            onChange={(event) => setExpiresAt(event.target.value)}
            type="datetime-local"
            value={expiresAt}
          />
        </label>
        <label className="flex items-end gap-2 text-sm text-zinc-300">
          <input
            checked={includeComments && planTier === "studio"}
            className="mb-2 size-4"
            disabled={planTier !== "studio"}
            onChange={(event) => setIncludeComments(event.target.checked)}
            type="checkbox"
          />
          <span className="pb-1">Include comments</span>
        </label>
      </div>

      {createdLink ? (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate text-sm text-emerald-100">
            {createdLink.url}
          </code>
          <Button
            aria-label="Copy share link"
            onClick={copyLink}
            size="icon"
            title="Copy share link"
            type="button"
            variant="outline"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      {links.length > 0 ? (
        <div className="mt-5 space-y-2">
          {links.map((link) => (
            <div
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3 text-sm"
              key={link.id}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-zinc-200">
                  {link.accessMode === "comment" ? (
                    <MessageCircle className="size-4" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  <span>{link.accessMode}</span>
                  {link.revokedAt ? (
                    <span className="text-zinc-500">revoked</span>
                  ) : null}
                </div>
                <p className="truncate text-zinc-500">
                  Created {new Date(link.createdAt).toLocaleString()}
                </p>
              </div>
              <Button
                aria-label="Revoke share link"
                disabled={busy || Boolean(link.revokedAt)}
                onClick={() => revokeShareLink(link.id)}
                size="icon"
                title="Revoke share link"
                type="button"
                variant="outline"
              >
                <RotateCcw />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
