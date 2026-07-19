# System Override — Visual Design

## Design direction

An intentionally unstable cyberpunk terminal interface: a secured mainframe prompt rendered through a damaged CRT. The composition is sparse and left-anchored inside a wide preview/export canvas, while the atmosphere comes from optical artifacts—phosphor bloom, chromatic aberration, scan texture, liquid distortion, and displaced echoes of the interface.

The experience should feel:

- technical, hostile, and slightly clandestine;
- mostly black and low contrast, with green as the active signal;
- crisp at the source but visibly degraded by the display layer;
- minimal in structure, maximal in atmosphere.

## Composition

- Use a black 1200 × 500 export canvas (`#000000`) and a responsive editor preview around it.
- Place one compact live interface toward the left side of the canvas and center it vertically.
- Keep the content hierarchy simple: large system label, two-line status message, then one primary action.
- Let the visual effects extend beyond the preview canvas while keeping the editor usable on small screens.
- Place the live scene above the background treatment at `z-index: 1`.
- Add two non-interactive optical copies behind/around the live scene. They are not additional content; they are display artifacts.
- Serialize the scene, effects, and user-provided text into a standalone SVG suitable for a README image.

## Typography

- Typeface: **Iosevka Etoile**, loaded in regular (`400`) and bold (`700`) weights.
- Presets: Iosevka Etoile, IBM Plex Mono, JetBrains Mono, Fira Code, and a system monospace stack.
- Fallback: `monospace`.
- Enable contextual ligatures with `font-variant-ligatures: contextual`.
- The system label is uppercase, underscore-separated, and oversized: `4.5rem`, zero default margin, with `20px` space below. Near-fit labels may reduce slightly to preserve one line; longer labels wrap between whole words.
- The status copy is a pale, translucent gray at `26px` with `1.5` line height and `35px` space below.
- The action label is uppercase, bold, and `24px`.
- Typography should remain monospaced and machine-like; avoid rounded, humanist, or decorative alternatives.

## Color palette

| Role | Value | Use |
| --- | --- | --- |
| Void | `#000000` | Page background and negative space |
| Phosphor green | `rgb(26, 124, 50)` / `#1a7c32` | Primary heading, button text, and border |
| Electric green | `rgba(0, 255, 65, …)` | Bloom, glow, hover state, and selection |
| Chrome gray | `rgba(224, 224, 224, 0.42)` | Secondary/status copy |
| Highlight white | `#ffffff` | Selected text and intensified glow |
| Red fringe | `rgba(255, 0, 0, …)` | Left-side chromatic split |
| Blue fringe | `rgba(0, 0, 255, …)` | Right-side chromatic split |
| Magenta haze | `rgba(255, 0, 90, …)` | Warm background distortion |
| Cyan haze | `rgba(0, 190, 255, …)` | Cool background distortion |

Green is the only solid accent. Red, blue, magenta, and cyan should appear as translucent optical errors rather than as normal UI colors.

## Display treatment

The CRT layer is part of the identity and should sit above the preview content as a pointer-transparent overlay.

1. Add a subtle preview-scoped haze using radial gradients centered near `47% 43%` and `54% 57%`. Apply light blur, saturation, contrast, `screen` blending, and approximately `0.22` opacity.
2. Add a second, slightly stronger distorted haze inset by roughly `-8%`. Use the liquid SVG filter, a small blur, `screen` blending, and approximately `0.18` opacity.
3. Apply a tiled screen-door pattern: alternating transparent and black squares, `4px × 4px`, with black at roughly `20%` opacity.
4. Divide the pattern into three perspective panels: a flat center panel from `20vw` to `80vw`, plus angled side panels rotated around the Y axis by `40deg` and `-40deg`.
5. Finish with a centered radial vignette, transparent through the middle and fading to black at about `30%` opacity around the edges.

The texture must remain subtle enough that the text stays readable. It should be felt before it is consciously noticed.

## Glitch and ghosting

The live heading uses a green glow plus hard red and blue offsets:

- green glow: approximately `0 0 10px`;
- red offset: `-8px`;
- blue offset: `8px`.

Create two visual echoes of the complete scene:

- **Near ghost:** translate approximately `+100px, +65px`, scale to `0.9`, use `0.3` opacity, `2px` blur, `hue-rotate(160deg)`, and `saturate(1.2)`.
- **Far ghost:** translate approximately `-400px, -350px`, scale to `2.5`, rotate around the X axis by `180deg`, mirror left-to-right with `scaleX(-1)`, use `0.4` opacity, `5px` blur, `hue-rotate(100deg)`, and `saturate(1.4)`.

Both ghosts use `mix-blend-mode: screen`, sit behind the live scene, ignore pointer input, and cannot be selected directly. Their exaggerated offsets should read as reflected or misregistered signal, not as a second interface.

## Primary action

The action button is a transparent, terminal-like control:

- `1px` phosphor-green border;
- `16px 32px` padding;
- green text with a restrained text glow;
- green outer and inset glow;
- inherited monospaced type and bold weight.

On hover or keyboard focus:

- add a translucent green fill;
- scale to `1.02` for a slight 3D pop;
- intensify the green glow;
- introduce hard red and blue border/text offsets;
- keep the background transparent enough for the CRT texture to show through.

The control should feel like a physical trigger on unstable equipment, not a conventional web button.

## Typing and cursor behavior

The preview can reveal either the system label or the status message one character at a time. Typing speed is configurable from the editor and the animation restarts when the selected text or typing settings change. The cursor is a separate setting: it can be hidden, shown as a solid block, or shown with a stepped blink whose cycle speed is configurable. The same optional reveal and cursor animation is serialized into the SVG; the completed text remains the fallback state for renderers that do not run SVG/CSS animation.

## Selection behavior

Selecting text in the live scene is an intentional part of the visual system. Use a green translucent selection background, white text, and a bright green glow. Mirror the same selection range onto both ghost scenes with the CSS Custom Highlight API so the optical copies remain synchronized with the source.

Ghost scenes should remain `user-select: none`; only the live scene participates in text selection.

## Implementation constraints

- Keep all visual overlays absolute to the preview and `pointer-events: none` so they never interfere with the editor.
- Preserve the stacking order: display overlays above everything, live scene above ghosts, ghosts above the black canvas.
- Use `font-display: swap` for the remote font and allow the monospace fallback to preserve the layout if the font cannot load.
- Respect `prefers-reduced-motion` in future iterations by reducing or disabling distortion, blur, and animated glitch movement if motion is introduced.
- The editor uses responsive type and a small-screen single-column layout; preview and generated SVG titles use a compact one-line fallback for near-fit labels and whole-word wrapping for longer input.

## SVG template

The generator accepts a system label, a newline-separated status message, an action label, and a separate initialized label for the clicked preview state. Empty fields remain empty in the preview and export; an empty action label also removes the visual button. Near-fit system labels shrink to remain on one line; longer labels wrap between words. The export contains:

- a black background, chromatic haze, screen-door pattern, and vignette;
- red/blue title offsets and phosphor-green glow;
- a static outlined action control;
- near and far ghost copies with inline turbulence, displacement, hue rotation, and blur filters; the far copy is horizontally mirrored without changing its distortion filter.
- optional CSS typing reveal and a configurable blinking cursor for the selected text layer.
- the selected font-family stack on the shared scene group; font files remain external rather than embedded.

The exported action is visual only. The initialized label is interactive-preview copy; interactivity belongs to the live editor preview, not to the README image.

## Content tone

Use terse, procedural, uppercase copy. Labels should resemble system identifiers (`SIGNAL_STATUS`); supporting text should describe an operation in progress; actions should be imperative (`START`). Avoid friendly marketing language, rounded UI metaphors, and explanatory paragraphs inside the interface.
