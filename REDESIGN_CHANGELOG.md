# SolveIt frontend redesign — changelog

Date: 2026-10-28 · Scope: visual/UI only. No changes to APIs, services, routes, auth, permissions, business logic or backend.

## Identity
- New token system in `src/index.css` (`--sv-*`): Deep Burgundy, Coffee Bean (primary), Vert Sauge, Warm Taupe, Soft Beige, Almond, White, plus the 4 approved gradients. Burgundy/Coffee never share a gradient with Sage.
- Every legacy name (`--brand-*`, `--cream`, `--peach`, `--olive`, `--earth`, `--lp-*`, `--ak-*`, `--ud-*`, `--dm-*`, `--st-*`) now points at these tokens, so old peach, olive, copper and earth styling is gone. About 470 hardcoded colours were replaced.
- Typography: IBM Plex Sans Arabic (UI/body, Arabic + Latin), Newsreader (Latin display) and Noto Naskh Arabic (Arabic display) for headings. Heavy 800/900 weights were softened to 600/700.
- Logo: burgundy and almond versions of the wordmark and "S" mark were added (`*-burgundy.png`) and the favicon was recoloured. The original PNGs are kept unchanged.

## Light / Dark mode
- New `ThemeContext` with one shared preference (`solveit-theme`). It follows the system setting on first visit and applies `data-theme` on `<html>` before first paint (no flash).
- New `ThemeToggle` in the public navbar, auth screens and public expert profile. The dashboards keep their existing topbar button and Settings control, which now drive the same shared theme.
- Dark mode now also covers the Landing Page, auth screens and public pages. Before, only the dashboards had it.

## Pages
- **Landing:** editorial restyle of every section, including the serif hero headline, an arched photo with a hairline inset, a ruled 4-step strip, a hairline FAQ list, and Burgundy Elegance trust and CTA panels. Card hover-lift and floating animations were removed, and reduced-motion is respected.
- **Navbar / Footer / Locale switch:** translucent almond navbar, Coffee Bean buttons, Deep Burgundy footer.
- **Auth (user / expert / admin):** user panels use Burgundy Elegance, expert panels Sage Serenity with sage actions, and admin panels flat Deep Burgundy.
- **Legal, 404, public expert profile, route loader:** retokenised and set in the display serif.
- **Dashboards (all 3 workspaces, every subpage):** Deep Burgundy sidebar with an almond logo. Flat Coffee Bean primary buttons, refined inputs, steppers, switches and modals. Role mark: Taupe for user and admin, Sage for expert.
- Shared components (`BrandFeedback`, `TagInput`, demo switcher, walkthrough) were retokenised.

## Files
41 files: 4 new logo PNGs, `context/ThemeContext.jsx`, `components/ThemeToggle/`, 30 restyled CSS files and small JSX edits. The JSX edits do three things: add the toggle, make the shells read the shared theme, and make the logo theme-aware. The original ZIP is untouched.

## Verification
- Unit tests: 69/69 pass (same as before).
- Production build: passes.
- Lint: 267 problems vs 266 before, all pre-existing patterns. The +1 is `react-refresh/only-export-components` on `ThemeContext.jsx`, the same pattern as the existing `LocaleContext.jsx`.
- I opened all 59 dashboard routes plus the public and auth pages in light/dark and AR/EN with a mocked API. Runtime errors are identical to the original build (10, all on detail pages caused by empty mock data, plus the existing `invite is not defined` bug in `AdminDetail.jsx`).
- No horizontal overflow at 375px (AR/EN) on the pages checked.
- Contrast: body, muted and button text pass WCAG AA in both themes.

## Known / not changed
- `/privacy`, `/terms` and 404 content is Arabic-only and fixed RTL, as before.
- Existing bug (not touched, it's logic): `invite is not defined` in `features/adminDashboard/pages/team/AdminDetail.jsx`.
- An old per-workspace theme choice (`ecp-*-theme`) is no longer read. Everyone starts from the shared theme.
- Logo recolour is an automatic tonal remap of the existing artwork. A designer-made vector version is recommended for final brand use.

---

# Phase 2: Espresso / Olive identity (2026-10-30)

Scope: visual/UI only, as above. This phase replaces the Burgundy/Coffee/Sauge set described earlier in this file.

- **Palette:**
  - Espresso #2E1F1A, Mocha #5A4032, Olive Sage #6B765E, Taupe #A8907E, Soft Beige #DCCFC2, Ivory #F3ECE4 and White.
  - Dark theme base #17100D.
  - Gradients: Brown Elegance, Olive Calm and Beige Luxury only. Brown and Olive are never in one gradient.
- **Fonts:** only Plus Jakarta Sans (EN) and Cairo (AR). IBM Plex, Newsreader and Noto Naskh were removed.
- **Radius scale:** 6 / 8 / 12 / 16 / full.
- **Buttons:**
  - Primary buttons are Olive (`--sv-cta`).
  - Secondary buttons are light with an Espresso text and border (`--sv-secondary-border`).
  - Form controls use `--sv-control-border` (AA).
- **Dashboards:** light, with Espresso sidebars and a light-sage active item (`--sv-nav-active`).
- **Hero:**
  - New EN/AR copy, with "Clarity." / "بوضوح الرؤية." in Olive.
  - CTAs are "Find an Expert" (same route) and "Explore Services" (same anchor).
- **Tokens:**
  - Component CSS has no hardcoded hex colours left; all of them now use `--sv-*` tokens.
  - New constants: `--sv-sage-pale`, `--sv-ink-deep`, `--sv-on-dark-muted`, `--sv-on-dark-faint`.
  - New semantic tokens: `--sv-cta-on-dark(-hover)`, `--sv-on-cta-on-dark`, `--sv-nav-active`, `--sv-scrim`.
  - The legacy names `--sv-burgundy` / `--sv-coffee` stay as aliases of Espresso.
- **Brand assets:**
  - New Espresso logos `solveit-wordmark-espresso.png` and `solveit-mark-espresso.png`.
  - The light variants were renamed `*-light-beige.png`.
  - The old `*-burgundy.png` files were removed.
  - `favicon.png` and `favicon.svg` were redone: an Espresso mark with an Olive star on an Ivory tile.
- **Verification:** tests 69/69 pass, the production build passes, and ESLint reports the same total as the pre-Phase-2 baseline (1209 with all plugins installed). Light-mode screenshots before and after the token cleanup are pixel-identical.
- **Hero image:**
  - Replaced with the final approved photo, `src/assets/images/hero-final.webp`: the original 1672×941 resolution, optimised WebP at 136 KB (the source PNG was 2.1 MB).
  - The old `hero-team-hd.jpg` was removed.
  - The arch frame and its treatment are unchanged. Only `object-position` moved from 30% to 50%, so the crop centres on the standing expert and the seated client at every breakpoint.

## New logo (2026-10-30)
- **New files:** the two supplied transparent logos are `src/assets/images/solveit-logo-on-light.png` (Espresso lettering) and `solveit-logo-on-dark.png` (white lettering).
  - Only the empty transparent margin was trimmed. The artwork is untouched, at its original proportions, and stored at 270px high for sharp 2×/3× display and optimised to about 25 KB each.
- **Where it changed:** both Logo components, so the navbar, footer, auth screens, legal page and the three dashboard sidebars all pick it up.
- **Automatic selection:** Espresso lettering on light backgrounds and white lettering on dark ones (dark theme, footer, Espresso sidebars).
- **Collapsed sidebar and decorative seals:** these keep the existing "S" brand mark; no new mark was created.
- **Sizes:** navbar 38px (34px on mobile), sidebar 42px. Footer and auth sizes are unchanged.
- **Removed:** 13 old logo images that nothing referenced any more. `public/solveit-logo-transparent.png` was kept, because emails or external links may point at it.

---

# Phase 3: "Olive Grove at Dusk" identity (2026-11-03)

Scope: visual/UI only. No changes to APIs, services, routes, auth, permissions, copy or business logic. No JSX was changed.

## Palette (from the supplied board, nothing invented)
Warm Ivory #F3ECE4 · Sand Beige #DCCEC1 · Warm Taupe #A7907E · Olive Green #434F37 · Cocoa Brown #5A4033 · Espresso #2E1F1A.
The visible shift from Phase 2 is the olive: #6B765E (soft sage) → #434F37 (deep olive), which now carries every primary action at 7.9:1 contrast instead of ~4.8:1.

## Token system (`src/index.css`)
- **Two tonal ramps built in OKLCH** from the six anchors, so steps keep one hue and even perceived lightness:
  `--sv-earth-25…950` (Ivory → Sand → Taupe → Cocoa → Espresso) and `--sv-olive-50…950` (Olive Green = 700).
- **Semantic roles** redeclared for light and dark. Balance: ~65% Ivory/Sand paper, ~22% Espresso/Cocoa structure, ~8% Olive (the one decisive colour: primary CTA, "resolved", progress, focus), ~5% Taupe (hairlines, detail).
- **Dark theme "Espresso night"**: base #19110C, warm surfaces, pale-olive CTA (#B1C1A1 with #171D11 text).
- New tokens: `--sv-cta-fill(-hover)`, `--sv-cta-shadow`, `--sv-focus-halo`, `--sv-inverse-fill`, `--sv-nav-tab`, `--sv-on-nav-tab`, `--sv-grain`, `--sv-grad-espresso|olive|paper|sand|olive-bar|earth-bar`, `--sv-radius-xl`, `--sv-ease-out`.
- All legacy names (`--sv-burgundy`, `--sv-coffee`, `--sv-sage*`, `--sv-almond`, `--sv-beige`, `--sv-mocha`, `--sv-grad-burgundy|sage|almond|coffee`, `--brand-*`, `--ud-*` …) still resolve, now to the new values. Theme-dependent gradient aliases are declared on every `[data-theme]` element so they switch correctly inside the dashboard shell.

## Gradients — rebuilt
The old gradients crossed hues (Espresso → Beige at 160%, Olive → Ivory at 170%), which produced muddy mid-tones. New rules:
1. Each gradient stays inside **one hue family** (brown ramp or olive ramp).
2. Dark fields are **lamp-lit**: a soft radial light source over a short tonal linear base, instead of diagonal colour-to-colour washes.
3. Dark fields carry a fine **SVG grain** (`--sv-grain`) to prevent banding and add material warmth.
4. Thin bars (progress, match score, scroll progress, stepper) use `--sv-grad-olive-bar`.

## Signature element: the focal lens
Hairline concentric rings that converge on one point — the product's promise (many expert inputs → one clear decision) drawn as a pattern. Pure CSS (`repeating-radial-gradient` + mask), no images:
hero arch, "with your case" comparison card (centred on the case), context showcase, expert-invite hub, final CTA (rising from the bottom like dawn), auth brand panels (converging on the "S" watermark), dashboard welcome cards, and the 404 page (a lens with nothing at its centre).

## Components
- **Primary buttons** (landing, auth, dashboards, admin/expert legacy buttons, tour, 404): one olive CTA with a tonal fill, inner highlight and soft olive shadow. Admin/expert `is-primary` buttons were Espresso; they now match the rest of the product.
- **Dashboard sidebar**: lamp-lit Espresso column with grain; the active item is an **Ivory "paper tab"** with Espresso text and an Olive icon (clear wayfinding, 13.5:1).
- **Auth brand panels**: user = lamp-lit Espresso, expert = lamp-lit Olive, admin = quiet near-flat Espresso; olive check marks, softer glass list items.
- **Landing**: lamp-lit paper hero, rings behind the arch, olive scroll-progress line and dot under the active nav link, olive kicker strokes, dark-olive "with your case" card, olive match/progress bars, olive-core invite hub, dawn-lit final CTA, grained footer with an olive hairline.
- **Focus**: 2px olive outline (3.5:1 on Ivory) or olive halo on inputs.
- Native checkboxes/radios use the olive (`accent-color`); scrollbars are tinted.
- Favicon: the star was recoloured to the new Olive; dark `theme-color` → #19110C.

## Verification
- Unit tests: 69/69 pass.
- Contrast: 38 key text/control pairs checked in both themes, all pass WCAG AA (body 10.7:1, muted 5.4:1, CTA 7.9:1 light / 9.0:1 dark).
- Visual check of landing, auth (user/expert/admin), 404, legal and the three dashboards in light/dark and AR/EN at 1440px and 375px; no horizontal overflow at 375px.
- Fonts are unchanged (Plus Jakarta Sans + Cairo, as decided in Phase 2).

## Phase 3.1: one identity across light and dark (2026-11-03)
The first Phase 3 dark theme was near-black with a pale sage action colour, and its brand panels were re-drawn with different gradients from light mode (e.g. the final CTA card was Espresso in light but a washed Cocoa in dark). Rule now: **brand surfaces are theme-invariant; only the page around them changes.**
- **Identical in both themes:** the Espresso lamp panels (final CTA, footer, user/admin auth panels, public-profile hero, dashboard sidebar), the Olive lamp panels (expert auth panel, "with your case" card, invite hub), the Ivory "paper tab" active state, the Olive buttons (same fill; in dark an Olive hairline ring lets the edge read on brown) and the Ivory button on dark panels. Their gradients are defined once in `:root` and are no longer overridden for dark.
- **Dark page = deep Espresso** (`#251713`, one step below Espresso on the identity ramp) so the true Espresso panels still sit above it; cards climb toward Cocoa (`#32221D → #372721 → #3E2D26`); text Ivory/Sand; hairlines Taupe at the same alpha as light.
- **Page gradients use the same geometry in both themes** (light source top-end, olive glow bottom-start, same rings): Ivory/white light in light mode, Cocoa light in dark mode.
- Removed all dark-only one-off overrides that made components diverge (footer, admin auth panel, trust bar, invite panel, hero arch halo). The final CTA now carries the same soft elevation in both themes.
- Contrast for the dark set: body 11.3:1, muted 8.2:1, faint ≥4.9:1 on every surface, CTA text 6.3–7.4:1, focus 9.1:1. Tests 69/69; no horizontal overflow at 375px.

## Phase 3.2: sign-in / sign-up swap card with the "focal lens" transition (2026-11-03)
Files: `src/features/auth/components/AuthFrame/AuthFrame.jsx`, `src/features/auth/authKit.css`. Routes, forms, validation and auth logic are unchanged.
- **Layout:** every auth screen (user, expert, admin, recovery, verification) is now one floating card on a lamp-lit page with faint focal rings. The top bar (logo, account chip, theme, language, home) and the security note sit outside the card. The brand panel is a full-card layer drawn with `clip-path`, so its edge facing the form is a large curve (168px; 132px under 1100px) traced by a 3px rim (Olive on Espresso panels, Sand/Taupe on the expert Olive panel).
- **Swap:** sign-in keeps the form on the inline-start side and the panel on the end side; sign-up mirrors it. Moving between them (any link to the other side: the panel CTA, "Create an account", "Sign in", "Back to sign up", …) plays three beats:
  1. **Cover (560ms):** the panel closes over the whole card; the current form and panel copy go out of focus (fade + 8px blur).
  2. **Focus (160ms):** focal-lens rings spin in and converge on an Olive core carrying the "S" mark; the new route mounts underneath. Navigation is delayed only until the card is covered.
  3. **Reveal (~980ms):** the panel opens toward the other side with its curve flipped; the new form lines arrive one by one (58ms apart), then the panel copy.
  Back/forward navigation sweeps the panel straight across. Clicks during a swap are ignored.
- **Fallbacks:** reduced motion → instant navigation, no transitions. Under 920px the card is a single column, the panel steps aside and screens simply rise in (no horizontal overflow at 375px).
- In the half-card column, the two-up sign-up fields now stack (container query under 600px), so long hints no longer truncate.

## Phase 3.3: one card height for every auth screen (2026-11-04)
File: `src/features/auth/authKit.css`.
- **Problem:** sign-in fitted the viewport but sign-up was taller, so the swap resized the card and toggled the page scrollbar mid-transition (layout jump).
- **Fix:** on the split layout the card has one fixed height for every screen, `clamp(560px, 100svh − 150px, 800px)`, so the page never scrolls and nothing resizes during the swap. A screen taller than the card scrolls inside its own column, with a thin Taupe scrollbar, a stable scrollbar gutter, contained overscroll and soft 22px fades at the top and bottom. Content is centred when it fits and starts at the top when it does not, so it is never clipped.
- Sign-up rhythm tightened (14px between blocks, 12px between fields, 50px inputs), so at viewport heights of 900px and above both sign-in and sign-up fit without any scrolling.
- Under 920px (single column) the card keeps its natural height, as before.

## Phase 4 — "Evergreen Study" palette (v4)

New six-colour palette applied across the whole product (variant of v3.4):
Ink #071B18 · Deep #123C35 · Pine #286451 · Sage #638B72 · Mist #B8C8A7 · Cream #F4EAD8.

**Distribution** — ~62% Cream/Mist paper · ~24% Deep/Ink structure (headings, hero/footer/auth panels, sidebar) · ~9% Pine (primary actions, progress, "resolved", focus) · ~5% Sage (hairlines, icons, detail). Cream is the only warm note: paper in light, text on green panels.

**Dark mode** — page = Ink, cards one to three steps up, brand panels (Deep/Pine lamp gradients), Pine buttons and the Cream paper tab are identical to light; Mist replaces Pine wherever green is text/icon on Ink.

**What changed** — `src/index.css` (tokens rebuilt: brand constants, ramps, semantic roles, gradients; legacy names kept as aliases), hard-coded colours in `authKit.css`, `Landing.css`, `Footer.css`, `ui.css`, `AuthSuccessAlert.css`, `index.html`; logos/marks/favicon recoloured (`src/assets/images/*`, `public/favicon.*`, `public/solveit-logo-transparent.png`). No JSX changed.

**Checks** — all text/background token pairs ≥ 4.5:1 in both themes; unit tests 69/69.

---

# Phase 3: Deep Teal identity, approved logo and "Midnight Stage" hero (2026-11-12)

Scope: visual/UI only. No changes to APIs, services, routes, auth, permissions or business logic.

- **Palette:** Ink #05161A, Deep #072E33, Teal #0C7075, Cyan #0F969C, Sky #6DA5C0, Slate #294D61, plus Gold #D0A04E. Gold is used only for primary CTA buttons and warm accents in the UI, never in the logo or icon. All tokens live in `src/index.css` (`--sv-*`); legacy names still alias the new values. Component CSS has no old Espresso/Olive hex values left.
- **Approved logo:** the supplied "solveit" wordmark (teal ribbon "v", star over the "i", tagline) and the ribbon "S" symbol with the star. Background removed to transparent. For dark surfaces the lettering is recoloured to light and the teal parts are lifted.
  - `solveit-logo-on-light.webp`, `solveit-logo-on-dark.webp`, `solveit-mark-on-light.webp`, `solveit-mark-on-dark.webp` (lossless-alpha WebP, about 55 KB each). They replace the old PNGs `solveit-logo-on-*.png`, `solveit-mark-espresso.png` and `solveit-mark-light-beige.png`.
  - Both Logo components pick the right file from the theme, so the navbar, footer, auth screens, legal page, public expert profile and the three dashboard sidebars update together.
- **App icon / favicon:** the approved symbol on a deep-teal squircle tile. New `public/favicon-48.png`, `favicon.png` (192), `apple-touch-icon.png` (180), `icon-512.png` and `site.webmanifest`; `index.html` links them. `favicon.svg` was removed.
- **`public/solveit-logo-transparent.png`:** stacked lockup (symbol over wordmark) with the approved logo. Kept for emails and external links.
- **Landing hero ("Midnight Stage"):** one deep-teal rounded panel that looks the same in light and dark mode.
  - Copy, pill and CTAs on one side; the photo (large arch corner) with three glass cards (case steps, remote session, written offer) on the other; the four-point trust strip along the bottom edge of the panel.
  - `HeroSection.jsx` and `TrustBar.jsx` were rewritten and `TrustBar` now renders inside the hero (the standalone section was removed from `Landing.jsx`). The old "proof" list, the lens rings and the floating cards were removed.
  - Navbar: floating pill, 1240px wide, 18px radius.
  - Responsive: stacked at 1080px and below, the remote-session chip is hidden under 560px.
- **Public expert profile:** the plain "S" tile + text in its header is now the real logo component.
- **Verification:** tests 69/69 pass. The offline production bundle builds. All public, auth and dashboard routes were opened in light/dark and AR/EN, and the landing page at 1440, 820 and 390px. Runtime errors are the same as before (mock data only).

## Known
- The approved logo was supplied as a raster image, so edges can soften at very large sizes. A vector source is recommended for print.
- In Plus Jakarta Sans a capital "I" looks like "l", so the written name "SolveIt" in small UI copy can read as "Solvelt". The logo itself is unaffected.
