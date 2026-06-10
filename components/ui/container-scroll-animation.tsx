"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

type ContainerScrollProps = {
  titleComponent: string | React.ReactNode;
  children:
    | React.ReactNode
    | ((
        progress: MotionValue<number>,
        prefersReducedMotion: boolean,
      ) => React.ReactNode);
  className?: string;
  contentClassName?: string;
  cardClassName?: string;
};

type ContainerScrollHeaderProps = {
  titleComponent: string | React.ReactNode;
  className?: string;
};

type ContainerScrollCardProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  rotateX?: MotionValue<number>;
  scale?: MotionValue<number>;
  translateY?: MotionValue<number>;
};

function ContainerScrollHeader({
  titleComponent,
  className,
}: ContainerScrollHeaderProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6",
        className
      )}
    >
      {typeof titleComponent === "string" ? (
        <h2 className="max-w-5xl font-mono text-3xl font-semibold leading-[1.05] tracking-normal text-[#fffbf4] sm:text-5xl lg:text-7xl">
          {titleComponent}
        </h2>
      ) : (
        titleComponent
      )}
    </div>
  );
}

function ContainerScrollCard({
  children,
  className,
  contentClassName,
  rotateX,
  scale,
  translateY,
}: ContainerScrollCardProps) {
  return (
    <motion.div
      style={{
        rotateX,
        scale,
        y: translateY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative mx-auto w-full max-w-6xl rounded-lg border border-[#d8cfbc]/20 bg-[#090b08] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.62),0_0_42px_rgba(0,255,136,0.06),inset_0_1px_0_rgba(255,251,244,0.07)] sm:p-3",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:border before:border-[#00ff88]/10 before:content-['']",
        "after:pointer-events-none after:absolute after:inset-x-8 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#00ff88]/65 after:to-transparent after:content-['']",
        className
      )}
    >
      <div
        className={cn(
          "relative min-h-[360px] overflow-hidden rounded-md border border-[#565449]/60 bg-[linear-gradient(135deg,rgba(216,207,188,0.08),rgba(17,18,13,0.96)_34%,rgba(0,255,136,0.055))] text-[#fffbf4]",
          "shadow-[inset_0_0_0_1px_rgba(255,251,244,0.035),inset_0_-1px_0_rgba(0,255,136,0.08)]",
          "sm:min-h-[460px] lg:min-h-[560px]",
          contentClassName
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,207,188,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(0,255,136,0.12),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(216,207,188,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(216,207,188,0.035)_1px,transparent_1px)] bg-[length:28px_28px] opacity-35" />
        <div className="relative h-full min-h-[inherit]">{children}</div>
      </div>
    </motion.div>
  );
}

function ContainerScroll({
  titleComponent,
  children,
  className,
  contentClassName,
  cardClassName,
}: ContainerScrollProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 72,
    damping: prefersReducedMotion ? 100 : 24,
    mass: 0.24,
  });

  const rotateX: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 0.12, 1],
    prefersReducedMotion ? [0, 0, 0] : [12, 0, 0]
  );
  const scale: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 0.12, 0.86, 1],
    prefersReducedMotion ? [1, 1, 1, 1] : [0.9, 1, 1, 0.98]
  );
  const cardTranslate: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 0.12, 0.86, 1],
    prefersReducedMotion ? [0, 0, 0, 0] : [36, 0, 0, -12]
  );

  return (
    <section
      ref={containerRef}
      style={{ position: "relative" }}
      className={cn(
        "relative flex min-h-[220vh] w-full flex-col items-center justify-start overflow-hidden bg-[#11120d] py-20 sm:py-28",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(216,207,188,0.12),transparent_30%),radial-gradient(circle_at_50%_48%,rgba(0,255,136,0.08),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8cfbc]/35 to-transparent" />
      <div className="relative z-10 w-full">
        <ContainerScrollHeader titleComponent={titleComponent} />
      </div>
      <div className="motioncode-container-scroll-sticky sticky top-0 z-10 flex min-h-[100dvh] w-full items-center justify-center px-4 py-16 sm:px-6 lg:py-20">
        <ContainerScrollCard
          rotateX={rotateX}
          scale={scale}
          translateY={cardTranslate}
          className={cardClassName}
          contentClassName={contentClassName}
        >
          {typeof children === "function"
            ? children(smoothProgress, Boolean(prefersReducedMotion))
            : children}
        </ContainerScrollCard>
      </div>
    </section>
  );
}

export { ContainerScroll, ContainerScrollCard, ContainerScrollHeader };
