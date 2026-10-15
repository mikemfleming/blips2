# blips

Blips of life is a generative audio experiment powered by React, Redux, and Tone.js.
The app runs entirely in the browser; no Express server or environment file is needed.

## Local development

Use Node.js 22 or later.

```sh
npm ci
npm start
```

Open http://localhost:8080. The development server rebuilds when source files change.

## Static build

```sh
npm run build
```

Deploy the contents of `dist/` to any static host. It contains `index.html`,
`bundle.js`, its source map, and `favicon.png`. Asset URLs are relative, so both
root sites and GitHub Pages project sites (such as `/blips/`) work.
Routes use hashes (`/#/about` or `/blips/#/about`) so links and refreshes work
without server rewrite rules. Existing `/about` bookmarks should use `#/about`.

## GitHub Pages

1. In the repository's **Settings → Pages → Build and deployment**, select
   **GitHub Actions** as the source.
2. Push to `master`, or run **Deploy to GitHub Pages** from the Actions tab with the `master` branch selected.

The workflow installs locked dependencies, builds the app, and publishes `dist/`
using the official Pages actions. If you rename the default branch, update the
workflow's `push.branches` value and deploy job branch condition to match.

See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Stateless composition URLs

Open `/?c=dY2CgBDQwMDA4MDAwHiDbBEYA` to load a centered glider in the minor
pentatonic key. The query parameter comes before the router fragment (`#/`).
The pattern loads paused, with no history, and its initial snapshot is captured
on Play. No database or browser storage is used.

The `c` value begins with `d` for raw DEFLATE or `r` for uncompressed binary,
followed by unpadded Base64url. The binary format is exactly 129 bytes: 128 bytes
for the 32 × 32 grid, left to right and top to bottom, most significant bit first;
byte 128 is `0` for major or `1` for minor. Lowercase `d`/`r` seeds use the
original 75 BPM. Uppercase `D`/`R` seeds contain 130 bytes, adding the BPM
(30–240) in byte 129. Prefixes `e` (DEFLATE) and `u` (raw) contain 131 bytes,
adding effect flags in byte 130: spatial=1, ping-pong=2, evolving filter=4,
chorus/phaser=8. Older formats load with all effects off. The encoder chooses compression
only when it shortens the payload. Malformed or oversized codes show an error
and leave the default empty grid available.

Press Space to toggle playback (Enter toggles the keyboard-selected square).
The seed/sprout button beside the key selector copies a share URL with the `c`
query parameter. Before first Play it shares the current grid and key; afterwards
it shares the composition's saved initial grid and key plus the currently selected BPM, even as playback evolves.
Clear the grid to begin a new composition.

The Conway organisms button opens a pattern palette (Glider, Blinker, Toad,
Beacon, Block, and Beehive). While paused, drag a card onto the grid to place it,
or select a card and click a square. A purple preview shows placement; patterns
near an edge shift to remain completely inside the board. Escape cancels a
selection. Standard pattern diagrams follow https://conwaylife.com/wiki/.

The speed button opens a tempo slider, numeric input, and presets. BPM counts
four sequencer steps per beat; speed changes apply during playback and survive
a share-link round trip.

Four audio-effect toggles add optional processing: spatial positioning across
sequencer columns, dotted-eighth-note ping-pong delay, a low-pass filter driven
by live-cell density, and a chorus/phaser combination. Settings travel in the
shared seed alongside BPM. Effect nodes are created on enable and disposed on
bypass, keeping the original synth and short echo as the default sound.

Organism orientation is shared across the palette and placement preview. Use the
rotation button or R for a clockwise quarter turn; Shift+R turns counterclockwise.
The angle remains selected between placements, and edge fitting uses the rotated
pattern dimensions. Rotation shortcuts ignore text inputs and playback.
Organism dragging uses pointer capture rather than native HTML drag-and-drop,
so R and Shift+R remain available while holding a pattern over the grid. The
preview rotates immediately, release places it, and Escape cancels the drag.
