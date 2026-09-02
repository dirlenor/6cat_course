# 6CAT ACADEMY — DESIGN SYSTEM

Version: 1.0
Status: Locked Foundation
Project: AI Website — Zero to Live

---

# 1. PURPOSE

This file is the global visual and structural source of truth for the 6CAT Academy landing page.

Every section must inherit this Design System.

Section-specific JSON files control:
- Section composition
- Content
- Element order
- Relative positioning
- Section-specific responsive behavior

This Design System controls:
- Layout
- Container
- Grid
- Spacing
- Typography
- Colors
- Buttons
- Cards
- Borders
- Radius
- Image behavior
- Icon behavior
- Responsive foundations

If a section JSON does not explicitly override a composition rule, follow this file.

Do not invent new design tokens when an existing token can be used.

---

# 2. DESIGN DIRECTION

The overall visual direction is:

Creative Education
×
Digital Design Studio
×
Editorial Design
×
Minimal UI

The website should feel like a modern creative studio that teaches practical website creation.

It should NOT feel like:
- Generic online course landing page
- AI SaaS website
- Dashboard
- Corporate training website
- Template marketplace

Core characteristics:

- Minimal
- Bold
- Editorial
- Creative
- Modern
- Hands-on
- Spacious
- Human
- Premium but approachable

---

# 3. DESIGN PRINCIPLES

## 3.1 Content First

Content hierarchy is more important than decoration.

The user should immediately understand:
1. What the section is about
2. What the main message is
3. What supporting information matters
4. What action is available

---

## 3.2 Generous Whitespace

Whitespace is an intentional part of the design.

Do not reduce whitespace simply to fit more content above the fold.

Sections are allowed to extend beyond one viewport.

Do not force sections into 100vh unless explicitly requested.

---

## 3.3 Strong Typography

Typography should create the majority of the visual hierarchy.

Use strong contrast between:
- Display
- Heading
- Body
- Label
- Caption

Do not make all text visually similar.

---

## 3.4 Minimal UI

Avoid unnecessary containers.

Do not automatically put content inside cards.

Use cards only when information genuinely belongs inside a contained component.

---

## 3.5 Editorial Composition

Layouts may use:
- Asymmetry
- Large typography
- Controlled overlap
- Large visual moments
- Intentional empty space
- Hand-drawn accents
- Browser/UI fragments

But readability always comes first.

---

# 4. GLOBAL CONTAINER

Primary desktop reference:

1440px

Main content container:

max-width: 1280px;
width: calc(100% - 128px);
margin-inline: auto;

Desktop minimum side padding:

64px

The 1280px container is LOCKED.

Normal text and UI content should remain inside this container.

Backgrounds, carousels and intentional decorative elements may extend beyond the container when required by the section composition.

---

# 5. CONTENT WIDTH

Do not automatically stretch text across the full 1280px container.

Use narrower reading widths.

## Narrow Reading Content

max-width: 640px;

Use for:
- Paragraphs
- Explanations
- Long body copy

## Standard Reading Content

max-width: 720px;

Use for:
- Body groups
- Supporting descriptions

## Medium Intro Content

max-width: 960px;

Use for:
- Section headlines
- Introductory statements
- Centered hero copy

Large display typography may exceed these widths when composition requires it.

---

# 6. GRID SYSTEM

## Desktop

12 columns

Column gap:

24px

Common layouts:

6 / 6
5 / 7
7 / 5
4 / 8
8 / 4
3 / 3 / 3 / 3

## Tablet

8 columns

Column gap:

20px

## Mobile

4 columns

Column gap:

16px

Use the global grid for major composition.

Do not force small internal components onto the global grid when Flexbox or local CSS Grid is more appropriate.

---

# 7. BREAKPOINTS

Use these global responsive ranges:

Large Desktop:
>= 1440px

Desktop:
1200px – 1439px

Small Desktop:
1024px – 1199px

Tablet:
768px – 1023px

Mobile:
480px – 767px

Small Mobile:
< 480px

The 1440px desktop reference is the primary visual reference.

Responsive layouts may reorganize content.

They must preserve:
- Content hierarchy
- Reading order
- Main visual emphasis
- CTA importance

Responsive design is NOT simply shrinking the desktop composition.

---

# 8. SECTION SPACING

Default desktop section spacing is LOCKED:

padding-top: 140px;
padding-bottom: 140px;

Token:

--section-space: 140px;

Use this as the default rhythm between major sections.

## Tablet

Recommended:

100px – 120px

## Mobile

Recommended:

72px – 80px

Section JSON may request a compact or special section.

Otherwise use the default global section spacing.

Do not reduce section spacing merely to make the page shorter.

---

# 9. SPACING SCALE

Use a 4px-based spacing system.

--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-30: 120px;
--space-35: 140px;

Avoid arbitrary values such as:

17px
29px
37px
53px
73px

Use the nearest spacing token whenever possible.

---

# 10. SPACING RELATIONSHIPS

These are general guidelines.

Section JSON may define relative spacing such as:
- small
- medium
- large
- extra-large

Resolve them using the global spacing system.

Recommended relationships:

Eyebrow → Heading:
16–24px

Heading → Supporting Copy:
24–32px

Headline Group → Main Content:
48–80px

Text → Main Visual:
48–64px

Major Content Group → Major Content Group:
64–96px

Card Internal Padding:
24–32px

Icon → Text:
16–24px

CTA → Previous Content:
32–48px

---

# 11. TYPOGRAPHY

Primary font family is LOCKED:

"Noto Sans Thai", sans-serif

Use Noto Sans Thai for both Thai and Latin text unless a section explicitly requires an expressive display treatment.

Fallback:

system-ui,
sans-serif;

---

# 12. TYPOGRAPHY CHARACTER

The typography system should create contrast between:

Bold / confident headings

and

Light / airy body text

Normal paragraphs should NOT look heavy.

Body typography weight is LOCKED at:

300

unless emphasis requires a heavier weight.

---

# 13. DESKTOP TYPE SCALE

## Display XL

Use for:
- ZERO → LIVE
- Major campaign statements

font-size:
clamp(72px, 7vw, 112px);

font-weight:
800;

line-height:
0.95;

letter-spacing:
-0.03em;

---

## Display

font-size:
72px;

font-weight:
700;

line-height:
1.05;

letter-spacing:
-0.025em;

---

## H1

font-size:
64px;

font-weight:
700;

line-height:
1.1;

letter-spacing:
-0.02em;

---

## H2

font-size:
52px;

font-weight:
700;

line-height:
1.15;

letter-spacing:
-0.015em;

---

## H3

font-size:
32px;

font-weight:
600;

line-height:
1.25;

---

## H4

font-size:
24px;

font-weight:
600;

line-height:
1.3;

---

## Body Large

font-size:
20px;

font-weight:
300;

line-height:
1.7;

---

## Body

font-size:
16px;

font-weight:
300;

line-height:
1.75;

---

## Body Small

font-size:
14px;

font-weight:
300;

line-height:
1.7;

---

## Label

font-size:
13px;

font-weight:
600;

line-height:
1.4;

letter-spacing:
0.04em;

---

## Caption

font-size:
12px;

font-weight:
300;

line-height:
1.5;

---

# 14. MOBILE TYPE SCALE

Do not simply scale the desktop layout proportionally.

Recommended mobile typography:

Display XL:
48–64px

Display:
44–52px

H1:
40–48px

H2:
36–40px

H3:
26–30px

H4:
20–22px

Body Large:
18px

Body:
16px

Body Small:
14px

Caption:
12px

Body copy should normally remain at least 14px.

---

# 15. EXPRESSIVE TYPOGRAPHY

Some sections use expressive handwritten / brush typography.

Examples:
- ZERO → LIVE
- LIVE
- Selected highlighted words
- Small handwritten annotations

This is a visual accent system.

It is NOT the primary typography system.

Do not use expressive typography for:
- Paragraphs
- Navigation
- Buttons
- Long headings
- Feature descriptions

During Direct Design, apply approved expressive typography when its approved
asset or treatment is available. Otherwise retain the real text and use a
clearly scoped placeholder treatment.

---

# 16. COLOR SYSTEM

Primary brand orange is LOCKED:

#FA5001

CSS:

--color-accent: #FA5001;

## Main Palette

--color-bg-primary: #F4F1EE;

--color-bg-white: #FFFFFF;

--color-bg-dark: #0A0A0A;

--color-bg-dark-soft: #141414;

--color-text-primary: #111111;

--color-text-secondary: #666666;

--color-text-inverse: #FFFFFF;

--color-text-inverse-secondary: #AFAFAF;

--color-accent: #FA5001;

--color-border-light: #E2DFDB;

--color-border-dark: #303030;

---

# 17. ORANGE USAGE

#FA5001 is the main brand accent.

Use orange intentionally for:
- Important words
- CTA
- Section numbers
- Active states
- Important annotations
- Selected icons
- Arrows
- Highlights
- Featured pricing treatment

Do not make every element orange.

Orange should attract attention because it is used selectively.

---

# 18. LIGHT SECTION

Default light section:

background:
#F4F1EE

primary text:
#111111

secondary text:
#666666

accent:
#FA5001

---

# 19. DARK SECTION

Dark sections:

background:
#0A0A0A

primary text:
#FFFFFF

secondary text:
#AFAFAF

accent:
#FA5001

Use borders and contrast rather than excessive shadows.

---

# 20. ACCENT BACKGROUND SECTION

Some sections may use the brand orange as the full background.

Background:

#FA5001

Use black and white typography depending on hierarchy and contrast.

Do not place unnecessary white cards across the entire orange section.

Allow the orange background to remain visually dominant.

---

# 21. BORDER RADIUS

Keep radius restrained.

--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-pill: 999px;

Default card:

16px

Default button:

8–10px

Do not automatically apply:
rounded-3xl
rounded-full

to every component.

The design should retain an editorial character.

---

# 22. BORDER SYSTEM

Light:

1px solid #E2DFDB

Dark:

1px solid #303030

Selected / Featured:

1px solid #FA5001

Use borders to create structure.

Avoid unnecessary heavy borders.

---

# 23. SHADOW SYSTEM

Shadows should be subtle and limited.

Use shadows mainly for:
- Floating browser frames
- Overlapping UI layers
- Important visual compositions

Avoid shadows on every card.

Dark sections should generally use border and contrast instead of heavy shadows.

---

# 24. BUTTON SYSTEM

## Primary Button

Purpose:
Main conversion action.

Examples:
- จองรอบเรียน
- ดูรอบว่าง / จองเลย
- จอง SOLO
- จอง BUDDY

Recommended height:

52–56px

Horizontal padding:

28–32px

Typography:

16px
font-weight: 600

Radius:

8–10px

Primary button may contain:

Label + Arrow Right

Minimum interactive target:

44 × 44px

---

## Secondary Button

Use:
- Transparent background
- Neutral or accent border
- Same general height as primary

Secondary buttons must never visually compete with the primary CTA.

---

# 25. CTA RULES

One visual area should normally contain only one dominant CTA.

Do not add unnecessary conversion buttons to every content block.

CTA placement should follow the section JSON.

Do not invent additional CTAs.

---

# 26. SECTION LABEL

Use one reusable SectionLabel component.

Structure:

[ NUMBER • ] SECTION NAME

Examples:

01
02
03
04
05
06

The number uses the accent system.

The component may have:
- Light variant
- Dark variant
- Orange-background variant

The component structure should remain consistent across sections.

Do not redesign the SectionLabel independently for every section.

---

# 27. CARD SYSTEM

Cards are supporting components.

They are NOT the default layout solution.

Use cards when:
- Information forms a clear contained unit
- Pricing requires comparison
- Testimonials require carousel items
- Small information summaries require containment

Default internal padding:

24–32px

Default radius:

16px

Default border:

1px

Avoid:

Card inside Card inside Card.

Avoid wrapping normal editorial content inside containers without a reason.

---

# 28. ICON SYSTEM

Use supplied icon artwork directly during Direct Design. If an icon asset is
missing, use a consistent placeholder that preserves the intended footprint.

When a new final icon is needed but has not been supplied, do not mix unrelated
icon styles or substitute generic stock artwork.

Recommended characteristics:

Outline icons
1.5–2px stroke
Minimal detail
Consistent optical weight

Common sizes:

16px
20px
24px
32px
48px

Do not mix unrelated icon styles.

---

# 29. IMAGE SYSTEM

Images must preserve intentional aspect ratios.

Common ratios:

Website screenshot:
16:9

Wide visual:
3:2

Portrait:
4:5

Square:
1:1

Avatar:
1:1

Mobile device:
approximately 9:19.5

Use:

object-fit: cover;

when cropping is acceptable.

Use:

object-fit: contain;

when the complete UI or screenshot must remain visible.

---

# 30. IMAGE AND PLACEHOLDER SYSTEM

Use approved supplied images directly during Direct Design.

When an intended image has not yet been supplied, use a labeled placeholder.

Examples:

[ HERO WEBSITE ]

[ WEBSITE SCREENSHOT ]

[ MOBILE PREVIEW ]

[ STUDENT AVATAR ]

[ INSTRUCTOR PHOTO ]

[ PROJECT SCREENSHOT ]

[ REFERENCE BOARD ]

Placeholder must preserve:
- Intended width
- Intended height
- Aspect ratio
- Position
- Alignment
- Overlap
- Hierarchy

Do not use random stock photography.

---

# 31. COMPLEX VISUALS AND FINAL COMPOSITES

When the user supplies an approved final composite image, use it as one image
instead of rebuilding its internal UI layers.

Example:

Hero visual may contain:

MAIN BROWSER
+ AI PROMPT
+ AI OUTPUT
+ MOBILE PREVIEW
+ TOOLBAR

Keep independent layout layers only when no approved composite exists and they
must be adjusted or animated independently.

---

# 32. EDITORIAL GRAPHICS

Allowed visual accents include:

- Brush underline
- Hand-drawn arrows
- Stars
- Circles
- Cursor
- Selection boxes
- Resize handles
- Annotation lines
- Doodles
- Browser UI fragments

These are supporting accents.

They must:
- Support hierarchy
- Explain interaction
- Reinforce the creative design language

They should NOT simply fill empty space.

Whitespace is allowed to remain empty.

---

# 33. DIRECT DESIGN GRAPHIC RULE

Use supplied approved decorative graphics directly.

If an intended editorial graphic has not been supplied and it affects layout,
use a simple placeholder. If it does not affect layout, omit it temporarily.

Example:

Brush underline
→ simple line

Complex doodle without an asset
→ omit

Photo
→ labeled rectangle

Icon
→ supplied icon asset, or a simple icon placeholder when missing

---

# 34. BROWSER / WEBSITE MOCKUPS

Browser frames are a recurring visual language.

They should communicate:

Design
Building
AI workflow
Responsive testing
Debugging
Publishing

Browser compositions may contain:

- Browser chrome
- Website screenshot
- Cursor
- Selection handles
- Prompt UI
- Code output
- Mobile preview
- Annotation

Do not automatically use generic laptop-device mockups.

The visual should feel like an active website design/build environment.

---

# 35. RESPONSIVE PHILOSOPHY

The current implementation phase is desktop-first. Desktop is the required
design target; responsive QA and refinement are deferred until requested.

When responsive work begins, reorganize the composition intelligently.

It does NOT mean shrinking the desktop layout until everything fits.

Preserve:
- Hierarchy
- Reading order
- Main message
- Main visual
- CTA

Remove or simplify secondary decorative elements when necessary.

---

# 36. COMMON RESPONSIVE PATTERNS

Desktop:

2 columns

Mobile:

1 column


Desktop:

4 testimonial cards

Tablet:

2–3 cards

Mobile:

1.1 cards


Desktop:

5-step horizontal process

Mobile:

Horizontal scroll
OR
Vertical sequence


Desktop:

Complex overlapping visual

Mobile:

Simplified layered visual


Desktop:

Pricing side-by-side

Mobile:

Stacked pricing cards

---

# 37. MOBILE LAYOUT - DEFERRED

Do not use this section as a required QA checklist during the current
desktop-first phase. Preserve these rules for the later responsive pass.

Recommended horizontal page padding:

20–24px

Text must not touch viewport edges.

Buttons may become:

width: 100%;

Cards may become:

width: 100%;

Complex visuals may intentionally overflow horizontally if the composition benefits from it.

Do not shrink UI screenshots until text becomes unreadable.

Simplify the composition instead.

---

# 38. CAROUSEL SYSTEM

For testimonial/review sections:

Desktop:
approximately 4 visible cards

Tablet:
approximately 2–3 cards

Mobile:
approximately 1.1 cards

Showing part of the next card is encouraged on touch devices because it communicates horizontal scrolling.

Carousel should support:

- Drag
- Swipe
- Arrow navigation when appropriate
- Pagination indicators
- Keyboard accessibility

Avoid aggressive autoplay.

Default:
autoplay disabled.

---

# 39. MOTION

Direct Design phase:

Keep non-essential animation disabled unless explicitly requested.

A later motion pass may introduce:

- Scroll reveal
- Hover feedback
- Carousel movement
- Browser-layer movement
- Brush reveal
- Cursor interaction
- Subtle parallax

Recommended durations:

Fast:
150–200ms

Normal:
250–350ms

Large visual transition:
400–700ms

Do not animate everything.

Motion should reinforce hierarchy.

Support:

prefers-reduced-motion

---

# 40. ACCESSIBILITY

Minimum interactive target:

44 × 44px

Maintain sufficient text/background contrast.

Do not rely on orange alone to communicate state.

Interactive elements require:
- Keyboard accessibility
- Visible focus states
- Semantic HTML

Informative images require alt text.

Decorative graphics should be hidden from assistive technology when appropriate.

---

# 41. DIRECT DESIGN MODE

The first implementation of each section follows the approved visual design.
Use real approved copy and supplied final assets from the beginning.

The purpose is to validate:

- Layout
- Proportion
- Grid
- Spacing
- Typography
- Hierarchy
- Content flow
- Desktop composition
- Visual placement

USE:

- Real text
- Real content order
- Real typography system
- Real container
- Real grid
- Real section spacing
- Real component dimensions
- Desktop structure
- Supplied final images, screenshots and icons

DO NOT USE:

- Invented imagery
- Unapproved decorative graphics
- Complex animation
- Unrequested effects

Use placeholders only for required assets that have not been supplied.

---

# 42. REFERENCE IMAGE RELATIONSHIP

When implementing a section, a visual reference image may be supplied together with the section JSON.

Use them as follows:

REFERENCE IMAGE
=
Visual composition reference.

Use it to understand:
- Overall appearance
- Relative sizing
- Visual balance
- Element placement
- Alignment
- Overlap
- Composition

SECTION JSON
=
Structural and content specification.

Use it to understand:
- What each element is
- Content hierarchy
- Content order
- Component relationships
- Desktop behavior
- Asset sources and required placeholders

DESIGN_SYSTEM.md
=
Global design rules.

Use it for:
- Typography
- Container
- Grid
- Spacing
- Color tokens
- Buttons
- Cards
- Radius
- Borders
- Responsive foundations

---

# 43. CONFLICT PRIORITY

If information conflicts, use this priority:

1. Explicit instruction in the current implementation request
2. Section JSON for content and composition
3. DESIGN_SYSTEM.md for global design rules
4. Reference image for visual interpretation

However:

The reference image should remain the primary visual guide for matching the intended composition.

Do not redesign a section merely because another layout would be easier to implement.

---

# 44. SECTION-BY-SECTION WORKFLOW

The website will be implemented ONE SECTION AT A TIME.

Do NOT build the entire landing page automatically.

Typical workflow:

SECTION 01
→ Direct design implementation
→ Review
→ Fix
→ Approve

Then:

SECTION 02
→ Implement
→ Review
→ Fix
→ Approve

Continue sequentially.

Do not modify previously approved sections unless explicitly requested.

---

# 45. SOURCE OF TRUTH

DESIGN_SYSTEM.md controls:

- Typography
- Container
- Grid
- Spacing
- Colors
- Buttons
- Cards
- Radius
- Borders
- Global responsive behavior

Section JSON controls:

- Section composition
- Content
- Element order
- Relative positioning
- Visual hierarchy
- Section-specific responsive behavior

Reference image controls:

- Visual direction
- Composition reference
- Relative visual proportions

---

# 46. GLOBAL GUARDRAILS

Do not invent new:
- Colors
- Typography sizes
- Spacing values
- Radius values
- Breakpoints

unless genuinely required.

Do not:
- Redesign approved compositions
- Add marketing copy
- Add statistics
- Add testimonials
- Add badges
- Add features
- Add CTAs
- Add decorative elements

unless explicitly specified.

Do not:
- Add generic AI gradients
- Add glassmorphism
- Turn editorial content into SaaS cards
- Use excessive shadows
- Use excessive rounded containers
- Fill intentional whitespace
- Force sections into 100vh

Do not modify previously approved sections while implementing a new section.

---

# 47. FINAL DESIGN CHARACTER

The final website should feel like:

CREATIVE STUDIO
×
EDUCATION
×
EDITORIAL DESIGN
×
REAL WEBSITE BUILDING

The visual system should communicate:

“เรียนรู้จากการลงมือทำจริง”

rather than:

“ซื้อคอร์สออนไลน์ทั่วไป”

Consistency should come from:
- Typography
- Grid
- Spacing
- Color
- Shared components
- Visual language

NOT from making every section use the same layout.
