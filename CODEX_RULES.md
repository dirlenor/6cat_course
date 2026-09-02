# 6CAT ACADEMY — CODEX RULES

Version: 1.0
Project: AI Website — Zero to Live
Status: Active Project Rules

---

# 1. PURPOSE

This file defines how Codex must work on the 6CAT Academy website.

These rules apply to every implementation, revision, responsive adjustment,
visual refinement, and QA task in this project.

This project is built SECTION BY SECTION.

Do NOT attempt to generate or redesign the entire website in one pass unless
the user explicitly requests it.

The primary goal is:

REFERENCE
→ STRUCTURE
→ IMPLEMENT
→ REVIEW
→ REFINE
→ APPROVE
→ LOCK
→ NEXT SECTION

---

# 2. CORE WORKFLOW

The website must be implemented one section at a time.

Expected workflow:

SECTION 01
→ Implement
→ Review
→ Fix
→ User Approval
→ Lock

SECTION 02
→ Implement
→ Review
→ Fix
→ User Approval
→ Lock

Continue sequentially until all sections are complete.

Never automatically continue to the next section.

After completing the requested section:

STOP.

Wait for the user's review or next instruction.

---

# 3. REQUIRED FILES

Before implementing any section, read:

1. `DESIGN_SYSTEM.md`
2. The JSON specification for the requested section
3. This `CODEX_RULES.md`

Example:

For Section 01:

- CODEX_RULES.md
- DESIGN_SYSTEM.md
- specs/01_HERO.json
- User-provided Section 01 reference image

For Section 02:

- CODEX_RULES.md
- DESIGN_SYSTEM.md
- specs/02_PROBLEM.json
- User-provided Section 02 reference image

And so on.

Do not rely on memory from previous implementation tasks when the current
project files provide the answer.

---

# 4. REFERENCE IMAGE IS REQUIRED FOR VISUAL IMPLEMENTATION

The user will normally provide a reference image when asking to implement
a section.

Study the supplied reference carefully before writing UI code.

Use the reference to understand:

- Overall composition
- Visual balance
- Relative element sizes
- Element positioning
- Alignment
- Whitespace
- Overlapping relationships
- Typography hierarchy
- Visual density
- Image placement
- Browser/UI placement
- Decorative element placement
- Section rhythm

Do NOT merely identify the components in the reference.

Study how those components relate spatially.

For example:

Do not only conclude:

"Left side contains text and right side contains an image."

Also evaluate:

- How wide is the text area?
- How wide is the visual area?
- Where does the visual begin vertically?
- How much empty space exists?
- Does the image overlap another element?
- How large is the headline relative to the visual?
- Where is the visual center of gravity?
- How does the composition balance?

The goal is to reproduce the intended composition,
not simply reproduce the same content.

---

# 5. SOURCE OF TRUTH

Different sources control different parts of the implementation.

## Current User Instruction

Controls the current task and always has highest priority.

Examples:

- Change this spacing
- Make this image larger
- Remove this element
- Only edit Section 03
- Keep Section 01 unchanged
- Use this new reference

---

## Section JSON

Controls:

- Section structure
- Exact content
- Element order
- Content hierarchy
- Required components
- Visual layers
- Relative positioning
- Placeholder types
- Section-specific responsive behavior

---

## DESIGN_SYSTEM.md

Controls global rules:

- Typography
- Font family
- Font weights
- Colors
- Container
- Grid
- Spacing system
- Section spacing
- Buttons
- Cards
- Radius
- Borders
- Responsive foundations
- Global visual language

---

## Reference Image

Controls visual interpretation:

- Composition
- Relative scale
- Visual balance
- Layout feeling
- Overlap
- Density
- Alignment
- Visual direction

---

## Taste Design Skill

Controls visual refinement and quality judgment.

Taste Design may improve:

- Balance
- Rhythm
- Alignment
- Typography quality
- Whitespace
- Proportion
- Responsive composition
- UI polish

Taste Design must NOT replace the approved design direction.

---

# 6. PRIORITY ORDER

When sources conflict, follow this priority:

1. Current user instruction
2. Section JSON
3. DESIGN_SYSTEM.md
4. Reference image
5. Taste Design judgment
6. General frontend conventions

However:

The reference image remains the primary guide for the intended visual
composition.

Do not use lower-priority design judgment as an excuse to redesign the
reference.

If a significant conflict cannot be resolved safely, preserve the existing
approved implementation and report the conflict rather than making a major
design decision silently.

---

# 7. REQUIRED SKILL — TASTE DESIGN

Taste Design is REQUIRED for visual implementation and visual QA.

Use the installed Taste Design skill whenever working on:

- Layout
- UI
- Typography
- Composition
- Spacing
- Responsive behavior
- Visual hierarchy
- Design refinement
- Visual QA

Before using it, read the skill instructions available in the environment.

Do not assume how the skill works based only on its name.

Follow the actual installed skill instructions.

---

# 8. HOW TO USE TASTE DESIGN

Use Taste Design to REFINE the implementation.

Do NOT use Taste Design to REDESIGN the project.

Taste Design should help evaluate:

- Visual hierarchy
- Composition quality
- Typography balance
- Spacing
- Alignment
- Proportion
- Whitespace
- Visual rhythm
- UI polish
- Responsive decisions
- Awkward layouts
- Generic-looking layouts
- Excessive visual density
- Weak visual emphasis

Taste Design is a quality layer.

It is not the creative director of the project.

---

# 9. TASTE DESIGN MUST NOT OVERRIDE

Taste Design must NOT independently:

- Change the section concept
- Change the information architecture
- Change content hierarchy
- Rewrite marketing copy
- Add new content
- Add new sections
- Remove required elements
- Replace the reference composition
- Introduce a new visual style
- Change brand colors
- Change global typography
- Change approved spacing tokens
- Add generic AI aesthetics
- Add SaaS-style components
- Add unnecessary cards
- Add unnecessary gradients
- Add glassmorphism
- Add decorative elements without purpose

If Taste Design suggests a major structural improvement that conflicts with
the specification:

Do NOT implement it automatically.

Keep the specified composition.

---

# 10. DEFAULT IMPLEMENTATION MODE - DIRECT DESIGN

The current implementation mode is Direct Design.

Build each requested section directly toward the approved visual design using
real approved copy and supplied assets from the first pass.

Do not create a separate structure-only phase unless the user explicitly
requests one.

The implementation should validate:

- Layout
- Grid
- Width
- Height
- Proportion
- Spacing
- Typography
- Hierarchy
- Content flow
- Visual placement
- Overlap
- Desktop composition

Responsive refinement and viewport QA are deferred until the user requests them.

---

# 11. DIRECT DESIGN MUST USE REAL CONTENT

Use real approved text from the Section JSON.

Do NOT use:

Lorem ipsum

or generic replacement copy.

The actual copy affects:

- Line wrapping
- Height
- Balance
- Spacing
- Responsive behavior

Therefore real text must be present from the beginning.

Exception:

Content explicitly marked as placeholder must remain placeholder.

Example:

Testimonials that have not been verified must NOT be converted into
apparently real testimonials.

---

# 12. ASSET PLACEHOLDERS

Use supplied and approved image, icon and graphic assets directly.

When an intended visual asset has not been supplied, use a labeled neutral
placeholder. Do NOT search for or invent a final image.

Examples:

[ HERO WEBSITE ]

[ MOBILE PREVIEW ]

[ AI PROMPT ]

[ AI OUTPUT ]

[ STUDENT PHOTO ]

[ PROJECT SCREENSHOT ]

[ REFERENCE BOARD ]

[ DESIGN WORKSPACE ]

Each placeholder must preserve the intended:

- Width
- Height
- Aspect ratio
- Position
- Alignment
- Overlap
- Layering when applicable
- Desktop behavior

Do not use random stock photography simply to make an incomplete section look finished.

---

# 13. COMPLEX VISUALS AND APPROVED COMPOSITES

If the user supplies an approved final composite image, use that image directly
instead of rebuilding its internal visual objects as separate DOM layers.

When a composite has not been supplied and individual elements must be positioned
or animated independently, keep only those required elements as separate layers.

Example:

Hero composition:

MAIN BROWSER
+
AI PROMPT CARD
+
AI OUTPUT
+
MOBILE PREVIEW
+
DESIGN TOOLBAR
+
CURSOR
+
SELECTION BOX

Use the asset behavior defined by the current Section JSON and the user's latest
instruction. Do not add independent layers merely to simulate a final image.

---

# 14. ICON ASSETS

Use supplied icon artwork directly. If an icon asset is missing, use a simple
consistent placeholder that preserves its intended size and alignment.

Maintain:

- Icon size
- Alignment
- Gap
- Relationship to text

Do not substitute unrelated icon artwork or generic stock graphics.

---

# 15. DECORATIVE GRAPHICS

Use supplied approved decorative graphics directly. If a required graphic has
not been supplied, use a composition-preserving placeholder rather than creating
an invented final treatment.

Do not invent unapproved:

- Brush strokes
- Hand-drawn arrows
- Doodles
- Textures
- Stars
- Circles
- Decorative scribbles
- Complex annotation graphics

If a missing graphic materially affects composition, represent it with a simple
placeholder. Otherwise it may be omitted until the approved asset is available.

---

# 16. DO NOT REDESIGN THE REFERENCE

The user has already made the primary design decisions.

Do not treat implementation as an opportunity to redesign the section.

Do not:

- Replace a two-column layout with cards
- Center content that is intentionally asymmetric
- Change visual order
- Move important elements
- Simplify intentional overlaps
- Create a generic landing-page pattern
- Change the composition because another layout is easier to code

Match the intended reference composition first.

Refine second.

---

# 17. DO NOT ADD CONTENT

Never invent:

- Marketing claims
- Statistics
- Testimonials
- Student counts
- Project counts
- Awards
- Badges
- Discounts
- Scarcity
- Countdown timers
- Guarantees
- Features
- Pricing
- Locations
- FAQs
- CTAs

unless supplied by the user or project specification.

If content is missing:

Use a clearly labeled placeholder when required.

Do not fill the gap with invented marketing content.

---

# 18. DO NOT MODIFY APPROVED SECTIONS

Once the user approves a section, consider it LOCKED.

Example:

Section 01 approved.

While implementing Section 02:

DO NOT modify Section 01.

This includes avoiding unnecessary changes to:

- JSX
- CSS
- Layout
- Typography
- Spacing
- Assets
- Responsive behavior
- Animation

unless the user explicitly requests a global change.

---

# 19. SHARED COMPONENT EXCEPTION

Sometimes implementing a new section requires improving a shared component.

Examples:

- Button
- Container
- SectionLabel
- Typography primitive

Before changing a shared component, determine whether the change will alter
an approved section.

If yes:

Prefer a variant, prop, local style, or scoped implementation rather than
silently changing previously approved sections.

Do not introduce regressions into approved work.

---

# 20. REVISION RULE

When the user requests a revision:

Change only what is necessary.

Example:

User says:

"Make the visual bigger."

Do not simultaneously:

- Change headline size
- Change section spacing
- Change button
- Change colors
- Rebuild the grid

unless those changes are technically required.

Preserve approved decisions.

---

# 21. SURGICAL CHANGES

Prefer targeted changes over large rewrites.

Before editing:

Understand which component controls the requested behavior.

Then modify the smallest reasonable scope.

Avoid rebuilding an entire section to fix a small spacing or alignment issue.

---

# 22. DO NOT OVER-ENGINEER

Do not create unnecessary abstractions.

A component should be reusable when reuse genuinely exists.

Good candidates:

- Container
- SectionLabel
- Button
- ImagePlaceholder
- IconPlaceholder
- BrowserFrame
- TestimonialCard
- PricingCard

Avoid turning every small text group into a component.

Keep the codebase understandable.

---

# 23. SEMANTIC STRUCTURE

Use semantic HTML where appropriate.

Examples:

<header>
<nav>
<main>
<section>
<article>
<footer>

Use heading hierarchy correctly.

Avoid using `<div>` for everything.

UI structure should remain accessible and maintainable.

---

# 24. CSS / STYLING

Follow the styling approach already used by the project.

Do not introduce a second styling system unnecessarily.

If the project uses Tailwind:

Use Tailwind consistently.

If reusable values become repetitive:

Use tokens, variables, utilities, or shared components.

Do not scatter arbitrary values throughout the code.

---

# 25. DESIGN TOKENS

Use DESIGN_SYSTEM.md as the source of truth.

Do not invent new:

- Colors
- Spacing
- Font sizes
- Radius values
- Breakpoints
- Border styles

unless genuinely required by the section.

If a unique value is required to reproduce the reference composition,
it may be used locally when justified.

Do not convert every visual measurement into a global token.

---

# 26. RESPONSIVE IMPLEMENTATION ORDER

For each section:

STEP 1
Desktop composition

STEP 2
Review desktop structure

STEP 3
Tablet adaptation

STEP 4
Mobile adaptation

Do not blindly scale the desktop layout down.

Responsive design should reorganize the composition intelligently.

---

# 27. DESKTOP REFERENCE

Primary design reference viewport:

1440px

Main container:

1280px

The desktop implementation should be evaluated primarily at this width.

Do not optimize only for the developer's current browser width.

---

# 28. RESPONSIVE PRINCIPLES

Preserve:

- Content hierarchy
- Reading order
- Main visual
- CTA priority
- Section identity

Responsive layouts may:

- Stack columns
- Reorder visual/text blocks when specified
- Reduce decorative layers
- Simplify overlaps
- Enable horizontal scrolling
- Reduce visual complexity

Do not shrink complex UI until it becomes unreadable.

---

# 29. MOBILE IS NOT MINI DESKTOP

Do not create mobile by applying:

transform: scale(...)

to the entire desktop composition.

Mobile requires deliberate composition.

Examples:

Desktop:
5 / 7 columns

Mobile:
Text
↓
Visual

Desktop:
4 testimonial cards

Mobile:
1.1 cards

Desktop:
Complex overlapping browser composition

Mobile:
Simplified layered composition

---

# 30. OVERFLOW

Avoid accidental horizontal page overflow.

Intentional overflow is allowed for:

- Carousel
- Large editorial typography
- Decorative visual layers
- Mobile visual compositions

Intentional overflow must be controlled.

Do not globally apply `overflow-x-hidden` merely to hide layout bugs.

Find the source of unintended overflow first.

---

# 31. TYPOGRAPHY

Use the typography system from DESIGN_SYSTEM.md.

Primary font:

Noto Sans Thai

Body copy should remain visually lighter than headings.

Do not make normal body text unnecessarily bold.

Pay attention to Thai typography:

- Line height
- Line breaks
- Paragraph width
- Heading wrapping
- Visual density

Do not force English-centric line-height values if Thai text becomes cramped.

---

# 32. TEXT WRAPPING

Do not insert arbitrary `<br>` tags simply to force the screenshot's exact
line break unless the break is clearly intentional.

Prefer controlling:

- max-width
- font-size
- letter-spacing
- container width

Intentional editorial line breaks may use explicit breaks when necessary.

Mobile should be allowed to reflow naturally unless a specific break is
required.

---

# 33. VISUAL HIERARCHY

Every section should clearly communicate:

1. Section context
2. Main message
3. Supporting information
4. Main visual
5. Action, if one exists

Do not allow minor UI details to compete with the main headline.

---

# 34. WHITESPACE

Whitespace is intentional.

Do not fill empty areas simply because they look empty.

Do not reduce section height just to make more content visible above the fold.

Evaluate whitespace as part of the composition.

---

# 35. CARDS

Do not automatically put every content group inside a card.

This project uses an editorial/studio visual language.

Cards should be used only when they have structural meaning.

Avoid generic SaaS layouts such as:

Six identical floating cards
+
gradient icons
+
large shadows

unless explicitly specified.

---

# 36. COLOR

Use colors defined in DESIGN_SYSTEM.md.

Primary orange:

#FA5001

Do not introduce:

- Purple AI gradients
- Blue SaaS gradients
- Random accent colors
- Neon glows

unless explicitly requested.

Color should reinforce the 6CAT visual identity.

---

# 37. ANIMATION

Do not add complex animation by default during Direct Design.

After a section is visually approved, motion may be added in a later pass when
the user requests it.

Potential future motion:

- Scroll reveal
- Cursor movement
- Layer parallax
- Brush reveal
- Carousel interaction
- Hover states
- Browser UI motion

Motion must support the composition.

Do not animate everything simply because animation is possible.

---

# 38. GSAP / MOTION LIBRARIES

Do not introduce GSAP or another animation library unless the user specifically
requests motion or the project already requires it.

Animation architecture should be added only after the static design is approved.

Avoid coupling layout structure tightly to animation logic.

The layout should work correctly without animation.

---

# 39. ASSET HANDLING

When final assets are later supplied:

Use the supplied assets.

Do not recreate or modify branded assets without instruction.

Maintain:

- Correct aspect ratio
- Visual quality
- Intended crop
- Logo proportions

Do not distort images.

Do not stretch logos.

---

# 40. PERFORMANCE

Avoid unnecessarily expensive UI effects.

Optimize final images appropriately.

Prefer responsive images where supported.

Avoid excessive client-side JavaScript for static visual content.

Animation should not significantly degrade page performance.

---

# 41. ACCESSIBILITY

Interactive components must support:

- Keyboard interaction
- Visible focus
- Appropriate semantic roles
- Adequate target size

Images require appropriate alt handling.

Decorative images should not create unnecessary screen-reader noise.

Respect:

prefers-reduced-motion

when motion is eventually implemented.

---

# 42. VISUAL QA — REQUIRED

After implementing a section, perform a visual QA pass before considering
the task complete.

Use Taste Design during this review.

Check:

### Composition

- Does the overall composition match the reference?
- Is the visual center of gravity similar?
- Are major elements positioned correctly?
- Are relative sizes correct?

### Typography

- Is the headline visually dominant?
- Is body copy sufficiently light?
- Are Thai line breaks natural?
- Are text widths appropriate?

### Spacing

- Is whitespace intentional?
- Are gaps consistent?
- Is the section too compressed?
- Is it unnecessarily tall?

### Alignment

- Are columns aligned?
- Are text edges intentional?
- Are visual layers aligned correctly?
- Are buttons aligned with related content?

### Visual hierarchy

- Is it immediately obvious what to look at first?
- Are secondary elements appropriately quieter?
- Are decorative elements competing with content?

### Reference fidelity

- Did the implementation drift from the supplied reference?
- Did coding convenience accidentally change the design?

### Design System

- Are global tokens being followed?
- Are arbitrary values being introduced unnecessarily?

### Generic-design check

Ask:

"Does this look like the supplied creative reference,
or did it accidentally become a generic SaaS/course landing page?"

If generic:

Refine it while remaining inside the approved composition.

---

# 43. VISUAL QA FIX PERMISSION

During visual QA, Codex may automatically fix MINOR issues such as:

- Small alignment inconsistencies
- Minor spacing imbalance
- Minor typography balance
- Obvious unintended overflow
- Small responsive issues

Do NOT automatically make major changes such as:

- Changing grid structure
- Reordering content
- Changing composition
- Removing elements
- Adding new elements
- Changing major typography scale
- Changing section height dramatically

Major design changes require user approval.

---

# 44. BROWSER QA

After implementation, verify the section in the browser when the environment
allows it.

Do not rely only on reading JSX/CSS.

Check the rendered result.

Evaluate at minimum:

Desktop:
1440px

Tablet:
approximately 768–1024px

Mobile:
approximately 390px

The exact testing method may depend on the development environment.

---

# 45. ERROR CHECKING

Before completing a task:

Check for:

- Build errors
- TypeScript errors
- Runtime errors
- Console errors caused by the new work
- Broken imports
- Missing assets
- Invalid JSX
- Obvious responsive overflow

Do not claim completion while known implementation errors remain.

---

# 46. EXISTING PROJECT SAFETY

Before editing an existing codebase:

Inspect the relevant project structure first.

Understand:

- Framework
- Routing
- Styling
- Existing components
- Existing design tokens
- Dependencies

Do not replace the project architecture unnecessarily.

Do not install dependencies unless required.

Do not remove existing dependencies without explicit reason.

---

# 47. DO NOT TOUCH UNRELATED CODE

When implementing Section 03, for example:

Do not refactor unrelated:

- API logic
- Authentication
- Other pages
- Build configuration
- Database code
- Existing sections

Stay within task scope.

---

# 48. SECTION IDENTIFICATION

Each major section should have a stable identifier when appropriate.

Examples:

#hero
#problem
#why-6cat
#experience
#reviews
#pricing

Use sensible semantic naming.

Do not expose implementation-specific names unnecessarily.

---

# 49. NAVIGATION ANCHORS

Navigation links must point to sections that actually exist.

Do not create navigation links to nonexistent sections.

If the design reference contains an outdated navigation item,
follow the current approved site structure rather than blindly reproducing
the outdated item.

---

# 50. CONTENT ACCURACY

Do not silently reuse outdated content from reference screenshots.

Reference screenshots may contain visual placeholder or older copy.

Section JSON and current user instructions control the approved content.

Examples of values that must come from the current specification rather than
old screenshots include:

- Duration
- Pricing
- Section numbering
- Booking information
- Workshop format

Visual references are not automatically content truth.

---

# 51. PLACEHOLDER / UNVERIFIED CONTENT

If content is marked:

PLACEHOLDER
UNVERIFIED
TBD
NOT CONFIRMED

keep that status.

Do not turn it into a factual public-facing claim.

This is especially important for:

- Testimonials
- Student names
- Student photos
- Statistics
- Community claims
- Service areas
- Guarantees

---

# 52. COMMENTS

Use comments only when they improve maintainability.

Good:

// Mobile intentionally shows partial next testimonial card.

Bad:

// This is a div.
// This is a button.

Do not clutter the implementation with obvious comments.

---

# 53. COMPLETION REPORT

After completing a section, provide a concise implementation summary.

Report:

- Section implemented
- Main structure created
- Responsive status
- Placeholder assets used
- Any unresolved issue
- Any decision requiring user review

Do not write a long essay.

Example:

Implemented Section 02 — The Problem.

- Desktop design composition completed
- 5/7 content/visual composition implemented
- Supplied assets used; missing assets remain placeholders
- Responsive QA intentionally deferred for the desktop-first phase
- Section 01 was not modified

Ready for visual review.

---

# 54. STOP CONDITION

After implementing the requested section:

STOP.

Do not:

- Start the next section
- Add unrelated features
- Continue polishing another section
- Build the entire page
- Invent additional work

Wait for user feedback.

---

# 55. APPROVAL / LOCK PROTOCOL

When the user says a section is:

Approved
OK
ผ่าน
ล็อก
เอาแบบนี้
ใช้ตัวนี้

Treat the section as approved unless context clearly indicates otherwise.

Mark it conceptually as:

LOCKED

From that point onward:

Do not alter its design during work on another section.

If a later global change could affect a locked section,
minimize the impact and verify it.

---

# 56. IMPLEMENTATION LOOP

For every new section:

1. Read CODEX_RULES.md
2. Read DESIGN_SYSTEM.md
3. Read the requested Section JSON
4. Study the supplied reference image
5. Inspect existing implementation
6. Confirm the scope internally
7. Implement ONLY the requested section
8. Match the reference composition
9. Apply Design System
10. Use supplied assets and placeholders only for missing visual assets
11. Run visual QA with Taste Design
12. Check the desktop composition; defer responsive QA until requested
13. Check for implementation errors
14. Report what changed
15. STOP

---

# 57. REVISION LOOP

For revisions:

1. Read the user's requested changes carefully
2. Inspect the current section
3. Identify the smallest required change
4. Preserve everything already approved
5. Implement the revision
6. Run visual QA
7. Verify desktop visual impact; defer responsive impact review until requested
8. Report the change
9. STOP

---

# 58. DIRECT DESIGN PHASE

Start directly in the approved visual direction. Use final approved assets when
they are supplied, including a single composite image when that is the approved
Hero asset.

Use placeholders only for intended assets that are still missing. Do not wait
for a separate structure-only approval before applying the approved design treatment.

---

# 59. MOTION PHASE

Motion should happen after the static visual design is approved.

Potential implementation:

- Scroll animation
- Reveal
- Parallax
- Hover
- Carousel motion
- Cursor interaction
- UI micro-interaction

Motion must be layered onto the approved layout.

Do not redesign the layout around an animation unless explicitly requested.

---

# 60. RESPONSIVE QA - DEFERRED

The current phase is desktop-first. Verify the desktop composition only and do
not require tablet or mobile viewport testing until the user requests responsive
work.

Preserve responsive foundations already in the code, but do not modify approved
desktop composition solely to refine smaller viewports during this phase.

---

# 61. PROJECT DESIGN CHARACTER

The project must maintain this visual character:

CREATIVE EDUCATION
×
DESIGN STUDIO
×
EDITORIAL
×
REAL HANDS-ON WORKSHOP

The website should feel:

- Designed
- Intentional
- Modern
- Creative
- Practical
- Human
- Premium but accessible

It should NOT feel:

- Generic SaaS
- Generic AI startup
- Template marketplace
- Corporate LMS
- Dashboard
- Mass-market course funnel

---

# 62. FINAL RULE

REFERENCE FIRST.

STRUCTURE BEFORE DECORATION.

DESIGN SYSTEM BEFORE ARBITRARY VALUES.

TASTE DESIGN FOR REFINEMENT, NOT REDESIGN.

ONE SECTION AT A TIME.

APPROVED SECTIONS STAY LOCKED.

WHEN THE REQUESTED SECTION IS COMPLETE:

STOP.
