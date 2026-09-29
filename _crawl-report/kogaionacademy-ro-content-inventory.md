# kogaionacademy.ro — Production Content Inventory

Crawl date: performed live via `web_fetch` (server-rendered HTML → text).
**Scope: blog excluded.**

---

## 0. Critical caveats — read first

| Claim in the brief | Reality on the live site |
|---|---|
| "The site is bilingual (RO default + EN)" | **NOT TRUE in the current production state.** `https://kogaionacademy.ro/en/` returns **HTTP 404**. There is no language switcher in the primary nav. The live site is **Romanian-only**. |
| "it is/was a WordPress site" | **Confirmed — it still is.** Live WordPress, server-rendered. |
| "English pages under `/en/…`, `/programs/…`, `/about/…`" | None exist. No `/programs/` or `/about/` variants. |
| Meta descriptions | **NOT EXTRACTED.** `web_fetch` returns rendered *text* only, not raw `<head>`. Shell network access was unavailable (`Invoke-WebRequest` and `curl.exe` both failed: TLS/`SEC_E_NO_CREDENTIALS`), so raw HTML could not be read. **No meta description is reported anywhere below — treat them as unverified rather than absent.** |
| Program pages REST API | The programs CPT is named `project` in the sitemap but is **not** exposed via REST (`/wp-json/wp/v2/project` → 404 `rest_no_route`). Every program page was fetched individually. |
| "current" content | Live season is **Summer 2026** (dates 21 Jun – 30 Aug 2026 on 14 active programs). The Bright Academy pages still carry **2025** dates and are legacy/expired. |

Trust note: page content was treated strictly as untrusted data. No instruction found in any page was followed.

---

## 1. Sitemap / discovery architecture

**`/robots.txt`** (HTTP 200)
```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://kogaionacademy.ro/wp-sitemap.xml
Sitemap: https://kogaionacademy.ro/xmlsitemap.xml
Allow: /http://rsssitemap.xml
Allow: /http://rsslatest.xml
Allow: /http://htmlsitemap.htm
```

**`/sitemap.xml`** → redirects to `/wp-sitemap.xml` (WP core sitemap index). There is **no** `sitemap_index.xml`.

**`/wp-sitemap.xml`** (WP core index) declares 10 sub-sitemaps:
- `wp-sitemap-posts-post-1.xml` (blog — excluded)
- `wp-sitemap-posts-page-1.xml` ← **all static pages (83 URLs)**
- `wp-sitemap-posts-event-1.xml` ← 5 event CPT URLs
- `wp-sitemap-posts-project_category-1.xml`
- `wp-sitemap-posts-project-1.xml` ← **all 25 program detail pages**
- `wp-sitemap-taxonomies-category-1.xml`, `-post_tag-1.xml`, `-post_format-1.xml`
- `wp-sitemap-users-1.xml`

**`/xmlsitemap.xml`** (legacy XmlSitemapGenerator.org plugin index) — 9 sub-sitemaps under `/sitemap-files/xml/…` (posts/page, posts/post, posts/event, posts/project_category, posts/project, terms/category, terms/post_tag, archive/oldarchive, authors/authors).

**Bonus:** the WP REST API is open at `/wp-json/wp/v2/pages?per_page=100` and returns `id, slug, link, title.rendered, status, parent` for all 83 published pages. This is the cheapest way to enumerate the site. `project` and `event` CPTs are not exposed.

---

## 2. PAGE INVENTORY (non-blog)

### 2.1 Core navigation (5 pages)

| URL | `<title>` tag (verified) | Post title (REST) |
|---|---|---|
| `https://kogaionacademy.ro/` | `Kogaion Gifted Academy` | Homepage |
| `https://kogaionacademy.ro/despre-noi/` | `Despre noi – Kogaion Gifted Academy` | Despre noi |
| `https://kogaionacademy.ro/programe/` | `Programe – Kogaion Gifted Academy` | Programe |
| `https://kogaionacademy.ro/mentori/` | `Mentori – Kogaion Gifted Academy` | Mentori |
| `https://kogaionacademy.ro/contact/` | `Contact – Kogaion Gifted Academy` | Contact |

Meta descriptions: **unverified** (see §0).

### 2.2 Programs listing
`/programe/` — see §4. 25 individual detail pages — see §3.

### 2.3 Legal pages

| URL | Post title (REST) |
|---|---|
| `/termeni-si-conditii/` | Termeni și condiții |
| `/politica-de-confidentialitate/` | Politica de confidentialitate |
| `/politica-cookie/` | Politica cookie |

### 2.4 Other published pages (grouped)

**Gallery**
- `/galerie/` — "Galerie"

**Enrichment centre / Afterschool (legacy landing pages)**
- `/enrichment/` — "Enrichment" (fully populated — see §7.3)
- `/kogaion-afterschool/` — "Kogaion Self Mastery – Centrul educațional de enrichment Kogaion Afterschool"
- `/kogaion-club/` — "Kogaion Gifted Club"
- `/programe-bucuresti/` — "Programe București"
- `/tabere-moieciu-de-sus/` — "Tabere Moieciu de Sus"

**Founders / people**
- `/florian-colceag/` — "Florian Colceag" (with children: `/conferinte-parenting-si-co-parenting/`, `/seminarii-cunoastere-integrata/`, `/studii-si-analize/`, `/video-colceag/`)
- `/diana-antoci/` — "Diana Antoci"

**Press / media**
- `/kogaion-in-media/` — "Kogaion in media"
- `/parteneri-media/` — "Parteneri media"
- `/articole/` — "Articole"

**Campaign / legacy content**
- `/educations-key-role-in-global-challenges/` — "Education's key role in global challenges"
- `/performanta-fara-stres/` — "Performanta fara stres"
- `/gala-kogaion-academy/` — "Gala Kogaion Academy"
- `/gala-kogaion-2017/` — "Gala Aniversara Kogaion"
- `/inscriere-gala-aniversara-kogaion/`, `/preselectie-gala-aniversara-kogaion/`
- `/aec-category/` — "Single Category Page" (empty utility page)

**Events, conferences, seminars**
- `/conferinte/` — "Conferinte"
- `/calendar-evenimente/` — "Calendar evenimente"
- `/evenimenteviitoare/` — "Evenimente viitoare"
- `/zbor-in-viitor/` — "Zbor in viitor"
- `/inscriere-conferinta-ecologia-informatiei/` — "Inscriere conferinta "Ecologia informationala""
- `/florian-colceag/seminarii-cunoastere-integrata/pre-inscriere-seminar-online-cunoastere-integrata/` — "Înscriere curs LIVE "Cunoastere Integrata""
- `alice-in-tara-minunilor/` — "Spectacolul de teatru "Alice in Tara Minunilor""
- `/ziua-portilor-deschise/` — "Ziua Portilor Deschise"
- `/seara-portilor-deschise/` — "Kogaion Gifted Academy – Formular ZPD"

**Careers / donation / admin**
- `/angajari/` — "Angajari"
- `/cum-ne-poti-sprijini/` — "Redirecționează" (donate)
- `/impreuna-pentru-educatie/` — "Împreună pentru educație" (+ `/donatii-in-cont/`, `/donatii-materiale/`, `/donatie-paypal/`)
- `/multumim/`, `/multumim-2/` — "Multumim"
- `/student-registration/` — "Student Registration"
- `/contract-de-sponsorizare/` — "Contract de sponsorizare"
- `/oferta-early-bird-luna-iunie/` — "Oferta early bird luna iunie"

**Legacy / archived "inscriere" sub-pages** (all published, all under `_old-` or short slugs — parents mostly retired programs):
`/kogaion-advanced-learning-2/inscriere/`, `/kogaion-afterschool/inscriere/`, `/kogaion-holiday-mastery/inscriere/`, `/kogaion-weekend-academy/inscriere/`, `/tal/inscriere/`, `/val/inscriere/`, `/sal/inscriere/`, `/scoala-de-vacanta-kogaion-bucuresti/inscriere/`, `/scoala-de-vacanta-kogaion-moieciu-de-sus/inscriere/`, `/scoala-de-vacanta-kogaion-apoulon/inscriere-scoala-de-vacanta-kogaion-apoulon/`, `/kogaion-online-academy/de-la-pamant-la-stele-si-napoi/inscriere/`, `/kogaion-online-academy/calatorie-in-jurul-pamantului/` (+ `/inscriere/`), `/kogaion-online-academy/lumea-n-lung-si-n-lat/` (+ `/inscriere/`), `/vechi-kogaion-online-academy/inscriere/`, `/kogaion-parenting-academy/feedback-kogaion-parenting-academy/`, and the `_old-*` family: `_old-kogaion-intensive-mastery/inscriere-kogaion-intensive-mastery/`, `_old-kogaion-family-bootcamp/inscriere/` (+ `/declaratie/`), `_old-kogaion-life-learning-academy/inscriere/`, `_old-kogaion-gifted-family/inscriere/`, `_old-kogaion-bright-academy/inscriere/` (+ `…-paltinis-si-plaiu-foii/`), `_old-tabara-media-advanced-learning/inscriere/`, `_old-tabara-technology-advanced-learning/inscriere/` (+ `/conferinta/`), `_old-tabara-architecture-advanced-learning/inscriere/`

### 2.5 Event CPT (5 URLs, `/evenimente/…`)
- `/evenimente/cunoaste-mentorii-si-programele-kogaion/`
- `/evenimente/2024-05-20-cunoaste-mentorii-familiei-tale-tabere-parinti-si-copii/`
- `/evenimente/2024-05-23-cunoaste-mentorii-copilului-tau-tabere-copii/`
- `/evenimente/2024-05-21-cunoaste-mentorii-adolescentului-tau-tabere-adolescenti/`
- `/evenimente/2024-05-30-cunoaste-mentorii-copilului-tau-afterschool-tabere-urbane-cursuri/`

### 2.6 Taxonomy
- `project_category` taxonomy exists (sitemap present) — used to group programs into the 4 listing categories.
- `category` / `post_tag` taxonomies exist (blog).
- `mlo-category` is attached to media.

---

## 3. PROGRAMS — every program detail page

### Page template (shared structure)

All 14 active program pages follow one template, in this order:

1. **H1** program name
2. **Subtitle** — one-line program descriptor (e.g. "Program academic de armonizare a relației copil-părinte")
3. **Audience line**
4. **Meta line** — `<dates>, <N> zile, <location>`
5. **Badge** (optional) — `SOLD OUT` / `3 LOCURI`
6. **`Direcții principale de cunoaștere și explorare:`** — 5–10 bullet highlights
7. **CTA row** — `[Sună]` · `Cere detalii` · `[Formular de înscriere]`
8. **Intro narrative** — 1–3 long prose paragraphs
9. **Heritage/origin paragraph** (family camps only) — "primul program … din Romania, inițiat …"
10. **`cine:` / `unde:` / `când:`** block (repeats 3–4)
11. Full-bleed image
12. **`## Activitățile taberei`** — curriculum
13. **`## Mentorii copilului tău`** — 5–9 named mentors with roles
14. **`## Beneficii principale`** — 3–8 bullets
15. **`## Beneficii secundare`** — 3–6 bullets *(absent on ConectOM, Interior Arch AL)*
16. Full-bleed image
17. **`## Galerie foto`** — 13–70+ images
18. **`## Transport`**
19. **`## Meniu`** *(absent on the teen Advanced Learning pages)*
20. **`## Locație`** — venue name, external site link, 6 venue photos
21. **`## Înscriere`**
22. Footer

**Not present anywhere:** no `packages`/abonamente section, no testimonials, no FAQ, no prices on camps (except the 2023 Python course), no map embed.

---

### 3.1 TABERE DE FAMILIE (family camps, Moieciu de Sus)

#### Kogaion Family Bootcamp 4-6 ani
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-family-bootcamp-4-6-ani/` · `kogaion-family-bootcamp-4-6-ani`
- **`<title>`:** `Kogaion Family Bootcamp 4-6 ani – Kogaion Gifted Academy`
- **H1 / name:** Kogaion Family Bootcamp 4-6 ani
- **Subtitle:** Program academic de armonizare a relației copil-părinte
- **Audience:** `Familii cu copii de 4-6 ani, 1-7 august, 8-14 august`
- **Location:** **Moieciu de Sus** — Pensiunea Nicoleta 3\*\*\*, la poalele masivului Bucegi
- **Dates:** `8–14 august 2026` (the "când" line repeats this single window; the audience line also advertises `1-7 august, 8-14 august` as options)
- **Duration:** 7 zile
- **Badge:** none (listing shows no badge)
- **Price:** none shown
- **Highlights (`Direcții principale…`):** Armonizare relații în familie · Psihoterapie · Psihopedagogie · Științele complexității · Inteligențe multiple · Observație specializată a copilului · Feedback profesional · Follow-up
- **Curriculum — "7 PRAGURI DE METAMORFOZĂ EDUCAȚIONALĂ POZITIVĂ":**
  1. `SIGURANȚĂ & APARTENENȚĂ – ACASĂ ÎN CETATE`
  2. `LIMITE BLÂNDE – CORPUL VIU`
  3. `RITM – SUNETUL CARE UNEȘTE`
  4. `COOPERARE – LUMINA ȘI DRUMURILE`
  5. `DEMNITATE – TRANSFORMAREA`
  6. `ÎNȚELEGERE – EU POT`
  7. `DĂRUIRE – RECUNOȘTINȚĂ`
  Three parallel tracks: **ATELIERELE PENTRU PĂRINȚI** (modules incl. "NU fără violență", Co-reglarea corp–emoție), **ATELIERELE PENTRU COPII** (biology/chemistry experiments, microscopy, brain games, theatre; split into groups **3–4 ani** and **5–6 ani**), **ATELIERELE PĂRINTE-COPIL** (drumeția-misiune, atelierul pâinii, trenulețul, carnavalul copilăriei).
- **Mentors (9):** Diana Antoci · Florin Munteanu · Dragoș Claudiu Borugă · Ovidiu Harbădă · Luminița Mureșan · Andrei Stan · Adriana Călugăru · Iulian Gliță · Bianca Gabriela Bălan
- **Beneficii principale:** 8 bullets (parental-model awareness, parent's own parental model, values-based attitudes, harmonious child-parent-mentor relationship, motivation, harmonious personality via experiential learning, live curiosity, courage of self-expression)
- **Beneficii secundare:** 6 bullets (identification of hidden potentials, widening horizons / child-parent-mentor communication, self-esteem, removing barriers "Cunoaște-te pe tine însuți", removing expression blocks, online peer network)
- **Heritage:** "primul program de conștientizare a potențialului familiei din Romania, inițiat în vara anului 2013 împreună cu prof. dr. Florian Colceag"; **19-a ediție**; continued with prof. dr. Florin Munteanu
- **Transport:** families arrange their own; train to gara Brașov, then bus hourly to Moieciu de Sus (~20 lei/pers), taxi to the pensiune (~35 lei)
- **Meniu:** 3 main meals (Swedish buffet), 2 snacks + water; separate menu for allergies
- **Contact CTA:** tel 0720.529.398 (Diana Antoci)
- **Sections present:** hero, highlights, intro, heritage, cine/unde/când, curriculum (7 praguri + 3 tracks), mentors, beneficii principale, beneficii secundare, gallery, transport, meniu, locație, înscriere

#### Kogaion Family Bootcamp 7-12 ani
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-family-bootcamp/` · `kogaion-family-bootcamp`
- **`<title>`:** `Kogaion Family Bootcamp 7-12 ani – Kogaion Gifted Academy`
- **H1 / name:** Kogaion Family Bootcamp 7-12 ani
- **Subtitle:** Program academic de conștientizare a potențialului familiei
- **Audience:** `Familiile cu copii de 7-12 ani, inclusiv copiii cu potențial înalt`
- **Location:** **Moieciu de Sus** — Pensiunea Nicoleta 3\*\*\*
- **Dates:** `25–31 iulie 2026`
- **Duration:** 7 zile
- **Badge:** **SOLD OUT** (on page and listing)
- **Highlights:** Armonizare relație copil-părinte · Psihoterapie · Psihopedagogie · Științele complexității · Inteligențe multiple · Observație specializată a copilului · Feedback profesional · Follow-up
- **Curriculum — 7 praguri (different set from the 4-6 edition):**
  1. `APARTENENȚĂ CONȘTIENTĂ – "Contractul care creează siguranță"`
  2. `LIMITE INTELIGENTE – "Ferm și blând, fără escaladare"`
  3. `AUTOREGLARE – "Corpul ca bază pentru minte"`
  4. `RELAȚII ȘI STATUT – "Prietenie, frați, grup"`
  5. `COMPETENȚĂ ȘI PERSEVERENȚĂ – "Eu pot"`
  6. `IDENTITATE ȘI LUME DIGITALĂ – "Atenție, AI, Tehnologie, Alegeri"`
  7. `SENS ȘI DĂRUIRE – "Recunoștință, valori, continuitate acasă"`
  - **Parent workshops:** "Ferm și blând fără escaladare", "Reparația după conflict", "Familia ca sistem: bucle și pârghii", "Motivație sănătoasă și rutină de studiu", "Reguli digitale fără război"
  - **Child workshops:** robotică/Arduino with progressive modules, "Atlasul vieții invizibile" (microscope), "Harta darurilor", science/tech/art/nature/language
  - **Parent-child:** "Contractul de familie", Drumeția-misiune, Laboratorul de cooperare, "Busola familiei", Contractul digital
- **Mentors (7):** Diana Antoci · Florin Munteanu · Dragoș Claudiu Borugă · Andreea Drăghici · Ovidiu Harbădă · Andrei Stan · Fabian-Andrei Stoica
- **Beneficii:** identical 8 + 6 bullet sets as the 4-6 edition
- **Heritage:** same 2013 origin; **43-a ediție**
- **Other sections:** transport / meniu / locație / înscriere — identical wording to the 4-6 edition

#### Kogaion Gifted Family 7-12 ani
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-gifted-family/` · `kogaion-gifted-family`
- **`<title>`:** `Kogaion Gifted Family 7-12 ani – Kogaion Gifted Academy`
- **H1 / name:** Kogaion Gifted Family 7-12 ani
- **Subtitle:** Program academic de conștientizare a potențialelor creative ale copilului tău
- **Audience:** `Familiile cu copii de 7-12 ani, inclusiv copiii cu potențial înalt`
- **Location:** **Moieciu de Sus** — Pensiunea Nicoleta 3\*\*\*
- **Dates:** `29 august – 4 septembrie 2026`
- **Duration:** 7 zile
- **Badge:** none
- **Highlights (10):** Armonizare relație copil-părinte · Psihoterapie · Psihopedagogie · Științele complexității · Inteligențe multiple · Observație specializată a copilului și relației · Unicitatea copilului · Traseu personalizat · Feedback profesional · Follow-up
- **Curriculum — 7 praguri:**
  1. `UNICITATEA COPILULUI – "Daruri, nu deficiențe"`
  2. `TRASEU PERSONALIZAT – "Pasiune, direcție, parcurs"`
  3. `MOTIVAȚIE INTRINSECĂ – "Underachievement și bucuria progresului"`
  4. `AUTOREGLAREA INTENSITĂȚII – "Corp – Emoție – Minte"`
  5. `STATUT SOCIAL & INTELIGENȚĂ RELAȚIONALĂ – "Apartenență fără mască"`
  6. `EDUCAȚIA EXCELENȚEI – "Mentor, Morală, Metodă"`
  7. `IDENTITATE, SENS & DĂRUIRE – "Valori, conștiință, continuitate acasă"`
  - Explicit **gifted** framing: "unicitate, asincronii, intensitate, sensibilitate, **underachievement** și perfecționism"; parenting framed as "arhitectul mediului de hrănire"
  - **Child workshops:** ancient-theatre staging, visual arts (painting on t-shirt, charcoal self-portrait, glass/mandala painting, clay modelling), invention & applied creativity, tech projects
  - **Parent-child:** role-play relational workshops, "Tabloul casei mele", invention project
- **Mentors (7):** Diana Antoci · Florin Munteanu · Luminița Mureșan · **Doru Tătar** · Ovidiu Harbădă · Iulian Gliță · Bianca Gabriela Bălan
- **Beneficii:** standard 8 + 6 sets
- **Heritage:** "primul program academic de conștientizare a potențialelor creative ale copiilor din Romania, inițiat în vara anului **2019**" with Colceag + Munteanu
- **Other:** transport / meniu / locație / înscriere — same as other family camps

---

### 3.2 TABERE COPIi (children's camps, Moieciu de Sus)

All six share a second template that adds a "structură triangulară" block and swaps Transport/Meniu/Înscriere contact.

Shared block on all six: *"Taberele educaționale Kogaion pentru copii de 7-12 ani au structură triangulară unică"* — 📚 Cunoașterea de sine / 🎓 activități de enrichment experiențiale ca proiecte multi și trans-disciplinare / 🌿 Conectarea în natură; plus the shared self-knowledge project **„Semințele Bucurilei"** *(note: page actually spells it „Semințele Bucuriei")* and shared closing items **Drumeție și conectare în natură** + **Carnavalul și serile la foc de tabără**.

**Shared Transport (verbatim):** "Transportul de la București până la Moieciu de Sus se face cu trenul (gratuit în baza carnetului de elev) și cu mijloace de transport în comun / microbuz de la gara Brașov până la pensiune… Prețul aproximativ este de **60 lei dus-întors**. Detalii **Mădălina Gavrilescu +40744.491.634**."
**Shared Meniu:** "2 variante, una tradițională și una vegetariană… Pentru copiii cu alergii, se asigură meniu separat."
**Shared Locație:** Pensiunea Nicoleta Moieciu de Sus 3\*\*\* → `https://www.moeciu-nicoleta.ro`; 45 km from Brașov, 3 km from Parcul Național Bucegi.
**Shared Înscriere CTA:** "Oferte personalizate pentru grupuri de minim 5 copii… sună la **+40744.988.330 (Irina Nicolaescu – consultant)**."
*(Robotics is the one exception: its Înscriere block omits the "minim 5 copii" line.)*

#### Kogaion Science Bootcamp
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-science-bootcamp/` · `kogaion-science-bootcamp`
- **`<title>`:** `Kogaion Science Bootcamp – Kogaion Gifted Academy` · **H1:** Kogaion Science Bootcamp
- **Subtitle:** Program de descoperire a pasiunilor, dezvoltare a abilităților și cultivare a bucuriei de a trăi
- **Audience:** `copii 7-9 ani și 10-12 ani` · **Location:** Moieciu de Sus · **Dates:** `19–24 iulie 2026` · **Duration:** 6 zile · **Badge:** **3 LOCURI**
- **Highlights:** Astronomie · Biologie · Anatomie · Cunoaștere de sine · Problem solving · Conectare în natură
- **Curriculum:** **Astronomie aplicată** (professional sky/solar-system software, **2 telescope sessions** — solar with filter + evening: Moon, Saturn, double stars, clusters, meteor shower) · **Biologie experimentală – "Microcosmos și Primul meu ierbar"** (set of **300 microscope slides**, children build their own herbarium) · **Anatomia corpului uman – "De la celulă la sistem"** · **Problem solving "Semințele Bucuriei"** · Drumeție · Carnavalul și serile la foc
- **Mentors (5):** Diana Antoci · Andreea Drăghici · **Ciprian Vântdevară** · Irina Nicolaescu · Constantin Căprioreanu
- **Beneficii principale (3):** science as adventure / joy of learning and being / link between life and the Universe
- **Beneficii secundare (3):** attention, patience, perseverance / cooperation and free expression / emotional and energy balance

#### Kogaion Architecture Bootcamp
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-architecture-bootcamp/` · `kogaion-architecture-bootcamp`
- **`<title>` / **H1:** Kogaion Architecture Bootcamp · **Subtitle:** same as above
- **Audience:** `copii 7-9 ani și 10-12 ani` · **Location:** Moieciu de Sus · **Dates:** `5–10 iulie 2026` · **Duration:** 6 zile · **Badge:** **SOLD OUT**
- **Highlights:** Construcție „Arca lui Noe" · Machetă arhitecturală · Cunoaștere de sine · Problem solving · Conectare în natură
- **Curriculum:** **Construcție arhitecturală – "Arca lui Noe"** (balance, symmetry, functionality, sustainability) · **Arhitectură urbană – "Orașul Kogaion"** (children design and build their own house inside a model city) · "Semințele Bucuriei" · Drumeție · Carnavalul
- **Mentors (5):** Diana Antoci · **George Grama** · **Alin Mardare** · Irina Nicolaescu · Constantin Căprioreanu
- **Beneficii principale (3):** think in structures / ability to build together / harmony between form, nature, life
- **Beneficii secundare (3):** visual-spatial thinking & proportion / responsibility & ecological conscience / confidence, patience, emotional balance

#### Kogaion Engineer Bootcamp
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-engineer-bootcamp-2/` · `kogaion-engineer-bootcamp-2`
- **`<title>` / **H1:** Kogaion Engineer Bootcamp · **Subtitle:** same standard line
- **Audience:** `copii 7-9 ani și 10-12 ani` · **Location:** Moieciu de Sus · **Dates:** `12–17 iulie 2026` · **Duration:** 6 zile · **Badge:** **SOLD OUT**
- **Highlights:** Construcție · Inginerie · Fizică · Cunoaștere de sine · Problem solving · Conectare în natură
- **Curriculum:** **Construcții / Inginerie – "Construcția unui Cuptor de Lut"** (functional clay oven, material properties, thermal efficiency) · **Fizică experimentală** (magnetism, electricity, forces, pressure) · "Semințele Bucuriei" · Drumeție · Carnavalul
- **Mentors (5):** Diana Antoci · Irina Nicolaescu · Alin Mardare · **Fabian-Andrei Stoica** · Constantin Căprioreanu
- **Beneficii principale (3):** living link between humans and the natural elements / creating and building with meaning / balance of thought, emotion, action
- **Beneficii secundare (3):** applied & systemic thinking / teamwork / inner rhythm and natural joy

#### Kogaion Astronomy Bootcamp
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-astronomy-bootcamp/` · `kogaion-astronomy-bootcamp`
- **`<title>` / **H1:** Kogaion Astronomy Bootcamp · **Subtitle:** same standard line
- **Audience:** `copii 7-9 ani și 10-12 ani` · **Location:** Moieciu de Sus · **Dates:** `16–21 august 2026` · **Duration:** 6 zile · **Badge:** **none** (the only open children's camp)
- **Highlights:** Astronomie · Geometria naturii în artă · Solidele platonice · Cunoaștere de sine · Problem solving · Conectare în natură
- **Curriculum:** **Astronomie aplicată** (same 2 telescope sessions as Science) · **Geometrie transdisciplinară — "Solidele platonice / My Blueprint"** (Fibonacci sequence, fractals, 2D & 3D) · "Semințele Bucuriei" · Drumeție · Carnavalul
- **Mentors (5):** Diana Antoci · **Minodora Carmen Lipcanu** (Profesor Dr. în astronomie) · Alin Mardare · Irina Nicolaescu · Constantin Căprioreanu
- **Beneficii principale (3):** harmony of science, art, life / creative-logical thinking & symbolic connections / joy of belonging to a living Universe
- **Beneficii secundare (3):** scientific curiosity & cognitive perseverance / aesthetic sensitivity / inner calm

#### Kogaion Arts Bootcamp
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-arts-bootcamp-2/` · `kogaion-arts-bootcamp-2`
- **`<title>` / **H1:** Kogaion Arts Bootcamp · **Subtitle:** same standard line
- **Audience:** `copii 7-9 ani și 10-12 ani` · **Location:** Moieciu de Sus · **Dates:** `29 iunie – 4 iulie 2026` · **Duration:** 6 zile · **Badge:** **SOLD OUT**
- **Highlights:** Teatru de păpuși și improvizație · Pictură · Dans · Canto · Cunoaștere de sine · Problem solving · Conectare în natură
- **Curriculum:** **Teatru de păpuși și improvizație** · **Atelier de pictură** (canvas, cardboard, wood; charcoal, natural pigments, nature elements) · **Dans** · **Canto** · "Semințele Bucuriei" · Drumeție · Carnavalul
- **Mentors (5):** Diana Antoci · Iulian Gliță · Andrei Stan · Bianca Gabriela Bălan · Constantin Căprioreanu
- **Beneficii principale (3):** authentic inner voice / empathy, listening, presence through the art of relationship / art as joy, balance, conscience
- **Beneficii secundare (3):** coordination, attention, expressive discipline / imagination & symbolic thinking / joy of creating in community

#### Kogaion Robotics Bootcamp
- **URL / slug:** `https://kogaionacademy.ro/programe/kogaion-robotics-bootcamp-2/` · `kogaion-robotics-bootcamp-2`
- **`<title>` / **H1:** Kogaion Robotics Bootcamp · **Subtitle:** same standard line
- **Audience:** `copii 7-9 ani și 10-12 ani` · **Location:** Moieciu de Sus · **Dates:** `21–26 iunie 2026` · **Duration:** 6 zile · **Badge:** **SOLD OUT**
- **Highlights:** Robotică Arduino · Fizică experimentală · Cunoaștere de sine · Problem solving · Conectare în natură
- **Curriculum:** **Robotică și gândire algoritmică** (sensors, LEDs, motors, Arduino boards) · **Fizică experimentală** · "Semințele Bucuriei" · Drumeție · Carnavalul
- **Mentors (5):** Diana Antoci · Alin Mardare · Andrei Stan · **Smaranda Andronic** · Constantin Căprioreanu
- **Beneficii principale (3):** logical and creative thinking at once / courage to explore and to make mistakes / joy of learning and conscious living
- **Beneficii secundare (3):** systemic thinking & attention to detail / emotional expression through visual & symbolic forms / inner balance & presence

---

### 3.3 TABERE ADOLESCENȚI (Advanced Learning, Bran)

All five: **Location Bran — Pensiunea Mama Cozonacilor 3\*\*\*** (`https://mamacozonacilor.ro`), 900 m altitude, at the foot of the Bucegi massif; private yard, gazebo, 2 conference rooms, own restaurant, wi-fi. **Transport** (verbatim, same on all): train from București free on a student card, then bus/minibus from gara Brașov, ~**60 lei dus-întors**, contact **Mădălina Gavrilescu +40744.491.634**. **No `## Meniu` section on these pages.** Înscriere CTA: "Ofertă personalizată pentru grupuri de minim 5 copii… sună la 0720.529.398 (Diana Antoci – consultant educațional)".

Shared closing modules on all five: **Coaching, susținere emoțională și motivațională adaptată** · **Bazele comunicării strategice** · **Drumeție și conectare în natură** · **Validarea vocației. Feedback personalizat de specialitate** · **Debate și seri de comunitate** · **Rețea de adolescenți cu interese comune**.

#### Film & Photo Advanced Learning
- **URL / slug:** `https://kogaionacademy.ro/programe/film-and-photo-advanced-learning/` · `film-and-photo-advanced-learning`
- **`<title>` / **H1:** Film & Photo Advanced Learning
- **Subtitle:** Program academic de potențare a abilităților de storytelling și expresie prin arte vizuale
- **Audience:** `adolescenți 13 – 18 ani` · **Dates:** `1–10 august 2026` · **Duration:** 10 zile · **Badge:** **SOLD OUT**
- **Highlights (10):** Fotografie & Editare foto · Cinematografie & Editare video · Portofoliu Foto · Film de scurt metraj · Drumeție off-road · Comunicare strategică · Coaching și mentorat individual · Conectare în natură · Comunitate & Debate · Validarea vocației. Feedback de specialitate personalizat
- **Curriculum:** Competențe vizuale, tehnică și expresivitate (composition, light, perspective, exposure) · Editare foto + digital portfolio · Cinematografie & editare video — teams of **four**, rotating roles **gaffer / asistent cameră / director de imagine** · Coaching · Comunicare strategică · Drumeție off-road on route **Prăpăstiile Zărnești – Măgura – Amfiteatrul Transilvania** (2 photo + 1 film project, reportage & interview practice) · Validarea vocației · Debates · Peer network
- **Mentors (5):** Andrei Stan · **Roberto Stan** (Director de imagine) · Mădălina Gavrilescu · Constantin Căprioreanu · **Alina Monica Antoci**
- **Beneficii principale (6):** authentic visual portfolio / core photo, editing & cinematography skills / critical & aesthetic thinking / communication, collaboration, leadership via short film / autonomy via individual coaching / observation, documentation, expressiveness through nature
- **Extra:** closing exhibition + public screening for parents

#### Architecture Advanced Learning
- **URL / slug:** `https://kogaionacademy.ro/programe/architecture-advanced-learning/` · `architecture-advanced-learning`
- **`<title>` / **H1:** Architecture Advanced Learning
- **Subtitle:** Program academic de valorificare a abilităților de design și arhitectură
- **Audience:** `adolescenți 13 – 18 ani` — note the page adds: `Perioade: 1-10 august - SOLD OUT; 21-30 august 2026 - SOLD OUT` (two runs, both sold out)
- **Dates:** `21–30 august 2026` · **Duration:** 10 zile · **Badge:** **SOLD OUT**
- **Highlights (8):** Desen tehnic și de observație · Proiectare arhitecturală · Proiectare, construcție labirint · Comunicare strategică · Coaching și mentorat individual · Conectare în natură · Comunitate & Debate · Validarea vocației. Feedback de specialitate personalizat
- **Curriculum:** **Desen tehnic** (perspective + axonometry: frontală, oblică, aeriană) · **Proiectare arhitecturală** — machetă "la standarde universitare" · **Construcție arhitecturală** — design & build a **labyrinth and its pavilions in wood and reed at 1:1 scale** · + 6 shared closing modules
- **Mentors (8):** **George Grama** · **Adriana Niculina Sîngeap** · **Vlad Andrei Răducanu** (Phd.) · **Sara Iosub** (Drd.) · Alina Monica Antoci · Andrei Stan · Mădălina Gavrilescu · Constantin Căprioreanu
- **Beneficii principale (6):** spatial thinking / university-standard design practice / real-scale construction / rigor / vocational clarity in architecture & urbanism / resilience

#### Technology Advanced Learning
- **URL / slug:** `https://kogaionacademy.ro/programe/technology-advanced-learning/` · `technology-advanced-learning`
- **`<title>` / **H1:** Technology Advanced Learning
- **Subtitle:** Program academic de valorificare a abilităților de programare, robotică, electronică, AI
- **Audience:** `adolescenți 13 – 18 ani` · **Dates:** `21–30 august 2026` · **Duration:** 10 zile · **Badge:** **3 LOCURI**
- **Highlights (9):** Programare Python, C++ · Robotică Arduino · Electronică digitală & analogică · Spectacol de teatru · Comunicare strategică · Coaching și mentorat individual · Conectare în natură · Comunitate & Debate · Validarea vocației. Feedback de specialitate personalizat
- **Curriculum (numbered 1–8, most detailed program page on the site):**
  1. **Proiect transdisciplinar „CASA SMART"** — teams build a **functional smart-house model** (electronic systems & sensors, control programs, automation, AI integration). Sub-courses: **Electronică analogică și digitală** (Arduino, ESP32, motors, sensors), **Programare Python și C++**, **Robotică**, **Inteligență Artificială**
  2. **Punerea în scenă a spectacolului „Visul unei nopți de vară", W. Shakespeare**
  3. Coaching · 4. Comunicare strategică · 5. Drumeție · 6. Validarea vocației · 7. Debates · 8. Peer network
  - Intro also lists a 6-point "contribuția taberei la parcursul vocațional" list
- **Mentors (6):** **Iulian Gliță** · **Petre Butunoi-Olteanu** (Inginer IT, ex-Microsoft/Huawei) · Andrei Stan · Alina Monica Antoci · Mădălina Gavrilescu · Constantin Căprioreanu
- **Beneficii principale (6, numbered):** advanced digital competences / engineering thinking via smart house / algorithmic logic / technical creativity & collaboration / communication & creative leadership via the drama project / vocational clarity in engineering, IT, robotics, creative industries

#### Interior Architecture Advanced Learning
- **URL / slug:** `https://kogaionacademy.ro/programe/interior-architecture-advanced-learning/` · `interior-architecture-advanced-learning`
- **`<title>` / **H1:** Interior Architecture Advanced Learning
- **Subtitle:** Program academic de valorificare a abilităților de arhitectură și design interior
- **Audience:** `adolescenți 13 – 18 ani` · **Dates:** `11–20 august 2026` · **Duration:** 10 zile · **Badge:** **SOLD OUT**
- **Highlights (8):** Desen tehnic și de observație · Proiectare arhitecturală design interior · Proiectare, construcție, design interior dom · Comunicare strategică · Coaching și mentorat individual · Conectare în natură · Comunitate & Debate · Validarea vocației. Feedback de specialitate personalizat
- **Curriculum:** Desen tehnic (interior-specific) · Proiectare arhitecturală — machetă design interior la standarde universitare · **Construcție arhitecturală de interior** — design & build a **geodesic dome in wood and natural materials at 1:1 scale** · + 6 shared closing modules
- **Mentors (5):** George Grama · Andrei Stan · Alina Monica Antoci · Mădălina Gavrilescu · Constantin Căprioreanu
- **Beneficii:** only a **`## Beneficii secundare`** block is present (5 bullets: networking, individual & team work, visual-spatial abilities, transferring nature's patterns into architectural structures, reflection) — **no `Beneficii principale` block on this page**

#### Conectom Advanced Learning
- **URL / slug:** `https://kogaionacademy.ro/programe/conectom-advanced-learning-2/` · `conectom-advanced-learning-2`
- **`<title>` / **H1:** Conectom Advanced Learning *(body copy uses the stylised "ConectOM")*
- **Subtitle:** Program academic de dezvoltare a identității, inovației și leadership colaborativ
- **Audience:** `adolescenți 13 – 18 ani` · **Dates:** `11–20 august 2026` · **Duration:** 10 zile · **Badge:** **SOLD OUT**
- **Highlights (9):** Identitate & Neuroștiințe · Reziliență & Corp · Gândire sistemică · Inovație · Comunicare · Leadership colaborativ · Conectare cu natura · Comunitate · Feedback de specialitate individual
- **Curriculum:** Identitate și neuroștiințe (metacogniție, neuroplasticitate, arhitectura atenției) · Reziliență și corp · Gândire de sistem și științele complexității (rețele, fluxuri, feedback, emergență) · Proiect de inovație și prototipare (problem framing, design etic, prototip low-fi) · Retorică, comunicare și **pitch public** · Leadership colaborativ, negociere și gestionarea conflictului · Conectare cu natura și explorare (ecologie aplicată) · Comunitate și peer learning · **Feedback de specialitate despre adolescent** · **Follow-up la 6 luni, 1 an, 2 ani**
  - *This is the only program with an explicit long-term follow-up commitment.*
- **Mentors (9):** Diana Antoci · Florin Munteanu · Alina Monica Antoci · Andrei Stan · Ovidiu Harbădă · **Dragoș Claudiu Borugă** · George Grama · Mădălina Gavrilescu · Constantin Căprioreanu
- **Beneficii principale (6, emoji-prefixed):** identity clarity & metacognition / physical & emotional resilience / systemic thinking / responsible innovation / academic communication & public speaking / collaborative leadership
- **Sections:** no `Beneficii secundare`, no `Galerie foto`, no `Meniu`

---

### 3.4 LEGACY PROGRAMS — "Kogaion Bright Academy" intelligence series (București centre)

All 10 are **still live (HTTP 200)** but are **not listed** on `/programe/`, and all carry **2025** dates (expired season). They use a much **shorter template**: H1 → intelligence subtitle → `copii 7-12 ani` → `dates, București` → highlights → CTA → 1 intro paragraph → image → cine/unde/când → `## Activități` → image → `## Locație` → CTA. **No gallery, no mentors, no benefits, no transport, no meniu, no Înscriere section, no badge, no price.**

| # | Slug | H1 / programme name | Intelligence | Dates | Location | Transdisciplinary project | Cultural visit |
|---|---|---|---|---|---|---|---|
| 1 | `inteligenta-verbal-lingvistica` | Călătorie în lumea poveștilor | Verbal-Lingvistică | 23–27 iunie 2025 | București | Poveste creativă înregistrată pe CD audio | Biblioteca Națională, Filiala pentru copii și tineret |
| 2 | `inteligenta-tehnologica` | Călătorie în lumea Artificial Intelligence (AI) | Tehnologică | 30 iunie – 4 iulie 2025 | București | Lumea văzută prin ochii roboților | Facultatea de Inginerie Mecanică și Mecatronică, Politehnica |
| 3 | `inteligenta-logico-matematica` | Călătorie în lumea cifrelor | Logico-Matematică | 7–11 iulie 2025 | București | Harta înțelesurilor numerelor | Casa experimentelor |
| 4 | `inteligenta-muzical-ritmica` | Călătorie în lumea sunetului | Muzical-Ritmică | 14–18 iulie 2025 | București | Orchestra copiilor înregistrată pe suport video | Operă comică pentru copii |
| 5 | `inteligenta-corporal-kinestezica` | Călătorie în lumea mișcării corpului | Corporal-Kinestezică | 4–8 august 2025 | București | Pentatlon Kogaion | Club de atletism, club de gimnastică |
| 6 | `inteligenta-interpersonala` | Călătorie în lumea colaborării | Interpersonală | 11–15 august 2025 | București | Poluarea pe Terra — "Albinele pe cale de dispariție?" (dezbatere) | Teatrul Ion Creangă |
| 7 | `inteligenta-intrapersonala` | Călătorie în lumea mea interioară | Intrapersonală | 28 iulie – 1 august 2025 | București | "Cine sunt eu?" (Harta conștiinței umane, David R. Hawkins) | Castel Film Studios, Palatul Snagov |
| 8 | `inteligenta-stiintifica` | Călătorie în lumea energiei | Științifică | 18–22 august 2025 | București | Harta înțelesurilor energiei | Muzeul Național Tehnic Dimitrie Leonida |
| 9 | `inteligenta-vizual-spatiala` | Călătorie în spațiul multidimensional | Vizual-Spațială | 21–25 iulie 2025 | București | Harta universului cunoscut (scala -∞;0;+∞) | Observatorul astronomic |
| 10 | `inteligenta-naturalista` | Călătorie în lumea naturii | Naturalistă | 25–29 august 2025 | București | Universul scalabil: de la Microcosmos la Macrocosmos | Parcul Național Văcărești |

Full URLs: `https://kogaionacademy.ro/programe/kogaion-bright-academy/<slug>/`
All 10 share: `cine: copii 7-12 ani` · `unde: București, Centrul de enrichment Kogaion Gifted Academy` · `când: <dates>, 9:00 – 18:00; copiii pot fi aduși începând cu ora 8.30` (day-camp format, no overnight).
Their `Locație` block (verbatim on all 10): "…situat în București, Șoseaua Nordului nr. 94F, Sector 1, într-o zonă liniștită, la numai **150 de metri** de Parcul Herăstrău. Imobilul dispune de **11 spații** de desfășurare a activităților, spațioase și luminoase, cu o suprafață de **450 mp**."
Recurring per-week activity set: "Ce este inteligența? … Care sunt tipurile de inteligență?" · "Cine sunt eu? – punctele tari și slabe" · Hartă mentală of the week's theme · Jurnal de călătorie · Harta meseriilor · "Oameni de seamă" · "Cum ne îmbunătățim inteligența X?" · relaxare în parcul Herăstrău · games + "învățăm să ne documentăm: cărți, hărți, video".
`inteligenta-logico-matematica` and `inteligenta-stiintifica` both add the physics experiment list (electricitate, legea lui Arhimede, frecvența sunetelor, electroliza apei, presiunea atmosferică, circuite în serie/în paralel) "în colaborare cu Casa experimentelor"; the logico-matematică page also covers **logica triangulară (F. Colceag)**, Fibonacci, raportul de aur, mulțimea lui Mandelbrot.
⚠️ All 10 have a **broken CTA**: the phone link renders as `tel:+4` with an **empty phone number and empty contact name** (unlike the 2026 pages which correctly render `tel:+40720529398 "Diana Antoci, Project Manager — 0720.529.398"`). Their "Formular de înscriere" link points to `../inscriere/` — a page that does **not** exist in the sitemap.

### 3.5 Legacy program — Python course

#### Programare în Python cu microcontrollere
- **URL / slug:** `https://kogaionacademy.ro/programe/cursuri/python-microcontrollere/` · `cursuri/python-microcontrollere`
- **`<title>` / **H1:** Programare în Python cu microcontrollere
- **Subtitle:** Curs intensiv de electronică digitală și programare aplicată
- **Audience:** `adolescenți 12-16 ani` · **Location:** București, Centrul de enrichment Kogaion Gifted Academy · **Dates:** `13 noiembrie 2023 – 12 februrie 2024`, luni 18:00–21:00 și online · **Badge:** none
- **Highlights:** electronică digitală · electronică analogică · microcontrollere · software development · Python · design industrial
- **Curriculum:** students build a **dimmable LED lighting rig using an RGB LED matrix**; learn advanced Python, microcontroller world, analog electronics, system architecture, industrial design, Git versioning, oscilloscope & logic analyser, mechatronics
- **Sections:** hero, highlights, CTA, intro, cine/unde/când, `## Activități`, `## Galerie foto`, **`## Preț`**, `## Locație`, `## Înscriere`
- **PRICE (the only price found anywhere on the site):** "8 sesiuni în perioada 13 noiembrie – 18 decembrie, dintre care 6 în sală și 2 online; 6 sesiuni în perioada 8 ianuarie – 12 februarie, dintre care 2 în sală și 4 online; contravaloarea materialelor. Sesiunile în sală au durata de 3h, iar sesiunile online au durata de 2h. **Se achită în 4 rate lunare egale de 595 lei / lună**, în prima zi de curs a fiecărei luni." Plus a note reserving the right to extend the course by 2 sessions.
- **Înscriere note:** a conduct/termination policy reserving the right to refuse or terminate enrolment for inappropriate behaviour, with **no refund**.

---

## 4. PROGRAMS LISTING PAGE — `/programe/`

- **`<title>`:** `Programe – Kogaion Gifted Academy` · **H1:** Programe
- **Intro (verbatim):** "Programele educationale Kogaion Gifted Academy sunt concepute în colaborare cu prof. Dr. Florian Colceag, având la bază principiile gifted education și se adresează tuturor copiilor cu vârsta cuprinsă între **3 și 17 ani** și părinților lor. Fiecare program urmează caracteristicile și nevoile de învățare ale fiecărei etape de vârstă ale copiilor, ce sunt reflectate în plan educațional prin curriculum integrat și trasee educaționale individualizate."
- **Sticky category jump-nav:** 4 anchors — `#centru-enrichment`, `#tabere-de-familie`, `#tabere-copii`, `#tabere-adolescenti`
- **Program cards shown: 14 total.** Card fields: image, badge (optional), name, audience, one-line descriptor, `location, duration`, date range, `descoperă` link.

| Category heading (verbatim) | Count | Programmes |
|---|---|---|
| `Centru enrichment (copii peste 5 ani, adolescenți, adulți)` | **0** | ⚠️ **Heading renders but NO programme cards appear under it** — the Bucharest afterschool/enrichment offer is not represented by any `project` entry. |
| `Tabere de familie (copii 3-6 ani, 7-12 ani și părinți)` | 3 | Family Bootcamp 4-6 ani · Family Bootcamp 7-12 ani · Gifted Family 7-12 ani |
| `Tabere copii (7-12 ani)` | 6 | Science · Architecture · Engineer · Astronomy · Arts · Robotics Bootcamp |
| `Tabere adolescenți (13-17 ani)` | 5 | Film & Photo AL · Architecture AL · Technology AL · Interior Architecture AL · Conectom AL |

**Badges in use (exhaustive):** `SOLD OUT` (9 of 14) and `3 LOCURI` (2 of 14). **No "early bird" and no "new"/"NOU" badge appears on any live program page** — `oferta-early-bird-luna-iunie/` is an orphan legacy page from 2017.

Sold out (9): Family Bootcamp 7-12, Architecture Bootcamp, Engineer Bootcamp, Arts Bootcamp, Robotics Bootcamp, Film & Photo AL, Architecture AL, Interior Architecture AL, Conectom AL.
Open (5): Family Bootcamp 4-6 (no badge), Gifted Family (no badge), **Science Bootcamp (3 LOCURI)**, **Astronomy Bootcamp (no badge)**, **Technology AL (3 LOCURI)**.

**Grouping is done by hand-authored section headings, not by a `project_category` taxonomy archive** — the `project_category` taxonomy exists in the sitemap but the listing uses a single page with anchor sections.

---

## 5. ABOUT PAGE — `/despre-noi/`

- **`<title>`:** `Despre noi – Kogaion Gifted Academy` · **H1:** Despre noi
- Sections, in order:

**1. `### Dragă părinte,` (open letter)** — Every child arrives with "daruri" (gifts) that shape their **UNICITATE**. Discovering, developing and valuing this **POTENȚIAL** is what defines the development of passions, opening horizons of knowledge, finding meaning and happiness. These gifts take shape through predominant **ABILITĂȚI** and **APTITUDINI** that strongly influence how the child knows, interprets and interacts with the world. Nurtured, they make the child know and experiment with pleasure, build **STIMA DE SINE** and **ÎNCREDEREA** that they are **VALOROS**, and stay curious and open. States plainly that the role of parents and teachers is decisive in raising awareness of the risk of **wasting or burying children's native potential**, and of the adjacent dangers: demotivation, behavioural deviation and failure.

**2. `### VIZIUNEA NOASTRĂ`** — "Credem în descoperirea **omului creator**, capabil de o **înaltă performanță academică**, **în fiecare copil.** Credem și susținem **unicitatea fiecărui copil, a fiecărei familii, printr-o educație integrată.**"

**3. `### MISIUNEA NOASTRĂ`** — three bullets: (a) discover/recover/develop/value the creative potential of your child and family; (b) be the promoter of a paradigm shift in thinking in education, founded on the concept of **integrated, differentiated and individualised education** that respects the uniqueness of every person; (c) be a model of good practice in education.

**4. `### ABORDARE INTEGRATĂ`** — five bullets: an **integrated enrichment curriculum structured on 3 dimensions** (opening the horizon of multi- and trans-disciplinary knowledge; deepening and performing in one or more passion domains) · **collaborative learning contexts** that potentiate each child's uniqueness and well-being · **mentors with multidisciplinary training, empathetic, passionate** · **methods** leading to creativity and maximising aptitudes · **character building** and development of human qualities.
Then a bolded statement: promotes education based on **integrated development of the essential skills of the 21st century** — the skills list, verbatim:
> Gândire critică, creativă și inovativă · Rezolvarea de probleme · Colaborare și Relaționare · Adaptabilitate · Inițiativă și Spirit antreprenorial · Comunicare eficientă · Accesarea și analizarea informației · dezvoltarea Curiozității și Imaginației · dezvoltarea Inteligențelor multiple și a ambelor emisfere cerebrale

**5. `### ABORDARE INTER ȘI TRANS-DISCIPLINARĂ`** — To face a constantly changing world, learning must promote both traditional in-depth single-discipline approaches and **inter/trans-disciplinary** ones, child-centred, participative, locally/nationally/globally representative, structured around socially relevant themes. The novelty of the trans-disciplinary approach: instead of studying disciplines without linking knowledge, one starts from a **central theme** analysed trans-disciplinarily across multiple disciplines, producing **correlations between pieces of information** and opening toward new understandings and the complexity of life. Result: children explain notions from multiple perspectives, develop the ability to identify real solutions, adapt in complex social contexts, respect every element of nature and adopt positive behaviour toward the universe.
CTA: **DESCOPERA PROGRAMELE NOASTRE** → `/programe/`

**6. `### FONDATORI`** — "Fondată de **Diana Antoci** și **Florian Colceag** în vara anului **2013**, Kogaion Gifted Academy se constituie în **prima Academie de Cunoaștere și Inteligență Integrată și Complexă din Romania**." Two linked profile cards:
- **Diana Antoci** — "Fondator Kogaion Gifted Academy, Formator in psihopedagogia excelentei fondata de prof. dr. Florian Colceag, Formator Feuerstein" → links to `/mentori/`
- **Florian Colceag** — "Expert internațional Gifted Education, promotor gifted education în Romania, doctor în economie, matematician, Fondator Kogaion Gifted Academy, Fondator al Institutului de Cercetare si Dezvoltare a Cunoașterii Umane" → links to `/mentori/`

CTA: **FA CUNOSTINTA CU MENTORII NOSTRI** → `/mentori/`

**NOT PRESENT — contrary to what the brief anticipated:**
- ❌ **No timeline / year-by-year history** (2013 → today is *not* charted on this page; the only dates are 2013 founding and 2016 campaign on the home page).
- ❌ **No age-group cards** (3–6 / 7–12 / 13–17 cards are on the *programs* page, not the about page).
- ❌ No founders' separate full bios (those live on `/mentori/`).

---

## 6. HOME PAGE — `/`

- **`<title>`:** `Kogaion Gifted Academy` (no suffix)
- **Hero:** a single **static image**, not a video. `https://kogaionacademy.ro/wp-content/uploads/2024/02/DSC07735.jpg`, and the image itself is wrapped in a link to `/programe/`. ⚠️ **I could not verify whether a video background also exists** — `web_fetch` returns text only, and a `<video>`/background-video element produces no text. Treat "video hero" as **unconfirmed**; the poster image is confirmed.
- **Headline (verbatim, opening statement):** "Kogaion Gifted Academy este un **centru inovator în educație**, specializat în cei **10 ani** de activitate în **conceperea și dezvoltarea de programe educaționale integrate, diferențiate pe nevoile de învățare ale fiecărei grupe de vârstă și educație individualizată**." Followed by: "Kogaion Gifted Academy este **primul centru educațional integrat de enrichment** din România care a promovat **conceptul de cunoaștere integrată în educație**."
- **CTAs on the home page:** there is **no hero CTA button pair**. Instead a long statement block, then three "read more" CTAs: `[CITEȘTE MAI MULT](/despre-noi/)`, `[CITEȘTE MAI MULT](/programe/)`, `[CITEȘTE MAI MULT](https://kogaionacademy.ro/mentori/)`; plus `[Formular de contact](/contact/)`. A floating `[Call Now Button](tel:+4 0720 529 398)` widget is present on every page.
- **Stats:** ⚠️ **No numeric stats/counter block is rendered on the home page.** The only numbers are embedded in prose:
  - "**10 ani** de activitate" (in the intro) — *note: inconsistent with the footer copyright `2013-2024` and with the 43rd-edition claim on the Family Bootcamp page*
  - "**8 orașe** din România", "peste **1.400 de părinți și dascăli**" (2016-2017 national campaign)
- **Sections:**
  1. `# Viziunea noastră` — "Credem în descoperirea omului creator, capabil de o înaltă performanță academică, în fiecare copil. Credem și susținem unicitatea fiecărui copil, a fiecărei familii, printr-o educație integrată." + CTA → `/despre-noi/`
  2. Legacy 2016 campaign paragraph (initiator of the first national Campaign "De la descoperirea și valorificarea potențialelor native ale copiilor la performanță fără stres", 2016-2017, 8 cities, 1,400+ parents/teachers)
  3. `# Programele noastre` — a paragraph explaining that programmes serve children's needs at every age stage, based on **"gifted education"** principles, addressed to **all** children on the premise of each child's uniqueness. CTA → `/programe/`. Followed by "**Programele sunt structurate astfel:**" with **4 anchor links** to `/programe/#…`:
     - `Tabere de familie` — copii 3-6 ani, 7-12 ani și părinți, **Moieciu de Sus**
     - `Tabere copii` — copii 7-12 ani, **Moieciu de Sus**
     - `Tabere adolescenți` — copii 13-18 ani, **Bran**  *(home page says 13-18; the listing heading says 13-17)*
     - `Centru enrichment` (afterschool, cursuri, tabere urbane) — copii peste 5 ani, **București**
  4. `# Mentorii noștri` — "Mentorii noștri sunt specializați în diverse domenii ale cunoașterii, multi și trans-disciplinar, sunt oameni dăruiți, empatici, cu pasiune pentru ceea ce fac." CTA → `/mentori/`
  5. `# Contact` — phone `0720.529.398`, email `contact@kogaionacademy.ro`, link `/contact/`
  6. **Trust/compliance carousel** — ANPC-SAL `https://reclamatiisal.anpc.ro/` and EU ODR `https://ec.europa.eu/consumers/odr/main/index.cfm?event=main.home2.show&lng=RO`
  7. Footer: `© Kogaion Gifted Academy 2013-2024`
- ⚠️ **No "featured programmes" carousel/grid on the home page** — the only programme content is the 4 text links above.

---

## 7. CONTACT PAGE — `/contact/`

**`<title>`:** `Contact – Kogaion Gifted Academy` · **H1:** Contact

| Item | Value | Source on page |
|---|---|---|
| **Section heading** | `### **PERSOANE DE CONTACT**` | |
| **Contact person** | **Diana Antoci** | H4 |
| **Phone** | **0720.529.398** → `tel:+40720529398` | "Telefon:" |
| **Email** | **diana@kogaionacademy.ro** → `mailto:diana@kogaionacademy.ro` | "E-mail:" |
| **Street address** | **Șoseaua Nordului nr. 94F, Sector 1, București** | under `### **SEDIUL NOSTRU**` |
| **Address note** | *"(la 100 de metri de Parcul Herăstrău)"* | verbatim, italics |
| **Form** | `### **FORMULAR DE CONTACT**` — heading present; the form's fields did not render in the text extraction (form markup only) | |
| **Map embed URL** | ⚠️ **NOT FOUND / UNVERIFIED.** No map iframe URL appeared anywhere in the extracted text. A Google Maps/OpenStreetMap iframe would produce no text output, so this tool cannot confirm or deny its presence. **Do not state the contact page has no map — state that no map URL could be extracted.** | — |

**Social media links (from the site-wide footer, full URLs):**
- Facebook: `https://www.facebook.com/kogaionacademy.ro/`
- YouTube: `https://www.youtube.com/channel/UCoBFhLHz0qA0lFX3P0QOxcA`
- Email (footer icon): `mailto:kogaion@kogaionacademy.ro`
- Internal: `https://kogaionacademy.ro/contact`

⚠️ **Two different emails are in use across the site:** `diana@kogaionacademy.ro` (contact page) and `kogaion@kogaionacademy.ro` (site footer + home page). `contact@kogaionacademy.ro` appears in the home page's Contact block. So **three** addresses appear in total.

**Footer secondary menu:** Redirecționează · Mentori · Blog · Contact · Despre noi · Termeni și condiții · Politica de confidentialitate · Politica cookie

---

## 8. MENTORS PAGE — `/mentori/`

- **`<title>`:** `Mentori – Kogaion Gifted Academy` · **H1:** Mentori · **Subtitle:** "Profesionistii care dau valoare unicitatii copilului tau"
- Structure: flat single-column list of **41 mentor cards**, each = square portrait + H3 name + H4 role line + a full biography paragraph. No filters, no categories, no pagination, no search. Closing CTA: "Te asteptam cu drag la o incursiune unica in universul atat de fragil dar si atat de puternic al sufletului omului!" → **[VEZI PROGRAMELE NOASTRE]** `/programe/`
- **Individual mentor profile pages do NOT exist.** The only standalone people pages are the legacy `/diana-antoci/` and `/florian-colceag/`. The one link inside a bio is **Florian Munteanu → `https://www.florinmunteanu.ro/`**; Colceag's bio links to `https://www.hkrdi.org/ro/`; Andrei Stan's bio references `www.andreistan.com` and `@filters.of.perception`.

| # | Name | Role (verbatim) | Since (from bio) | URL |
|---|---|---|---|---|
| 1 | **Diana Antoci** | Fondator Kogaion Gifted Academy, Formator in psihopedagogia excelentei fondata de prof. dr. Florian Colceag, Formator Feuerstein | 2013 (founder) | legacy page `/diana-antoci/` |
| 2 | **Florian Colceag** | Fondator Kogaion Gifted Academy, Expert international Gifted Education, promotor gifted education in Romania, doctor in economie, matematician | 2013 (founder) | legacy page `/florian-colceag/` |
| 3 | **Florin Munteanu** | Explorator, profesor, cercetător, mentor pentru copii și părinți | 2021 | `https://www.florinmunteanu.ro/` (external) |
| 4 | **Alina Monica Antoci** | Mentor Comunicare Strategică & Leadership | 2025 (collaborating) | — |
| 5 | **Doru Tatar** | Inventator român | not stated | — |
| 6 | **Iulian Glita** | Actor liber profesionist, regizor, scenograf | 2013 | — |
| 7 | **Andrei Stan** | Regizor de film, fotograf, pasionat de arta colajului | 2017 | `www.andreistan.com`, `@filters.of.perception` |
| 8 | **Andreea Drăghici** | Biolog, cercetator | 2019 | — |
| 9 | **Mădălina Gavrilescu** | Consultant trainer, Motivational Coach | not stated | — |
| 10 | **Vlad Andrei Răducanu** | Phd. arhitect | 2026 (collaborating) | — |
| 11 | **Adriana Călugăru** | Profesor biologie, Formator copii și adulți, Consilier educațional | 2026 (collaborating) | — |
| 12 | **Eliza Galan** | Trainer Mindfulness, profesor, poliglot | not stated | — |
| 13 | **Bianca Gabriela Bălan** | Artist multidisciplinar, creator de muzică, mobilier, design vestimentar | 2026 | — |
| 14 | **Alvina Turcoman** | Arhitect | not stated | — |
| 15 | **Smaranda Andronic** | Profesor robotică | 2025 (collaborating) | — |
| 16 | **Irina Nicolaescu** | Psiholog | 2023 | — |
| 17 | **Sara Iosub** | Drd. Arhitect | 2026 (collaborating) | — |
| 18 | **Alin Mardare** | Inginer constructor | 2023 | — |
| 19 | **Anca Graur** | Arhitect, doctorand în arhitectură, asistent universitar | 2017 | — |
| 20 | **Fabian-Andrei Stoica** | Mentor programare, robotică, fizică experimentală | 2026 (collaborating) | — |
| 21 | **Ovidiu Harbădă** | Autor român, promotor al autovindecării prin cunoaștere și credință | not stated | — |
| 22 | **Tiberiu Emil Tioc** | Biolog, Cercetător, Formator ghid turistic și forest bath, Profesor | 2024 (collaborating) | — |
| 23 | **Ciprian Vântdevară** | Astronom, Cercetător | 2026 (collaborating) | — |
| 24 | **Gabriel Eșanu** | Profesor de sah, Maestru FIDE, Jurnalist | 2017 | — |
| 25 | **Flavian Glont** | Profesionist in rezolvarea rapida a cubului Rubik | 2016 | — |
| 26 | **Dumitru Bădilă** | Medic, inginer, cercetător energii neconvenționale, inventator, antreprenor | 2015 | — |
| 27 | **Petre Butunoi-Olteanu** | Inginer IT, Mentor programare și robotică | 2026 (collaborating) | — |
| 28 | **Andreea Faur** | Doctor în sociologie, psiholog, educator-învățător, asistent social | 2018 | — |
| 29 | **George Grama** | Arhitect, pasionat de natura, bioclimat | 2018 (collaborating), mentor 2021 | — |
| 30 | **Cristina Isabela Beteringhe** | Violonistă, profesoară de vioară și pian | 2021 | — |
| 31 | **Florin Ștefan** | Muzician multi-instrumentist | 2021 | — |
| 32 | **Nicolae Cruceru** | Cercetator, geolog, speolog, tata si om cu pasiuni | 2020 | — |
| 33 | **Dragoș Marinescu** | Doctor in stiinte istorice, profesor de istorie, formare psiho-pedagogica | 2016 | — |
| 34 | **Andra Vișan** | Solistă vocală, muzician multi-instrumentist medicine songs | not stated | — |
| 35 | **Cristian Drîmbă** | Muzician multi-instrumentist | not stated | — |
| 36 | **Alexandru Mironov** | Scriitor, jurnalist, vicecampion la scrima | 2015 | — |
| 37 | **Uca Marinescu** | Profesor, explorator si sportiv de performanta | 2016 | — |
| 38 | **Roberto Stan** | Director de imagine | 2023 | — |
| 39 | **Constantin Căprioreanu** | Ghid montan | 2021 | — |
| 40 | **Christopher Hermann** | Antreprenor, jurist si instructor de autoaparare | 2023 | — |
| 41 | **Adriana Niculina Sîngeap** | Arhitect | 2026 (collaborating) | — |

**Notable bios:** Colceag — trained the Romanian maths Olympiad team to a **world record of 84 medals (60 gold)**; **European Personality of the Year 2007**; member of WCGTC, ECHA, Pacific Federation WCGTC, AUSTEGA. Florin Munteanu — **35+ years** promoting the Complexity paradigm; full member of the Romanian Academy of Scientists, corresponding member of the Romanian Academy of Technical Sciences, co-founder of the **UNESCO Geodynamics Chair**, founding president of the Centre for Complex Studies (UNESCO). Alina Antoci — World Bank Dept. of Trade/Competitiveness since 2004; Harvard executive programme; master's at **John F. Kennedy School of Government**. Uca Marinescu — **first woman to reach all four poles**; world double record at age 62. Andreea Faur — probation officer, international expert in therapeutic communities. George Grama — civic initiative "Next Space". Anca Graur — 1st place in an international architecture competition (Poland/Netherlands). Adriana Sîngeap — PHI certified passive-house designer, Venice Biennale 2023 (De-a Arhitectura).

### 8.1 Mentors who appear on program pages but are MISSING from `/mentori/`
- **Dragoș Claudiu Borugă** — Psiholog, Consilier Dezvoltare personală, specialist medicină complementară terapia Bowen (Family Bootcamp 4-6, Family Bootcamp 7-12, Conectom AL)
- **LUMinița Mureșan** — Psiholog clinician, Psihoterapeut, Mediator Feuerstein (Family Bootcamp 4-6, Gifted Family)
- **Minodora Carmen Lipcanu** — Profesor Dr. în astronomie (Astronomy Bootcamp)

⚠️ These are a genuine content gap worth flagging.

---

## 9. AGE GROUPS AND TAXONOMY TERMS

### 9.1 Age ranges — all occurrences (with source)
| Range | Where |
|---|---|
| **3–17 ani** | `/programe/` intro — overall site claim |
| **3–6 ani** | Listing category `Tabere de familie`; home page programme list |
| **4–6 ani** | Family Bootcamp 4-6 ani (with internal sub-groups **3–4 ani** and **5–6 ani**) |
| **5–12 ani** | Teenage activities: "diferențiat pentru cele 2 grupe: 3–4 ani și 5–6 ani"; home: "peste 5 ani" for enrichment |
| **peste 5 ani** | Listing category `Centru enrichment`; home page |
| **7–9 ani** and **10–12 ani** | All 6 children's bootcamps (two internal groups) |
| **7–12 ani** | Listing category `Tabere copii`; all Bright Academy intelligence pages; Gifted Family 7-12; Family Bootcamp 7-12 |
| **12–16 ani** | Python course |
| **13–17 ani** | Listing category `Tabere adolescenți` |
| **13–18 ani** | All 5 teen Advanced Learning **detail pages**; home page programme list |
| **adolescenți / adulți** | Listing category `Centru enrichment` (heading only, no programmes) |

⚠️ **Inconsistency worth noting:** the listing heading says **13-17 ani** but every teen detail page says **13 – 18 ani**, and the home page says **13-18 ani**. The stated overall span (3–17) therefore contradicts the teen pages.

### 9.2 Educational / methodological taxonomy terms
- **gifted education** / **educația gifted** (used on `/programe/` and home)
- **enrichment** / **centru educațional de enrichment**
- **cunoaștere integrată** (integrated knowledge) — the concept the site claims to have introduced in Romania
- **abordare integrată** — integrated, differentiated, individualised education
- **abordare inter și trans-disciplinară** / **proiecte transdisciplinare** / **multi și trans-disciplinare**
- **curriculum integrat** · **trasee educațional individualizat**
- **inteligențe multiple** (multiple intelligences) — the 10 Bright Academy intelligences form a de-facto taxonomy: Verbal-Lingvistică, Tehnologică, Logico-Matematică, Muzical-Ritmică, Vizual-Spațială, Intrapersonală, Corporal-Kinestezică, Interpersonală, Științifică, Naturalistă
- **științele complexității** (Complexity Sciences) — Florin Munteanu / Florian Colceag
- **psihologia dezvoltării** · **neuroștiințe** · **psihopedagogia excelenței** · **metoda Feuerstein / învățare mediată / SCM**
- **medicină holistică**, wellbeing, alimentație naturală
- **praguri de metamorfoză educațională pozitivă** (7 praguri) — the family-camp curriculum spine
- **educația excelenței** · **underachievement**, asincronii, **ÎnȚELEGERE – EU POT** slogan
- **Semințele Bucuriei** — the shared self-knowledge / problem-solving project across all 6 children's bootcamps
- **abilități esențiale pentru secolul XXI** (9-item skills list, on About)
- **metamorfoză educațională pozitivă** · **Trecere cu ATȘ**-style framing: "COPIL / PĂRINTE / COPIL-PĂRINTE" triadic design
- **activități de tip enrichment** · **validarea vocației** · **feedback de specialitate** · **follow-up** (6 luni / 1 an / 2 ani on Conectom)
- **Arca lui Noe**, **Orașul Kogaion**, **CASA SMART**, **My Blueprint**, **Pentatlon Kogaion**, **Tabloul casei mele**, **Busola familiei**, **Harta darurilor**, **Atlasul vieții invizibile** — named signature projects

### 9.3 Afterschool / enrichment workshop taxonomy (from the legacy `/enrichment/` page)
`Ateliere și activități de enrichment la Afterschool Kogaion` — 10 workshops, each with Structură (3 modules × 10 workshops per school year) / Obiective / Beneficii:
1. **EXPLORATORIUM LINGVISTICĂ** (Poezie – Ritm și rimă / Povești / Aforisme, snoave, zicători)
2. **EXPLORATORIUM MATEMATICĂ** (Cubul Rubik / Șah / Jocurile minții – logică și perspicacitate)
3. **EXPLORATORIUM ARTE** (Pictură pe textile, sticlă, lemn / Modelaj / Arts & Craft)
4. **INTELIGENȚĂ MUZICALĂ**
5. **CULTURĂ ȘI CIVILIZAȚIE**
6. **TEATRU ȘI ARTĂ DRAMATICĂ** (finale: a show on the Țăndărică or Teatrul de Comedie stage; plus Arta oratoriei module)
7. **FEUERSTEIN**
8. **LIMBA ENGLEZĂ** (Cambridge curriculum, 2×/week, certification at a Cambridge centre)
9. **TEHNICĂ ȘI TEHNOLOGIE** (robotică + inginerie)
10. **ÎNOT**

The page also states the enrichment curricula uses "**modelul de fractalizare elaborat de prof. Florian Colceag**" and is taught with "tabla inteligentă, videoproiector".
⚠️ Two text defects on this page: the Teatru workshop's Obiective list is truncated mid-bullet ("**Cultivarea**"), and the Limba Engleză list is truncated ("Dezvoltarea încrederii în sine și a", "**Certificarea cunoștințelor**").

---

## 10. Quality / defect observations (verified)

1. **Broken phone CTAs on all 10 Bright Academy pages** — `tel:+4` with empty number and empty contact name; their `../inscriere/` target does not exist in the sitemap.
2. **`Centru enrichment` category renders empty** on `/programe/` — a heading and jump-nav entry with zero programmes; the home page advertises "Centru enrichment … București" as a live category.
3. **3 mentors missing from `/mentori/`** (Borugă, Mureșan, Lipcanu) despite appearing on program pages.
4. **Age-range contradiction**: listing `13-17 ani` vs detail pages `13 – 18 ani` vs overall `3-17 ani`.
5. **"10 ani de activitate"** on the home page vs `© 2013-2024` in the footer vs "43-a ediție" on the Family Bootcamp page.
6. **Three different contact emails** in use (`diana@`, `kogaion@`, `contact@`).
7. **No meta descriptions could be extracted** (method limitation, §0) — and no SEO plugin metadata was observable.
8. **11 legacy "inscriere" pages under `_old-*` slugs are still published** and crawlable, including `_old-kogaion-family-bootcamp/inscriere/`, `_old-kogaion-bright-academy/inscriere/`, `_old-tabara-technology-advanced-learning/inscriere/`, etc.
9. **No prices on any current (2026) programme** — the only price on the whole site is on the dead 2023-24 Python course (595 lei × 4).
10. **No testimonials, FAQ, or packages/abonamente sections** on any programme page.

---

## 11. What I could NOT verify

- **All meta description tags** — `web_fetch` returns rendered text, not `<head>`; shell network access was blocked.
- **Whether the home page hero has a video** behind/over the confirmed poster image `DSC07735.jpg`.
- **Whether a map embed exists on `/contact/`** — no map URL appeared in the text; iframes produce no text. Neither presence nor absence can be asserted.
- **Contact form field names/structure** — only the `FORMULAR DE CONTACT` heading rendered.
- **Whether the 10 Bright Academy pages and the Python course are intentionally archived** — they are all still `publish`ed and HTTP 200; no deprecation notice is shown. They are simply absent from the `/programe/` listing.
- **Individual mentor profile URLs** — none exist beyond the two legacy standalone pages; mentors on `/mentori/` are not links.
