# Design System Specification

## 1. Overview & Creative North Star: "Tactical Precision"
This design system is built for mission-critical clarity. Our Creative North Star is **Tactical Precision**—an aesthetic that mirrors high-end aerospace instrumentation blended with premium editorial layout. 

While standard safety applications often feel utilitarian and "boxy," this system breaks the template through intentional asymmetry and a "map-first" philosophy. We utilize sophisticated layering, glassmorphism, and high-contrast typography to ensure that even in high-stress navigation scenarios, the user feels a sense of calm authority. We move away from the "flat" web by treating the UI as a series of contextual overlays that float with purpose over a primary data layer.

---

## 2. Colors: The Palette of Authority
The foundation is built on deep, oceanic blues and architectural grays, providing a stable environment for high-visibility status indicators.

### The "No-Line" Rule
To maintain a premium, seamless feel, **1px solid borders are strictly prohibited for sectioning.** Do not use borders to separate a sidebar from a map or a header from a content area. Boundaries must be defined through:
*   **Tonal Shifts:** Placing a `surface-container-low` (#f3f3f6) section against a `surface` (#f9f9fc) background.
*   **Negative Space:** Utilizing the spacing scale to create clear mental models of separation.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of information. 
*   **Base Layer:** `surface` (#f9f9fc) for global backgrounds.
*   **Secondary Context:** `surface-container-low` (#f3f3f6) for sidebars or secondary navigation.
*   **Primary Focus:** `surface-container-lowest` (#ffffff) for the highest-priority cards and interactive modules to provide "natural lift."

### The "Glass & Gradient" Rule
For elements floating directly over the map (navigation prompts, search bars), use **Glassmorphism**:
*   **Background:** `surface` at 85% opacity.
*   **Effect:** `backdrop-blur: 12px`.
*   **Signature Gradient:** For main CTAs or "Emergency" states, apply a subtle linear gradient from `primary` (#003461) to `primary_container` (#004b87) at a 135-degree angle. This adds "visual soul" and depth that static hex codes cannot achieve.

---

## 3. Typography: Technical Legibility
We use a dual-typeface system to balance technical precision with human accessibility.

*   **Display & Headlines (Space Grotesk):** This geometric sans-serif provides a technical, almost "instrument-cluster" feel. Use `display-lg` through `headline-sm` for high-level data points and section titles. The slightly exaggerated apertures ensure readability at a glance.
*   **Body & Labels (Inter):** A workhorse for functional clarity. Use `body-md` for all instructional text. The neutral nature of Inter ensures that the "Technical" personality of Space Grotesk doesn't become overwhelming.

**Editorial Tip:** Use `label-sm` in all-caps with 5% letter spacing for metadata or non-interactive "status" tags to create a high-end, authoritative look.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a functional tool, not a decoration.

*   **The Layering Principle:** Instead of drop shadows, stack tiers. A `surface-container-lowest` (#ffffff) card sitting inside a `surface-container` (#eeeef0) well creates immediate hierarchy without visual clutter.
*   **Ambient Shadows:** If a floating element (like a map marker popover) requires a shadow, it must be "Ambient."
    *   **Blur:** 24px - 40px.
    *   **Opacity:** 6% of `on-surface` (#1a1c1e).
    *   **Offset:** Y-axis only (4px - 8px).
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a border (e.g., high-contrast mode), use `outline_variant` (#c2c6d1) at **20% opacity**. Never use 100% opaque borders.

---

## 5. Components: Precision Primitives

### Buttons
*   **Primary:** Uses the `primary` (#003461) fill with `on_primary` (#ffffff) text. Apply the `md` (0.375rem) roundedness scale.
*   **Secondary:** Use `secondary_container` (#cfe6f2) with `on_secondary_container` (#526772). This provides a lower-energy alternative that still feels "safety-certified."
*   **Emergency (Tertiary):** Use `tertiary` (#6e0009). This should be reserved for destructive or high-alert actions only.

### Cards & Lists
*   **Constraint:** **Never use divider lines.** 
*   **Execution:** Separate list items using a 4px vertical gap or by alternating background tones between `surface-container-low` and `surface-container`. 
*   **Interactions:** On hover, a card should transition from `surface-container-low` to `surface-container-lowest` to simulate "lifting" toward the user.

### Input Fields
*   **Style:** Minimalist. Use `surface_container_high` (#e8e8ea) as the fill. 
*   **Active State:** Instead of a thick border, use a 2px bottom-accent in `primary` (#003461) and a subtle `surface_tint` glow.
*   **Error State:** Use `error` (#ba1a1a) for the label and helper text. The input background shifts to `error_container` (#ffdad6).

### Navigation HUD (Map-Integrated)
*   Floating controls (Zoom, North-up, Layers) should use the `full` (9999px) roundedness scale to distinguish them from data-driven cards.
*   Use Glassmorphism (85% opacity + blur) to ensure the map remains visible underneath the controls.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. For example, a heavy data panel on the left balanced by a floating, minimal HUD on the right.
*   **Do** use `tertiary` (#6e0009) and `error` (#ba1a1a) sparingly. If everything is an emergency, nothing is.
*   **Do** rely on `title-lg` and `display-sm` to create a clear "Entry Point" for the user's eye on every screen.

### Don't:
*   **Don't** use 1px solid borders to define boxes. It breaks the "premium tactical" feel.
*   **Don't** use standard black (#000000) for text. Always use `on_surface` (#1a1c1e) to maintain tonal depth.
*   **Don't** use sharp 90-degree corners. Even the `sm` (0.125rem) radius is enough to make the "technical" look feel "accessible."
*   **Don't** use heavy "Drop Shadows." Use tonal layering first; if a shadow is needed, make it ambient and wide.