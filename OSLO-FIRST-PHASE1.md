# Issue #87 / Fase 1 — Oslo-first full kopi (arbeidskontrakt)

> **Arbeidsstatus: designsystemgalleri og målt eksport-QA implementert som kandidat; full fase 1 er IKKE OWNER-GODKJENT.**
> Dette er den låste kontrakten for én samlet kildeimport, ikke en påstand om at `starter/astro` allerede er en 1:1-kopi. Endelig aksept krever en fungerende eksport, kilde-/DOM-/CSS-paritet og OWNER-godkjenning.

## Kanoniske versjoner ved oppstart

- **Visuell kilde:** `AnelPasic/optimalisering.oslo.noV3.3` main `9719e4c439ef22b52ac74d868fa5d72b88a5d622`.
- **MWS før kopi:** `AnelPasic/MedonWebSystem` main `c50a28a1d376ad0026d466bd6d003daaa6bd513a`.
- Kopier fra kontrollert, pin'et source-SHA. Hvis OWNER har endret Oslo siden dette tidspunktet, verifiser nytt `main` og fryse et nytt kilde-SHA før kopiering. **Ikke reset, skriv over eller rediger Oslo** under fase 1.
- Mål: integrert `starter/astro`, ikke et parallelt `kit` eller et ekstra designbibliotek.

## Hva *kopieres* i samme implementeringsrunde

- Godkjente visuelle Astro-komponenter og deres reelle avhengigheter; nøyaktig markup, daisyUI/Tailwind-klasser på samme elementer, CSS/compositions/tokens, Breakpoints, pseudo-elementer og interaksjoner.
- Komplette **Pages CMS-kontrakten** fra Oslo (`.pages.yml`, alle relevante globale/lokale redaktørfelter, side- og seksjonsstruktur, herobilder, card/presentation-valg, FAQ, liste og relevante varianter). Flytt **strukturen**, ikke feltene med eierinnhold.
- Kun necessary data adapters slik at **Oslo UI er fasit** og MWS fortsatt eksporterer selvstendige nettsider. Adapteren skal aldri bli en alternativ visuell implementasjon.
- Inngangsoppsettet: agenten setter kundens data, logo, tema (hele daisyUI Light/Dark-blokker), font og tekniske innstillinger. Den får ikke velge eget utseende, egne standardblokker, egne CSS-regler eller endre spacing/typografi.

## Hva *ikke* kopieres

- Ekte Oslo-brand, logo, bilder, tekster, SEO-felter, priser/tilbud, ordre-/leaddata, proof/caser, domene, e-post, persondata, secrets, Resend-/D1-/Cloudflare-ressurser og produksjonsendepunkter. Sjekk både JSON, JS/TS, Astro, CSS og public assets for hardkodede Oslo-data.
- Oslo-spesifikk drift/konfig som aktiverer skjema eller bestilling uten kundespesifikk godkjenning. Ingen kunderepo eller live-deploy endres.
- Generell daisyUI-refaktorering av Oslo. Den er **fase 3 etter OWNER-test**.

## Eksisterende MWS-funksjoner som må bestå

1. `create-site.mjs`: trygt separat prosjekt, avviser eksisterende destinasjon, kopierer kun kundens nye starter uten kilde-/testhemmeligheter.
2. Pages CMS: native create/edit/delete for tjenester og artikler, redigering av beskyttede sider, globale innholdskilder og lokale ordnede seksjoner, referanser, gjenåpning og persistering.
3. Content Voice / `Språk og tone`, Site Chrome, Pagefind søk som bygges out of the box, Light/Dark theme controller.
4. Lead Intake forblir **opt-in** og korrekt isolert; ingen automatiske Worker/D1/Resend/Access-forsyninger eller aktiverte skjema.
5. Sikkerhet: innebygd URL-/innholdsvalidering, ingen utilsiktet indeksering av interne ruter, ingen kredential-lekkasje.

## Implementering (ingen trinnvis kosmetisk port)

1. Ta inventar og fryse Oslos kildefiler samt MWS-funksjonene som må beholdes.
2. Erstatt **hele det visuelle MWS-grunnlaget samlet** med Oslo-koden og nødvendige data-adaptere. **Fjern foreldet parallell MWS-styling og duplicate CSS** — ikke legg på lapp etter lapp.
3. Bygg en ny, kundenøytral Pages CMS-modell fra Oslos struktur med minimale **fiktive**, schema-gyldige fixtures; ikke bulk-kopier datainnhold.
4. Test eksport og begge systemene. Merk diff som designavvik, godkjent teknisk dataadapter eller spesifikk funksjonsbevaring.
5. Åpne Draft PR og la den være upublisert til alle fase-1-sjekker er grønne og OWNER har sett det nye designet. Ingen merge eller live-deploy bare fordi CI bygger.

## Akseptansekriterier — Fase 1

- [ ] En **nyeksportert** side bygger/indekserer med `npm run verify` og gir redigerbar Pages CMS-struktur.
- [ ] Med identiske **komplette tema-variabler, font og identiske fiktive fixtures** er toppmeny, Hero, seksjoner, kort, lenker/CTA, FAQ, PageList, footer og øvrige standardkomponenter like Oslo i DOM, native klasser, computed CSS og visuelle skjermbilder.
- [ ] Browser-paritet på minst 390, 768 og 1440 px, både Light og Dark, med fokus/keyboard, menynavigasjon og skrolling. Rapporter reelle avvik, ikke svake `includes('btn')`-tester.
- [ ] Ingen Oslo-eierdata i nyeksportert root eller build/HTML. Verifiser hardkodet innhold i kildekode i tillegg til `src/content`.
- [ ] MWS' create/edit/delete, global sources, Content Voice, Site Chrome, Pagefind, sikkerhet og valgfri Lead Intake er bevart.
- [ ] Ingen Oslo-/kunderepo, DNS eller produksjonsintegrasjon endret.
- [ ] **OWNER aksepterer fase 1 visuelt.** Neste trinn er **kundetest på Sofiemyr eller Misterting**, ikke daisyUI-vask ennå.

## Fasegrenser

Fase 2: OWNER bruker ny starter på **selvvalgt** Sofiemyr Bil eller Misterting.
Fase 3: **først etter bestått kundetest**, rydd standardkomponenter til daisyUI i Optimalisering Oslo (visuell paritet bevares).
Fase 4: Kopier på nytt fra vasket Oslo og **erstatt** tidligere visuell MWS-kopi fullt ut. Ikke lag flere override-lag.

Dette dokumentet er operativt for fase 1 og erstatter eldre #87-instruksjoner om å fortsette løse, manuelle delporter.
