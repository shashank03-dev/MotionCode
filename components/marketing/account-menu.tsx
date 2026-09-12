"use client";

import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type AccountMenuProps = {
  email: string | null;
};

type MenuPosition = {
  top: number;
  right: number;
};

const MENU_GAP = 10;

export function AccountMenu({ email }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const accountInitial = (email?.trim()?.[0] ?? "•").toUpperCase();
  const accountLabel = email ?? "Signed in";

  // Tap feedback: a physical squash-and-stretch bounce rather than a symmetric
  // scale pulse — the badge compresses under the "press", springs up, then
  // settles with an elastic wobble. Reads as a real object reacting to touch.
  const playBounce = useCallback(() => {
    const el = triggerRef.current;
    if (!el) {
      return;
    }
    // matchMedia is absent in non-browser/test environments; never let the
    // reduced-motion check throw out of the click handler and block the toggle.
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    gsap.killTweensOf(el);
    gsap
      .timeline({ defaults: { transformOrigin: "50% 50%" } })
      // anticipation: squash down into the press
      .to(el, {
        scaleX: 1.1,
        scaleY: 0.82,
        y: 2,
        duration: 0.11,
        ease: "power3.out",
      })
      // launch: stretch up out of the press
      .to(el, {
        scaleX: 0.93,
        scaleY: 1.12,
        y: -4,
        duration: 0.13,
        ease: "power1.inOut",
      })
      // settle: elastic wobble back to rest
      .to(el, {
        scaleX: 1,
        scaleY: 1,
        y: 0,
        duration: 0.9,
        ease: "elastic.out(1, 0.42)",
      });
  }, []);

  // Stop any in-flight bounce if the button unmounts mid-animation.
  useEffect(() => {
    const el = triggerRef.current;
    return () => {
      if (el) {
        gsap.killTweensOf(el);
      }
    };
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + MENU_GAP,
      right: Math.max(window.innerWidth - rect.right, 8),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          playBounce();
          setOpen((value) => !value);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={email ? `Account menu for ${email}` : "Account menu"}
        title={accountLabel}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[rgba(0, 153, 255, 0.4)] bg-[rgba(0, 153, 255, 0.08)] font-mono text-xs font-bold uppercase text-accent transition-colors will-change-transform hover:border-[rgba(0, 153, 255, 0.7)] hover:bg-[rgba(0, 153, 255, 0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {accountInitial}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Account"
              style={{
                position: "fixed",
                top: position.top,
                right: position.right,
                background:
                  "radial-gradient(circle at 88% 0%, rgba(0, 153, 255, 0.1), transparent 44%), linear-gradient(150deg, rgba(247, 248, 248, 0.1), rgba(247, 248, 248, 0.03) 46%, rgba(10, 11, 13, 0.42)), rgba(10, 11, 13, 0.82)",
              }}
              className="z-[100] max-h-[calc(100dvh-16px)] w-60 max-w-[calc(100vw-16px)] overflow-y-auto rounded-2xl border border-[rgba(247,248,248,0.2)] pb-[env(safe-area-inset-bottom)] shadow-[0_24px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(247,248,248,0.16)] backdrop-blur-2xl"
            >
              <div className="border-b border-[rgba(247,248,248,0.1)] px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.6)]">
                  Signed in as
                </p>
                <p
                  className="mt-1 truncate font-mono text-sm text-ink"
                  title={accountLabel}
                >
                  {accountLabel}
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center px-4 py-3 text-left font-mono text-xs uppercase tracking-[0.08em] text-[rgba(247,248,248,0.78)] transition hover:bg-[rgba(0, 153, 255, 0.08)] hover:text-accent focus-visible:bg-[rgba(0, 153, 255, 0.08)] focus-visible:text-accent focus-visible:outline-none"
                >
                  Sign out
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
