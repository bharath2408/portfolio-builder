# Advanced Animations Roadmap

Feature plan for advanced animations in Foliocraft. GSAP 3.14 is already installed with ScrollTrigger.

## Implemented

### Entrance Animations (12 presets)
fade-up, fade-in, slide-left, slide-right, scale, blur-in, bounce-in, flip-x, flip-y, rotate-in, zoom-in, typewriter — with duration, delay, and easing controls.

### Scroll Trigger
Reveal (plays on scroll into view) and Parallax (depth effect with configurable speed). Powered by GSAP ScrollTrigger with auto-detected scroll container.

### Hover Effects (5 presets)
lift, tilt-3d, glow, grow, shake — via Framer Motion.

### Stagger Animations
Section-level setting. Blocks animate one-by-one with configurable delay (ms) and direction (start, end, center, random).

---

## Planned

### 1. Scroll-Linked Progress Animations
**Priority:** High
**Complexity:** Medium
**Dependencies:** GSAP ScrollTrigger (installed)

Elements transform continuously as the user scrolls — not just enter/exit, but tied to scroll position (0–100%).

**Properties to add to BlockStyles:**
- `scrollLinked?: boolean`
- `scrollLinkedProperty?: "opacity" | "x" | "y" | "scale" | "rotate" | "blur"`
- `scrollLinkedFrom?: number`
- `scrollLinkedTo?: number`

**Implementation:**
- Use `ScrollTrigger` with `scrub: true` to tie animation progress to scroll position
- Similar to parallax but for any CSS property
- Add UI controls in Effects panel: toggle, property selector, from/to values

---

### 2. Text Splitting Animations
**Priority:** High
**Complexity:** Medium
**Dependencies:** Custom splitter (no GSAP SplitText needed — use CSS/JS splitting)

Animate individual characters, words, or lines of text blocks.

**Properties to add to BlockStyles:**
- `textAnimation?: "none" | "char-fade" | "char-wave" | "word-slide" | "word-fade" | "line-reveal" | "line-slide"`
- `textAnimationStagger?: number` (ms between each unit)

**Implementation:**
- Split text into `<span>` wrappers via a `SplitText` component
- Apply GSAP stagger animations to the spans
- Works with Heading and Text blocks
- Presets:
  - **char-fade** — each character fades in one-by-one
  - **char-wave** — characters rise up in a wave pattern
  - **word-slide** — words slide in from below
  - **word-fade** — words fade in sequentially
  - **line-reveal** — lines reveal with a clip-path wipe
  - **line-slide** — lines slide up into position

---

### 3. Counter Animation
**Priority:** High
**Complexity:** Low
**Dependencies:** GSAP ScrollTrigger (installed)

Stat blocks count up from 0 to their value when scrolled into view.

**Properties to add to BlockStyles:**
- `counterAnimation?: boolean`
- `counterDuration?: number` (seconds, default 2)

**Implementation:**
- Detect Stat blocks with numeric values
- Use GSAP `to()` with `snap` and `innerText` proxy to animate the number
- Trigger via ScrollTrigger on reveal
- Parse "50+", "10k", "99%" — animate the numeric part, keep suffix

---

### 4. Marquee / Ticker
**Priority:** Medium
**Complexity:** Low
**Dependencies:** CSS animation or GSAP

Continuous horizontal scrolling of content (text, badges, logos).

**New block type: `marquee`**
- `items: string[]` — text items to scroll
- `speed?: number` — pixels per second (default 50)
- `direction?: "left" | "right"`
- `pauseOnHover?: boolean`

**Implementation:**
- Duplicate content to fill the viewport
- Use CSS `@keyframes` with `translateX` for smooth infinite scroll
- Alternative: GSAP timeline with `repeat: -1`

---

### 5. Reveal Masks (Clip-Path Animations)
**Priority:** Medium
**Complexity:** Medium
**Dependencies:** GSAP ScrollTrigger

Content revealed via animated clip-path on scroll.

**Properties to add to BlockStyles:**
- `revealMask?: "none" | "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top" | "circle-expand" | "diagonal"`

**Implementation:**
- Use `clip-path: inset()` or `clip-path: circle()` with GSAP tweening
- `left-to-right`: `inset(0 100% 0 0)` → `inset(0 0 0 0)`
- `circle-expand`: `circle(0% at 50% 50%)` → `circle(150% at 50% 50%)`
- Trigger on scroll into view

---

### 6. Magnetic Cursor Effect
**Priority:** Low
**Complexity:** Medium
**Dependencies:** Framer Motion `useMotionValue` + `useTransform`

Elements subtly pull toward the cursor when nearby.

**Properties to add to BlockStyles:**
- `magneticHover?: boolean`
- `magneticStrength?: number` (0.1–0.5, default 0.2)

**Implementation:**
- Track cursor position relative to element center
- Apply transform offset proportional to distance
- Use `useMotionValue` for performant updates without re-renders
- Only active on desktop (disable for touch)

---

### 7. 3D Card Flip
**Priority:** Low
**Complexity:** Low
**Dependencies:** Framer Motion or CSS transforms

Full 180° card flip on hover or click, showing a back face.

**Properties to add to BlockStyles:**
- `flipOnHover?: boolean`
- `flipBackContent?: string` (text shown on back)
- `flipBackColor?: string`

**Implementation:**
- Use `transform: rotateY(180deg)` with `backface-visibility: hidden`
- Two divs: front (block content) and back (custom content)
- Framer Motion `animate` for smooth flip
- Works best on Project Cards and Cards

---

### 8. Scroll-Driven Section Timelines
**Priority:** Low
**Complexity:** High
**Dependencies:** GSAP ScrollTrigger + Timeline

Choreographed multi-block animations tied to section scroll progress.

**Properties to add to SectionStyles:**
- `scrollTimeline?: boolean`
- `timelineSequence?: Array<{ blockIndex: number; animation: string; start: number; end: number }>`

**Implementation:**
- Create a GSAP Timeline per section
- Each block's animation is mapped to a scroll progress range (0–1)
- Use `ScrollTrigger` with `scrub: true` on the section
- Complex UI: visual timeline editor showing blocks on a progress bar

---

### 9. Particle Backgrounds
**Priority:** Low
**Complexity:** Medium
**Dependencies:** Canvas API or lightweight library (tsparticles)

Floating particle effects behind section content.

**Properties to add to SectionStyles:**
- `particleBg?: "none" | "floating" | "confetti" | "snow" | "stars" | "network"`
- `particleCount?: number`
- `particleColor?: string`

**Implementation:**
- Render a `<canvas>` behind section content
- Use requestAnimationFrame for smooth particle movement
- Keep particle count low (50–100) for performance
- Presets define particle shape, movement pattern, and physics

---

### 10. SVG Path Drawing
**Priority:** Low
**Complexity:** Medium
**Dependencies:** GSAP (core — `drawSVG` is premium, but can use `strokeDasharray`/`strokeDashoffset` trick)

Lines and shapes that draw themselves on scroll.

**New block type or property on Line/shapes:**
- `drawOnScroll?: boolean`
- `drawDuration?: number`

**Implementation:**
- Set `stroke-dasharray` to total path length
- Animate `stroke-dashoffset` from full length to 0
- Use ScrollTrigger with scrub for scroll-linked drawing
- Works on Line blocks, borders, and custom SVG blocks

---

## Priority Order

1. ~~Stagger animations~~ ✅ Implemented
2. Counter animation (Low complexity, high impact for Stat blocks)
3. Text splitting animations (High impact for hero sections)
4. Scroll-linked progress (Powerful creative tool)
5. Marquee / ticker (Common portfolio pattern)
6. Reveal masks (Visually impressive)
7. Magnetic cursor (Polish/delight)
8. 3D card flip (Project cards enhancement)
9. Particle backgrounds (Visual flair)
10. SVG path drawing (Niche but impressive)
11. Scroll-driven timelines (Complex, power-user feature)
