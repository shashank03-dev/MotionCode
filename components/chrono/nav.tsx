"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

import { MarketingAuthNavActions } from "@/components/marketing/auth-nav-actions";
import { timecode } from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { ProductPanel } from "./nav-menu";

type NavLink = {
  label: string;
  href: string;
  /** Section this link points at on the landing page (scrollspy). */
  section?: string;
  /** Superscript count, basement-style. Decorative only. */
  count?: string;
  menu?: boolean;
};

const LINKS: Record<"landing" | "site", NavLink[]> = {
  landing: [
    { label: "Features", href: "#features", section: "features", count: "06", menu: true },
    { label: "How it works", href: "#how", section: "how" },
    { label: "Pricing", href: "#pricing", section: "pricing", count: "03" },
    { label: "Support", href: "/support" },
  ],
  site: [
    { label: "Features", href: "/#features", count: "06", menu: true },
    { label: "How it works", href: "/#how" },
    { label: "Pricing", href: "/pricing", count: "03" },
    { label: "Support", href: "/support" },
  ],
};

/**
 * Page reel readout — the document as a 3-second reel; the scroll position is
 * shown as a 24fps timecode. Written straight to the DOM (no re-renders).
 */
function ReelTimecode() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const barRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (ref.current) ref.current.textContent = timecode(p);
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <span
      aria-hidden
      className="hidden items-center gap-2.5 font-mono text-[11px] tabular-nums tracking-[0.08em] text-ink-3 xl:inline-flex"
    >
      <span className="relative h-px w-8 overflow-hidden bg-hairline-strong">
        <span ref={barRef} className="absolute inset-0 origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
      </span>
      <span ref={ref} className="text-ink-2">
        00:00
      </span>
    </span>
  );
}

/** Which landing section is under the nav right now. */
function useActiveSection(enabled: boolean, ids: string[]) {
  const [active, setActive] = React.useState<string | null>(null);
  const key = ids.join(",");
  React.useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        // Last section in document order that crosses the reading line wins.
        const current = key.split(",").filter((id) => visible.get(id)).pop() ?? null;
        setActive(current);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of key.split(",")) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [enabled, key]);
  return active;
}

export function Nav({
  variant = "landing",
  position = "fixed",
}: {
  variant?: "landing" | "site";
  /** `fixed` floats over the landing hero; `sticky` takes up flow space. */
  position?: "fixed" | "sticky";
}) {
  const links = LINKS[variant];
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const menuId = React.useId();
  const panelId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const panelTriggerRef = React.useRef<HTMLButtonElement>(null);
  const linksRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLSpanElement>(null);
  const closeTimer = React.useRef<number | undefined>(undefined);
  // When hover just opened the panel, the click that follows must not shut it.
  const hoverOpenedAt = React.useRef(0);

  const active = useActiveSection(
    variant === "landing",
    links.flatMap((l) => (l.section ? [l.section] : [])),
  );

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile sheet: Escape, scroll lock, first-link focus.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
      else setPanelOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Product panel: Escape returns focus, outside click closes.
  React.useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelOpen(false);
        panelTriggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !panelTriggerRef.current?.contains(target)) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [panelOpen]);

  const openPanelSoon = () => {
    window.clearTimeout(closeTimer.current);
    setPanelOpen((wasOpen) => {
      if (!wasOpen) hoverOpenedAt.current = performance.now();
      return true;
    });
  };
  const closePanelSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setPanelOpen(false), 180);
  };
  React.useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Sliding hover pill (Linear-style): follows the pointer / focus across links.
  const movePill = (el: HTMLElement | null) => {
    const pill = pillRef.current;
    const row = linksRef.current;
    if (!pill || !row) return;
    if (!el) {
      pill.style.opacity = "0";
      return;
    }
    const r = el.getBoundingClientRect();
    const base = row.getBoundingClientRect();
    pill.style.opacity = "1";
    pill.style.width = `${r.width}px`;
    pill.style.transform = `translate(${r.left - base.left}px, -50%)`;
  };

  const close = () => setOpen(false);
  const capsule = scrolled || open || panelOpen;

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        position === "fixed" ? "fixed inset-x-0 top-0" : "sticky top-0",
        "z-50 px-2 sm:px-3",
      )}
    >
      <nav
        aria-label="Primary navigation"
        data-capsule={capsule || undefined}
        className={cn(
          "nav-capsule relative mx-auto flex h-14 items-center justify-between gap-3 border",
          capsule
            ? "mt-2 max-w-[1040px] rounded-[16px] border-hairline-strong bg-carbon/85 px-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl backdrop-saturate-150 sm:pl-4"
            : "mt-2 max-w-[1280px] rounded-[16px] border-transparent bg-transparent px-[clamp(8px,3.4vw,32px)]",
        )}
      >
        <Link
          href={variant === "landing" ? "#top" : "/"}
          aria-label="MotionCode home"
          className="flex min-h-[44px] shrink-0 items-center"
        >
          <Logo />
        </Link>

        <div
          ref={linksRef}
          onPointerLeave={() => movePill(null)}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex"
        >
          <span
            ref={pillRef}
            aria-hidden
            className="nav-pill pointer-events-none absolute left-0 top-1/2 h-9 rounded-[10px] bg-bone/[0.06] opacity-0"
            style={{ transform: "translate(0, -50%)" }}
          />
          {links.map((link) => {
            const isActive = !!link.section && active === link.section;
            return (
              <div
                key={link.label}
                className="relative flex items-center"
                onPointerEnter={link.menu ? openPanelSoon : undefined}
                onPointerLeave={link.menu ? closePanelSoon : undefined}
              >
                <Link
                  href={link.href}
                  aria-current={isActive ? "location" : undefined}
                  onPointerEnter={(e) => movePill(e.currentTarget)}
                  onFocus={(e) => movePill(e.currentTarget)}
                  onBlur={() => movePill(null)}
                  onClick={() => setPanelOpen(false)}
                  className={cn(
                    "relative inline-flex min-h-[44px] items-center px-3 text-[14px] transition-colors duration-200",
                    isActive ? "text-ink" : "text-ink-2 hover:text-ink",
                    link.menu && "pr-1",
                  )}
                >
                  {link.label}
                  {/* Room for the superscript count, which sits outside the
                      link so it never joins the accessible name. */}
                  {link.count ? <span aria-hidden className="inline-block w-3" /> : null}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent transition-[opacity,transform] duration-500 ease-expo",
                      isActive ? "scale-100 opacity-100" : "scale-0 opacity-0",
                    )}
                  />
                </Link>
                {link.count ? (
                  <sup
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute top-3 font-mono text-[9px] tracking-[0.04em] text-ink-3",
                      link.menu ? "right-8" : "right-2",
                    )}
                  >
                    {link.count}
                  </sup>
                ) : null}
                {link.menu ? (
                  <button
                    ref={panelTriggerRef}
                    type="button"
                    aria-label="Product menu"
                    aria-expanded={panelOpen}
                    aria-controls={panelOpen ? panelId : undefined}
                    onClick={() =>
                      setPanelOpen((v) => (v && performance.now() - hoverOpenedAt.current < 500 ? true : !v))
                    }
                    className="relative mr-1 inline-flex size-6 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:text-ink"
                  >
                    <ChevronDown
                      className={cn("size-3.5 transition-transform duration-300 ease-expo", panelOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {panelOpen ? (
          <ProductPanel
            ref={panelRef}
            id={panelId}
            base={variant === "landing" ? "" : "/"}
            onNavigate={() => setPanelOpen(false)}
            onPointerEnter={openPanelSoon}
            onPointerLeave={closePanelSoon}
          />
        ) : null}

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {variant === "landing" ? <ReelTimecode /> : null}
          <span aria-hidden className="hidden h-4 w-px bg-hairline-strong xl:block" />
          <MarketingAuthNavActions variant={variant} />
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-[12px] text-ink transition-colors hover:bg-bone/[0.06] md:hidden"
          >
            <span aria-hidden className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-5 bg-current transition-transform duration-500 ease-expo",
                  open && "translate-y-1.5 rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-px w-5 bg-current transition-transform duration-500 ease-expo",
                  open && "-translate-y-1.5 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>

        {open ? (
          <div
            ref={menuRef}
            id={menuId}
            data-nav-menu
            className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[calc(100dvh-88px)] overflow-y-auto rounded-[16px] border border-hairline-strong bg-carbon px-4 pb-5 pt-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] md:hidden"
          >
            <div className="grid">
              {links.map((link, i) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={close}
                  className="group flex min-h-[56px] items-baseline justify-between border-b border-hairline py-3 text-[28px] font-medium tracking-[-0.04em] text-ink"
                  style={{ animation: `fade-up .6s var(--ease-out) ${i * 50}ms both` }}
                >
                  {link.label}
                  <span className="font-mono text-[11px] tracking-[0.12em] text-ink-3 transition-colors group-hover:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <MarketingAuthNavActions variant={variant} layout="menu" onNavigate={close} />
            </div>
          </div>
        ) : null}
      </nav>
      {open && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="fixed inset-0 z-40 bg-carbon/60 backdrop-blur-sm md:hidden"
            />,
            document.body,
          )
        : null}
    </header>
  );
}
