# Integrated MedonWebSystem Astro starter — MWS-052

**Exact Oslo blueprint (OWNER 2026-11-02):** new sites must have identical DOM, CSS and UI behavior; only font family and daisyUI Light/Dark theme variables may differ. The MWS-only visible demo warning has been removed; source/geometry parity remains OPEN in #87. **Do not promise 1:1 yet.**

**Typography editor is intentionally restricted to font family.** Text size, spacing, font weight, tracking, line-height and component geometry are fixed to the approved Oslo design. Other appearance adjustments belong only in the complete daisyUI Light/Dark theme blocks.

**Design/CTA source parity:** [OSLO-BLUEPRINT.md](OSLO-BLUEPRINT.md) describes required same-element daisyUI classes, the CMS CTA preset, the optional Lead Intake form shell, and the 1:1 areas still awaiting visual verification.

**Status (2026-10-28):** The full integrated starter is in **MedonWebSystem `main`**, squash-merged in [PR #18](https://github.com/AnelPasic/MedonWebSystem/pull/18). All checks passed, including 11 integration/export tests, Astro typecheck/build, Linux + Windows system source checks, and an independent **fictional SykkelLab Demo** Chrome/Git dry run. **Real authenticated Pages CMS edits in a separately connected GitHub repository, preview deployment and OWNER visual acceptance remain unverified.** This is ready for agent-assisted testing, not a live customer release.

## Preview-first: reuse existing Workers or Pages, otherwise provision once

**Discover before provisioning (#22).** On any requested customer project, first identify its GitHub repo, **actual Cloudflare Workers or Pages target**, the Git-triggered deploy pipeline and reachable URL. **Reuse any verified existing Workers/Pages preview.** Never create parallel Pages when a Worker already works. For a genuinely NEW project without a preview, first successful build can create its own GitHub repo, stock Pages CMS connection and **one** Git-integrated target (Pages for simple static Astro; Workers Builds Git where appropriate), with no second deployment permission. Record the selection in `coordination/PREVIEW-TARGET.md` and verify actual Git → Cloudflare deployment and real CMS save→Git→deploy→reopen. See [`PREVIEW-DEPLOY.md`](PREVIEW-DEPLOY.md) for separate Workers and Pages steps. **OWNER indexing decision (#25):** no global noindex in normal page code; preview indexing/protection is configured and verified in Cloudflare, not presumed. No new production DNS, paid resources, real leads or customer-site mutations without their own authorization. Local demo CI does not provision resources.

**MWS #87 — OWNER sticky parity (2026-11-02):** the full-width Site Chrome header matches Optimalisering Oslo: sticky at viewport `top: 0`, no top/side gap, outer margin, rounded frame or floating shadow, with theme `base-200` background. The inner navbar follows Oslo header widths and heights (101/86/78/74px at desktop/900/650/359 breakpoints). Independent SykkelLab Chrome checks desktop/mobile, Light/Dark, scroll stability, full-width rectangles, and CTA/menu hit targets. The earlier MWS #23 requirement for a visible/overridable sticky gap has been explicitly superseded; do not reintroduce `--mws-chrome-sticky-gap`. Existing customer deployments are not automatically updated by the starter change.

**MWS-024 — Search is ready by default, visibility is optional.** `npm install` includes pinned `pagefind@1.5.2`. Every ordinary `npm run build` executes Astro then Pagefind and validates `dist/pagefind/` and Norwegian index files, independently of whether the search icon is visible. The neutral Pages CMS `Toppmeny → Vis søk` checkbox defaults to off; changing **only this checkbox to På**, saving to Git and allowing the normal Cloudflare Git build is sufficient to enable the real search modal. No installation, manual command, API or separate setup. Only intended public HTML is opted into the **internal** index (`data-pagefind-body`); 404 and non-public technical routes must remain excluded. External indexing is managed by Cloudflare, not the app; internal Pagefind does not change that. `npm run dev` alone does not produce the postbuild assets; test with a normal build/preview. Existing `search.mode: link` continues to work.

## Included modules and optional installations

The integrated source already contains **Site Chrome**, **Page CMS**, **Page Builder** (ordered local/global sections, PageList and FAQ), and **Content Voice** (Pages CMS `Språk og tone`, `coordination/CONTENT-TONE.json`). Site Chrome, Page CMS and Page Builder have one maintained implementation here in `starter/astro`. Content Voice remains a separate editorial kit for justified integrations; do **not** re-install integrated modules for new Astro sites. `kits/lead-intake` remains available separately as an **opt-in READY_OUT_OF_BOX** kit for Codex-assisted Worker/D1/Resend/Access integration: exporting this starter does not install a functioning lead form or approve real submissions. An integrated runnable source and a signed-off live customer installation are different milestones.

## Run immediately from a MedonWebSystem clone

Requires Node >=24.12, npm.

```sh
cd starter/astro
npm install
npm run verify
npm run dev
```

The site contains seven neutral demo pages. Ordinary pages have no app-level noindex; the 404 remains excluded. Preview protection must be configured and verified in Cloudflare. No price promises, functioning lead intake, public search index, customer proof or actual sales forms are bundled.

## Create a standalone website root (recommended for Antigravity/Codex)

From the **MedonWebSystem repository root**:

```sh
node starter/astro/scripts/create-site.mjs --target ../mws-demo-test --brand "Testverksted Demo"
cd ../mws-demo-test
npm install
npm run verify
npm run dev
```

The exporter creates a **new directory** and refuses to overwrite anything. It copies all source/configuration to repository root, rewrites demo brand names in JSON and synchronizes Pages CMS PageList labels. It never pushes code, connects CMS or deploys. The resulting root includes `.pages.yml`, `AGENTS.md`, `package.json`, `src/` and `coordination/`.

An Antigravity or Codex run should read `AGENTS.md` in the exported project, verify the site at desktop/mobile widths and report build/test/screenshots. For optional isolated demo testing in the MedonWebSystem source repository (not bundled in exported sites), see [upstream test handoff](https://github.com/AnelPasic/MedonWebSystem/blob/main/starter/TEST-WITH-AGENT.md).

For minimal, optional Home/Service/Article starter examples (not another CMS or blueprint), see [`CONTENT-04-PAGE-PATTERNS.md`](CONTENT-04-PAGE-PATTERNS.md). New CMS interface labels should use English; existing labels remain unchanged.

The starter now matches Oslo: **Tjenester → Alle tjenester** and **Innsikt → Artikler** are separate native Create/Edit/Delete collections, each covering original and new pages. See [`CONTENT-06-ADD-DELETE-PAGES.md`](CONTENT-06-ADD-DELETE-PAGES.md). The six non-service demo pages remain protected. Deleting an existing service requires link and redirect checks.

## CMS architecture

- Stock Pages CMS: **one** `.pages.yml`, a readonly root URL-slug followed by SEO → single editable Hero → ordered content sections → FAQ → listing.
- Independent global editors for header, appearance and footer, with shared responsive Site Chrome.
- Native **Global Innhold** collection at `src/content/global-content/*.json`; pages select a stable `sharedContent` reference, never copy/promo GitHub Actions. Validate IDs/UUIDs, missing sources, collision and publication.
- Local and global rich content use a common shape: headings, paragraphs, cards, links, 1–3 column layouts, surfaces and alignment.
- Shared Hero has layout, optional first-sentence emphasis and proof cards. Proof **requires independent verified permission and approval**; none is turned on in demo.
- PageList, FAQ and Content Voice are installed; automatic `source: "pages"` now lists only `kind: service` (also usable for product landing pages). Articles and index pages remain manually selectable. Prices/proof/forms/calculators are protected, inert or approval-gated.

## Test and approval boundaries

`npm run verify`: validate synchronized CMS selects, unit/integration/export tests, Astro typecheck and the standard Pagefind-producing static build.

`npm run verify:second-brand`: on Linux with Google Chrome, run the isolated fictional SykkelLab root install, local Git content commit/reopen/revert, responsive Chromium preview assertions and source indexability/404 checks. [Last passing workflow](https://github.com/AnelPasic/MedonWebSystem/actions/runs/40614127585) demonstrates earlier 9-test baseline; PR #18's final CI includes the 11-test exporter as well.

Neither command proves an actual Pages CMS OAuth/login, native `reference` selection and authenticated GitHub commit, nor an independently deployed preview. For these, create a separate temporary GitHub repository from the exported site, connect it to Pages CMS and test create → select on two pages → save → reopen → edit → preview both → hide on one → revert. Review mobile/desktop visually before acceptance. Do not enable forms or launch without owner approval; ensure Cloudflare preview/production indexing settings are independently reviewed.

**Safety:** Do not copy any Optimalisering Oslo pilot content/brand/colors, real customer case, prices, Resend/D1/lead credentials, `sunset` theme, or production domains. Never call a local simulation a real CMS acceptance.

## Internal design-system QA

Every standard export includes `/design-system/`, `/design-system/global-elements/` and `/design-system/proof-list/`. These routes are noindex and excluded from Pagefind. They use fictional fixtures; contact/order forms cannot submit, and production Proof/Pricing/calculator activation remains separate.

The gallery reuses the shared components, including all five PageList layouts with optional 1/2/3-column CMS settings, and synchronizes its Light/Dark controls with the header. Do not replace it with a static imitation.

For upstream drift: `node scripts/check-design-system-source.mjs PATH_TO_PINNED_OSLO_APP`. Measured evidence and the disposable neutral reference adapter are in the [MWS #87 QA report](https://github.com/AnelPasic/MedonWebSystem/blob/main/docs/qa/issue-87/README.md). OWNER visual acceptance remains a separate gate.
