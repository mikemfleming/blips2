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
2. Push to `master`, or run **Deploy to GitHub Pages** from the Actions tab.

The workflow installs locked dependencies, builds the app, and publishes `dist/`
using the official Pages actions. If you rename the default branch, update the
workflow's `push.branches` value to match. Manual deployment must also run on the
default branch.

See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Stateless composition URLs

Open `/?c=dY2CgBDQwMDA4MDAwHiDbBEYA` to load a centered glider in the minor
pentatonic key. The query parameter comes before the router fragment (`#/`).
The pattern loads paused, with no history, and its initial snapshot is captured
on Play. No database or browser storage is used.

The `c` value begins with `d` for raw DEFLATE or `r` for uncompressed binary,
followed by unpadded Base64url. The binary format is exactly 129 bytes: 128 bytes
for the 32 × 32 grid, left to right and top to bottom, most significant bit first;
the final byte is `0` for major or `1` for minor. The encoder chooses compression
only when it shortens the payload. Malformed or oversized codes show an error
and leave the default empty grid available.

Press Space to toggle playback (Enter toggles the keyboard-selected square).
The seed/sprout button beside the key selector copies a share URL with the `c`
query parameter. Before first Play it shares the current grid and key; afterwards
it shares the composition's saved initial grid and key, even as playback evolves.
Clear the grid to begin a new composition.

The Conway organisms button opens a pattern palette (Glider, Blinker, Toad,
Beacon, Block, and Beehive). While paused, drag a card onto the grid to place it,
or select a card and click a square. A purple preview shows placement; patterns
near an edge shift to remain completely inside the board. Escape cancels a
selection. Standard pattern diagrams follow https://conwaylife.com/wiki/.
