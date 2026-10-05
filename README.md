# Kogaion Academy

Situl public al Academiei Kogaion — programe educaționale pentru copii și
adolescenți, construit pe SvelteKit, cu un back-office care editează conținutul,
programele, mentorii, articolele și formularele direct din baza de date.

## Stack

|               |                                                        |
| ------------- | ------------------------------------------------------ |
| Framework     | SvelteKit 2.50 + Svelte 5 (rune-uri)                   |
| Runtime       | [Bun](https://bun.sh) 1.3.14                           |
| Build         | Vite 7                                                 |
| Server        | `@sveltejs/adapter-node` — `bun ./build/index.js`      |
| Bază de date  | PostgreSQL, accesat prin `drizzle-orm` + `postgres.js` |
| Autentificare | Better Auth, exclusiv prin Google OAuth                |
| CSS           | Tailwind CSS 4                                         |
| i18n          | `@inlang/paraglide-js`, **doar română** (vezi mai jos) |
| Admin         | Rich-text prin Edra (wrapper peste Tiptap)             |

## Cerințe preliminare

- **Bun 1.3.14.** Nu există câmp `engines` în `package.json`, deci bun nu verifică
  versiunea local — dar `Dockerfile` și CI-ul folosesc ambele 1.3.14, iar
  `.npmrc` are `engine-strict=true`.
- **PostgreSQL** accesibil, pentru migrations și seed-uri.
- **Contul Google OAuth** cu redirect URI configurat (vezi [Variabile de mediu](#variabile-de-mediu)).

```bash
bun install --frozen-lockfile
cp .env.example .env      # apoi completează
bun run dev                # http://localhost:5173
```

O fereastră goală apare dacă nu ai rulat migrările și seed-urile:

```bash
bun run db:migrate
bun run db:seed:permissions
bun run db:seed:content
```

Ordinea completă a seed-urilor e în [`docs/DB_AND_ADMIN.md`](docs/DB_AND_ADMIN.md).

## Variabile de mediu

Toate sunt **runtime**. Proiectul nu folosește `$env/static/*` în niciun loc, deci
nimic nu este încorporat în bundle la build — vezi [Lucruri care șochează](#lucruri-care-șochează).

| Variabilă              | Obligatorie | Unde se folosește                                          | Efect dacă lipsește                                                                                                                                     |
| ---------------------- | ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | da          | `src/lib/server/db/index.ts`                               | **Procesul nu pornește.** `initAuth()` aruncă la boot.                                                                                                  |
| `ORIGIN`               | da          | `src/lib/server/auth.ts` (`baseURL`), CSRF în adapter-node | **Procesul nu pornește.** Fără el, adapter-ul deduce origin-ul din headerele cererii cu protocol hardcodat `https`, ceea ce strică OAuth și POST-urile. |
| `BETTER_AUTH_SECRET`   | da          | `src/lib/server/auth.ts`                                   | **Procesul nu pornește.** Sub 32 de caractere better-auth doar avertizează.                                                                             |
| `GOOGLE_CLIENT_ID`     | da          | `src/lib/server/auth.ts`                                   | Login-ul nu funcționează.                                                                                                                               |
| `GOOGLE_CLIENT_SECRET` | da          | `src/lib/server/auth.ts`                                   | Login-ul nu funcționează.                                                                                                                               |
| `PUBLIC_SITE_URL`      | recomandată | `src/routes/admin/media/+page.server.ts`                   | Cade pe `ORIGIN`; lipsesc URL-urile absolute de media în admin.                                                                                         |
| `SEED_ADMIN_SECRET`    | opțională   | `src/routes/api/seed-admin/+server.ts`                     | `POST /api/seed-admin` răspunde 403 în producție.                                                                                                       |
| `GA4_MEASUREMENT_ID`   | opțională   | `src/lib/server/forms/ga4.ts`                              | Analytics server-side dezactivat.                                                                                                                       |
| `GA4_API_SECRET`       | opțională   | `src/lib/server/forms/ga4.ts`                              | Idem.                                                                                                                                                   |

**Nu configurați** `NODE_ENV`. Dockerfile-ul pune deja `production` în stadiul de
runtime — iar `development` ar deschide `/api/seed-admin`. Vezi
[Lucruri care șochează](#lucruri-care-șochează).

> **Nu adăugați `?sslmode=disable`** în `DATABASE_URL`. `postgres.js` interpretează
> acel parametru ca „negociază TLS” și connection-ul eșuează împotriva serverelor care
> nu vorbesc TLS. Lăsați query string-ul gol.

## Bază de date

29 de tabele, definite în `src/lib/server/db/schema.ts` (25) și
`src/lib/server/db/auth.schema.ts` (4, generat de Better Auth prin
`bun run auth:schema` și re-exportat din `schema.ts`). Grupate astfel:

- **Autentificare** — `user`, `session`, `account`, `verification` (Better Auth),
  plus `permission`, `role_permission`, `user_permission_override`, `admin_invite`
- **Conținut** — `program`, `program_locale`, `program_section`, `program_mentor`,
  `mentor`, `site_section`, `blog_post`
- **Configurare site** — `site_setting`, `hero_settings`, `contact_settings`
- **Media** — `media_asset`
- **Formulare** — `forms_definition`, `forms_definition_revision`, `forms_placement`,
  `forms_submission`, `forms_answer`, `forms_event`, `forms_metric_daily`,
  `forms_saved_view`
- **Audit** — `cms_audit_log`

```bash
bun run db:migrate        # aplică fișierele din drizzle/
bun run db:generate       # generează o migrare din src/lib/server/db/schema.ts
bun run db:push           # aplică schema direct, fără fișiere de migrare
bun run db:studio         # Drizzle Studio
```

**Migrările nu rulează în CI.** Pipeline-ul doar le _verifică_
(`drizzle-kit check`); aplicarea e un pas operator, cu `DATABASE_URL` real.
Motivul e în [Lucruri care șochează](#lucruri-care-șochează).

## Comenzi disponibile

**Dezvoltare**

| Comandă               | Ce face                               |
| --------------------- | ------------------------------------- |
| `bun run dev`         | server de dezvoltare                  |
| `bun run preview`     | previzualizează build-ul de producție |
| `bun run check:watch` | `svelte-check` în timp real           |

**Verificare și build**

| Comandă          | Ce face                                   |
| ---------------- | ----------------------------------------- |
| `bun run check`  | `svelte-kit sync` + `svelte-check`        |
| `bun run lint`   | `prettier --check .` și `eslint .`        |
| `bun run format` | rescrie fișierele cu Prettier             |
| `bun run build`  | build de producție în `build/`            |
| `bun run start`  | pornește build-ul: `bun ./build/index.js` |

**Bază de date**

| Comandă                     | Ce face                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `bun run db:migrate`        | aplică migrările                                                                                |
| `bun run db:migrate:direct` | aceleași migrări, fără drizzle-kit (workaround pentru `spawn EPERM`)                            |
| `bun run db:generate`       | generează migrări noi                                                                           |
| `bun run db:push`           | aplică schema fără migrări                                                                      |
| `bun run db:studio`         | Drizzle Studio                                                                                  |
| `bun run db:seed:<x>`       | seed-uri; lista completă în `package.json` și în [`docs/DB_AND_ADMIN.md`](docs/DB_AND_ADMIN.md) |

## Structura proiectului

```
src/
├── routes/
│   ├── (publice)      despre, programe, mentori, blog, contact,
│   │                  politici, login
│   ├── admin/         back-office: conținut, programe, mentori, blog,
│   │                  formulare, media, echipă, setări, permisiuni
│   └── api/           health, forms/submit, forms/events,
│                      active-users, seed-admin
├── lib/
│   ├── components/    UI; edra = editor rich-text, ui = primitives
│   ├── server/        db/, content/, forms/, legal/, auth, permissions
│   ├── forms/         tipuri și schema pentru formularul de contact
│   ├── paraglide/     GENERAT la build — nu se editează, nu se versionează
│   └── stores/, client/, actions/, assets/
├── hooks.server.ts    guard de sesiune + rol pe /admin
└── app.html
```

Alte directoare care contează:

```
messages/       mesajele de traducere (ro.json, en.json) — input pentru paraglide
project.inlang/ configurația paraglide
static/         media servit ca static (~235 MB) — inclus în build/client/
drizzle/        migrările SQL și snapshot-urile
scripts/        seed-uri, ingest de conținut, unelte de administrare
docs/           documentația internă
blogs/          pipeline de authoring pentru articole (NU intră în build)
```

**Despre rute:** numele în română re-exportă loader-ul din varianta engleză.
`src/routes/programe/+page.server.ts` este `export { load } from '../programs/+page.server'`.
Așadar `programs/`, `mentors/` și `about/` sunt implementările canonice.

## Autentificare și admin

Login exclusiv prin Google (`emailAndPassword: { enabled: false }`).
Contul `pazalgroup@gmail.com` este super-administrator prin definiție —
vezi `src/lib/server/permissions.ts`.

Panoul din `src/hooks.server.ts` rulează pe orice cerere și cere rol de editor pe
`/admin`. După primul login cu Google, acordă rolul cu:

```bash
bun run db:seed:admin
```

## CI/CD

GitHub Actions construiește imaginea, Coolify o _trage_. Serverul de producție
nu compilează nimic.

```
check ∥ lint ∥ schema  →  build  →  image (doar push/dispatch)  →  deploy (manual)
```

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
Documentația completă: [`docs/ghcr-coolify/`](docs/ghcr-coolify/README.md).

**Două secrete** în environment-ul GitHub `production`:

| Secret                   | Ce e                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| `KOGAION_DEPLOY_WEBHOOK` | linkul copiat din Coolify: `.../api/v1/deploy?uuid=<uuid>&force=false` |
| `KOGAION_COOLIFY_TOKEN`  | token API Coolify cu `read` + `write` + `deploy`                       |

Tokenul **nu** merge în URL: Coolify autentifică prin headerul
`Authorization: Bearer`. Query string-ul doar identifică ținta.

**Deploy-ul e manual.** Un push în `main` construiește și publică imaginea, dar
nu livrează. Pentru producție: rulare manuală din Actions cu input-ul `deploy`
bifat, sau _Redeploy_ din panou.

## Deploy

În Coolify, resursă de tip **Docker Image** (una singură):

| Câmp                                                               | Valoare                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Image Name                                                         | `ghcr.io/mirelconstantin/kogaionacademy.ro`                 |
| Image Tag or Hash                                                  | gol la creare; CI-ul îl fixează pe digest la fiecare deploy |
| Ports Exposes                                                      | `3000`                                                      |
| Healthcheck                                                        | **dezactivat în panou** — imaginea are deja `HEALTHCHECK`   |
| Port Mappings / Consistent Container Names / Custom Container Name | **gol / oprit**                                             |
| Environment Variables                                              | cele 5 obligatorii, toate **Runtime**                       |

Workflow-ul de configurare, pas cu pas:
[`docs/ghcr-coolify/04-prima-o-data.md`](docs/ghcr-coolify/04-prima-o-data.md).

## Lucruri care șochează

**1. Nimic public nu ajunge în bundle la build.** Zero `$env/static/public`,
zero `$env/dynamic/public`, zero `import.meta.env`. Toate valorile sunt citite din
`process.env` la runtime. `PUBLIC_SITE_URL` începe cu `PUBLIC_` de frică să pară
o variabilă Vite — dar e citit cu `process.env`, deci **nu** e publică. Nu te
baza pe `PUBLIC_` ca prefix pentru a decide ceva.

**2. `ORIGIN` lipsă omoară procesul, nu strică site-ul.** `initAuth()` din
`src/hooks.server.ts` verifică `DATABASE_URL`, `ORIGIN` și `BETTER_AUTH_SECRET`
și aruncă la boot, numind variabilele lipsă. E comportament dorit: fără el,
`src/lib/server/db/index.ts` ar cădea **în tăcere** pe `postgres://localhost:5432/kogaion`
și site-ul ar arăta gol, fără nicio eroare.

**3. `NODE_ENV=development` în producție deschide `/api/seed-admin`.**
`src/routes/api/seed-admin/+server.ts` sare verificarea de `SEED_ADMIN_SECRET` în
dezvoltare. Nu seta `NODE_ENV` în Coolify.

**4. `bun run db:generate` nu e de încredere aici.** Lanțul de snapshot-uri
drizzle e desincronizat față de fișierele SQL: comanda emite un `CREATE TABLE`
pentru opt tabele `forms_*` care există deja în baza de date. De aceea job-ul
`schema` din CI folosește doar `bunx drizzle-kit check --out ./drizzle --dialect postgresql`.
Corectează mai întâi istoricul de migrări.

**5. Containerul nu are `node`, `curl` sau `wget`.** `oven/bun:1` este Debian 13,
nu alpine. De aceea `HEALTHCHECK` din imagine e scris cu `bun -e` + `fetch`, iar
health check-ul din panoul Coolify trebuie să rămână **oprit** — unul HTTP ar rula
în interiorul containerului fără client HTTP și ar răsturna deployment-ul.

**6. `bun run check` și `bun run lint` pică în prezent.** Cele 35 de erori de tip
sunt toate în `src/lib/components/edra/` (copie vendored a editorului, scrisă
pentru o versiune mai veche a tipurilor Tiptap). Nu sunt bug-uri ale aplicației.

## Documentație

| Document                                                                       | Ce conține                                                             |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [`docs/DB_AND_ADMIN.md`](docs/DB_AND_ADMIN.md)                                 | baza de date, seed-urile, contul de admin, autentificarea              |
| [`docs/ghcr-coolify/README.md`](docs/ghcr-coolify/README.md)                   | pipeline-ul CI/CD: arhitectură, variabile, Coolify, rollback, probleme |
| [`docs/ghcr-coolify/04-prima-o-data.md`](docs/ghcr-coolify/04-prima-o-data.md) | checklist-ul de configurare, de la zero                                |
| [`docs/ghcr-coolify/07-probleme.md`](docs/ghcr-coolify/07-probleme.md)         | simptom → cauză → reparare                                             |

## Convenții

- `bun run ...` peste tot, niciodată `npm`.
- `src/lib/paraglide/` este generat la build și gitignored — nu edita și nu comita.
- Limba site-ului public este româna. `messages/en.json` există, dar
  `vite.config.ts` folosește `strategy: ['baseLocale']`, deci engleza nu e servită.
  Pentru a o activa: vezi `PUBLIC_SITE_LOCALE_LOCKED_RO` în `src/lib/site-i18n.ts`.
