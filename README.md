# nikcarlberg.com

Personal portfolio site for [Nik Carlberg](https://nikcarlberg.com) — cybersecurity graduate from Oregon Tech.

Live at **[nikcarlberg.com](https://nikcarlberg.com)** · Deployed via GitHub Pages

---

## Overview

A static portfolio with two modes:

- **Terminal** — xterm.js shell with commands (`whoami`, `projects`, `ls`, `help`)
- **Space** — 3D force-directed node graph of skills, projects, and links

## Tech

- [Astro](https://astro.build) (static output)
- [xterm.js](https://xtermjs.org) for the terminal (CDN)
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph) + [Three.js](https://threejs.org) for the space view
- Hosted on GitHub Pages with a custom domain

## Dev

```sh
npm install
npm run dev      # local dev server
npm run build    # build to dist/
npm run preview  # preview built site
```

> Requires Node v18+.

## Structure

```
src/pages/
  index.astro     landing page
  terminal.astro  terminal view
  space.astro     3D space graph
public/
  terminal.js     terminal logic
  styles.css      global styles
  CNAME           custom domain config
```
