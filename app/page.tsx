"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#________";
const scrambleText = (element: HTMLElement | null, finalString: string, goingOut: boolean = false) => {
  if (!element) return;
  let iteration = 0;
  const intervalId = element.getAttribute('data-interval-id');
  if (intervalId) clearInterval(parseInt(intervalId));
  
  const stepTime = 20; 
  const totalSteps = 12; 
  const charsPerStep = Math.max(1, finalString.length / totalSteps);

  const interval = setInterval(() => {
    element.innerText = finalString
      .split("")
      .map((letter, index) => {
        if (!goingOut) {
          if (index < iteration) return finalString[index];
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        } else {
          if (index < iteration) return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          return finalString[index];
        }
      })
      .join("");
    
    if(iteration >= finalString.length) {
      clearInterval(interval);
      element.removeAttribute('data-interval-id');
      if (!goingOut) {
        element.innerText = finalString;
      }
    }
    
    iteration += charsPerStep;
  }, stepTime);
  
  element.setAttribute('data-interval-id', interval.toString());
};

const FEATURES_DATA = [
  { num: "01", title: "Upload Any Format", desc: "Drag in MP4, GIF, WebM, or Lottie files. Our engine handles any animation source with frame-perfect accuracy.", code: "// 8 frames extracted\n> format: MP4 → JPEG\n> resolution: 1920×1080" },
  { num: "02", title: "AI Frame Analysis", desc: "Neural networks decompose motion into discrete keyframes, easing curves, and transform paths — automatically.", code: "// motion analyzed\n> keyframes: 12\n> easing: cubic-bezier(...)" },
  { num: "03", title: "Multi-Framework Output", desc: "Get production-ready CSS, GSAP, and Framer Motion code. Copy, paste, ship.", code: "// output ready\n> CSS  ✓\n> GSAP  ✓\n> Framer ✓" },
  { num: "04", title: "Performance Scorer", desc: "Every generated animation is benchmarked for jank, repaints, and composite layer usage with a 0-100 score.", code: "// perf score\n> GPU layers: yes\n> score: 94/100" },
  { num: "05", title: "Accessibility Audit", desc: "Automatic prefers-reduced-motion fallbacks and WCAG compliance checks on every export.", code: "// a11y check\n> reduced-motion: ✓\n> WCAG AA: pass" }
];

export default function LandingPage() {
  const heroLinesRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroSubtextRef = useRef<HTMLParagraphElement>(null);
  const heroTerminalRef = useRef<HTMLDivElement>(null);
  const heroTermLinesRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroGlowRef = useRef<HTMLDivElement>(null);

  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const leftCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rightPanelsRef = useRef<(HTMLDivElement | null)[]>([]);

  const processSectionRef = useRef<HTMLDivElement>(null);
  const processStepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (heroGlowRef.current) {
        heroGlowRef.current.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
      }
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Setup Hero Animation
      gsap.fromTo(
        heroLinesRef.current,
        { y: "100%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );

      gsap.fromTo(
        heroSubtextRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.6, ease: "power2.out" }
      );

      gsap.fromTo(
        heroTermLinesRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.1, stagger: 0.8, delay: 0.8 }
      );

      // Setup Features Section ScrollTrigger
      const NUM_FEATURES = FEATURES_DATA.length;
      let lastIndex = -1;

      const activateFeature = (index: number) => {
        const changed = lastIndex !== index;
        leftCardsRef.current.forEach((card, i) => {
          if (!card) return;
          card.style.opacity = i === index ? "1" : "0.25";
          card.style.borderColor = i === index ? "var(--accent)" : "var(--border)";
          card.style.borderLeft = i === index ? "3px solid #00ff88" : "1px solid var(--border)";
          card.style.background = i === index ? "var(--accent-dim)" : "transparent";
          const numEl = card.querySelector('.card-num') as HTMLElement;
          if (numEl) {
            numEl.style.textShadow = i === index ? "0 0 12px #00ff8860" : "none";
          }
        });
        rightPanelsRef.current.forEach((panel, i) => {
          if (!panel) return;
          if (i === index) {
            panel.style.opacity = "1";
            panel.style.transform = "scale(1)";
            panel.style.filter = "blur(0px)";
            
            if (changed) {
              const titleEl = panel.querySelector('.feature-title') as HTMLElement;
              const descEl = panel.querySelector('.feature-desc') as HTMLElement;
              if (titleEl) scrambleText(titleEl, FEATURES_DATA[i].title, false);
              if (descEl) scrambleText(descEl, FEATURES_DATA[i].desc, false);
            }
          } else {
            panel.style.opacity = "0";
            panel.style.transform = "scale(1.05)";
            panel.style.filter = "blur(8px)";
            if (changed && i === lastIndex) {
              const titleEl = panel.querySelector('.feature-title') as HTMLElement;
              const descEl = panel.querySelector('.feature-desc') as HTMLElement;
              if (titleEl) scrambleText(titleEl, FEATURES_DATA[i].title, true);
              if (descEl) scrambleText(descEl, FEATURES_DATA[i].desc, true);
            }
          }
        });
        lastIndex = index;
      };

      if (featuresSectionRef.current) {
        ScrollTrigger.create({
          trigger: featuresSectionRef.current,
          start: "top top",
          end: () => `+=${NUM_FEATURES * window.innerHeight}`,
          pin: true,
          pinSpacing: false,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(
              Math.floor(self.progress * NUM_FEATURES + 0.35),
              NUM_FEATURES - 1
            );
            activateFeature(index);
          }
        });

        // Initialize state
        activateFeature(0);
      }

      // Setup Process Steps Animation
      if (processSectionRef.current && processStepsRef.current.length > 0) {
        gsap.fromTo(
          processStepsRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: processSectionRef.current,
              start: "top 70%",
            }
          }
        );
      }
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen relative">
      <div ref={heroGlowRef} 
           style={{
             position: "fixed", width: "800px", height: "800px",
             background: "radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)",
             borderRadius: "50%", pointerEvents: "none", zIndex: 9999,
             left: 0, top: 0,
             transform: "translate(-50%, -50%)",
             transition: "transform 0.1s ease-out",
             willChange: "transform"
           }} />

      {/* SECTION 1 - NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
           style={{
             height: "56px",
             padding: "0 40px",
             background: "var(--bg)",
             borderBottom: "1px solid var(--border)",
             backdropFilter: "blur(12px)"
           }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: "16px" }}>
          ⟨/⟩ MotionCode
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>Features</Link>
          <Link href="#how-it-works" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>How it Works</Link>
          <Link href="#pricing" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>Pricing</Link>
          <Link href="/app" 
                style={{
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  background: "transparent",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "8px 20px",
                  borderRadius: "0",
                  textDecoration: "none",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--accent-dim)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            Try Free →
          </Link>
        </div>
      </nav>

      {/* SECTION 2 - HERO */}
      <section className="relative w-full flex flex-col items-start overflow-hidden" 
               style={{
                 minHeight: "100vh",
                 paddingLeft: "10vw",
                 paddingTop: "22vh",
                 borderBottom: "1px solid var(--border)"
               }}>
        
        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          01 /
        </div>

        {/* Scan line */}
        <div style={{
          position: "absolute", width: "100%", height: "1px", left: 0,
          background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.18), transparent)",
          animation: "scan 6s ease-in-out infinite",
          pointerEvents: "none", zIndex: 1
        }} />

        <div className="flex items-center" style={{ position: "absolute", top: "18vh", left: "10vw", zIndex: 10 }}>
          <div style={{
            width: "6px", height: "6px", backgroundColor: "#00ff88", borderRadius: "50%",
            display: "inline-block", marginRight: "8px", verticalAlign: "middle",
            animation: "heroPulse 2s ease infinite"
          }}></div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px" }}>
            {"// motion intelligence platform"}
          </div>
        </div>

        <div className="flex flex-col relative z-10" style={{ pointerEvents: "none" }}>
          <div style={{ overflow: "hidden" }}>
            <div ref={el => { heroLinesRef.current[0] = el; }} style={{ pointerEvents: "auto", fontFamily: "var(--font-mono)", fontSize: "7vw", fontWeight: "bold", color: "var(--text)", lineHeight: 1.1, willChange: "transform" }}>
              Turn any animation
            </div>
          </div>
          <div style={{ overflow: "hidden" }}>
            <div ref={el => { heroLinesRef.current[1] = el; }} style={{ pointerEvents: "auto", fontFamily: "var(--font-mono)", fontSize: "7vw", fontWeight: "bold", color: "var(--text)", lineHeight: 1.1, willChange: "transform" }}>
              into production
            </div>
          </div>
          <div style={{ overflow: "hidden" }}>
            <div ref={el => { heroLinesRef.current[2] = el; }} style={{ pointerEvents: "auto", fontFamily: "var(--font-mono)", fontSize: "7vw", fontWeight: "bold", color: "var(--accent)", lineHeight: 1.1, willChange: "transform" }}>
              code.
            </div>
          </div>
        </div>

        <p ref={heroSubtextRef}
           className="relative z-10 pointer-events-none"
           style={{
             fontFamily: "var(--font-body)",
             fontSize: "15px",
             color: "var(--muted)",
             lineHeight: 1.7,
             marginTop: "28px",
             maxWidth: "420px"
           }}>
          Upload a video. Get CSS, GSAP, and Framer Motion code instantly.
        </p>

        <div className="flex flex-row gap-4 relative z-10" style={{ marginTop: "40px" }}>
          <Link href="/app"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: "bold",
                  padding: "14px 32px",
                  border: "none",
                  borderRadius: "0",
                  textDecoration: "none",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
          >
            Start for free →
          </Link>
          <Link href="#features"
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  padding: "14px 32px",
                  border: "1px solid var(--border)",
                  borderRadius: "0",
                  textDecoration: "none",
                  transition: "border-color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--accent-border)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            See it work ↓
          </Link>
        </div>

        <div ref={heroTerminalRef} className="absolute hidden lg:block"
             style={{
               right: "8vw",
               top: "50%",
               transform: "translateY(-50%)",
               width: "360px",
               height: "280px",
               border: "1px solid rgba(255, 255, 255, 0.08)",
               background: "rgba(10, 10, 10, 0.5)",
               backdropFilter: "blur(12px)",
               WebkitBackdropFilter: "blur(12px)",
               boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
               borderRadius: "12px",
               fontFamily: "var(--font-mono)",
               fontSize: "12px",
               lineHeight: "1.8",
               zIndex: 0,
               willChange: "transform"
             }}>
          {/* Terminal Header Info */}
          <div className="flex items-center gap-2" style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 16px" }}>
            <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]"></div>
            <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]"></div>
            <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]"></div>
          </div>
          <div style={{ padding: "20px" }}>
            <div ref={el => { heroTermLinesRef.current[0] = el; }} style={{ display: "block", color: "#3a3a4a" }}>$ motioncode analyze button-morph.mp4</div>
            <div ref={el => { heroTermLinesRef.current[1] = el; }} style={{ display: "block", color: "#3a3a4a" }}>&gt; extracting 8 frames...</div>
            <div ref={el => { heroTermLinesRef.current[2] = el; }} style={{ display: "block", color: "#00ff88" }}>&gt; intent detected: morph ✓</div>
            <div ref={el => { heroTermLinesRef.current[3] = el; }} style={{ display: "block", color: "#00ff88" }}>&gt; duration: 340ms</div>
            <div ref={el => { heroTermLinesRef.current[4] = el; }} style={{ display: "block", color: "#3a3a4a" }}>&gt; generating output...</div>
            <div ref={el => { heroTermLinesRef.current[5] = el; }} style={{ display: "block", color: "#00ff88" }}>
              &gt; CSS  GSAP  Framer Motion  ✓ <span className="blink-cursor" style={{ opacity: 1, display: "inline-block" }}>▊</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - LOGO STRIP */}
      <section style={{ padding: "40px 0", borderBottom: "1px solid var(--border)", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "3px", whiteSpace: "nowrap", marginBottom: "32px", opacity: 0.6 }}>
          TRUSTED BY DEVELOPERS AT
        </div>
        <div className="flex whitespace-nowrap marquee-scroll w-full">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex" style={{ gap: "80px", paddingRight: "80px" }}>
              {["Vercel", "Stripe", "Linear", "Figma", "Notion", "Loom", "Raycast", "Resend"].map(brand => (
                <span key={brand} style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--muted)" }}>
                  {brand}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 - LOGO/FEATURES (STICKY SCROLL) */}
      <section ref={featuresSectionRef} 
               style={{ position: "relative", height: "100vh", overflow: "hidden", display: "flex", borderBottom: "1px solid var(--border)", marginBottom: `${(FEATURES_DATA.length - 1) * 100}vh` }}>
        
        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          02 /
        </div>

        <div style={{ width: "48%", padding: "60px 40px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#3a3a4a", letterSpacing: "3px" }}>PRODUCT</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "28px", color: "var(--text)", marginBottom: "40px", marginTop: "16px" }}>Everything you need to ship motion.</div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {FEATURES_DATA.map((ft, i) => (
            <div key={ft.num}
                 ref={el => { leftCardsRef.current[i] = el; }}
                 style={{
                   padding: "24px 28px",
                   border: "1px solid var(--border)",
                   borderLeft: "1px solid var(--border)",
                   marginBottom: "10px",
                   borderRadius: "0",
                   transition: "all 0.35s ease",
                   opacity: 0.3,
                   background: "transparent"
                 }}>
              <div className="card-num" style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent)", letterSpacing: "1px", transition: "text-shadow 0.3s ease" }}>{ft.num}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text)", fontWeight: 700, margin: "6px 0" }}>{ft.title}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{ft.desc}</div>
            </div>
          ))}
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {FEATURES_DATA.map((ft, i) => (
            <div key={ft.num}
                 ref={el => { rightPanelsRef.current[i] = el; }}
                 style={{
                   position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px",
                   opacity: 0, transform: "scale(1.05)", filter: "blur(8px)", transition: "opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease", willChange: "transform"
                 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "160px", fontWeight: 800, color: "#ffffff08", userSelect: "none" }}>{ft.num}</div>
              <div className="feature-title" style={{ fontFamily: "var(--font-mono)", fontSize: "28px", color: "#e2e8f0", marginTop: "-30px", zIndex: 10, willChange: "transform" }}>{ft.title}</div>
              <div className="feature-desc" style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--muted)", maxWidth: "320px", textAlign: "center", marginTop: "16px", lineHeight: 1.7, zIndex: 10, willChange: "transform" }}>{ft.desc}</div>
              <div style={{
                marginTop: "32px", width: "280px", background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "16px",
                fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a3a4a", zIndex: 10, whiteSpace: "pre-line", textAlign: "left"
              }}>
                {ft.code}
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* SECTION 5 - HOW IT WORKS */}
      <section id="how-it-works" ref={processSectionRef}
               style={{ position: "relative", background: "var(--bg)", padding: "120px 10vw", borderBottom: "1px solid var(--border)" }}>
        
        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          03 /
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "2px" }}>Process</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "36px", color: "var(--text)", marginBottom: "64px", marginTop: "16px" }}>Three steps to production-ready code</div>
        
        <div className="flex flex-col md:flex-row" style={{ border: "1px solid #1a1a1a" }}>
          {[
            { num: "01", title: "Upload", desc: "Drop your video or GIF into the converter" },
            { num: "02", title: "Analyze", desc: "AI extracts every frame and reads the motion" },
            { num: "03", title: "Ship", desc: "Copy production code in CSS, GSAP, or Framer Motion" }
          ].map((st, i) => (
            <div key={st.num}
                 ref={el => { processStepsRef.current[i] = el; }}
                 className="flex-1 relative group"
                 style={{ padding: "48px 40px", borderRight: i === 2 ? "none" : "1px solid #1a1a1a", willChange: "transform", background: "linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)", transition: "background 0.3s ease" }}>
              
              <div style={{ position: "absolute", top: 0, left: 0, width: "0%", height: "2px", background: "#00ff88", transition: "width 0.3s ease", opacity: 0.8 }} className="group-hover:w-full" />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "64px", color: "var(--border)", display: "block", marginBottom: "-16px", transform: "translateY(-16px)", transition: "color 0.3s ease", userSelect: "none" }} className="group-hover:text-[#ffffff0c]">{st.num}</div>
              
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#00ff88", letterSpacing: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "6px", height: "6px", background: "#00ff88", borderRadius: "50%", opacity: 0.8 }} className="animate-pulse" />
                {`STEP ${st.num}`}
              </div>
              
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", color: "#e2e8f0", margin: "16px 0 10px" }}>{st.title}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 }}>{st.desc}</div>
              {i < 2 && (
                <div style={{ position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", color: "#1a1a1a", fontSize: "24px", zIndex: 10 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 - CTA */}
      <section style={{ position: "relative", background: "var(--surface)", padding: "120px 10vw", textAlign: "center", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          04 /
        </div>

        <div style={{ width: "48px", height: "2px", background: "#00ff88", marginBottom: "32px" }}></div>
        <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "48px", color: "#e2e8f0", margin: 0, lineHeight: 1.1 }}>Start converting</h2>
        <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "48px", color: "#00ff88", margin: 0, lineHeight: 1.1 }}>animations today.</h2>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0 40px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#3a3a4a", letterSpacing: "1px" }}>
          <span>4 frameworks</span>
          <div style={{ width: "1px", height: "12px", background: "#3a3a4a" }}></div>
          <span>&lt; 30s analysis</span>
        </div>

        <Link href="/app"
              style={{
                display: "inline-block",
                background: "var(--accent)",
                color: "var(--bg)",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                fontWeight: "bold",
                padding: "16px 48px",
                borderRadius: "0",
                textDecoration: "none",
                transition: "opacity 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.opacity = "0.9"}
              onMouseOut={e => e.currentTarget.style.opacity = "1"}
        >
          Launch Converter →
        </Link>
      </section>

      {/* SECTION 7 - FOOTER */}
      <footer style={{ background: "#080808", borderTop: "1px solid #1a1a1a", padding: "80px 10vw 0" }}>
        
        {/* TOP ROW */}
        <div className="flex flex-col md:flex-row gap-16 md:gap-0" style={{ width: "100%", borderBottom: "1px solid #1a1a1a", paddingBottom: "64px" }}>
          
          {/* LEFT (40% width) */}
          <div className="w-full md:w-[40%]">
            <div style={{ fontFamily: "var(--font-mono)", color: "#00ff88", fontSize: "18px" }}>
              ⟨/⟩ MotionCode
            </div>
            <div style={{ fontFamily: "var(--font-body)", color: "#3a3a4a", fontSize: "13px", marginTop: "8px" }}>
              Intelligence for motion.
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
              <div style={{ border: "1px solid #1a1a1a", padding: "6px 14px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a3a4a" }}>
                4 frameworks
              </div>
              <div style={{ border: "1px solid #1a1a1a", padding: "6px 14px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a3a4a" }}>
                &lt; 30s analysis
              </div>
              <div style={{ border: "1px solid #1a1a1a", padding: "6px 14px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a3a4a" }}>
                open beta
              </div>
            </div>
          </div>

          {/* RIGHT (60% width) */}
          <div className="w-full md:w-[60%] flex flex-wrap md:flex-nowrap justify-start md:justify-end gap-[40px] md:gap-[80px]">
            
            {/* Column "Product" */}
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a3a4a", letterSpacing: "2px", marginBottom: "20px", textTransform: "uppercase" }}>
                Product
              </div>
              {["Converter", "Pricing", "Changelog", "Docs"].map(link => (
                <Link key={link} href="#" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#3a3a4a", lineHeight: 2.2, display: "block", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.color = "#3a3a4a"}>
                  {link}
                </Link>
              ))}
            </div>

            {/* Column "Company" */}
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a3a4a", letterSpacing: "2px", marginBottom: "20px", textTransform: "uppercase" }}>
                Company
              </div>
              {["About", "Careers", "Blog", "Security"].map(link => (
                <Link key={link} href="#" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#3a3a4a", lineHeight: 2.2, display: "block", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.color = "#3a3a4a"}>
                  {link}
                </Link>
              ))}
            </div>

            {/* Column "Legal" */}
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a3a4a", letterSpacing: "2px", marginBottom: "20px", textTransform: "uppercase" }}>
                Legal
              </div>
              {["Privacy", "Terms", "SLA", "DPA"].map(link => (
                <Link key={link} href="#" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#3a3a4a", lineHeight: 2.2, display: "block", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.color = "#3a3a4a"}>
                  {link}
                </Link>
              ))}
            </div>

          </div>
        </div>

        {/* DECORATIVE ELEMENT */}
        <div style={{ 
          fontFamily: "var(--font-mono)", 
          fontSize: "clamp(48px, 8vw, 120px)", 
          color: "#ffffff04", 
          textAlign: "center", 
          letterSpacing: "0.3em", 
          padding: "40px 0", 
          userSelect: "none", 
          pointerEvents: "none" 
        }}>
          MOTIONCODE
        </div>

        {/* BOTTOM ROW */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-0" style={{ padding: "24px 0", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#1a1a1a" }}>
            © 2026 MotionCode. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Twitter ↗", "GitHub ↗", "LinkedIn ↗"].map(link => (
              <Link key={link} href="#" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a3a4a", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#00ff88"} onMouseOut={e => e.currentTarget.style.color = "#3a3a4a"}>
                {link}
              </Link>
            ))}
          </div>
        </div>

      </footer>
    </div>
  );
}
