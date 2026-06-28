"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "./split-text";

// These plugins are only used by this handoff diagram, so registering them here
// (instead of on the landing page) keeps them out of the initial bundle.
// DrawSVG strokes the connector traces; MotionPath rides the packet node along
// the same trace — both read the geometry we compute live from the DOM.
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);

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
    const stage = section.querySelector<HTMLElement>(
      ".motioncode-handoff-stage",
    );
    const svg = section.querySelector<SVGSVGElement>(".motioncode-handoff-map");
    const hub = section.querySelector<HTMLElement>(".motioncode-handoff-hub");
    const noteCards = gsap.utils.toArray<HTMLElement>(
      section.querySelectorAll(".motioncode-handoff-note"),
    );
    const basePaths = gsap.utils.toArray<SVGPathElement>(
      section.querySelectorAll(".motioncode-handoff-branch-base"),
    );
    const branches = gsap.utils.toArray<SVGPathElement>(
      section.querySelectorAll(".motioncode-handoff-branch-active"),
    );
    const nodes = gsap.utils.toArray<SVGCircleElement>(
      section.querySelectorAll(".motioncode-handoff-node"),
    );
    const terminalRows = gsap.utils.toArray<HTMLElement>(
      section.querySelectorAll(".motioncode-handoff-terminal-row"),
    );
    const headerChars = section.querySelectorAll(
      ".motioncode-handoff-header .motioncode-split-char",
    );
    const splitChars = gsap.utils.toArray<HTMLElement>(
      section.querySelectorAll(".motioncode-split-char"),
    );

    // Connectors are derived from live geometry, not authored as fixed path
    // strings. We map the SVG's user space 1:1 onto the stage's pixel box, then
    // route each trace from the hub's near edge to the exact centre of the
    // card's port — so a trace always lands precisely on its dot at any width.
    const clamp = gsap.utils.clamp;
    const buildConnectors = () => {
      if (!stage || !svg || !hub) return;
      const stageRect = stage.getBoundingClientRect();
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const hubRect = hub.getBoundingClientRect();
      const hubLeft = hubRect.left - stageRect.left;
      const hubRight = hubRect.right - stageRect.left;
      const hubTop = hubRect.top - stageRect.top;
      const hubBottom = hubRect.bottom - stageRect.top;
      const hubCentreX = (hubLeft + hubRight) / 2;
      // Keep hub exits off the rounded corners.
      const hubInset = Math.min(44, hubRect.height * 0.16);

      noteCards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCentreX = cardRect.left + cardRect.width / 2 - stageRect.left;
        const cardCentreY = cardRect.top + cardRect.height / 2 - stageRect.top;
        const onLeft = cardCentreX < hubCentreX;

        // Port sits on the card's inner edge (the one facing the hub).
        const portX = onLeft
          ? cardRect.right - stageRect.left
          : cardRect.left - stageRect.left;
        const portY = cardCentreY;
        const hubX = onLeft ? hubLeft : hubRight;
        const hubY = clamp(hubTop + hubInset, hubBottom - hubInset, portY);
        const direction = onLeft ? -1 : 1;

        // Horizontal tangents at both ends → a clean circuit-trace S-curve that
        // reads as a routed signal, fitting the terminal motif.
        const span = Math.abs(portX - hubX);
        const handle = Math.max(54, span * 0.46);
        const d =
          `M${hubX.toFixed(1)} ${hubY.toFixed(1)} ` +
          `C${(hubX + direction * handle).toFixed(1)} ${hubY.toFixed(1)} ` +
          `${(portX - direction * handle).toFixed(1)} ${portY.toFixed(1)} ` +
          `${portX.toFixed(1)} ${portY.toFixed(1)}`;

        basePaths[index]?.setAttribute("d", d);
        branches[index]?.setAttribute("d", d);
      });
    };

    buildConnectors();
    // Re-route before every ScrollTrigger refresh (which fires on resize) so the
    // traces stay welded to their ports as the layout reflows.
    ScrollTrigger.addEventListener("refreshInit", buildConnectors);

    if (reduceMotion || compactLayout) {
      // Static, fully-assembled state: traces drawn, packets hidden, cards lit.
      gsap.set(branches, { drawSVG: "0% 100%" });
      gsap.set(nodes, { autoAlpha: 0 });
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
      // A plain resize listener keeps the static traces aligned (no ScrollTrigger
      // exists in this branch to fire refreshInit).
      const onResize = () => buildConnectors();
      window.addEventListener("resize", onResize);
      return () => {
        ScrollTrigger.removeEventListener("refreshInit", buildConnectors);
        window.removeEventListener("resize", onResize);
      };
    }

    // Traces start undrawn (collapsed at the hub end); DrawSVG reveals each one
    // hub → port as its packet rides across.
    gsap.set(branches, { drawSVG: "0% 0%" });

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

    // Intro: the central packet terminal and the heading assemble first, before
    // any branch reaches out to a card.
    handoffTimeline
      .addLabel("intro", 0)
      .to(
        [hub, ...terminalRows],
        { autoAlpha: 1, scale: 1, duration: 0.1, stagger: 0.015 },
        "intro",
      )
      .to(
        headerChars,
        {
          autoAlpha: 1,
          y: 0,
          rotationX: 0,
          rotationZ: 0,
          skewY: 0,
          duration: 0.16,
          stagger: { amount: 0.06 },
          ease: "power2.out",
        },
        "intro+=0.02",
      );

    // Four packets, evenly staggered across the early/middle of the scrub. Each
    // packet runs the same beat: branch draws out → node rides it to the card →
    // card fills → text resolves → the card settles to rest scale. Timing is
    // tuned so the *last* card finishes well before progress 1.0 (the old code
    // scheduled it at 0.90–1.08, so it never completed inside the scrub range
    // and the bottom-left card read as empty/broken the whole way down).
    const CARD_START = 0.14;
    const CARD_STAGGER = 0.16;

    branches.forEach((branch, index) => {
      const node = nodes[index];
      const card = noteCards[index];
      const cardChars = card?.querySelectorAll(".motioncode-split-char");
      const at = `card-${index}`;

      handoffTimeline
        .addLabel(at, CARD_START + index * CARD_STAGGER)
        .to(branch, { drawSVG: "0% 100%", duration: 0.12 }, at)
        .to(node, { autoAlpha: 1, duration: 0.02 }, at)
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
            duration: 0.12,
            ease: "power1.in",
          },
          at,
        )
        .to(
          card,
          {
            "--note-motion-y": "0px",
            "--note-scale": 1.012,
            "--note-tilt": "0deg",
            autoAlpha: 1,
            duration: 0.1,
            ease: "power3.out",
          },
          `${at}+=0.05`,
        )
        .set(card, { attr: { "data-connected": "true" } }, `${at}+=0.08`)
        // The travelling node dissipates the instant it docks — the card's own
        // glowing port dot ([data-connected]::after) becomes the resting anchor,
        // so there's never a flat disc stacked on the glowing dot.
        .to(node, { autoAlpha: 0, duration: 0.05, ease: "power2.out" }, `${at}+=0.1`)
        .to(
          cardChars,
          {
            autoAlpha: 1,
            y: 0,
            rotationX: 0,
            rotationZ: 0,
            skewY: 0,
            duration: 0.13,
            // `amount` spreads every char across a fixed window regardless of
            // how long the copy is, so a 6-word body and a 3-word title finish
            // in the same beat instead of the longest card running over.
            stagger: { amount: 0.08 },
            ease: "power2.out",
          },
          `${at}+=0.07`,
        )
        .to(
          card,
          { "--note-scale": 1, duration: 0.07, ease: "power2.out" },
          `${at}+=0.18`,
        );
    });

    // Hold: pad the tail of the timeline so the fully-assembled board stays on
    // screen for the last stretch of the scrub instead of snapping complete on
    // the final pixel of scroll.
    handoffTimeline.to({}, { duration: 0.22 });

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", buildConnectors);
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
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {HANDOFF_NOTES.map((note) => (
              <g key={note.id}>
                {/* `d` is assigned at runtime from live DOM geometry. */}
                <path className="motioncode-handoff-path motioncode-handoff-branch-base" />
                <path className="motioncode-handoff-path motioncode-handoff-branch-active" />
                <circle className="motioncode-handoff-node" cx="0" cy="0" r="4.5" />
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
