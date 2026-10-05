# 02 — Variabile: ce se construiește, ce se pornește

Acesta este documentul care previne clasa de buguri ce nu arată nicăieri în
erori, ci doar în browserul clientului. În `kogaionacademy.ro` clasa aceea **nu se
poate produce**: proiectul nu are nicio variabilă de valoare publică, deci nimic
nu se înglobează în bundle la momentul build-ului. Tot ce urmează explică
mecanismul, și ce rămâne în schimb — două build args și tabelul complet al
variabilelor de runtime.

## Regula

> **Nu există `NEXT_PUBLIC_*`, nu există `PUBLIC_*` de build, nu există
> `import.meta.env`.** Prin urmare nu există nicio valoare care ajunge în
> browser prin build.
>
> **Tot ce e secret se citește la runtime**, din `process.env`, prin
> `$env/dynamic/private`. Schimbarea lui în Coolify cere redeploy — nu rebuild,
> și nu atinge imaginea.

## Cum funcționează exact

SvelteKit are patru moduri de a expune o variabilă de mediu. Proiectul folosește
unul singur:

| Mod                    | Când se citește valoarea                     | În repo       |
| ---------------------- | -------------------------------------------- | ------------- |
| `$env/dynamic/private` | **la runtime**, din `process.env`            | **4 fișiere** |
| `$env/static/private`  | la **build**, apoi literal în cod            | 0             |
| `$env/dynamic/public`  | la runtime, și ajunge în browser prin `load` | 0             |
| `$env/static/public`   | la build, **înglobat în bundle**             | 0             |

Cele patru importuri, toate pe server:

- [`src/lib/server/auth.ts:4`](../../src/lib/server/auth.ts) — `ORIGIN`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [`src/lib/server/db/index.ts:4`](../../src/lib/server/db/index.ts) — `DATABASE_URL`
- [`src/lib/server/forms/ga4.ts:1`](../../src/lib/server/forms/ga4.ts) — `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`
- [`src/routes/api/seed-admin/+server.ts:11`](../../src/routes/api/seed-admin/+server.ts) — `SEED_ADMIN_SECRET`, `NODE_ENV`

Mecanismul, care e diferit de Next.js în exact punctul care contează:
`$env/dynamic/private` este un obiect construit **la runtime** din `process.env`.
Vite și Rollup nu au ce valoare să inlinezească, deci în bundle rămâne o accesare
de proprietate — `env.ORIGIN` rămâne o accesare de proprietate și în chunk-urile
de server. O valoare pusă în Coolify după build ajunge astfel în containerul care
rulează, fără să se atingă imaginea.

`$env/static/*` funcționează invers: SvelteKit injectă valorile prin `define` la
build, iar `env.X` devine un **literal** în fiecare chunk care o referă. Varianta
`public` ajunge și în chunk-urile de client — și decide după **prefix**, nu după
graful de importuri: un modul folosit doar pe server nu te scutește. Exact de
aceea proiectul nu folosește deloc forma `static`: ea ar îngloba fiecare secret
în build și ar face ca valoarea din Coolify să devină o copie decorativă, care nu
mai face nimic și nu dă niciun avertisment.

## Ce nu se aplică aici

| Concept                                  | De ce nu apare în acest proiect                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_*`                          | convenție Next.js. Zero apariții în `src/`, iar nici [`vite.config.ts`](../../vite.config.ts) nu definește un `define` cu variabile publice       |
| `NEXT_PUBLIC_APP_URL` și „inversia” lui  | fără o valoare publică nu există de ce să fie „ignorată peste tot” la build. Nu e o capcană reparată, e o capcană care nu a fost construită       |
| ramuri `_PROD` / `_STAGING`              | repo are o singură ramură, `main`. Nu există perechea de variabile, deci nu există nici linia de cod care ar putea alege greșit între ele         |
| `next-intl`                              | înlocuit de paraglide-js — vezi secțiunea următoare. Nu există `NEXT_LOCALE`, nu există segment `[locale]`, i18n-ul nu negociază limbă la runtime |
| `APP_VERSION` / `COMMIT_COUNT` în bundle | nu există `src/lib/version.ts`. Singura versiune a codului care rulează e cea din eticheta OCI a imaginii                                         |

## Ce se construiește efectiv: două build args

Declarate ca `ARG` în [`Dockerfile`](../../Dockerfile), populate de pipeline:

| Build arg       | Etapă                                 | Ce produce                                       | De ce nu e secret                                      |
| --------------- | ------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `GIT_SHA`       | builder (`:94-95`) și runner (`:143`) | eticheta OCI `org.opencontainers.image.revision` | pipeline-ul îl publică în _Step summary_, lângă digest |
| `IMAGE_CREATED` | runner (`:144`)                       | eticheta OCI `org.opencontainers.image.created`  | e un timestamp; o `LABEL` nu poate rula o comandă      |

`GIT_SHA` apare **de două ori** nu din uitare: un `ARG` nu traversează etapele
build-ului. Etapa `builder` îl are ca `ENV`, iar `runner` are nevoie de un
`ARG` propriu ca să umple `LABEL`. Fără al doilea, eticheta ar fi goală chiar
dacă pipeline-ul transmite corect valoarea.

**Excepția care pare o încălcare a regulii.** `Dockerfile:88-89` are
`ARG DATABASE_URL=postgres://localhost:5432/kogaion` plus
`ENV DATABASE_URL` cu acea valoare, doar în etapa `builder`. Nu e un secret și
nu ajunge în imaginea livrată:

1. valoarea e un DSN local, fără credențiale, și e identică cu fallback-ul din
   [`src/lib/server/db/index.ts:6-9`](../../src/lib/server/db/index.ts) — build-ul
   vede o valoare explicită în locul unui `undefined` care ar scoate Postgres.js în
   eroare la import;
2. etapa `runner` nu o copiază, deci nu apare în `docker history` al imaginii
   finale;
3. pipeline-ul nu o transmite niciodată ca argument.

## Nimic secret nu este vreodată `ARG`

Trei motive, în ordine de severitate:

1. `ARG` și `ENV` ajung în istoricul imaginii, iar `docker history`,
   `docker image inspect` și `crane config` le afișează în clar.
2. **`ENV` e mai rău decât `ARG`**: `docker history` ascunde corpul unui `RUN`,
   dar niciodată valorile unui `ENV`.
3. Attestările de provenance înregistrează argumentele rezolvate **cu nume și
   valoare**, iar pipeline-ul trimite `provenance: mode=max` — deci orice secret
   ar ajunge publicat în GHCR, lângă imagine.

Și nu s-ar câștiga nimic: fiindcă proiectul citește exclusiv din
`$env/dynamic/private`, valoarea reală nu trebuie să existe în build. Locul ei
e un placeholder explicit din
[`src/lib/server/auth.ts:9-23`](../../src/lib/server/auth.ts), folosit doar cât
timp `building` e adevărat. Revizia anterioară a `Dockerfile` trecea
`BETTER_AUTH_SECRET` și `GOOGLE_CLIENT_SECRET` ca `ARG`: nu câștiga nimic și
punea cheia în istoric — de aceea `docker build` avertiza `SecretsUsedInArgOrEnv`
și avertismentul era corect.

## Paraglide compilează la build și nu are nevoie de nicio variabilă

[`vite.config.ts:17-22`](../../vite.config.ts) rulează `paraglideVitePlugin` cu
`project: './project.inlang'` și `outdir: './src/lib/paraglide'`. Limbile vin din
[`project.inlang/settings.json`](../../project.inlang/settings.json)
(`baseLocale: "ro"`, `locales: ["ro", "en"]`), mesajele din `messages/*.json`.

Trei lucruri care rezultă de aici, toate importante pentru pipeline:

1. **Nu există variabilă de limbă.** `strategy: ['baseLocale']` înseamnă că
   locale-ul nu se negociază: nici cookie, nici `Accept-Language`, nici env.
   Limba e un fapt compilat, ca mesajele însele.
2. **Nu trebuie nimic în repo.** `src/lib/paraglide/` este în `.gitignore:25` și
   se regenerează în `buildStart()`; un checkout curat construiește fără el.
3. **Singurul lucru care contează la build e `NODE_ENV=production`**, pus chiar de
   `Dockerfile:68-72`. Paraglide **aruncă** la un fișier de mesaje stricat doar în
   production; altfel doar loghează și continuă — deci o imagine cu traduceri
   lipsă ar trece printr-un pipeline verde.

## Ce rămâne runtime

Toate se citesc pe server, la cerere sau la boot, și **nu** ajung în browser.
Setarea lor în Coolify funcționează imediat, fără rebuild.

| Variabilă                               | Rol                                                                                                           | Citită din                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `DATABASE_URL`                          | **obligatorie** — DSN-ul Postgres; fără `?sslmode=disable` (vezi [DB_AND_ADMIN.md](../DB_AND_ADMIN.md))       | `db/index.ts:6`                  |
| `ORIGIN`                                | **obligatorie** — `baseURL` pentru Better Auth și callback-ul Google; fără slash final                        | `auth.ts:39`                     |
| `BETTER_AUTH_SECRET`                    | **obligatorie** — minim 32 de caractere                                                                       | `auth.ts:40`                     |
| `GOOGLE_CLIENT_ID`                      | **obligatorie** — singurul provider; `emailAndPassword` e dezactivat (`auth.ts:47`)                           | `auth.ts:50`                     |
| `GOOGLE_CLIENT_SECRET`                  | **obligatorie** — perechea lui `GOOGLE_CLIENT_ID`, pentru schimbul de cod                                     | `auth.ts:51`                     |
| `PUBLIC_SITE_URL`                       | recomandată — baza absolută pentru URL-urile imaginilor din admin; cade pe `ORIGIN` dacă lipsește             | `admin/media/+page.server.ts:44` |
| `SEED_ADMIN_SECRET`                     | opțională, recomandată dacă `/api/seed-admin` e accesibil — deschide rolul `editor` pentru contul super admin | `api/seed-admin/+server.ts:15`   |
| `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` | opționale — Measurement Protocol server-side; absente, formulele se trimit și nu se contorizează              | `forms/ga4.ts:13-14`             |

[`.env.example`](../../.env.example) listează exact aceste nouă, în această ordine.
Nu adăuga nimic la el fără să existe un `env.X` în `src/` care chiar îl citește.

## Variabile decorative: nu se configurează nicăieri

**`RESEND_API_KEY`, `SMTP_URL`, `INVITE_MAIL_TRANSPORT`.** Singura citire din
tot proiectul este
[`src/routes/admin/team/+page.server.ts:123-127`](../../src/routes/admin/team/+page.server.ts),
și doar ca un boolean `hasMailTransport`. Nu există niciun cod de trimitere email
în proiect: cu oricare dintre ele setate, invitația e tot creată în baza de date,
iar răspunsul tot afișează avertismentul că email-ul nu a fost trimis. Sunt
documentate ca facilități pentru un transport care nu e implementat; setate în
Coolify, ar arăta ca trei chei în plus care nu fac nimic.

**`BETTER_AUTH_URL`.** A fost `ENV` într-o versiune veche a `Dockerfile`-ului și
a fost eliminat: origin-ul vine din `ORIGIN`, prin `baseURL`
([`auth.ts:39`](../../src/lib/server/auth.ts)). O a doua variabilă pentru același
fapt ar fi o a doua sursă de adevăr.

## Capcana `ORIGIN`

Are două jumătăți, și merită citite împreună.

**Lipsă = proces mort, cu exit 1.** `initAuth()`
([`auth.ts:69-87`](../../src/lib/server/auth.ts)) verifică `DATABASE_URL`,
`ORIGIN` și `BETTER_AUTH_SECRET` și **aruncă**, numind variabila lipsă. Funcția e
rulată o singură dată, din `init` în
[`src/hooks.server.ts:76-81`](../../src/hooks.server.ts), adică la
`server.init()` al adapter-node — niciodată la build, pentru că `building` scurtează
returul. Deci fără `ORIGIN` containerul intră în crash-loop cu un mesaj care spune
exact ce lipsește. E comportamentul dorit: un nume în log bate un `undefined`
tăcut, care ar arăta ca „site-ul are conținut, deci merge”.

**Greșită = nicio eroare la pornire.** Procesul pornește perfect, și de aceea
greșeala se descoperă târziu. Când `ORIGIN` lipsește, adapter-node deduce
origin-ul din headerele cererii cu protocolul **hardcodat `https`**; în spatele
unui ingress HTTP origin-ul dedus e greșit, și SvelteKit respinge **fiecare POST**
— form actions și endpoint-uri API — cu 403, fără mesaj pe ecran. Iar pentru că
aceeași valoare ajunge ca `baseURL` la Better Auth, ea rupe și callback-ul
Google: navigarea se întoarce cu un `redirect_uri` neacceptat. Deci `ORIGIN` nu e
o variabilă pe care o setezi „aproape corect”.

Ea nu e în `Dockerfile` intenționat (`:121-130`): e un fapt despre **un
deployment**, nu despre imagine. Deci merge în Coolify, nu în build.

## `NODE_ENV`: nu îl seta în Coolify

`Dockerfile:116` pune deja `NODE_ENV=production` în etapa `runner`. Dacă îl
suprascrii din panou, se schimbă un singur lucru — și e cel mai rău lucru de pe
pagina asta: [`api/seed-admin/+server.ts:16-24`](../../src/routes/api/seed-admin/+server.ts)
verifică `env.NODE_ENV === 'development'` și sare **ambele** verificări de secret.
Endpointul devine accesibil fără secret la orice POST și acordă rol `editor`
contului super admin. Un singur câmp, completat de bună credință, deschide o
escaladare de rol. Lasă-l implicit.

## Verificare după schimbare

Verificarea nu mai privește bundle-ul — nu are ce verifica acolo. Privește
istoricul imaginii și etichetele:

```bash
# 1. niciun secret nu a ajuns în istoric: trebuie să nu returneze nimic
docker history --no-trunc <imagine> | grep -iE 'SECRET|PASSWORD|DATABASE_URL|TOKEN'

# 2. build args au ajuns: etichetele OCI sunt populate
docker image inspect <imagine> --format '{{json .Config.Labels}}'

# 3. nu s-a introdus o valoare publică prin ricoșeu
grep -rlE 'NEXT_PUBLIC_|VITE_' build/client | head
```

Punctul 3 întoarce nimic azi și trebuie să rămână așa: e singura verificare care
poate detecta ziua în care cineva adaugă un build arg cu valoare publică.

**Cum verificăm că proba din imagine are ce verifica.** `HEALTHCHECK` din
`Dockerfile` interoghează `GET /api/health`, iar ruta există:
`src/routes/api/health/+server.ts`. De aceea jobul `build` verifică explicit că
`api/health` a ajuns în manifestul rutelor compilate — o rută prezentă în `src/`
dar dispărută din bundle ar lăsa proba să primească 404, `r.ok` să fie fals și
containerul să fie marcat unhealthy după trei încercări, în ciuda unui proces
perfect sănătos. Verificarea se face pe artefact, nu pe cod.

Detalii operaționale: [03-configurare-coolify.md](03-configurare-coolify.md) are
valorile de băgat în panou, [05-verificare.md](05-verificare.md) are probele de
după deploy.
