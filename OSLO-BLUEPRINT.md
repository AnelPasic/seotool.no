> **2026-11-02 OWNER OVERRIDE — SOURCE-COPY FIRST:** See [OSLO-FIRST-PHASE1.md](OSLO-FIRST-PHASE1.md). The former incremental parity slices below are historical notes; do NOT continue them as the implementation strategy. Do one controlled Oslo visual/CMS structure copy into the integrated starter, preserving neutral MWS data/integration functionality. Fase 3 daisyUI cleanup is forbidden before the customer pilot is accepted. Current starter is not yet a verified full copy.

# Optimalisering Oslo — component/class blueprint for new MWS Astro sites

**Authority:** the approved implementation in `AnelPasic/optimalisering.oslo.noV3.3` at the latest reviewed `main`, subject to deliberate OWNER overrides. MWS `starter/astro` is the *client-neutral implementation* of that visual and semantic blueprint.

## OWNER acceptance rule — EXACT BLÅKOPI (2026-11-02)

**No "approximately Oslo", class-name-only parity, MWS-only banners, separate layouts or styling interpretations.** A newly exported site must have the **same rendered markup, class names on matching nodes, all native daisyUI modifiers, CSS values for dimensions/spacing/radius/shadows, geometry, responsiveness and functionality** as approved Optimalisering Oslo. The **only allowed default design differences** are (a) selected font family and (b) the complete client-owned daisyUI Light/Dark theme variable blocks. Site content/identity, CMS data, services, pricing and legally verified proof remain independent. Current MWS is **NOT yet certified** as a 1:1 blueprint. No misleading completion claims.

**First corrective slice on PR:** removed the MWS-only "Teknisk demonstrasjon" stripe from all page templates (including exports), aligned the page shell `site-shell [data-ui-shell]`, imported Oslo's exact shared role typography snapshot and primitive dimensions, and aligned default Tailwind text/radius metrics with Oslo `main@0a81b0b8`; fonts stay neutral, palette uses daisyUI variables. The Pages CMS typography editor is now limited to font-family; independent type scale, weight, leading, tracking and custom Tailwind CSS overrides are intentionally rejected. Source regression tests pin these defaults. This fixes globally observable differences but **does NOT** port all Oslo component CSS or PageList/Pricing/Proof/Footer yet.

**Required implementation strategy:** adopt one-way source synchronization from the approved Oslo components/styles into integrated `starter/astro`; adapt only *data sourcing* to MWS's client-neutral Pages CMS models. Do not maintain visually separate MWS components once a corresponding Oslo component exists. Reuse the exact Oslo CSS/compositions, review conflicting MWS CSS and remove duplicates, not append overrides indefinitely. After each slice, test both rendered DOM and computed style (including pseudo-elements, focus, widths, mobile transitions) using equivalent neutral fixture data. Do not merge a "full parity" declaration until independent browser visual diffs are reviewed by OWNER. Existing client sites are never migrated by this instruction alone.

## Non-negotiable rule

Comparable elements must use the **same daisyUI/Tailwind class names on the same DOM elements** as Oslo. Reuse the source component structure and behaviors. Additional `mws-*` hooks may remain for actual reusable behavior or backwards compatibility, but **must not become an alternative visual design system**. Never call a shared color token alone “1:1 parity.” Visual geometry, breakpoints, keyboard operation, Light/Dark, forms and mobile behavior also matter.

Different projects supply their own theme values, typography tokens, names, images, content, proof permission, prices, legal copy and backend. **Do not copy the Oslo brand/colors, OWNER JSON, production forms, Resend/D1 settings or any customer's evidence.** Prefer daisyUI component primitives and semantic foreground/background pairs.

## Source-level CTA contract (initial implementation)

| Oslo element | Required MWS element and classes | Implemented |
| --- | --- | --- |
| Ordinary section | `<section class="content-section section-space home-section-{id} …">` | Yes in `RichContentSection.astro` (plus compatible `mws-rich-section` hook) |
| Section shell | `<div class="shell …">` | Yes (also `mws-main-shell`) |
| Heading group | `<div class="section-heading">` with eyebrow and `h2` | Yes |
| Paragraph container | `<div class="body-copy">` and existing column semantics | Yes |
| Items/card grid | `<div class="section-items">` and native `card card-border` cards | Yes |
| Links | `.section-links`, `.text-link`, CTA button `btn btn-primary` on `a` | Yes |
| CTA section surface | `bg-info text-info-content` on the **section**, not a legacy alias | Yes; `presentation: cta` in local/global CMS forces `info` |
| Lead assessment section | `<section class="assessment-section section-space bg-info text-info-content">` | Yes, opt-in `AssessmentSection.astro`; never auto-render a form |
| Lead form | `<form class="assessment-form card … text-base-content">` and `button form-submit btn btn-primary` | Lead Intake adapter/example updated; only installed on authorized sites |

**OWNER #87 supersedes the previous MWS #28 visual default:** Oslo's unselected `content-section` surface uses `var(--paper)` / daisyUI `base-100`, with canonical `section-space` spacing (90px desktop; Oslo responsive values on narrow screens). The former MWS default of a transparent, unpadded ordinary section is NOT an accepted visual override. Explicit CMS surface choices remain theme-semantic. Earlier source-class parity alone was not pixel-identical visual acceptance. Existing live customer sites are not automatically migrated by changing the starter.

## Issue #87 — Hero + FAQ source parity slice (PR)

Reviewed against Oslo `main@0a81b0b8`:

- **Hero:** native `commercial-hero` with semantic `home-hero shell` / `service-hero shell` / `inner-hero` families, `hero-container`, `hero place-items-start`, `hero-content hero-frame`, `page-hero-copy`, `hero-intro`, `hero-actions`, `hero-visual`, `hero-photo`, `hero-proof-result` and `hero-proof-support`. Existing MWS CMS source, H1 typography, image positioning and evidence gate are preserved. No customer copy imported.
- **FAQ:** `faq-section section-space`, `shell faq-grid`, `faq-list`, native `details.collapse.collapse-plus`, `summary.collapse-title`, `div.collapse-content`. Remains keyboard-operable and controlled by existing global/local FAQ data.
- **Compatibility:** Retained `mws-starter-hero`, `mws-main-shell` and `mws-faq` for existing source selectors; independent theme token values govern visual treatment. Source-level test: `tests/oslo-hero-faq-parity.test.mjs`.

**Limit:** source/DOM class parity is not the same as computed CSS or visual 1:1. Native Oslo CSS composition and client-specific layout/content are intentionally not copied. Real browser viewport screenshots, theme parity and OWNER approval are a later gate; no claim of end-to-end visual equivalence.

## Issue #87 — Header + Nav parity slice

The current MWS header keeps native editable Site Chrome content, the real Pagefind integration, theme controller, language targets, accessible disclosures and the OWNER-required flush, full-width Oslo sticky header. MWS now places approved Oslo class names on corresponding DOM elements without removing the functional `mws-*` selectors:

| Element | Oslo class contract in integrated MWS |
| --- | --- |
| Outer site header | `site-header` / optional `site-header--sticky` |
| Main toolbar | `shell header-inner navbar` |
| Brand link | `wordmark` |
| Desktop navigation | `desktop-nav`, `menu menu-horizontal` |
| Navigation item and trigger | `header-nav-item`, `header-nav-parent` |
| Disclosure button | `nav-disclosure btn btn-ghost btn-square` |
| Dropdown panel | `ul.header-submenu.menu.bg-base-100` (direct child, not a nested `div`) |
| Mega panel | `header-mega-menu bg-base-100`, `header-mega-inner shell`, `header-mega-columns`, `header-mega-links`, `header-mega-promo` |
| Actions and CTA | `header-actions`, `button button-small btn btn-sm` plus CMS color modifier |
| Mobile navigation | `menu-toggle`, `mobile-menu shell`, `menu w-full` |
| Search | `site-search-trigger--desktop` / `site-search-trigger--mobile` |
| Languages | `language-switch`, `language-switch__choice` with desktop/mobile variants |

Desktop/mobile cutoff is 901px/900px, with matching TypeScript matchMedia and CSS. A dedicated browser test asserts the boundary and absence of horizontal overflow at 901px. Source-regression tests guard class placement and native focus/ARIA interactions. Highlighted submenus retain `secondary`/`secondary-content` contrast in both themes.

**OWNER correction (2026-11-02):** The earlier sticky inset exception is REVOKED. The MWS sticky header must match Oslo: `position: sticky; top: 0`, full viewport width, no outer margin or side inset, no outer border-radius or floating shadow, and `base-200` theme background. Inner `header-inner navbar` heights follow Oslo's 101/86/78/74px breakpoints; previously approved independent header width/gutter tokens remain for the inner shell only. The Chrome regression measures both initial and scrolled rectangles at 390/768/1440px, including edge alignment and CTA/menu hit testing. The old MWS #23 top-gap rule is superseded; do not restore it. MWS retains its independently functional site-owned logo variants and search modes. Other full UI parity still requires direct Oslo visual comparison and OWNER approval.

## Issue #87 — PageList source port (new slice)

**Canonical Oslo source:** `optimalisering.oslo.noV3.3@0a81b0b8`, `app/src/components/PageList.astro`, `ListingVisual.astro`, `Arrow.astro`, `PackageFocusIcon.astro`, `styles/shared.css`, `styles/compositions/sections.css`, and original Phosphor SVG paths.

- The integrated MWS `PageList.astro` now renders the **same element structure and native daisyUI classes** for `cards` (Oslo's editorial `section-items > article.info-item`, deliberately *not* forced into new `card` boxes), `mediaCards` (native `card card-border bg-base-100`, `card-body`, `card-title`), `alternating` (responsive `listing-item` copy/visual orientation), `compact` (plain `page-list-row`) and `links` (native `text-link` and arrow). No alternative `mws-list-*` styling.
- The **complete PageList component `<style>` block is verbatim** from Oslo. `ListingVisual.astro`, `Arrow.astro`, `PackageFocusIcon.astro`, and the original Phosphor SVG path shapes are embedded inline rather than adding .svg files prohibited by MWS package safety; only the MWS visual type import changed. Preserved fallback icon for alternating, only in the presentation layer, and CMS-owned image positioning.
- The PageList section owns `content-section section-space` and `shell` directly: the previous extra `py-16 md:py-24` MWS wrapper has been removed. Exact source selector/value subsets from Oslo `shared.css` for base geometry plus `compositions/sections.css` support the list; the outer homepage section collection adopts `invite-home`.
- **No data migration:** MWS still owns page listing metadata, references, internal links and publishing permissions. Never bring in Oslo article titles, clients, metrics, imagery or production URLs.
- **Validation:** new static source/semantics tests and SykkelLab Chrome fixture for all five modes, including 1440/768/390px column counts, alternating reversal, icons, routes and responsive stacking. Each fixture exists in an isolated test checkout only and is not exported in customer projects.

- The Oslo `.shell` revealed a double-width wrapper around the MWS Hero. That redundant parent `.mws-main-shell` was removed; the Hero now owns the canonical Oslo `.shell` (maximum 1200px). Historical MWS expectations of 1360/1440px Hero width are superseded.\n\n- Oslo places `.shell` **inside** the full-width `inner-hero` for utility/article pages. MWS now matches this DOM placement on utility pages; browser checks assert both the full-bleed outer section and constrained inner shell.\n\n**Not full site parity:** The remaining Oslo global CSS/compositions and other MWS custom component renderers still require the same source-level port and cross-site visual comparison. This PageList slice is not a claim of full OWNER-approved pixel-level parity. The `MWS #26` legacy test demanding non-Oslo PageList cards was superseded because the approved Oslo implementation uses editorial info-item cards for `cards` and native daisyUI only for `mediaCards`.

## Remaining 1:1 blueprint acceptance

The following are **not yet certified 1:1**: Hero DOM/visual geometry, PageList media/card/alternating layouts, FAQ, sticky header/menus/search, pricing/order flow, proof cards and optional overrides, footer, all site-specific CTA placements and real Lead Intake installation. Compare source markup/class placement first, then rendered desktop/tablet/mobile at approximately 390/768/1440px in Light and Dark. Do not replace working custom interactions with inappropriate daisyUI-only markup (the interactive Oslo glossary popover is an example).

Do not mark full blueprint parity complete until each reusable component passes those checks in an independently exported, published site and the OWNER accepts the visual. The current MWS #14 authenticated CMS roundtrip remains separate.

## New site workflow

1. Export **integrated `starter/astro`**, do not rebuild old kits.
2. Choose the same Oslo component pattern for an equivalent section. For a regular content CTA set `Seksjonstype = CTA – Oslo-blåkopi` in Pages CMS; the section itself receives `bg-info text-info-content`, and links become `btn btn-primary`.
3. When an approved live enquiry form is needed, install the existing Lead Intake kit and place its real `LeadForm` in `AssessmentSection`'s named `form` slot. Never infer provider permission or auto-provision resources.
4. Check class parity on matching DOM nodes, computed colors and responsive/keyboard behavior. Confirm Git, CI, provider deployment and OWNER approval separately.
