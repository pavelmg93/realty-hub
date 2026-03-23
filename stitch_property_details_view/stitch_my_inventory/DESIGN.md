# Design System Document: High-End Editorial Wealth Management

## 1. Overview & Creative North Star: "The Digital Curator"
This design system moves away from the "template-driven" look of traditional fintech and real estate platforms. Our Creative North Star is **The Digital Curator**. We aim to treat every screen like a high-end investment prospectus or a luxury architectural editorial. 

The aesthetic is defined by **intentional asymmetry**, where content isn't just placed on a grid, but choreographed to create a sense of bespoke craftsmanship. We use expansive white space (breathing room) not as a void, but as a premium asset. By layering sophisticated surfaces and utilizing high-contrast typography scales, we convey authority, transparency, and exclusivity.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
Our palette is rooted in deep navy (`primary: #001B43`) and accented by a refined gold-orange (`secondary: #8D4F00`). 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Traditional "boxes" make an interface look cheap and rigid. Boundaries must be defined solely through:
- **Background Color Shifts:** Placing a `surface-container-low` component on a `surface` background.
- **Tonal Transitions:** Using subtle shifts in the neutral scale to imply separation.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of heavy-weight fine paper.
- **Layer 0 (Base):** `surface` (#F9F9FC)
- **Layer 1 (Cards/Sections):** `surface-container-low` (#F3F3F7)
- **Layer 2 (Elevated Accents):** `surface-container-highest` (#E1E2E6) or `surface-container-lowest` (#FFFFFF) for high-contrast lift.

### The "Glass & Gradient" Rule
To move beyond a flat "out-of-the-box" feel:
- **Glassmorphism:** Use semi-transparent surface colors (e.g., `primary-container` at 80% opacity) with a `backdrop-blur` of 20px-40px for navigation bars and floating modals.
- **Signature Textures:** Apply subtle linear gradients (e.g., `primary` to `primary-container`) on Hero CTAs to provide a "soul" and professional polish that flat hex codes cannot achieve.

---

## 3. Typography: Authoritative Editorial
We utilize **Plus Jakarta Sans** as our primary voice. Its geometric yet warm character provides a modern, high-end feel.

- **Display (display-lg/md):** Used sparingly for hero headlines. Use `tight` letter-spacing (-0.02em) to create a high-fashion editorial look.
- **Headlines (headline-lg/md):** Define the narrative. These should always be `primary` or `on-background` to maintain maximum authority.
- **Body (body-lg/md):** Reserved for data and descriptions. Ensure line heights are generous (1.6x) to facilitate readability in complex investment documents.
- **Labels (label-md/sm):** Used for "Metadata" (e.g., Property ID, Yield %). Use `uppercase` with 0.05em letter-spacing to distinguish from body text.

---

## 4. Elevation & Depth: Tonal Layering
We reject traditional drop shadows. We convey hierarchy through **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift without a single pixel of shadow.
- **Ambient Shadows:** If a "floating" effect is mandatory, use an extra-diffused shadow: `box-shadow: 0 20px 50px rgba(0, 27, 67, 0.05)`. Notice the tint—we use a 5% opacity of our `primary` color, not black, to mimic natural light.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` at **15% opacity**. 100% opaque borders are strictly forbidden.
- **Integrated Backgrounds:** Use `backdrop-blur` on overlays to allow underlying property imagery or data to bleed through, making the layout feel integrated rather than "pasted on."

---

## 5. Components: Refined Primitives

### Buttons
- **Primary:** `primary` background with `on-primary` text. Use a subtle gradient and `xl` (0.75rem) roundedness.
- **Secondary:** `surface-container-highest` background. No border.
- **Tertiary (High-End Ghost):** No background. Text-only with an underline that appears on hover, utilizing the `secondary` color.

### Cards & Lists
- **Forbid Divider Lines:** Never use a horizontal line to separate list items. Use vertical white space (`spacing-6` or `spacing-8`) or a subtle alternating background shift between `surface` and `surface-container-low`.
- **Property Cards:** Use `surface-container-lowest` with a "Ghost Border" (15% opacity `outline-variant`).

### Input Fields
- **Styling:** Minimalist. Background should be `surface-container-low`. On focus, the background shifts to `surface-container-lowest` with a 1px `primary` bottom border only.
- **Error States:** Use `error` text, but keep the input background a very soft `error-container` (10% opacity) to avoid jarring the user.

### Signature Component: The "Investment Metric" Chip
For real estate yields and wealth growth percentages, use a `secondary-container` chip with `on-secondary-container` text. These should feel like "stamps of quality" on the page.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical layouts where text blocks are slightly offset from image containers.
- **Do** prioritize `Plus Jakarta Sans` for all numerical data; its high x-height makes financial figures look elegant.
- **Do** use `surface-dim` for footers to "ground" the page.
- **Do** incorporate the FIDT logo in the header with a minimum of `spacing-12` clear space around it.

### Don't
- **Don't** use 100% black (#000000). Use `on-surface` (#191C1E) for all "black" text.
- **Don't** use the `full` roundedness (pill shapes) for anything other than small status tags. High-end design favors the `xl` (0.75rem) or `lg` (0.5rem) scale for a more structural feel.
- **Don't** use standard "Blue" links. Use `primary` for navigation and `secondary` for calls to action.
- **Don't** crowd the interface. If you think it needs more features, it probably needs more white space.