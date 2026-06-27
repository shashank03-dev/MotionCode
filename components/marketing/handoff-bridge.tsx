"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { SplitText } from "./split-text";

// MotionPathPlugin is only used by this handoff diagram, so registering it here
// (instead of on the landing page) keeps the plugin out of the initial bundle.
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const HANDOFF_NOTES = [
  {
    id: "design",
    label: "Design review",
    title: "Spec captured",
    body: "Frames, timing, easing, and intent stay visible beside the reference.",
    position: {
      x: "15%",
      y: "24%",
      width: "292px",
      rotate: "-2deg",
      dotX: "100%",
      dotY: "50%",
      tailX: "0px",
      tailOrigin: "left center",
    },
  },
  {
    id: "developer",
    label: "Developer handoff",
    title: "Code variants ready",
    body: "CSS, GSAP, and Motion exports map back to one analyzed source.",
    position: {
      x: "85%",
      y: "26%",
      width: "318px",
      rotate: "2deg",
      dotX: "0%",
      dotY: "50%",
      tailX: "-22px",
      tailOrigin: "right center",
    },
  },
  {
    id: "qa",
    label: "Product QA",
    title: "Production checks attached",
    body: "Reduced-motion, transform safety, and replay notes ship with the packet.",
    position: {
      x: "85%",
      y: "72%",
      width: "286px",
      rotate: "-1deg",
      dotX: "0%",
      dotY: "50%",
      tailX: "-22px",
      tailOrigin: "right center",
    },
  },
  {
    id: "tools",
    label: "Toolchain fit",
    title: "Context included",
    body: "Fits beside Figma, GitHub, Vercel, Linear, Loom, and Notion.",
    position: {
      x: "15%",
      y: "72%",
      width: "322px",
      rotate: "1deg",
      dotX: "100%",
      dotY: "50%",
      tailX: "0px",
      tailOrigin: "left center",
    },
  },
];

const HANDOFF_BRANCH_PATHS = {
  design: "M400 253 C370 240 358 190 331 166",
  developer: "M780 397 C832 338 814 218 835 179",
  qa: "M780 469 C808 482 826 492 852 497",
  tools: "M400 325 C356 378 365 464 347 497",
} as const;

const HANDOFF_HUB_ROWS = [
  "Reference",
  "Motion map",
  "Code variants",
  "QA notes",
];

export default function HandoffBridge() {
  const handoffSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = handoffSectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const compactLayout = window.matchMedia("(max-width: 1023px)").matches;
    const noteCards = gsap.utils.toArray<HTMLElement>(
      section.querySelectorAll(".motioncode-handoff-note"),
    );
    const branches = gsap.utils.toArray<SVGPathElement>(
      section.querySelectorAll(".motioncode-handoff-branch-active"),
    );
    const nodes = gsap.utils.toArray<SVGCircleElement>(
      section.querySelectorAll(".motioncode-handoff-node"),
    );
    const hub = section.querySelector<HTMLElement>(".motioncode-handoff-hub");
    const terminalRows = gsap.utils.toArray<HTMLElement>(
      section.querySelectorAll(".motioncode-handoff-terminal-row"),
    );
    const headerChars = section.querySelectorAll(
      ".motioncode-handoff-header .motioncode-split-char",
    );
    const splitChars = gsap.utils.toArray<HTMLElement>(
      section.querySelectorAll(".motioncode-split-char"),
    );

    if (reduceMotion || compactLayout) {
      gsap.set(branches, {
        strokeDashoffset: 0,
        strokeDasharray: "1 0",
      });
      gsap.set(nodes, { autoAlpha: 1 });
      gsap.set([hub, ...terminalRows], { autoAlpha: 1, x: 0, scale: 1 });
      gsap.set(noteCards, {
        "--note-motion-y": "0px",
        "--note-scale": 1,
        "--note-tilt": "0deg",
        autoAlpha: 1,
      });
      gsap.set(splitChars, {
        autoAlpha: 1,
        y: 0,
        rotate: 0,
        rotationX: 0,
        skewY: 0,
      });
      noteCards.forEach((card) => {
        card.dataset.connected = "true";
      });
      return;
    }

    branches.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    });

    gsap.set(splitChars, {
      autoAlpha: 0,
      y: 18,
      rotationX: -68,
      rotationZ: 6,
      transformOrigin: "50% 80%",
    });
    gsap.set([hub, ...terminalRows], {
      autoAlpha: 0,
      scale: 0.96,
    });
    gsap.set(nodes, { autoAlpha: 0 });
    gsap.set(noteCards, {
      "--note-motion-y": "22px",
      "--note-scale": 0.985,
      "--note-tilt": "-2deg",
      autoAlpha: 0,
    });

    const handoffTimeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top 72%",
        end: "bottom 48%",
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    handoffTimeline
      .to(
        [hub, ...terminalRows],
        { autoAlpha: 1, scale: 1, duration: 0.12, stagger: 0.02 },
        0,
      )
      .to(
        headerChars,
        {
          autoAlpha: 1,
          y: 0,
          rotationX: 0,
          rotationZ: 0,
          skewY: 0,
          duration: 0.2,
          stagger: 0.004,
          ease: "power2.out",
        },
        0.04,
      );

    branches.forEach((branch, index) => {
      const node = nodes[index];
      const card = noteCards[index];
      const cardChars = card?.querySelectorAll(".motioncode-split-char");
      const start = 0.18 + index * 0.18;

      handoffTimeline
        .to(branch, { strokeDashoffset: 0, duration: 0.18 }, start)
        .to(node, { autoAlpha: 1, duration: 0.02 }, start)
        .to(
          node,
          {
            motionPath: {
              path: branch,
              align: branch,
              alignOrigin: [0.5, 0.5],
              start: 0,
              end: 1,
            },
            duration: 0.2,
          },
          start,
        )
        .to(
          card,
          {
            "--note-motion-y": "0px",
            "--note-scale": 1.01,
            "--note-tilt": "0deg",
            autoAlpha: 1,
            duration: 0.12,
            ease: "power3.out",
          },
          start + 0.14,
        )
        .set(card, { attr: { "data-connected": "true" } }, start + 0.15)
        .to(
          cardChars,
          {
            autoAlpha: 1,
            y: 0,
            rotationX: 0,
            rotationZ: 0,
            skewY: 0,
            duration: 0.18,
            stagger: 0.003,
            ease: "power2.out",
          },
          start + 0.18,
        )
        .to(
          card,
          { "--note-scale": 1, duration: 0.08, ease: "power2.out" },
          start + 0.28,
        );
    });

    ScrollTrigger.refresh();

    return () => {
      handoffTimeline.scrollTrigger?.kill();
      handoffTimeline.kill();
    };
  }, []);

  return (
    <section
      ref={handoffSectionRef}
      data-testid="handoff-notes"
      className="motioncode-handoff-bridge"
      aria-labelledby="handoff-notes-heading"
    >
      <div className="motioncode-handoff-shell">
        <div className="motioncode-handoff-header">
          <SplitText
            as="p"
            text="Team handoff"
            className="motioncode-split-text"
            delayStep={18}
          />
          <SplitText
            as="h2"
            id="handoff-notes-heading"
            text="One motion reference. Four team-ready packets."
            className="motioncode-split-text"
            delayStep={16}
          />
        </div>
        <div className="motioncode-handoff-stage">
          <svg
            className="motioncode-handoff-map"
            viewBox="0 0 1180 690"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {HANDOFF_NOTES.map((note) => (
              <g key={note.id}>
                <path
                  className="motioncode-handoff-path motioncode-handoff-branch-base"
                  d={HANDOFF_BRANCH_PATHS[note.id as keyof typeof HANDOFF_BRANCH_PATHS]}
                />
                <path
                  className="motioncode-handoff-path motioncode-handoff-branch-active"
                  d={HANDOFF_BRANCH_PATHS[note.id as keyof typeof HANDOFF_BRANCH_PATHS]}
                />
                <circle
                  className="motioncode-handoff-node"
                  cx="590"
                  cy="345"
                  r="6"
                />
              </g>
            ))}
          </svg>
          <div className="motioncode-handoff-hub motioncode-handoff-terminal" aria-label="MotionCode handoff packet">
            <div className="motioncode-handoff-terminal-top">
              <span>motioncode/handoff</span>
              <strong>4 synced packets</strong>
            </div>
            <div className="motioncode-handoff-terminal-rows">
              {HANDOFF_HUB_ROWS.map((row, index) => (
                <div
                  key={row}
                  className="motioncode-handoff-terminal-row"
                  style={{ "--note-index": index } as React.CSSProperties}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{row}</strong>
                  <small>{index === 0 ? "source locked" : index === 1 ? "curves mapped" : index === 2 ? "variants ready" : "fallbacks attached"}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="motioncode-handoff-notes">
            {HANDOFF_NOTES.map((note, index) => (
              <article
                key={note.id}
                className="motioncode-handoff-note"
                style={
                  {
                    "--note-index": index,
                    "--note-x": note.position.x,
                    "--note-y": note.position.y,
                    "--note-width": note.position.width,
                    "--note-rotate": note.position.rotate,
                    "--dot-x": note.position.dotX,
                    "--dot-y": note.position.dotY,
                    "--tail-x": note.position.tailX,
                    "--tail-origin": note.position.tailOrigin,
                  } as React.CSSProperties
                }
              >
                <SplitText
                  as="span"
                  text={note.label}
                  className="motioncode-handoff-label motioncode-split-text"
                  delayStep={14}
                />
                <SplitText
                  as="strong"
                  text={note.title}
                  className="motioncode-handoff-title motioncode-split-text"
                  delayStep={12}
                />
                <SplitText
                  as="p"
                  text={note.body}
                  className="motioncode-handoff-body motioncode-split-text"
                  delayStep={7}
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
