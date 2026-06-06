# MotionCode 16:9 Promo Video Design

## Goal

Build the first MotionCode promotional video as a polished 16:9 launch trailer that can be embedded into the homepage or landing page. This first output is the reference version for later cinematic, 4:3, and 9:16 variants.

## Deliverable

- One 16:9 video composition at `1920x1080`.
- Target duration: 30-32 seconds, with 31 seconds as the planned runtime.
- Full promotional treatment with voiceover, music bed, motion design, product workflow, and CTA.
- Product visuals should be abstract glimpses, not literal screenshots of the current app.

## Visual Direction

The trailer should feel like MotionCode's existing landing page in motion: smoky dark canvas, bone/floral typography, restrained olive borders, code/terminal structure, scan lines, frame strips, and premium technical rhythm.

Palette:

- Background: `#11120D`
- Deep black panels: `#080808`, `#0A0A0A`
- Primary text: `#FFFBF4`
- Accent text and panels: `#D8CFBC`
- Muted UI: `#565449`
- Active system green, used sparingly: `#00FF88`

Typography:

- Use the landing page's visual pairing: Space Mono for headlines, labels, and code; Inter for short explanatory captions.
- Favor large kinetic typography for main beats, but keep copy readable on a homepage embed.

Motion:

- High-energy launch trailer pacing with controlled, premium restraint.
- Use fast typographic reveals, scan wipes, frame-strip pulses, vector overlays, and code-panel assembly.
- Avoid random glitch noise, loud flashing, over-saturated gradients, or effects that feel detached from the product.

## Narrative Timeline

### 0-4s: Brand Ignition

Open on a dark smoky field with a thin scan line and MotionCode mark. Reveal the core promise:

> Turn animation into production code.

The first beat should establish premium technical confidence, not explain the UI yet.

### 4-9s: Upload And Frame Extraction

Show an abstract video asset entering the system. It splits into a horizontal frame strip with highlighted frames and a subtle extraction meter.

Visual language: file tile, timeline ticks, frame thumbnails represented as abstract motion blocks.

### 9-15s: AI Motion Intelligence

The frame strip becomes an analysis surface. Overlay motion vectors, easing curves, intent labels, and keyframe markers.

Key words:

- intent detected
- easing curve
- transform path
- keyframes

### 15-22s: Multi-Framework Code Output

Assemble four clean code panels in sequence:

- CSS
- GSAP
- Framer Motion
- React Spring

Panels should look production-grade and minimal, with short code fragments and syntax-color accents. The goal is to make output feel real without needing literal app screenshots.

### 22-27s: Production Confidence

Show quality checks completing:

- Performance score
- GPU-ready transforms
- Reduced-motion fallback
- Accessibility check

This should communicate that MotionCode is not just generative; it helps developers ship responsibly.

### 27-31s: CTA

End with a clean final lockup:

> Upload. Analyze. Ship motion.

Use the MotionCode mark, a subtle system pulse, and a homepage-friendly ending frame that can hold for embedding.

## Voiceover

Tone: calm, premium, technically confident. Avoid hypey shouting.

Draft:

> Meet MotionCode. Upload any animation and turn it into production-ready motion code. Frames are extracted, movement is analyzed, and the system detects intent, timing, easing, and transform paths. Export clean CSS, GSAP, Framer Motion, and React Spring, with performance and accessibility checks built in. From inspiration to shipped interaction, faster.

The voiceover may be tightened during production to fit the 31-second runtime.

## Audio Direction

Use a tasteful cinematic synth pulse with clean momentum. The bed should support the visuals without sounding like random blast effects.

Audio qualities:

- Low, warm pulse
- Light digital ticks for scan and frame extraction moments
- Short risers into scene transitions
- No harsh drops, meme-style impacts, or distracting loudness spikes

## Technical Approach

Use a video-first composition workflow. HyperFrames is preferred for HTML/GSAP motion timing and export discipline; Remotion guidance should inform layout, composition setup, asset handling, and render checks if a Remotion implementation is chosen or needed.

The first implementation should create a reusable composition structure that can later produce:

- Cinematic 21:9
- 16:9
- 4:3
- 9:16

Only the 16:9 output is in scope for this first build.

## Homepage Fit

The ending frame and overall contrast must sit comfortably on the existing landing page, which uses a dark smoky background, thin borders, mono typography, and restrained highlights. The video should attract attention without fighting the page.

## Validation

Before calling the output complete:

- Verify the 16:9 composition renders at `1920x1080`.
- Inspect representative frames from the opening, analysis, code output, quality-check, and CTA sections.
- Confirm text remains readable and does not overlap.
- Confirm the runtime is within 30-32 seconds.
- Confirm final audio is present or clearly document any missing audio dependency.

## Out Of Scope For First Output

- Cinematic, 4:3, and 9:16 variants.
- Real app screenshots.
- Feature changes to the landing page.
- Rewriting the product app workflow.
