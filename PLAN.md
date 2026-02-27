# Portfolio Rebuild Plan — Dual-Mode Site (Astro)

## Goal
Transform the current single-mode terminal site into a dual-mode portfolio that opens with a
choice screen. Visitor picks either:
- **Terminal** — existing xterm.js experience (ported as-is)
- **Space** — interactive 3D force-directed node graph of all portfolio content

Astro is already installed (`astro@^5.0.0`, `astro.config.mjs` present).

---

## Current State
- Plain HTML/CSS/JS (`index.html`, `styles.css`, `terminal.js`)
- No Astro `src/` directory yet — Astro is installed but not wired up
- Deployed via GitHub Pages, custom domain `nikcarlberg.com` (CNAME present)
- GitHub repo: `https://github.com/c1d3r24/Site`

### Content extracted from terminal.js (needed for space view nodes)
**About:** Cybersecurity grad (B.S.) from Oregon Tech, minor in Business. Focus on Network
Security and Ethical Hacking, penetration testing, firewalls, IDS, secure network design.

**Projects:**
1. Python IDS/IPS — "An IDS/IPS built entirely in python" — no URL yet (coming soon)
2. Terminal Styled Portfolio — https://github.com/c1d3r24/Site

**Social:**
- GitHub: https://github.com/c1d3r24
- LinkedIn: https://www.linkedin.com/in/nik-carlberg-148945355

**Commands (terminal):** help, whoami, ls, projects, blog, clear, echo

---

## Target Astro File Structure

```
src/
  pages/
    index.astro         ← Landing/choice page (NEW)
    terminal.astro      ← Terminal view (ported from index.html)
    space.astro         ← Space/graph view (NEW)
  layouts/
    Base.astro          ← Shared <head>, meta tags, fonts
public/
  terminal.js           ← Copied from root (unchanged)
  styles.css            ← Copied from root (unchanged)
  favicon.ico           ← if exists
CNAME                   ← stays at root (GitHub Pages needs it here)
```

No `src/components/` needed unless complexity grows.

---

## Step-by-Step Implementation

### Step 1 — Scaffold Astro src/ directory
- Create `src/layouts/Base.astro`
- Create `src/pages/index.astro` (placeholder)
- Create `src/pages/terminal.astro` (placeholder)
- Create `src/pages/space.astro` (placeholder)
- Move `terminal.js` and `styles.css` → `public/`
- Update `astro.config.mjs` (add `base`, verify `output: 'static'`)
- Test: `npm run dev` should serve at localhost

### Step 2 — Terminal page (`/terminal`)
Port `index.html` into `terminal.astro`. This is nearly a straight copy:
- Load xterm.js + xterm-addon-fit from CDN via `<script>` tags in `<head>`
- Load `/terminal.js` from public/
- Load `/styles.css`
- Mount `<div id="terminal-container">`
- No changes to `terminal.js` itself

### Step 3 — Landing page (`/`)
Full-screen dark background with two animated choice cards side by side.

**Visual design:**
- Background: `#0A0B12` (same as terminal theme)
- Centered headline: "Choose your experience" (subtle, monospace)
- Two cards:
  - Left: **Terminal** — shows a mini ASCII art preview, description "For the technically inclined"
  - Right: **Explore** — shows a mini animated node preview (CSS only), description "For everyone"
- Hover: card lifts, glows in its accent color
  - Terminal card: neon green glow (`#00FF6A`)
  - Space card: electric blue/cyan glow (`#00D1FF`)
- Click navigates to `/terminal` or `/space`
- Subtle animated star-field background (pure CSS or minimal canvas)

**No framework needed** — pure Astro + vanilla JS for the landing.

### Step 4 — Space/graph view (`/space`)
Interactive 3D force-directed graph.

**Library: `three.js` + custom D3 force simulation** OR **`3d-force-graph`** (vanilla JS, wraps Three.js)

Recommendation: **`3d-force-graph`** npm package
- Install: `npm install 3d-force-graph`
- Vanilla JS, no React needed
- Handles 3D node/link rendering, camera controls, click events
- Renders to a `<div>` just like xterm

**Node graph structure:**
```
[Nik Carlberg]  ←→  [About]
     ↕               ↕
[Projects]      [Skills]      [Contact]
     ↕               ↕
[Python IDS]  [Cybersecurity] [GitHub]
[Portfolio]   [Networking]    [LinkedIn]
              [Pen Testing]
```

Each node has:
- `id`, `name`, `group` (for color), `description`, `url?`

Clicking a node opens a side panel with details (or navigates to URL for social links).

**Color groups:**
- Core (Nik node): gold/yellow
- Projects: steel blue
- Skills: neon green
- Social/Contact: cyan

**Camera:** auto-rotate slowly until user interacts.

### Step 5 — GitHub Pages deployment
Two options:
1. **GitHub Actions** — add `.github/workflows/deploy.yml` that runs `npm run build` and deploys `dist/` to GitHub Pages. This is the standard Astro + GitHub Pages approach.
2. **Manual** — build locally, commit `dist/`, point Pages to that. Messier, not recommended.

**Recommended:** GitHub Actions workflow.
The `CNAME` file must be in `public/` (Astro copies it to `dist/` on build).

---

## Decisions / Open Questions

| # | Question | Decision |
|---|---|---|
| 1 | Space view library | `3d-force-graph` (vanilla, wraps Three.js) |
| 2 | Deployment method | GitHub Actions |
| 3 | Keep old index.html? | No — Astro takes over routing |
| 4 | Blog link | Keep as external link in both views |
| 5 | Mobile experience | Terminal: scrollable, Space: pinch-zoom supported by 3d-force-graph |

---

## Implementation Order (priority)
1. [ ] Scaffold Astro structure + move files
2. [ ] Terminal page working at `/terminal`
3. [ ] Landing page at `/`
4. [ ] Space view at `/space` with hardcoded node data
5. [ ] GitHub Actions deploy workflow
6. [ ] Polish: transitions, mobile, loading states

---

## Key Constraints
- `terminal.js` should NOT be rewritten — port as-is into `public/`
- No React/Vue/Svelte unless strictly needed (keep bundle small)
- Maintain existing terminal color scheme (`#0A0B12` bg, neon green, electric blue)
- CNAME must end up in `dist/` after build (put it in `public/CNAME`)
