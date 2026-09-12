"use client";

import { FormEvent, useState } from "react";
import { RefreshCw, Send } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  EmptyState,
  Field,
  Input,
  Panel,
  Pill,
  Textarea,
} from "@/components/ui/kit";
import type { SupportTicketDTO } from "@/lib/contracts/adminSupport";
import type { ApiResponse } from "@/lib/contracts/errors";

type SupportCenterProps = {
  initialTickets: SupportTicketDTO[];
  userEmail: string;
};

export function SupportCenter({ initialTickets, userEmail }: SupportCenterProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/support", {
        body: JSON.stringify({ body, subject }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<{
        ticket: SupportTicketDTO;
      }>;

      if (!json.ok) {
        setError(json.message);
        return;
      }

      setTickets((current) => [json.data.ticket, ...current]);
      setBody("");
      setSubject("");
      setSuccess("Support ticket created.");
    } catch {
      setError("Support ticket creation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-5 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
      <Panel as="section" variant="glass" inset="none" radius="2xl" className="p-6">
        <div className="mb-6">
          <h2 className="font-display text-xl font-medium tracking-tight text-ink">
            Contact MotionCode
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-ink-2">
            Signed in as <span className="text-ink">{userEmail}</span>. Your tickets
            stay scoped to your account.
          </p>
          <SignOutButton className="mt-4 h-11 min-h-[44px] rounded-full border-hairline px-4 text-[13px] text-ink-2 hover:border-accent-border hover:text-ink" />
        </div>

        <form className="grid gap-4" onSubmit={submitTicket}>
          <Field label="Subject" htmlFor="support-subject">
            <Input
              id="support-subject"
              maxLength={160}
              minLength={3}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Billing, analysis, workspace access"
              required
              value={subject}
            />
          </Field>
          <Field label="Details" htmlFor="support-body">
            <Textarea
              id="support-body"
              className="min-h-40 resize-y leading-6"
              maxLength={4000}
              minLength={10}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Include what happened, affected project or workspace, and whether it blocks production work."
              required
              value={body}
            />
          </Field>
          <button
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            Create ticket
          </button>
          {error ? (
            <p className="rounded-xl border border-[var(--danger-border)] bg-[rgba(232,112,95,0.08)] px-3.5 py-2.5 text-[13.5px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-xl border border-accent-border bg-accent-dim px-3.5 py-2.5 text-[13.5px] text-ink">
              {success}
            </p>
          ) : null}
        </form>
      </Panel>

      <Panel as="section" variant="glass" inset="none" radius="2xl" className="overflow-hidden">
        <div className="border-b border-hairline p-5">
          <h2 className="font-display text-lg font-medium tracking-tight text-ink">
            Your tickets
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-2">
            Updates from support operators appear here after status changes.
          </p>
        </div>
        <div className="divide-y divide-hairline">
          {tickets.map((ticket) => (
            <article className="p-5" key={ticket.id}>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-ink">
                    {ticket.subject}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-6 text-ink-2">
                    {ticket.body}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Pill tone="accent">{ticket.status}</Pill>
                  <Pill tone="neutral">{ticket.priority}</Pill>
                </div>
              </div>
              <p className="mt-3 font-mono text-[11px] text-ink-3">
                Created {formatDate(ticket.createdAt)} · Updated{" "}
                {formatDate(ticket.updatedAt)}
              </p>
            </article>
          ))}
          {tickets.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No tickets yet"
                description="When you open a support ticket it will appear here with its status."
              />
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
