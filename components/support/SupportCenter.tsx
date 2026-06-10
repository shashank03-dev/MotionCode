"use client";

import { FormEvent, useState } from "react";
import { RefreshCw, Send } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
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
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-lg border border-[var(--border)] bg-[#151913] p-5">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase text-[#8fd6ff]">Support</p>
            <h1 className="mt-2 text-2xl font-semibold">Contact MotionCode</h1>
            <p className="mt-2 text-sm leading-6 text-[#b9c0ba]">
              Signed in as {userEmail}. Your tickets stay scoped to your account.
            </p>
            <SignOutButton className="mt-4 border-[var(--border)] text-[#e7f7ff] hover:border-[#8fd6ff]/50" />
          </div>
          <form className="grid gap-4" onSubmit={submitTicket}>
            <label className="grid gap-2 text-sm">
              <span className="text-[#d8e0dc]">Subject</span>
              <input
                className="h-10 rounded-lg border border-[var(--border)] bg-[#0f140f] px-3 text-sm text-[var(--text)] placeholder:text-[#737b75]"
                maxLength={160}
                minLength={3}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Billing, analysis, workspace access"
                required
                value={subject}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[#d8e0dc]">Details</span>
              <textarea
                className="min-h-40 resize-y rounded-lg border border-[var(--border)] bg-[#0f140f] px-3 py-2 text-sm leading-6 text-[var(--text)] placeholder:text-[#737b75]"
                maxLength={4000}
                minLength={10}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Include what happened, affected project or workspace, and whether it blocks production work."
                required
                value={body}
              />
            </label>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#8fd6ff]/50 bg-[#8fd6ff]/12 px-4 text-sm font-medium text-[#e7f7ff] hover:bg-[#8fd6ff]/18 disabled:opacity-50"
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
              <p className="rounded-lg border border-[#ff7a7a]/40 bg-[#ff7a7a]/10 px-3 py-2 text-sm text-[#ffd1d1]">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg border border-[#82e6a0]/40 bg-[#82e6a0]/10 px-3 py-2 text-sm text-[#d8ffe2]">
                {success}
              </p>
            ) : null}
          </form>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[#151913]">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="text-lg font-semibold">Your Tickets</h2>
            <p className="mt-1 text-sm text-[#b9c0ba]">
              Updates from support operators appear here after status changes.
            </p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {tickets.map((ticket) => (
              <article className="p-4" key={ticket.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-[var(--text)]">
                      {ticket.subject}
                    </h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-[#b9c0ba]">
                      {ticket.body}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <TicketPill value={ticket.status} />
                    <TicketPill value={ticket.priority} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#737b75]">
                  Created {formatDate(ticket.createdAt)} · Updated{" "}
                  {formatDate(ticket.updatedAt)}
                </p>
              </article>
            ))}
            {tickets.length === 0 ? (
              <div className="p-6 text-sm text-[#b9c0ba]">
                No support tickets yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function TicketPill({ value }: { value: string }) {
  return (
    <span className="rounded-lg border border-[var(--border)] bg-[#0f140f] px-2 py-1 text-xs text-[#d8e0dc]">
      {value}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
