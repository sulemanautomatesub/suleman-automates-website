# Suleman Automates — Website

Premium static multi-page website for **Suleman Automates**, an AI voice assistant
for Dubai real estate brokerages. Brand direction: deep burgundy + warm ivory,
derived from the provided SA monogram.

Pages:

- `index.html` — Home: hero with 3D call-preview (illustrative transcript), how it
  works, use cases, interactive ROI calculator, demo CTA.
- `product.html` — Product: 3D floating phone preview (illustrative), call workflow
  with scroll-driven side-slide panels, captured data, scope table
  (included / subject to scope / custom-discuss), FAQ.
- `pricing.html` — Pricing: Starter AED 1,500 · Growth AED 2,500 · Scale AED 3,000,
  one-time setup AED 1,000, additional calls AED 15, scope notes.

All demo requests go to WhatsApp **+92 309 0196403** with a prefilled message, or
email **suleman.automates@sulemanautomate.site** (linked in every page's footer).
No Retell links are exposed anywhere on the site.

## Stack

No build step — plain HTML + CSS + vanilla JS, plus a small set of **locally
bundled animation libraries** (no CDN, nothing to install):

- `assets/js/vendor/gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`,
  `lenis.min.js` — GSAP 3.13 (free plugins included) + Lenis 1.3. These power the
  smoother motion layer: Lenis-driven smooth scrolling (wired through the GSAP
  ticker), ScrollTrigger-driven one-by-one side-slide panels (reversible on
  scroll-up), and SplitText character reveals on the hero headlines.
  Everything is guarded — if a vendor file is missing or fails, the site falls
  back to the original vanilla behaviour with no broken UI.

- `assets/css/style.css` — design tokens, components, responsive + reduced-motion rules
- `assets/js/global.js` — loading intro (~3.4s brand screen with a gold progress bar
  that slides away like a curtain, first visit per tab), header entrance on every
  page load (brand letters scatter, then converge), mobile menu, scroll-driven
  side-slide panels (steps / workflow nodes tied to scroll depth), 3D tilt on the
  preview scenes, and a custom headset-agent cursor (fine pointers only).
  Motion extras: a thin gold **scroll progress bar** at the top, a **particle
  field** behind each hero (gold dots + faint linking lines, pointer-reactive,
  pauses when the tab is hidden), a **scrub rail line** that grows above the
  steps / workflow grids, and a **pinned horizontal journey** section on the
  Product page (desktop only — panels pin and slide sideways as you scroll,
  headlines fill from dim ivory as they cross centre; stacks vertically on
  mobile and without GSAP). The premium layer also includes giant display
  typography with an animated gold-shimmer on section headings, a moving
  marquee ticker strip under each hero, an ambient cursor spotlight glow,
  and gold glow hovers on cards, panels and buttons.
- `assets/js/home.js` — call-preview transcript sequence, ROI calculator with
  paired number+slider controls, count-up results and flash pulses
- `assets/img/brand-monogram.png` — the provided brand image (cropped via CSS
  `object-fit`, never recoloured or redrawn)

## Run locally

Any static file server from this folder works:

```bash
# Python
python -m http.server 8000
# then open http://localhost:8000

# or Node
npx serve .
```

Opening `index.html` directly from the filesystem (double-click) also works,
though a server is recommended so fonts and relative paths behave normally.

Note: fonts load from Google Fonts (Fraunces + Inter). Offline, the site falls
back to system serif/sans stacks and stays fully usable.

## Deployment (later — not done yet)

1. Push this folder to a GitHub repository (e.g. `suleman-automates-website`).
2. In Vercel: **Add New Project → Import** the repo.
3. Settings:
   - Framework preset: **Other** (or "Static")
   - Build command: *(empty)*
   - Output directory: *(empty — repo root is the site)*
4. `vercel.json` enables clean URLs (`/product`, `/pricing`) and is the only
   config needed. No environment variables required. The vendor libraries in
   `assets/js/vendor/` ship with the repo — nothing is fetched from a CDN, so
   the deployed site needs no extra configuration.

## Content guardrails (already applied)

- Call preview and ROI results are labelled **illustrative** everywhere.
- No customer names, logos, statistics, testimonials or results are invented.
- WhatsApp handling and complex CRM work are marked **custom · discuss**, not live.
- Basic CRM integration is marked **subject to scope**.
- "Recommended" badge on Growth is an editorial marker, not a popularity claim.

## Known limitations

- The intro plays once per browser tab (sessionStorage). The header scatter-and-
  converge plays on every page load. Reduced-motion users skip all of it entirely
  (native cursor, no intro, panels always visible).
- How-it-works / workflow panels are scroll-driven: they slide in one by one as
  the user scrolls and slide back out when scrolling up. On narrow screens each
  panel activates on its own position instead of section progress.

- True device emulation (touch events, user-agent) isn't simulated; responsive
  layouts were verified at 390px / 800px / 1280px CSS widths.
- The ROI calculator does not model AED 15 extra-call charges, taxes or custom
  work — this is stated on the page by design.
- The 3D tilt activates only on desktop-sized screens with a fine pointer;
  touch and reduced-motion users get the static card (by design).
