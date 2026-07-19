# Terminal Studio

Terminal Studio is a dependency-free generator for README graphics in the style of a damaged cyberpunk CRT terminal.

## Style summary

The visual language is sparse, technical, and hostile: a black void, phosphor-green monospace typography, pale chrome status text, and a single outlined terminal action. The signal is made unstable with red/blue chromatic offsets, green bloom, magenta/cyan haze, a subtle 4px screen-door texture, vignette, and two displaced optical echoes behind the live scene.

The starter copy is intentionally plain: `SIGNAL_STATUS`, `Reading configuration...`, `Awaiting input.`, and `START`. Replace it with your own text when the generator opens.

The ghosts are display artifacts rather than extra content. They are non-interactive, tinted, blurred, distorted, and layered below the readable source scene. The exported SVG keeps the same hierarchy and effects as a static README-friendly composition.

## Generate an SVG

Open [`index.html`](./index.html) in a browser. Enter:

- a system label; near-fit labels stay on one line at a smaller size, while longer labels wrap between words;
- a status message, with line breaks for multiple lines;
- an action label;
- an initialized label, shown in the live preview after pressing its button.
- a font family from the included monospace presets.

The **Typing effect** controls let you enable the reveal, choose whether it types the system label or status message, and adjust the speed. **Cursor** controls independently toggle the cursor, its blinking, and the blink cycle speed. These settings affect the live preview and are included in the exported SVG when the renderer supports SVG/CSS animation.

Font presets load from the editor stylesheet when online and keep a system-monospace fallback. The chosen family is written into the SVG, but the font itself is not embedded.

The preview updates as you type. Clearing a field clears that corresponding text layer (and an empty action label removes the visual button). Use **COPY SVG** to place the complete asset on the clipboard, or **DOWNLOAD SVG** to save `terminal-signal.svg`.

Add the downloaded file to a repository and reference it from a README:

```md
![Terminal signal](./terminal-signal.svg)
```

The generated SVG is self-contained: filters, gradients, ghost layers, screen texture, text, and optional typing/cursor effects are embedded in the file. The button is intentionally visual only because README images are static; its initialized label is used by the interactive preview state. If a README renderer disables animation, the SVG still falls back to the complete text.

## Project files

- [`index.html`](./index.html) — generator interface and live preview.
- [`style.css`](./style.css) — CRT editor chrome and preview treatment.
- [`app.js`](./app.js) — text binding, typing/cursor state, SVG serialization, copy/download actions, and preview interaction.
- [`design.md`](./design.md) — the detailed visual specification.

The app has no build step or runtime dependencies. The editor loads Iosevka Etoile remotely, while exported SVGs use a system monospace stack so they remain portable.
