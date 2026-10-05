# Bază de date și cont admin

## Baza de date

Aplicația folosește variabila de mediu **DATABASE_URL** (în `.env`). Exemplu pentru baza nouă:

```env
DATABASE_URL="postgres://postgres:PASSWORD@HOST:PORT/clients"
```

> **Nu adăuga `?sslmode=disable`.** Driverul folosit (`postgres.js`) interpretează acel parametru
> drept „negociază TLS” și connection-ul eșuează cu
> `Client network socket disconnected before secure TLS connection was established`
> împotriva serverelor care nu acceptă TLS. Lasă query string-ul gol.

### Migrare date din baza veche în cea nouă

1. În baza nouă rulezi migrările: `bun run db:migrate`
2. Setezi **OLD_DATABASE_URL** = conexiunea la baza veche (sursă) și **DATABASE_URL** = baza nouă (destinație)
3. Rulezi: `OLD_DATABASE_URL=... DATABASE_URL=... bun run scripts/migrate-db-to-new.ts`

### Populare baza nouă (fără migrare din baza veche)

După ce rulezi migrările pe baza nouă:

1. **`bun run db:migrate`** – aplică schema (tabele mentor, program, program_locale, program_mentor, site_section, hero_settings, contact_settings, etc.).
2. **`bun run db:seed:permissions`** – permisiunile (25 chei) + rolurile (114 rânduri `role_permission`).
3. **`bun run db:seed:mentors`** – populează mentori din `scripts/mentors-seed-data.ts`.
4. **`bun run db:seed:content`** – populează programe și conținut per limbă (RO/EN) din `programs-data` și mesaje.
5. **`bun run db:seed:cms`** – setări implicite pentru contact și hero (ro/en).
6. **`bun run db:seed:sections:full`** – `site_section` pentru **ambele limbi** (24 secțiuni × ro/en: home, about, programs, mentors, contact). Înlocuiește `db:seed:sections`, care scrie doar RO și omite 6 secțiuni de pe home.
7. **`bun run scripts/fix-contact-socials.ts`** – înlocuiește link-urile demonstrative din `contact_settings.socials` cu conturile reale (Facebook + YouTube).
8. **(Opțional) `bun run db:seed:admin`** – setează rolul de editor pentru contul **pazalgroup@gmail.com** (rulează după primul login cu Google cu acel email).
9. Migrarea **`0011_forms_platform`** adaugă tabelele pentru formulare. După migrare: **`bun run db:seed:forms`** (publică formularul `contact`/ro v1) și **`bun run db:seed:forms:en`** (varianta `en`, fără de care pagina de contact în engleză nu găsește o definiție publicată).
10. **(Opțional) `bun run db:seed:legal`** – inserează în **`site_setting`** cheia **`legal_policies`** (șabloane RO pentru politica cookie, confidențialitate și text banner) dacă lipsește.
11. **`bun run db:seed:media`** – scrie rânduri în `media_asset` pentru cele ~600 de fișiere din `static/media/uploads` (titlu/alt/tags derivate din nume; nu suprascrie editările manuale fără `--overwrite`).
12. **(Opțional) `bun run db:import:blog`** – importă articolele din `blogs/articles` în `blog_post` (fără frontmatter: titlul din H1, data din numele folderului `DD-MM-YYYY`, Markdown → HTML, imaginile descărcate în `static/media/uploads/blog`). Implicit doar cele 3 mai noi; `--all` importă tot arborele; sau listează explicit fișierele. `db:seed:blog-demo` inserează 4 articole demo hardcodate, fără legătură cu `blogs/`.
13. **(Opțional) `bun run db:seed:mentors:live`** – adaugă mentorii care apar pe `/mentori/` dar lipsesc din `mentors-seed-data.ts` (biografii sunt copiate verbatim de pe site).

Toate seed-urile sunt idempotente (pot fi rulate din nou).

#### Conținutul bogat al paginilor de program (`program_section`)

`db:seed:content` creează rândurile plate din `program` + `program_locale`. Textul bogat al paginii
de detaliu trăiește în `program_section` și este introdus de câte un script per program:

```bash
bun run scripts/ingest-<program>.ts   # necesită rețea: descarcă imaginile de pe kogaionacademy.ro
bun run scripts/normalize-program-location-texts.ts   # completează program.location
bun run scripts/normalize-program-schedule-texts.ts   # normalizări ageRange/datesText/durationText
```

Pentru **afterschool** rulează obligatoriu, în această ordine:
`ingest-afterschool-program.ts` → `backfill-afterschool-section-media.ts` → `update-afterschool-gallery.ts`
(ultimul fixează galeria curată de 18 imagini și suprascrie galeria generată de ingest).

Scripturile de ingest folosesc **delete-then-insert** pe `program_section` (pe toate limbile
programului) și pe `program_mentor`, deci pot fi rulate din nou. Fiecare descărcare de imagine
e în `try/catch`: dacă o imagine pică, rândul e salvat fără ea — deci nu rula ingest-urile fără rețea,
că pierzi referințele către imagini.

## Eroarea la `bun run db:migrate`

Dacă `drizzle-kit` eșuează cu **`spawn EPERM`** (medii sandboxate / CI cu pipe-uri restricționate),
drizzle-kit nu își poate porni procesul copil. Rulează în schimb runnerul direct, care aplică
aceeași logică și lasă jurnalul în aceeași stare:

```bash
bun run db:migrate:direct
```

Dacă vezi **ECONNREFUSED**, înseamnă că **PostgreSQL nu rulează** sau nu e accesibil la adresa din `DATABASE_URL`.

1. Pornește PostgreSQL / verifică conexiunea la server.
2. Setează `DATABASE_URL` în `.env`.
3. Rulează din nou: `bun run db:migrate`.

## Build & deployment (Docker / GHCR / Coolify)

Pipeline-ul complet este în [`docs/ghcr-coolify/`](ghcr-coolify/README.md). Acest
document rămâne ghidul operațional: baza de date, seed-uri, contul de admin. Nu
descrie traseul imaginii — acolo totul este un singur workflow, `.github/workflows/ci.yml`,
și serverul de producție **nu construiește nimic**.

### Ce s-a schimbat

| | înainte | acum |
| --- | --- | --- |
| Platformă | Easypanel (build de pe server) | Coolify, resursă **Docker Image** care doar *trage* |
| Build args | `DATABASE_URL`, `ORIGIN`, `PUBLIC_SITE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GIT_SHA` | doar `GIT_SHA` și `IMAGE_CREATED` (label-uri OCI) |
| Runtime | `bun run start` (`bun`, proces copil) | `bun ./build/index.js` în formă exec, ca serverul să fie PID 1 și să primească SIGTERM |
| Secret în imagine | `BETTER_AUTH_SECRET` și `GOOGLE_CLIENT_SECRET` treceau prin `ARG` + `ENV` în builder — `docker build` avertiza `SecretsUsedInArgOrEnv` | **niciun secret nu mai este `ARG`** |
| Imagine | ~1.6 GB (toate devDependencies copiate în runner) | ~350–400 MB (stadiu `prod-deps` cu `bun install --production`) |
| Utilizator | root | `1001:1001` |
| Health check | absent | `HEALTHCHECK` în imagine, pe `/api/health`, cu `bun -e` |

### De ce build-ul nu are nevoie de secrete

Proiectul folosește exclusiv `$env/dynamic/private` (5 importuri, zero `$env/static/*`),
deci orice valoare e citită din `process.env` **la runtime**. `getAuth()` din
`src/lib/server/auth.ts` este **lazy**, iar `initAuth()` începe cu `if (building) return;`.
Rezultatul: `bun run build` trece fără niciun secret, fără rețea și fără bază de date —
verificat pe un checkout curat.

În `Dockerfile` a rămas un singur `ENV` fictiv, `DATABASE_URL=postgres://localhost:5432/kogaion`.
E o plasă de siguranță, nu o cerință: la `vite build` sunt evaluate ~35 module de rute,
iar `src/lib/server/db/index.ts` cade **în tăcere** pe `localhost` când variabila lipsește.

### Obligatoriu pe container — toate **Runtime**, niciuna build arg

`DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET` (min. 32 caractere), `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`. Recomandat: `PUBLIC_SITE_URL`. Opțional: `SEED_ADMIN_SECRET`,
`GA4_MEASUREMENT_ID`, `GA4_API_SECRET`.

La pornire, `init` din `src/hooks.server.ts` le verifică și aruncă o eroare care le numește
explicit pe cele lipsă — altfel `DATABASE_URL` lipsă cădea în tăcere pe
`postgres://localhost:5432/kogaion` și site-ul ar arăta gol, fără nicio eroare.

**`ORIGIN` merită atenție specială.** Fără el, adapter-node deduce origin-ul din headerele
cererii cu protocolul hardcodat `https` — deci în spatele unui proxy HTTP toate POST-urile
și form action-urile cad cu `403 Cross-site POST form submissions are forbidden`, fără
nicio eroare la pornire. Cu `initAuth()` în cale, simptomul real e mai brutal: procesul moare
cu `exit 1` la pornire, numind varianta lipsă. Crash-loop cu un mesaj care spune cauza e
comportamentul dorit; un origin greșit care doar rupe POST-urile nu e.

**Nu seta `NODE_ENV=development` în Coolify.** Dockerfile-ul pune deja
`NODE_ENV=production` în stadiul runner; forțat la `development`, `/api/seed-admin` sare
verificarea de secret și devine un endpoint deschis de escaladare de rol.

### Migrările nu rulează în pipeline

Dezintenționat, prin decizie. Un commit care adaugă o coloană ajunge live înainte ca baza să
o aibă, și eșuează ca o eroare Postgres la runtime — de obicei pe un cod pe care nimeni nu
l-a exersat. Pipeline-ul **verifică** migrările (`drizzle-kit check`), nu le aplică.
Migrarea rămâne un pas operator, de mai jos, cu `DATABASE_URL`.


## Cont admin (doar Google)

Autentificarea este **doar prin Google** (fără email/parolă).

1. **Super admin:** contul **pazalgroup@gmail.com** are mereu acces de admin. După primul login cu Google cu acest email, rulează o dată **`bun run db:seed:admin`** (sau POST `http://localhost:5173/api/seed-admin` cu body `{}`) ca să i se seteze rolul `editor` în DB. Dacă userul nu există încă, seed-ul returnează un mesaj: „Loghează-te mai întâi cu Google (pazalgroup@gmail.com); rulează din nou seed-ul după primul login.”
2. În **development** nu e nevoie de `SEED_ADMIN_SECRET`. În **production** seteați `SEED_ADMIN_SECRET` în env și trimiteți-l în body: `{ "secret": "valoarea-ta" }` la POST `/api/seed-admin`.

## Autentificare (login)

- **Pagină login:** `/login` – doar Google (fără înregistrare).
- **Super admin:** contul **pazalgroup@gmail.com** are mereu acces de admin, indiferent de rol în DB.
- Dacă nu ești logat și accesezi ceva protejat (ex. `/admin`), ești redirecționat la `/login`, apoi după login la `/admin`.
- Adminii logați văd o **bară de administrare** (cine e autentificat, link Panou, Deconectare).

## Editare inline (hover)

Când ești autentificat ca editor, pe paginile publice (Mentori, Programe, detaliu program) poți da **hover** pe un card/articol și apăsa **Edit**. Se deschide un popup unde editezi datele; la Salvează, modificările se salvează în baza de date și se reîncarcă datele pe site, deci se văd peste tot (aceeași entitate – mentor sau program – e folosită în listă și în alte pagini).

## Formulare (admin)

- **Rută:** `/admin/forms` – listă definiții, detaliu per id (răspunsuri tip tabel, analiză, export CSV/XLSX, publicare versiune nouă).
- **Design:** tab **Design** – builder vizual (drag-and-drop, palette, JSON brut colapsabil) **și previzualizare** pe aceeași pagină (`FormRenderer` mod `preview`). La **Salvează ciornă** se validează schema și se scrie în `forms_definition`.
- **Răspunsuri:** tabel cu câmpuri dinamice + coloană **Detalii** (pagină sursă, referrer, IP mascat, user-agent, UTM, snapshot consimțământ, fingerprint sesiune, utilizator logat dacă există).
- **Istoric:** după fiecare salvare reușită se inserează un rând în **`forms_definition_revision`** (păstrate ultimele ~100 per formular). Din listă poți **Restaurează** o versiune anterioară (titlu + `schema_json`).
- **Tracking:** evenimentele de analiză se înregistrează doar dacă vizitatorul a acceptat categoria de consimțământ pentru analiză (banner cookie). GA4 opțional: `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` în `.env`.

## Politici legale & GDPR

- **Admin:** `/admin/legal` (vizualizare cu `pages.view`, salvare cu `pages.edit`) – texte în **Markdown** pentru politica cookie, confidențialitate, banner de consimțământ și date operator. Stocare: **`site_setting`**, cheie **`legal_policies`** (JSON).
- **Public:** `/politica-cookie-uri` și `/politica-de-confidentialitate` – același conținut, randat HTML **sanitizat** server-side (`marked` + DOMPurify).
- **Banner:** conținutul titlului și al textului vine din DB; linkuri către cele două pagini. **Footer:** linkuri către aceleași rute.