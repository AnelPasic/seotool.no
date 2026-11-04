# CONTENT-01 — Én kilde per innholdsbit (nøytral MWS-standard)

Denne veiledningen bygger på **testet Oslo-pilot** [PR #56](https://github.com/AnelPasic/optimalisering.oslo.noV3.3/pull/56). Den er en **kort redaktørfasit for eksisterende Astro + native Pages CMS**, ikke et nytt innholdssystem. Overordnede regler for siderekkefølge/CRO og innholdskvalitet ligger fortsatt i `docs/PAGE-BUILDER-AND-CRO-BASELINE.md` og `docs/CONTENT-QUALITY-AND-VOICE.md` i systemrepoet.

| Du vil endre | Kilde i standardstarter | Hvem styrer plassering? |
| --- | --- | --- |
| SEO, Hero, egen seksjon, side-FAQ eller CTA | **Sider** → `src/content/pages/<side>.json`: `seo`, `hero`, `sections`, `faq` | Siden. Hero er eget toppfelt; seksjonslisten bestemmer resten. |
| En ordinær seksjon på flere sider | **Global Innhold → Egendefinerte seksjoner** → `src/content/global-content/<id>.json` | Hver side bruker `{ "_block": "sharedContent", "entry": "<id>" }`. Kilden eier teksten; siden eier plassering og synlighet. |
| Et fast felles element eller beskyttet funksjon | **Global Innhold → Beskyttede og faste elementer** → `src/content/global-masters.json` | Siden bruker `{ "_block": "global", "id": "<anker>", "element": "<master-nøkkel>" }`. Ikke kopier masterdata inn i sidefilen. |
| Godkjente case/evidens | Prosjektets godkjente casekilde (i demoen `src/content/proof-cases.json`) og beskyttet `global-masters.json`-proof | En plassering/utvelgelse er **ikke** bevis eller publiseringsgodkjenning. I nøytral starter er proof deaktivert. |
| Navigasjon, logo, farger, typografi og footer | **Globale Elementer** → `src/content/site-chrome/header.json`, `appearance.json`, `footer.json` | Hele nettstedet. Ikke kopier til `home.json`. |
| Språk og tone for **senere** redaksjonell redigering | **Språk og tone** → `coordination/CONTENT-TONE.json` + prosjektets `CONTENT-VOICE-PROFILE.md` | Redaktøren/agenten; endrer **ikke** publisert tekst automatisk. |

**Forskjellen mellom de to globale typene:** `sharedContent` peker til **én vanlig tekst-/kortseksjon** med eget filnavn/ID. `global` peker til en **fast master** for f.eks. tjenester, prosess, FAQ eller beskyttede priser, proof, kontakt og kalkulator. Dette er ikke utskiftbare CMS-redaktører. Global FAQ/master er heller ikke automatisk den samme som hver sides lokale `faq`.

**Pris-side ≠ pris-master:** `src/content/pages/priser.json` eier sidens forklaring, SEO og Hero. `global-masters.json.pricing` er den eneste masterautoriteten for et eventuelt felles kommersielt pristilbud. Den nøytrale demoen har `publicationApproved: false` og ingen reelle priser; ikke aktiver uten OWNER-beslutning.

## Standard verifisert på tre nøytrale sidetyper

- **Forside** `pages/home.json`: egen SEO/Hero/FAQ, lokal `introduksjon`, `sharedContent`-referanse til `felles-eksempel`, `global`-referanser til `process`/`faq` og PageList. Hver plassering er en referanse, ikke en ny master.
- **Tjeneste** `pages/tjeneste.json`: egen SEO/Hero/FAQ, lokal `innhold` og en `sharedContent`-referanse til **samme kilde**. Endre kildens tekst ett sted.
- **Artikkel** `pages/managed-articles/innsikt-artikkel.json`: egen SEO/Hero/`listing` og eventuelle lokale seksjoner/FAQ. En artikkel kan vises gjennom PageList uten at den blir duplisert som global seksjon.

**Redigeringsregel:** Finn hvem som eier teksten før du endrer den. Side-JSON eier **lokalt innhold og referansens plassering**, global-content eier **gjenbrukbar tekst**, global-masters eier **felles data/funksjoner**, site-chrome eier **rammeverket**, tonefilen er **redaksjonelt signal**. Bevar godkjente priser, proof, ID/anker, CTA-/form-identitet og eksisterende editorer. Ingen rå HTML/JS, parallell CMS, automatisk kopiering/promotering eller migrering av eierdata.

**Forskjell fra Oslo-piloten:** Oslo har åtte **separate** `global-elements/*.json` og separate evidensfiler `proof/*.json`. Starteren samler faste masterelementer i **én** `global-masters.json`. Det er en bevisst lagringsforskjell, men **samme redaksjonelle eierskapsmodell**. Vi innfører ikke en risikabel migrering bare for å få identiske filstier. Nye klienter skal aldri arve Oslo-tekster, kundelister, priser, merkevare eller bevis.
