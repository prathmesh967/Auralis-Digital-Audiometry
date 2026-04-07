# Design System: Digital Audiometry High-End Editorial Guidelines

## 1. Overview & Creative North Star
**Creative North Star: "The Sonic Architect"**

The design system for Digital Audiometry moves away from the clinical coldness of traditional medical software. Instead, it embraces a "Sonic Architect" philosophy—where data is treated as a premium, architectural element. We break the standard "dashboard" template by using intentional asymmetry, overlapping frosted surfaces, and dramatic typographic scales.

By leveraging **Glassmorphism** and **Tonal Layering**, we create an interface that feels like a precision instrument. The UI does not just sit on a screen; it breathes through animated sound-wave motifs and "living" gradients, establishing a sense of cutting-edge innovation and absolute professional trust.

---

## 2. Colors & Surface Soul
Our palette transitions from deep, atmospheric indigos to electric, glowing accents. This is not just a color choice; it is a hierarchy of light.

### Color Roles
- **Background (`#0a0e14`):** The "Infinite Void." This provides the high-contrast foundation for our glowing elements.
- **Primary Accent (`#96f8ff`):** Used for critical data points and active states. It mimics the glow of a medical laser.
- **Secondary Gradient (Electric Purple to Soft Rose):** Reserved for high-level health insights and "human" elements of the data.
- **Tertiary (`#5bb1ff`):** Used for informational accents and secondary data streams.

### The "No-Line" Rule
**Standard 1px solid borders are strictly prohibited for sectioning.** 
Visual boundaries must be defined through background color shifts or tonal transitions. To separate a sidebar from a main content area, use `surface-container-low` against a `background` base. Lines feel restrictive; tonal shifts feel expansive.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials:
1.  **Level 0 (Base):** `surface` or `background`.
2.  **Level 1 (Sections):** `surface-container-low`.
3.  **Level 2 (Cards):** `surface-container` or `surface-container-high`.
4.  **Level 3 (Interactive/Floating):** Glassmorphic overlays with `backdrop-filter: blur(20px)` and 15% opacity `surface-bright`.

### The "Glass & Gradient" Rule
CTAs and Hero elements must use the **Signature Gradient** (`#00F2FE` to `#4FACFE`). For secondary interactive elements, use Glassmorphism. A frosted glass card should use a semi-transparent `surface-variant` color to allow the "Sonic Architect" background motifs to bleed through, ensuring the UI feels integrated, not pasted.

---

## 3. Typography: The Editorial Voice
We use a high-contrast pairing of **Space Grotesk** for data/headlines and **Inter** for functional reading.

- **Display (Space Grotesk):** Large, bold, and authoritative. Use `display-lg` (3.5rem) for hearing test results or decibel levels to create a "Hero Data" moment.
- **Headlines (Space Grotesk):** Clear and technical. `headline-sm` (1.5rem) should feel like an entry in a scientific journal.
- **Body (Inter):** High-readability sans-serif. Use `body-md` (0.875rem) for patient notes and diagnostic descriptions.
- **Labels (Inter Bold):** Use `label-md` (0.75rem) in all-caps with 0.05em letter spacing for technical metadata to mimic a high-end hardware interface.

The hierarchy is intentional: Big data, clean instructions, and minute technical details.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to represent "height"; we use light and transparency.

### The Layering Principle
Achieve depth by stacking `surface-container` tiers. A `surface-container-highest` card should sit atop a `surface-container-low` background. This creates a soft, natural "lift" that mimics high-end paper or frosted glass.

### Ambient Shadows
For floating elements (Modals/Popovers), use **Ambient Shadows**.
- **Blur:** 40px - 60px.
- **Opacity:** 4% - 8%.
- **Color:** Use a tinted version of `on-surface` (deep indigo) rather than pure black to maintain the "medical glow."

### The "Ghost Border" Fallback
If an edge must be defined for accessibility, use a **Ghost Border**:
- **Token:** `outline-variant`
- **Opacity:** 15% maximum.
- **Weight:** 1px.
It should be felt, not seen.

---

## 5. Components & Interactions

### Buttons
- **Primary:** Full gradient (`#00F2FE` to `#4FACFE`) with a subtle `primary_container` outer glow on hover. No border.
- **Secondary (Glass):** Frosted glass effect with `surface-bright` at 10% opacity and a `Ghost Border`.
- **Tertiary:** Text-only using `primary` color, strictly for low-priority actions.

### Cards & Lists (The "Anti-Divider" Rule)
**Forbid the use of divider lines in lists.** 
To separate audiogram results or patient names, use a 12px vertical spacing shift or a subtle background toggle between `surface-container-low` and `surface-container`.

### Input Fields
Inputs should feel like "hollowed-out" sections of the UI.
- **Background:** `surface-container-lowest`.
- **Focus State:** A 1px glowing border using `primary` and a 4px outer "neon" blur.

### Signature Component: The Waveform Visualizer
A medical-tech app requires a "living" element. Use the **Secondary Gradient** for an animated sound-wave motif. The wave should be semi-transparent, sitting behind frosted glass cards to provide a sense of real-time diagnostic activity.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical layouts. Place a large `display-lg` metric off-center to create visual interest.
- **Do** lean into `backdrop-blur`. The more depth, the more premium the experience feels.
- **Do** use "Safe Space." Increase padding by 1.5x what you think is necessary to allow the medical data to "breathe."

### Don't
- **Don't** use pure black `#000000` for backgrounds. Use the charcoal/indigo `background` (`#0a0e14`) to maintain tonal depth.
- **Don't** use 100% opaque borders. They break the "Glassmorphism" illusion.
- **Don't** use standard "drop shadows" with 0 blur. This is a medical-tech tool, not a flat web-app.
- **Don't** crowd the interface. If the screen feels full, increase the container size or move content to a nested glass layer.

### Accessibility Note
While we prioritize a "Glass" aesthetic, ensure that all `on-surface` text on `primary` or `surface` containers maintains a 4.5:1 contrast ratio. Use the `primary-fixed` tokens for text that must remain legible over dark, complex glass backgrounds.