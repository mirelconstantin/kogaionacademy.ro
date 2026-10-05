# 01 — Arhitectura

## Regula

**Serverul de producție nu construiește nimic.** Nu „nu ar trebui”, nu „doar
când se întâmplă”: nu există în configurație nicio cale prin care Coolify să
construiască kogaionacademy.ro. Un build-pack Docker ar necesita un repository
atașat la resursă, iar resursa noastră nu are repository — are o referință de
imagine, un digest.

## Fluxul

```
git push origin main
   │
   ├── check ────┐
   ├── lint ─────┤
   ├── schema ───┤   paralele, independente între ele
   └─────────────┘   (nu depind unul de altul)
   │
   └── build ────────── depinde: check, lint, schema
         │             rulează `vite build` în afara Docker-ului și verifică
         │             contractul artefactului
         │
         └── image ───── depinde: build
               │        construiește imaginea în Docker, publică în GHCR
               │        (doar pe push; niciodată pe PR)
               │
               │
               │        ↓ AICI FLUXUL SE OPREȘTE. Un push pe `main` construiește
               │          și publică imaginea, și atât. Serverul nu e atins.
               │
workflow_dispatch, cu input-ul `deploy` bifat   ← singurul drum spre producție
    │
    └── deploy ── depinde: build, image
          1. descoperă resursa Coolify după domeniu
          2. fixează resursa pe digestul nou
          3. POST /api/v1/deploy
          4. așteaptă până când deployment-ul ajunge terminal
```

Nu există `staging` și nu există ramură `production`. Repository-ul are o
singură ramură, `main`; imaginea mutătoare e tot ce exista ca mediu distinct.

Ce se întâmplă în Coolify, în aceeași secundă:

```
docker compose --project-name <uuid> --project-directory <workdir> pull
docker compose --project-name <uuid> --project-directory <workdir> up --build -d
```

adică **trage** un layer și pornește containerul. Nimic nu se compilează. Logul
deploy-ului conține `Pulling latest images from the registry.` — asta e Coolify, nu
un defect: pentru un tip `dockerimage` nu există nimic de construit local.

## Graful de job-uri, și de ce arată așa

| Job      | Rulează                                                       | Depinde de        | De ce                                                                                                                      |
| -------- | ------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `check`  | `bun run check` (`svelte-kit sync` + `svelte-check`)          | —                 | Singura poartă care vede erorile de tip. Rulează în paralelă cu restul, pentru că nu are nevoie de nimic construit.        |
| `lint`   | `bun run lint` (`prettier --check .` && `eslint .`)           | —                 | Formatarea e verificată în CI pentru că nu poate fi verificată în review: review-ul vede diff-ul, nu ținta.                |
| `schema` | `bunx drizzle-kit check --out ./drizzle --dialect postgresql` | —                 | Drift între `src/lib/server/db/schema.ts` și `drizzle/`. Nu are nevoie de `DATABASE_URL` și nici de bază de date.          |
| `build`  | `bun run build` (= `vite build`)                              | cele 3 de mai sus | Singurul job care compilează SvelteKit în afara Docker-ului. Nu construiește imaginea — verifică ce construiește imaginea. |
| `image`  | `docker buildx build` + `push` în GHCR                        | `build`           | Publică imaginea. **Pe push**, nu pe PR — un PR n-are voie să scrie în registry.                                           |
| `deploy` | PATCH pe resursă + POST + polling                             | `build`, `image`  | Trebuie să vadă construcția și imaginea ca `success`.                                                                      |

Ambele flag-uri ale job-ului `schema` sunt obligatorii: `drizzle.config.ts` nu
are cheie `out`, deci fără `--out` comanda moare cu un mesaj care vorbește
despre „AWS Data API driver” — total greșit pentru un proiect pe Postgres. Iar
`--dialect postgresql` e motivul pentru care verificarea nu atinge nicio bază de
date: se uită doar în `drizzle/`.

### De ce nu există `unit` și `e2e`

Fiindcă în repository **nu există teste**. Zero fișiere `*.test.*` sau
`*.spec.*` sub `src/`, și niciun runner în `package.json` — nu Playwright,
nu Vitest, nu Jest.

Un job de teste fictiv ar fi un câștig fals: `vitest run` peste zero fișiere
iese verde, dă un badge de acoperire goal și comunică „testat” unui cititor
care nu s-a uitat în `package.json`. Mai rău, ar antrena echipa să citească
verde ca „s-a verificat ceva”.

Așadar numele exacte a ce _este_ verificat contează: `svelte-check`,
`prettier` + `eslint`, drift-ul de schemă, și contractul artefactului de
build. Un pipeline verde înseamnă „aplicația compilează, se type-checkuiează,
se formatează și intră într-o imagine al cărei contract e verificat” — **nu**
„comportamentul e corect”. Spunerea aceasta e mai utilă decât un badge verde
fără conținut.

### De ce `always()` apare doar într-un singur loc

Un job cu `needs` are implicit `success()` în condiție, **dacă** expresia `if`
numește o funcție de stare. `deploy` o numește (`needs.image.result == 'success'`),
deci trebuie să scriem `always()` explicit, altfel expresia nici nu ajunge să fie
evaluată. `!cancelled()` **nu** ar fi funcționat: negarea unei funcții de stare nu
îndeplinește regula.

Verificările explicite pe `needs.*.result` sunt cea care face corect în ambele
situații: `cancelled` și `failure` înseamnă ambele _nu deploya_, deci o rulare
superseded nu poate trage un tag pe care nimeni nu l-a terminat de publicat.

### De ce `cancel-in-progress` depinde de tipul evenimentului

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

O rulare de PR nu are efecte secundare: anularea celei superseded e economie
pură. O rulare de push poate fi la jumătate prin `docker push`; anulată acolo,
tag-ul mutător poate rămâne indicând spre un manifest pe care nicio rulare nu
l-a publicat complet — un rollback tăcut, cu pipeline verde. Push-urile stau
în coadă. Câteva minute, iar „ce rulează acum” rămâne neechivoc.

## Contractul dintre `vite build` și `Dockerfile`

`adapter-node` (fără `out`) își scrie ieșirea în `build/`, nu în
`.next/`. Patru fișiere generate la rădăcina arborelui, plus aplicația:

```
build/
├── index.js      creează serverul HTTP, aplică env, sună handler.js
├── handler.js    handler-ul generat, cu tabelul de rute
├── env.js        cititorul pentru $env/dynamic/*; validează PORT, ORIGIN,
│                 SHUTDOWN_TIMEOUT etc. din process.env, la runtime
├── shims.js      globals lipsă pentru runtime (crypto, File)
└── server/       aplicația SvelteKit: index.js, manifest.js, chunks/
```

Etapa `runner` copiază două lucruri:

```dockerfile
COPY --from=builder --chown=1001:1001 /code/build ./build
COPY --from=prod-deps --chown=1001:1001 /code/node_modules ./node_modules
```

Se copiază **întregul** `build/`, nu doar `build/server/index.js`: acel fișier
are 514 de octeți și e doar re-exporturi — importă direct douăsprezece chunk-uri
din `build/server/chunks/`, care la rândul lor mai trag altele. O listă de
fișiere „relevante” ar fi un contract care se rupe la primul refactor de
nume de chunk.

Ce se strică, în fiecare caz:

- fără `build/index.js` sau `build/handler.js`, **imaginea se construiește
  perfect și containerul nu pornește deloc**, în producție, cu câteva minute
  după un pipeline complet verde;
- fără `build/client/`, aplicația pornește — și fiecare pagină întoarce
  `404` pe asset-urile ei. `static/` ajunge aici prin Vite; nu se copiază
  separat și nu se poate exclude din context (236 MB de `media/` și
  `programs/` sunt conținutul site-ului).

De aceea job-ul `build` verifică existența lor înainte de a publica:

```bash
for f in build/index.js build/handler.js build/env.js build/shims.js build/server/index.js build/server/manifest.js build/client; do
  [ -e "$f" ] || { echo "::error::missing '$f'"; exit 1; }
done
```

**Fișierul `.env` primește aceeași atenție, dar nu printr-o aserțiune — pentru că
aici nu se aplică.** Proiectul citește configurația exclusiv din
`process.env`, la runtime: zero `$env/static/*`, zero
`$env/dynamic/public`, zero `import.meta.env`. Nu există nimic care
să fie copiat în artefact și nimic de șters din el. Nu există niciun
`NEXT_PUBLIC_*` al cărui valoare să fie îngropată în build, pentru simplul
motiv că proiectul nu e Next.js și nu are echivalentul lui `APP_URL` construit
la compilare: `PUBLIC_SITE_URL` se citește la runtime, ca orice altă
variabilă.

## De ce s-a eliminat duplicarea build-ului

Varianta anterioară verifica artefactul construind o imagine completă în job-ul
`build`, și apoi o construia din nou în job-ul `image` ca s-o publice. Două
`docker build` la fiecare push, pentru o singură imagine publicată.

Acum `docker build` rulează **o singură dată**, în job-ul `image`. Job-ul
`build` rulează doar `vite build` în afara Docker-ului și verifică
contractul de mai sus pe arborele rezultat. E suficient pentru că
`Dockerfile` copiază exact arborele același — contractul verificat e chiar
contractul copiat, nu un gemen construit în paralel.

Costul e asimetric. Un build în plus se vede doar în timpul de rulare. O
divergență între „ce s-a verificat” și „ce s-a livrat” se vede abia în
producție, ca un container care nu pornește. Iar singura alternativă cu adevărat
sigură — să asamblăm imaginea dintr-un artefact `build/` produs în job — ar
încălca regula de la începutul documentului: `Dockerfile` nu ar mai produce
singur o imagine funcțională.

## De ce imaginea a coborât de la 1,6 GB la ~350 MB

|                          | Înainte                    | După                                |
| ------------------------ | -------------------------- | ----------------------------------- |
| `node_modules` în runner | 456 MB — installul complet | 246 MB — `bun install --production` |
| Imagine, total           | ~1,6 GB                    | ~350–400 MB                         |

Cauza era una singură: etapa `runner` prelua `node_modules` de la etapa de
build, unde `typescript`, `vite`, `drizzle-kit`, `prettier`,
`eslint` și `@inlang/paraglide-js` sunt obligatorii la compilare și nu au ce căuta în
producție. Etapa `prod-deps` rulează același install cu `--production`, pe
aceleași manifesturi.

E corect pentru că Vite externalizează **doar** pachete din `dependencies`; ce
e importat din `devDependencies` în `src/` (`bits-ui`,
`sveltekit-superforms`, `tailwind-merge`) ajunge înglobat în chunk-urile de
server și nu are nevoie de intrare în `node_modules` la runtime. `sharp` e
azi o intrare directă în `dependencies`, deci supraviețuiește trivial.

Reverificarea cifrei și a cauzei, după orice schimbare de dependențe:

```bash
docker build -t kogaion:local .
docker image inspect kogaion:local --format '{{.Size}}'
docker run --rm --entrypoint sh kogaion:local -c 'du -sh build build/client build/server node_modules'
```

Presupunerea de mai sus nu se verifică încă o dată la build, ci după: orice
import ne-relațional rămas în chunk-urile de server trebuie rezolvat din
`node_modules` la runtime, iar lista lor se extrage cu expresia din
`Dockerfile`:

```bash
docker run --rm --entrypoint sh kogaion:local -c "grep -rhoE \"from '[^.'][^']*'\" build/server | sort -u"
```

## De ce s-au eliminat cache mount-urile din `Dockerfile`

`RUN --mount=type=cache` era corect pe un server de build de odată și este
**exact zero** pe un runner GitHub. BuildKit nu păstrează cache mount-urile în
cache-ul `type=gha`.

`docker/setup-buildx-action` creează un builder nou, de tip
`docker-container`, în interiorul jobului; el este distrus când jobul se
termină. Un cache mount ține de builder, deci pornește gol la fiecare rulare.
Mai rău, e o capcană: face build-ul să _pare_ incremental în timp ce recompilă
tot.

Ce funcționează pe CI este cache-ul de **layere**:

```yaml
cache-from: type=gha,scope=kogaion-image
cache-to: type=gha,mode=max,scope=kogaion-image,ignore-error=true
```

`mode=max` pentru că exportă și etapele intermediare — inclusiv
`builder`, unde sunt toate minutele. `scope` nu e opțional: fără el se
folosește implicit literal `buildkit`, împărțit între toate workflow-urile și toate
ramurile din repository. `ignore-error=true` pentru că scrierea cache-ului nu e
pe drumul critic: ea poate eșua _după_ ce imaginea a fost deja publicată (token
de cache read-only pe trigger-uri neîncrezute, `error writing layer blob`). Un
cache vechi costă un build lent; un push eșuat costă deploy-ul.

## O singură platformă, declarată explicit

```yaml
platforms: linux/amd64
```

O imagine pe care serverul Coolify nu o poate rula eșuează la pull, **în
producție**, care e cel mai prost loc posibil. Nu se folosește `linux/arm64`
aici: build-urile ar rula sub QEMU, cu un build de câteva ori mai lent, pentru
o platformă pe care nu se livrează nimic.

Cache-ul e **un singur scope**, `kogaion-image`, nu unul per ramură — și aici
nu e o optimizare, e o simplificare: există o singură ramură. Stratul de
dependențe e oricum byte-identic, iar `mode=max` exportă și întregul arbore
`build/`, toate împărțind aceeași cotă de 10 GB a repository-ului. GitHub
restricționează deja accesul la cache la ramura curentă, cea de bază și cea
implicită, deci izolarea pe care ar cumpăra-o un al doilea scope există deja.

## Ce _nu_ face pipeline-ul, și e o decizie

- **Nu rulează migrări.** Runner-ul copiază doar `build/` și
  `node_modules/` de producție: `drizzle-kit` e `devDependency` și nu ajunge în
  imagine, iar directorul `drizzle/` nu e copiat în runner. Migrările rămân un
  pas operator dintr-un checkout real, cu `DATABASE_URL` de producție. Vezi
  secțiunea de mai jos.
- **Nu rulează smoke test cu `docker run`.** `initAuth()` din
  `src/hooks.server.ts` verifică `DATABASE_URL`, `ORIGIN` și
  `BETTER_AUTH_SECRET` și **aruncă** la pornire dacă lipsesc — deci un smoke
  test ar cere toate secretele de producție în CI, ca să verifice un proces
  care oricum pornește sau nu pornește. Iar `/api/health` nu atinge baza de
  date și întoarce mereu 200: ar dovedi că `bun` poate porni un proces. În
  schimb, `build` verifică contractul artefactului, partea care prinde
  efectiv ruperea.
- **Nu rulează teste.** Zero în repository; vezi secțiunea de mai sus.
- **Nu are două medii.** Nu `staging`, nu `production`: o ramură, o resursă
  Docker Image, un singur domeniu. Nu se aplică aici nimic din ce se
  construiește în jurul unei perechi staging/production — și niciun build arg
  public, pentru că proiectul nu are nimic public la build.
- **Nu șterge tag-uri vechi din GHCR.** O retenție automată care șterge greșit
  e mai rău decât tag-uri în plus. Comanda manuală e în
  [07-probleme.md](07-probleme.md).

## Cea mai mare lacună rămasă: migrările

Job-ul `schema` verifică că nu există drift între
`src/lib/server/db/schema.ts` și `drizzle/`. **Nu aplică** migrările în
producție. Astfel, un commit care adaugă o coloană ajunge live înainte ca baza
să o aibă, și eșuează ca o eroare Postgres la runtime, de obicei pe un cod pe
care nimeni nu l-a exersat.

Problema nu poate fi rezolvată corect în `ci.yml` fără o decizie care ține de
altceva: cine deține `DATABASE_URL` de producție la momentul migrării, și ce
se întâmplă cu o migrare care eșuează la jumătate după ce containerul nou
pornește. Cât timp răspunsul nu e scris, migrarea manuală din
[`docs/DB_AND_ADMIN.md`](../DB_AND_ADMIN.md) e corectă — dar e un pas uman, și
asta e exact ce face pipeline-ul imperfect, nu documentul.
