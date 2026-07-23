"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";

import type { PublicProjectComment } from "@/lib/server/shareLinks";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type Comment = PublicProjectComment & {
  authorName?: string | null;
};

type CommentsPanelProps = {
  comments: Comment[];
  canComment?: boolean;
  className?: string;
  heading?: string;
  onSubmit?: (body: string) => Promise<void> | void;
  publicIncluded?: boolean;
};

export function CommentsPanel({
  canComment = false,
  className,
  comments,
  heading = "Comments",
  onSubmit,
  publicIncluded = true,
}: CommentsPanelProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = canComment && Boolean(onSubmit);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !canSubmit) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.(trimmed);
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  if (!publicIncluded) {
    return (
      <section className={cn("rounded-lg border border-hairline p-5", className)}>
        <div className="flex items-center gap-2 text-ink">
          <MessageCircle className="size-4" />
          <h2 className="text-lg font-semibold">{heading}</h2>
        </div>
        <p className="mt-2 text-sm text-ink-2">
          Comments remain private to workspace members.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-hairline p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-ink">
          <MessageCircle className="size-4" />
          <h2 className="text-lg font-semibold">{heading}</h2>
        </div>
        <span className="text-sm text-ink-3">{comments.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article
              className="rounded-lg border border-hairline bg-panel/60 p-3"
              key={comment.id}
            >
              <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
                <span>{comment.authorName ?? "Workspace member"}</span>
                <time dateTime={comment.createdAt}>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(comment.createdAt))}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                {comment.body}
              </p>
              {comment.resolvedAt ? (
                <div className="mt-2 flex items-center gap-1 text-xs text-accent">
                  <CheckCircle2 className="size-3" />
                  <span>Resolved</span>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-ink-2">No comments yet.</p>
        )}
      </div>

      {canSubmit ? (
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-hairline bg-panel p-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
            maxLength={2000}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a scoped workspace comment"
            value={body}
          />
          <Button disabled={submitting || !body.trim()} type="submit">
            <Send data-icon="inline-start" />
            Send
          </Button>
        </form>
      ) : null}
    </section>
  );
}
