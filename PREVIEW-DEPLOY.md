# MWS — preview-first: reuse existing Workers or Pages before provisioning

## Active rule — KONFLIKT-01 / #59 (2026-10-30)

**Discover → reuse → provision once.** For an existing site, keep its verified GitHub + Cloudflare **Workers or Pages** deployment; do not add a parallel Pages project. For an expressly requested **new** site with no target, provision exactly one Git-linked target after the first passing build (Pages for simple static Astro; Workers where required). Confirm actual deployed SHA and reachable URL.

**No global noindex in source or CMS.** OWNER manages indexing through Cloudflare, and **access/privacy is a separate control**. Do not call a preview `noindex`, private or production-published without checking the provider and HTTP behavior. A public preview may be indexed. Demo content must be fictional/public-safe until access is verified. Protected production resources, existing sites, DNS, indexing settings, paid services, leads and launch still require separate authorization. Follow the detailed verification steps below; source CI, deployment and authenticated CMS save→deploy→reopen are separate outcomes.

**Precedence:** This active policy overrides historical Pages-only/noindex text in root decisions and the immutable v3.4 process bundle. Do not rewrite that provenance bundle.

**OWNER policy, 2026-10-29 (Issue #22; indexing precedence: Issue #25).** One primary Git-connected Cloudflare preview target per customer site. **Discover first, provision second.** This applies to projects that already exist AND to requested new sites. Merely finding `wrangler.json`, a `*.workers.dev` URL or a GitHub Actions check does **not** prove Cloudflare Git integration or automatic deployment.

## 0. Mandatory read-only discovery — BEFORE any Cloudflare or repo creation

1. Establish **new vs existing** customer site, identify the authorized GitHub repository and current `main`, the working directory and `git remote -v`. Never create a second repo when the project already has one.
2. Inspect repository deploy evidence: `wrangler.json`/`wrangler.jsonc`/`wrangler.toml`, `package.json`, `.github/workflows`, and previous documented previews. Treat configuration as an **indication**, not proof of a live Cloudflare service.
3. In the **actual Cloudflare account**, inspect Workers & Pages for a service linked to this repo: **Workers vs Pages**, service/project name, Git remote, production/preview branch, root, build/deploy command, last deployment **commit SHA**, latest status, preview URL and automatic-deploy trigger. For Workers distinguish **Workers Builds Git integration** from GitHub Actions deploying with Wrangler. A CI `npm run build` success alone does NOT publish.
4. Check stock Pages CMS uses the same GitHub repository/branch and root `.pages.yml`; confirm how CMS saves trigger build. Record findings in `coordination/PREVIEW-TARGET.md` in the **customer repo**, after inspecting any existing record. Never overwrite valid recorded infrastructure or put credentials there.
5. If a working Git-connected target already exists, **reuse it**. If type, URL or Git/deploy link cannot be verified, leave deployment unchanged, continue local code work and request only the missing Cloudflare/permissions evidence. **Do not create Pages as a guess.** If duplicate targets exist, choose nothing new; report the conflict for OWNER decision.

## 1. Existing Cloudflare Workers target — KEEP Workers

- **Do not** create Pages or migrate the Worker. Retain its original `*.workers.dev` endpoint, Wrangler config, bindings, route, D1, Resend/secrets and existing CI/deployment arrangement. Do not change a customer repo or active deployments without its own authorization.
- **Workers Builds Git integration:** Cloudflare Worker → Settings → Build: verify actual repo/branch/root, build command (usually `npm run build`), deploy command (typically `npx wrangler deploy`) and optional non-production preview command (typically `npx wrangler versions upload`). Non-production preview versions are **not** the same as publishing main. Confirm generated URL and last build SHA in Cloudflare. Never assume GitHub status means published.
- **Existing GitHub Actions + Wrangler deploy:** inspect workflow for an actual authenticated `wrangler deploy` / `wrangler versions upload` action and trigger, not just tests. Confirm matching Cloudflare deployment/version/commit and URL. Preserve the working pipeline instead of layering a second one.
- For existing sites, verify **read-only** first: Git commit → actual Cloudflare build/deploy record → reachable **same** URL. With explicit OWNER scope for a safe content-only CMS test, save a reversible edit in Pages CMS → inspect Git commit → check automatic deploy SHA and URL → reopen → revert. Do not send test leads or touch production bindings.
- Workers static assets may use `wrangler.json` `assets.directory: "./dist"`; use the **project's** existing configuration, not Pages-specific `CF_PAGES_URL` assumptions.

## 2. No existing verified preview — create ONE Git-linked target for a new site

A specifically requested **new** customer website preauthorizes its own **new** GitHub repository, stock Pages CMS and a single Git-integrated preview after the first passing build, not a second permission prompt. Missing account authentication is a specific unblock request. **Do not create Cloudflare infrastructure if discovery is uncertain.**

1. Export the starter to the new project root using `scripts/create-site.mjs`. Run `npm install && npm run verify`; create/push a **new** repo only if one does not exist. Never copy client secrets, existing OWNER/CMS data, paid integrations, or the saved `sunset` Dark theme.
2. **Pages Git integration (default for a new static Astro project):** Cloudflare → Workers & Pages → **Pages → Connect to Git** → the repo. Astro: root `/`, build `npm run build`, output `dist`, Node `24.12.0` from `.node-version`/`NODE_VERSION`. `CF_PAGES_URL` may be used by this starter if `SITE_URL` is absent. Verify `*.pages.dev` and last deployed commit.
3. **Workers Builds Git integration (valid alternative where Workers runtime/bindings are needed):** choose **Workers**, connect GitHub repo, configure verified Wrangler assets/runtime and actual **build + deploy** commands, branch, root and preview behavior. Workers is not Pages: do not assume `CF_PAGES_URL` or `*.pages.dev`; set correct `SITE_URL` explicitly if needed. Validate any Wrangler configuration generated for the project before deploying.
4. **Pick only one** platform and record its product, repo, URL, pipeline and why it was chosen in `coordination/PREVIEW-TARGET.md`. Do not create both Pages and Workers for the same preview without a separately documented OWNER exception.
5. Avoid Pages Direct Upload/`wrangler pages deploy dist` when the intended long-term workflow is **Pages Git integration**: that upload-only Pages project cannot be converted to Git integration. Workers Wrangler deployment is a **different** product/workflow; do not ban it by conflating names.

## 3. Both products: separate verification and approval gates

- **Git source:** actual repo, branch and commit SHA.
- **Build:** successful compiled output, including Pagefind; not proof of upload.
- **Deploy:** Cloudflare dashboard/build or Wrangler deployment record with the same commit/version and a reachable URL; **only then** mark externally previewed.
- **CMS round-trip:** real authenticated Pages CMS create/edit → save to Git → triggered Cloudflare deploy → URL changed → CMS reopen → revert. Simulated Git fixtures do not prove this.
- **Indexing/security:** OWNER controls indexing at **Cloudflare** (Issue #25); ordinary pages do **not** set global HTML noindex, `_headers` X-Robots-Tag or `robots.txt` disallow. Verify actual provider settings/HTTP behavior; never describe a public preview as `noindex` based on code or assumption. **noindex is not access control**; sensitive/unfinished material needs approved access restrictions (e.g. Cloudflare Access), or use public-safe material only.
- **Separate approvals** remain for existing production-site mutations, DNS/custom domains, indexing changes, PII, paid resources, real lead collection, Resend/D1, ads/analytics, release and destructive migration. No repeat approval for routine newly authorized preview builds.

## Minimal delivery report

Give OWNER **one** preview URL, selected Cloudflare product, GitHub repo + SHA, build result, **deployment** proof, real CMS round-trip result, indexing/access status (verified vs unknown), and only blockers requiring OWNER action. Never claim OWNER visual acceptance from a CI check.

## Issue #22 release gate

Before adopting this as a fully accepted standard, test **an existing Workers project** and **a fresh Git-connected Pages project**, each with a real Git → Cloudflare deploy → URL check and real Pages CMS save/reopen. Tests or source inspection alone are not substitutes. Do not alter Sofiemyr Bil or create a second provider target merely to satisfy testing.

Official references:
- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Pages Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/
- Pages CMS: https://pagescms.org/docs/configuration/
