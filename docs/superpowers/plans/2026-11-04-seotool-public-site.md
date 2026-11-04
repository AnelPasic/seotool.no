# SeoTool Public Product Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the public marketing and product website for SeoTool at `https://seotool.no` using the Medon Web System (MWS) integrated Astro starter and stock Pages CMS.

**Architecture:** Static Astro 5 site styled with Tailwind CSS and daisyUI, adhering to the Optimalisering Oslo design baseline. All customer-facing content is editable through stock Pages CMS (`.pages.yml`). Content collections manage pages and articles, while Pagefind generates local search. External navigation links cleanly route users to the authenticated app at `https://app.seotool.no`.

**Tech Stack:** Astro 7.3+, TypeScript, Tailwind CSS 4, daisyUI 5, Zod, Pagefind 1.5.2, Pages CMS.

---

### Task 1: Update Page Builder Schemas to Support External Login URLs in Hero CTAs

**Files:**
- Modify: `src/page-builder.ts:101`
- Modify: `.pages.yml:141,147`
- Test: `tests/integration.test.mjs`

- [ ] **Step 1: Update `cta` schema in `src/page-builder.ts`**

Change `href: internalHref` to `href: safeHref` in `cta`:
```typescript
const cta = z.object({ label: text, href: safeHref }).strict();
```

- [ ] **Step 2: Update regex pattern in `.pages.yml` for hero CTAs**

In `standardPageHero`:
Update `primaryCta.fields[1]` and `secondaryCta.fields[1]` to accept both root-relative internal links and HTTPS URLs:
```yaml
          - { name: href, label: Adresse (intern eller https), type: string, required: true, pattern: '^(/|https?://)' }
```

- [ ] **Step 3: Update `integration.test.mjs` assertions for dynamic page count**

In `tests/integration.test.mjs`:
Update the fixed 7-page check so it validates that all page slugs produce unique public paths, rather than asserting a fixed length of 7:
```javascript
test('one canonical page per actual route, no missing component', () => {
  assert.equal(new Set(pages.map(p=>publicPath(p.slug))).size,pages.length);
  assert.ok(pages.length >= 7, 'Starter includes base routes');
  assert.equal(pages.find(p=>p.slug==='home')?.kind,'home');
  assert.equal(pages.find(p=>p.slug==='404')?.kind,'utility');
  for(const path of ['src/components/BaseLayout.astro','src/components/PageView.astro','src/components/Hero.astro','src/components/SiteChromeHeader.astro','src/components/PageSections.astro']) assert.ok(existsSync(join(root,path)),path);
});
```
And update line 41:
```javascript
  const entries=cms.content.slice(3).filter(entry=>entry.type==='file');
  assert.equal(entries.length,5,'Five fixed pages protected; services/articles use separate native collections');
```

- [ ] **Step 4: Run unit tests to verify baseline passes**

Run: `npm test`
Expected: PASS (all tests pass)

- [ ] **Step 5: Commit changes**

```bash
git add src/page-builder.ts .pages.yml tests/integration.test.mjs
git commit -m "feat: allow external URLs in hero CTA and generalize page integration tests"
```

---

### Task 2: Create and Configure All Eight V1 Routes

**Files:**
- Modify: `src/content/pages/home.json`
- Create: `src/content/pages/seo.json`
- Create: `src/content/pages/ai-synlighet.json`
- Create: `src/content/pages/lokal-synlighet.json`
- Create: `src/content/pages/slik-fungerer-det.json`
- Create: `src/content/pages/gratis-analyse.json`
- Create: `src/content/pages/innsikt.json`
- Modify: `src/content/pages/kontakt.json`
- Test: `tests/integration.test.mjs`

- [ ] **Step 1: Configure `src/content/pages/home.json`**

Set:
- `slug`: `"home"`
- `seo.title`: `"SeoTool – Finn ut hva du bør gjøre først i søk og AI"`
- `seo.description`: `"SeoTool samler data fra nettstedet, Google og AI-tjenester for å gi deg konkrete, prioriterte tiltak for synlighet."`
- `hero.eyebrow`: `"Søkeinnsikt og handling"`
- `hero.title`: `"SeoTool forteller deg hva du bør gjøre først — og hvorfor."`
- `hero.support`: `"Tradisjonelle verktøy viser hva som skjedde. SeoTool analyserer tekniske feil, søkeintensjon og AI-synlighet for å prioritere dine neste tiltak."`
- `hero.primaryCta`: `{"label": "Analyser nettsiden", "href": "/gratis-analyse/"}`
- `hero.secondaryCta`: `{"label": "Logg inn", "href": "https://app.seotool.no"}`
- Core sections highlighting observation before scores, prioritized action, and clear evidence.

- [ ] **Step 2: Create `src/content/pages/seo.json`**

Set:
- `slug`: `"seo"`
- `kind`: `"service"`
- `seo.title`: `"SEO og organisk søk – SeoTool"`
- `seo.description`: `"Få oversikt over tekniske feil, søkeord, rangeringer og konkurrenter med SeoTool."`
- `hero.eyebrow`: `"Kjernesøk og analyse"`
- `hero.title`: `"Teknisk innsikt og søkemuligheter uten gjetting."`
- `hero.support`: `"SeoTool overvåker nettsidens helse, Search Console-ytelse og faktiske rangeringer for å avdekke hvilke optimaliseringer som gir størst effekt."`
- `hero.primaryCta`: `{"label": "Be om analyse", "href": "/gratis-analyse/"}`
- Sections covering: crawler, technical issues, Search Console integration, queries, rankings/SERP, competitors, search intent, and historical observations.

- [ ] **Step 3: Create `src/content/pages/ai-synlighet.json`**

Set:
- `slug`: `"ai-synlighet"`
- `kind`: `"service"`
- `seo.title`: `"AI-synlighet – Overvåk omtale i ChatGPT og Google AI"`
- `seo.description`: `"Spor hvordan merkevaren og nettstedet ditt siteres i ChatGPT, Google AI Overviews og AI Mode."`
- `hero.eyebrow`: `"AI-søk og kildebruk"`
- `hero.title`: `"Se hvordan kunstig intelligens omtaler og siterer nettstedet ditt."`
- `hero.support`: `"Kartlegg hvilke kilder og konkurrenter som trekkes frem i ChatGPT og Google AI Overviews, basert på observerte siteringer framfor spekulative poengsummer."`
- `hero.primaryCta`: `{"label": "Utforsk AI-synlighet", "href": "/gratis-analyse/"}`
- Sections strictly adhering to: ChatGPT, Google AI Mode, Google AI Overviews, mentions, citations, cited sources, competitors, and historical observations (no fake 'AI rank').

- [ ] **Step 4: Create `src/content/pages/lokal-synlighet.json`**

Set:
- `slug`: `"lokal-synlighet"`
- `kind`: `"service"`
- `seo.title`: `"Lokal synlighet – SeoTool (Under utvikling)"`
- `seo.description`: `"SeoTool utvikler støtte for lokal synlighet, Google Bedriftsprofil og lokale søk."`
- `hero.eyebrow`: `"Planlagt funksjonalitet"`
- `hero.title`: `"Lokal synlighet: Innsikt for bedrifter med fysisk tilstedeværelse."`
- `hero.support`: `"Vi bygger funksjoner for lokal rangering og bedriftsprofiler. Denne modulen er under aktiv utvikling og forventes lansert i kommende oppdateringer."`
- `hero.primaryCta`: `{"label": "Motta varsel ved lansering", "href": "/kontakt/"}`
- Sections clearly marking local visibility as coming / under development.

- [ ] **Step 5: Create `src/content/pages/slik-fungerer-det.json`**

Set:
- `slug`: `"slik-fungerer-det"`
- `kind`: `"service"`
- `seo.title`: `"Slik fungerer SeoTool – Fra data til handling"`
- `seo.description`: `"Lær hvordan SeoTool samler inn bevis, prioriterer tiltak og måler resultater over tid."`
- `hero.eyebrow`: `"Metode og arkitektur"`
- `hero.title`: `"Fra spredte datapunkter til en prioritert handlingsplan."`
- `hero.support`: `"Nettside + Google + søkemarked + AI gir bevisgrunnlag. SeoTool prioriterer oppgavene slik at du vet nøyaktig hva du skal gjennomføre."`
- `hero.primaryCta`: `{"label": "Start en analyse", "href": "/gratis-analyse/"}`
- Sections detailing: Datafangst (Nettsted + Google + Marked + AI) -> Bevis -> Prioritering -> Handling -> Måling.

- [ ] **Step 6: Create `src/content/pages/gratis-analyse.json`**

Set:
- `slug`: `"gratis-analyse"`
- `kind`: `"service"`
- `hero.family`: `"assessment"`
- `seo.title`: `"Gratis nettstedsanalyse – SeoTool"`
- `seo.description`: `"Be om en gjennomgang av nettstedets tekniske tilstand og søkepotensial."`
- `hero.eyebrow`: `"Vurdering"`
- `hero.title`: `"Få en gjennomgang av nettstedets synlighet."`
- `hero.support`: `"Legg inn nettadressen din for å få en innledende vurdering av tekniske flaskehalser og uutnyttet søkepotensial."`
- Sections providing clear assessment UX framing: URL, email, context, and clear next steps without simulating an instant fake audit.

- [ ] **Step 7: Create `src/content/pages/innsikt.json`**

Set:
- `slug`: `"innsikt"`
- `kind`: `"service"`
- `seo.title`: `"Innsikt og artikler – SeoTool"`
- `seo.description`: `"Faglige artikler om søkemotoroptimalisering, AI-synlighet og datadrevet forbedring."`
- `hero.eyebrow`: `"Kunnskapsbase"`
- `hero.title`: `"Innsikt om søk, kunstig intelligens og synlighet."`
- `hero.support`: `"Lær hvordan søkemotorene og AI-modellene henter informasjon, og hvordan du forbedrer nettsidens autoritet."`
- `sections`: includes `pageList` block with `source: "articles"` to dynamically show articles from `managed-articles`.

- [ ] **Step 8: Update `src/content/pages/kontakt.json`**

Set:
- `slug`: `"kontakt"`
- `kind`: `"contact"`
- `seo.title`: `"Kontakt oss – SeoTool"`
- `seo.description`: `"Ta kontakt for spørsmål om SeoTool, faglig rådgivning eller teknisk bistand."`
- `hero.eyebrow`: `"Kundestøtte og dialog"`
- `hero.title`: `"Hvordan kan vi hjelpe deg?"`
- `hero.support`: `"Ta kontakt for veiledning om verktøyet, hjelp med nettstedet eller spørsmål om våre tjenester."`
- Sections routing to: SEO/AIO-bistand, spørsmål om SeoTool, eller eksisterende kunder via `https://app.seotool.no`.

- [ ] **Step 9: Run tests to verify all routes validate**

Run: `npm test`
Expected: PASS

- [ ] **Step 10: Commit route pages**

```bash
git add src/content/pages/
git commit -m "feat: add all eight v1 content routes and assessment surface"
```

---

### Task 3: Configure Site Chrome (Header Navigation and Footer)

**Files:**
- Modify: `src/content/site-chrome/header.json`
- Modify: `src/content/site-chrome/footer.json`
- Test: `tests/integration.test.mjs`

- [ ] **Step 1: Configure `src/content/site-chrome/header.json`**

Update `navigation` to:
1. Dropdown `Produktet`:
   - `/seo/` (SEO)
   - `/ai-synlighet/` (AI-synlighet)
   - `/lokal-synlighet/` (Lokal synlighet)
   - `/slik-fungerer-det/` (Slik fungerer det)
2. Link `Innsikt` -> `/innsikt/`
3. Link `Gratis analyse` -> `/gratis-analyse/`
4. Primary CTA: `Logg inn` -> `https://app.seotool.no`

- [ ] **Step 2: Configure `src/content/site-chrome/footer.json`**

Update `footer.about` and `footer.groups`:
1. Group 1: `Produktet` (`/seo/`, `/ai-synlighet/`, `/lokal-synlighet/`, `/slik-fungerer-det/`)
2. Group 2: `Ressurser` (`/innsikt/`, `/gratis-analyse/`, `/kontakt/`)
3. Group 3: `SeoTool App` (`https://app.seotool.no`)
4. Legal links: standard neutral links.

- [ ] **Step 3: Run tests to verify navigation integrity**

Run: `npm test`
Expected: PASS (all navigation paths exist)

- [ ] **Step 4: Commit site chrome configuration**

```bash
git add src/content/site-chrome/header.json src/content/site-chrome/footer.json
git commit -m "feat: configure SeoTool navigation hierarchy and login CTA"
```

---

### Task 4: Configure SeoTool Content Voice & Tone

**Files:**
- Modify: `coordination/CONTENT-TONE.json`
- Modify: `coordination/CONTENT-VOICE-PROFILE.md`
- Modify: `coordination/AGENT-VOICE-INSTRUCTIONS.md`

- [ ] **Step 1: Set tone presets in `coordination/CONTENT-TONE.json`**

Configure `defaultPreset: "noktern"` with balanced commercial overrides, enforcing clear and technically credible copy.

- [ ] **Step 2: Update `coordination/CONTENT-VOICE-PROFILE.md`**

Define SeoTool-specific Voice rules:
- Norwegian first
- Observable facts before scores
- Distinction between observation and inference
- No SEO mythology or "AI-powered revolution" buzzwords
- No estimates presented as facts

- [ ] **Step 3: Update `coordination/AGENT-VOICE-INSTRUCTIONS.md`**

Incorporate SeoTool brand facts, product boundary with `app.seotool.no`, and the commercial value gate rules.

- [ ] **Step 4: Commit coordination voice files**

```bash
git add coordination/
git commit -m "docs: establish SeoTool content voice profile and tone guidelines"
```

---

### Task 5: Sync Pages CMS Options and Validate CMS Contract

**Files:**
- Modify: `.pages.yml` (if needed for collection exclusions)
- Run: `npm run sync:choices`
- Run: `npm run check:choices`

- [ ] **Step 1: Check `.pages.yml` collection exclusions**

Ensure `serviceGroup.exclude` in `.pages.yml` properly manages fixed vs dynamic service routes.

- [ ] **Step 2: Sync PageList choices**

Run: `npm run sync:choices`
Expected: "Updated canonical PageList page choices" (or current)

- [ ] **Step 3: Verify choices check passes**

Run: `npm run check:choices`
Expected: PASS

- [ ] **Step 4: Commit any synced changes**

```bash
git add .pages.yml
git commit -m "chore: sync Pages CMS page choices"
```

---

### Task 6: Cloudflare Preview Target Discovery and Documentation

**Files:**
- Modify: `coordination/PREVIEW-TARGET.md`

- [ ] **Step 1: Document Cloudflare Pages Git preview target**

Fill in `coordination/PREVIEW-TARGET.md` with:
- Project: `SeoTool`
- Repository: `https://github.com/AnelPasic/seotool.no.git` (branch: `main`)
- Target: Cloudflare Pages Git integration
- Build configuration: Build command `npm run build`, output directory `dist`, Node.js version `24.12.0`
- Clear instructions for connecting Cloudflare Pages to the GitHub repo.

- [ ] **Step 2: Commit target documentation**

```bash
git add coordination/PREVIEW-TARGET.md
git commit -m "docs: document Cloudflare Pages preview target for seotool.no"
```

---

### Task 7: Full Verification Suite and Git Push

**Files:**
- Run: `npm run verify`
- Test: Static route existence check in `dist/`
- Test: Pagefind search index verification
- Push to GitHub: `git push -u origin main`

- [ ] **Step 1: Run complete verification suite**

Run: `npm run verify`
Expected:
- `npm run check:choices` PASS
- `npm test` PASS
- `astro check` PASS (0 errors, 0 warnings)
- `astro build` PASS (all 8 static routes generated)
- `pagefind` index PASS

- [ ] **Step 2: Verify all 8 static routes are present in `dist/`**

Check:
- `dist/index.html` (`/`)
- `dist/seo/index.html` (`/seo/`)
- `dist/ai-synlighet/index.html` (`/ai-synlighet/`)
- `dist/lokal-synlighet/index.html` (`/lokal-synlighet/`)
- `dist/slik-fungerer-det/index.html` (`/slik-fungerer-det/`)
- `dist/gratis-analyse/index.html` (`/gratis-analyse/`)
- `dist/innsikt/index.html` (`/innsikt/`)
- `dist/kontakt/index.html` (`/kontakt/`)

- [ ] **Step 3: Push commits to GitHub repository**

Run: `git push -u origin main`
Expected: Commits pushed to `https://github.com/AnelPasic/seotool.no.git`
