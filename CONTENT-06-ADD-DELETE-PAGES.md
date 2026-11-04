# CONTENT-06 — Native Add / Delete pages

The integrated stock Pages CMS matches approved Oslo PR #61: **Tjenester → Alle tjenester** is one collection for the existing `tjeneste.json` and all new root services. The separate `New service pages` menu and duplicate fixed service editor are removed.

**Create:** Tjenester → Alle tjenester → Add an entry. Enter a valid unique lowercase `Page URL slug` such as `demo-service`. CMS writes `src/content/pages/demo-service.json` with URL `/demo-service/` and fixed `kind: service`. Complete SEO, Hero, sections and optional FAQ/listing. Root filename, slug and kind are validated at build.

**Edit or Delete:** The original service demo and all newly created services are deletable in this collection. Before deleting established pages, remove inbound links (navigation/CTA/PageList/global content) and plan redirects. The build reports dangling internal links but does not create redirects. Home, Pricing, Contact, About and 404 remain protected; the original article is deletable only through its separate article collection.

**Articles:** `Innsikt → Artikler` is now one native Create/Edit/Delete collection for both the original neutral example and new articles. The separate `New articles (Add / Delete)` menu and fixed article editor are gone. The original article is moved byte-identically to `managed-articles/innsikt-artikkel.json` and keeps URL `/innsikt/artikkel/`. Slug `innsikt/your-guide` maps to `managed-articles/innsikt-your-guide.json`. Delete also applies to the original article; remove inbound links and plan redirects before deleting.

**PageList:** Seven seeded page suggestions, including the nested example article, remain pinned and can be safely rebranded by the exporter. New services are automatically discovered in PageLists; use Manual URL to link them explicitly. CMS creates/deletes require no YAML sync. The legacy `managed-services` folder remains import-compatible but is not a new-service CMS editor. Existing customer sites are NOT migrated.

No draft/status process, new backend or extra credentials. Source and CI acceptance are distinct from a future authenticated CMS roundtrip on a newly exported site.
