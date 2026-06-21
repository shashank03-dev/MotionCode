"use client";

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
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={email ? `Account menu for ${email}` : "Account menu"}
        title={accountLabel}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[rgba(0,255,136,0.4)] bg-[rgba(0,255,136,0.08)] font-mono text-xs font-bold uppercase text-[#00ff88] transition hover:border-[rgba(0,255,136,0.7)] hover:bg-[rgba(0,255,136,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff88]"
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
                  "radial-gradient(circle at 88% 0%, rgba(0, 255, 136, 0.1), transparent 44%), linear-gradient(150deg, rgba(255, 251, 244, 0.1), rgba(255, 251, 244, 0.03) 46%, rgba(8, 10, 9, 0.42)), rgba(8, 10, 9, 0.82)",
              }}
              className="z-[100] w-60 overflow-hidden rounded-2xl border border-[rgba(255,251,244,0.2)] shadow-[0_24px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,251,244,0.16)] backdrop-blur-2xl"
            >
              <div className="border-b border-[rgba(255,251,244,0.1)] px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(216,207,188,0.6)]">
                  Signed in as
                </p>
                <p
                  className="mt-1 truncate font-mono text-sm text-[#fffbf4]"
                  title={accountLabel}
                >
                  {accountLabel}
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center px-4 py-3 text-left font-mono text-xs uppercase tracking-[0.08em] text-[rgba(255,251,244,0.78)] transition hover:bg-[rgba(0,255,136,0.08)] hover:text-[#00ff88] focus-visible:bg-[rgba(0,255,136,0.08)] focus-visible:text-[#00ff88] focus-visible:outline-none"
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
