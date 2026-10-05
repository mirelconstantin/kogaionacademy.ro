# CI/CD — build în GitHub, deploy din registry

Regula pe care se construiește tot ce urmează:

> **Serverul de producție nu construiește nimic.**
> GitHub Actions este singurul loc unde se produce o imagine kogaionacademy.ro.
> Coolify _trage_ un artefact finit, identificat prin digest.

Tot ce ai nevoie să configurezi, înțelegi sau reiei pipeline-ul este în
folderul acesta. Fiecare document spune **ce**, **de ce** și **ce se strică
dacă nu e așa**.

| Document                                                     | De ce îl citești                                                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [01-arhitectura.md](01-arhitectura.md)                       | Fluxul complet, graful de job-uri, contractul dintre `ci.yml` și `Dockerfile`. Citește-l primul.                             |
| [02-variabile-de-construit.md](02-variabile-de-construit.md) | Ce se poate seta la build și ce **nu** se poate. Singurul build arg cu valoare utilă este `GIT_SHA`; tot restul e runtime.   |
| [03-configurare-coolify.md](03-configurare-coolify.md)       | Fiecare câmp din panou, cu valoarea și motivul.                                                                              |
| [04-prima-o-data.md](04-prima-o-data.md)                     | Checklist-ul de pus în picioare de la zero, în ordine, cu verificare după fiecare pas.                                       |
| [05-verificare.md](05-verificare.md)                         | Cum afli _ce rulează acum cu adevărat_ — și cum demonstrezi că deploy-ul a fost cel nou.                                     |
| [06-rollback.md](06-rollback.md)                             | Înapoi în timp în două minute, prin API, fără să bați cu degetul în câmpuri.                                                 |
| [07-probleme.md](07-probleme.md)                             | Tabelul de simptome → cauză → reparare.                                                                                      |
| [08-variabile-operator.md](08-variabile-operator.md)         | Fiecare variabilă a pipeline-ului într-un singur loc: unde se pune, cine o folosește, și ce se strică dacă lipsește.         |
| [09-portabilitate.md](09-portabilitate.md)                   | **Aplică tot pattern-ul la alt proiect.** Ce copiez, ce înlocuiesc, setup-ul în ordine și toate bug-urile întâlnite pe rând. |

Trei scripturi stau lângă documente, în `scripts/`, și rulează **pe serverul de
deploy**, ca utilizatorul sub care Coolify face SSH:
[`login-registry.sh`](scripts/login-registry.sh) — chiar poate hostul să
atingă GHCR? [`verify-deploy.sh`](scripts/verify-deploy.sh) — ce rulează acum,
cu adevărat? [`rollback.sh`](scripts/rollback.sh) — înapoi în timp, prin API.

## Ce NU este aici, și de ce

| Absent                                 | Motiv                                                                                                                                                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deploy.yml` de exemplu                | Nu a existat nici înainte de portare. Un workflow duplicat în folderul de documentație ar fi nevăzut de Actions și ar fi o a doua cale de deploy, concurentă cu `ci.yml`. Pipeline-ul real este **un singur** fișier: `.github/workflows/ci.yml`.                                  |
| `local-rehearsal/`                     | Nu a existat nici aici. Rumea un registry Docker local și construia o imagine de test: nu exersează nici GitHub Actions, nici Coolify, nici GHCR — testează `registry:2` cu `alpine`, adică exact lucrurile care nu se schimbă. Nu construim local.                                |
| `.env.example` duplicat în folder      | Nu a existat nici aici. Există **un singur** `.env.example`, în rădăcină, și el nu ajunge în contextul de build. Credentialele pipeline-ului sunt **variabile și secrete GitHub**, nu fișiere pe un disk.                                                                          |
| Mediu `staging`, ramură secundară      | **Nu se aplică aici.** Repo-ul public are o singură ramură, `main`, fără staging: nu există nimic de promovat între medii, iar `:main` nu este o etapă, este ținta.                                                                                                                |
| `NEXT_PUBLIC_*`, `NEXT_PUBLIC_APP_URL` | **Nu se aplică aici.** Proiectul are zero `$env/static/*`, zero `$env/dynamic/public`, zero `import.meta.env`. Niciun build arg nu conține o valoare publică, deci nu are ce echivalent să aibă `NEXT_PUBLIC_APP_URL`; adresa vine la runtime, prin `ORIGIN` și `PUBLIC_SITE_URL`. |
| `next-intl`                            | **Nu se aplică aici.** i18n-ul este `paraglide-js`, compilat în `buildStart()`. Nu există middleware de locale și nici prefix de limbă în URL.                                                                                                                                     |
| Build local prin Docker                | Nu este calea suportată. `Dockerfile`-ul e construit doar de `ci.yml`.                                                                                                                                                                                                             |

## Numerele care contează

|                    |                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Imagine            | `ghcr.io/mirelconstantin/kogaionacademy.ro`                                                                                 |
| Tag mutător        | `:main` (singura ramură) — pentru privire umană și redeploy manual din panou                                                |
| Tag de commit      | `:sha-<commit pe 40 de caractere>` — ținta de rollback; imutabil **prin convenție de CI**, nu prin garanție a registry-ului |
| Ce fixează Coolify | **digestul**, nu tagul: `sha256-<64 hex>` cu **linie**, fără `:`, stocat în `docker_registry_image_tag`                     |
| Workflow           | `.github/workflows/ci.yml`, job-ul `image`                                                                                  |
| Port expus         | `3000` — resursele Docker Image pornesc pe 80 implicit                                                                      |
| Health check       | `HEALTHCHECK` din imagine, pe `GET /api/health`, scris cu `bun -e` + `fetch`                                                |

De ce probe-ul e scris în bun și nu în node: `oven/bun:1.3.14` este Debian 13
(trixie), **nu** alpine, și nu conține `node`, `curl`, `wget` sau `busybox`.
Un `node -e` — exact ce arată documentația SvelteKit — nu pornește într-o
imagine construită astfel.

## Cum se diferențiază de MedPaz

| În MedPaz                     | Aici                                                              | De ce contează                                                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js                       | SvelteKit 2 + Svelte 5, `adapter-node`                            | Nu există `NEXT_PUBLIC_*` și nu există build arg cu valoare publică. Aplicația citește doar `process.env` la runtime, deci imaginea nu conține adresa site-ului și nici nu poate.                              |
| `main` + `staging`            | o singură ramură, `main`                                          | Nu există promotion între medii și nu există tag `:staging`. `:main` este simultan ținta de deploy și ultima referință de diagnostic, nu o etapă intermediară.                                                 |
| Build arg cu valoare publică  | doar `GIT_SHA` și `IMAGE_CREATED`, amândoi pentru `LABEL`-uri OCI | Singurele build arg-uri sunt metadate de trasabilitate. Niciun secret nu este `ARG`, pentru că `docker history` le tipărește în clar, iar CI trimite `provenance: mode=max`.                                   |
| imagine de ~170 MB            | **~350–400 MB**                                                   | `static/` (235 MB) ajunge obligatoriu în `build/client/`, iar runner-ul primește `node_modules` de producție în locul installului complet. Nu se poate îngusta fără să elimini conținut servit utilizatorului. |
| Alpine, cu `wget` la îndemână | Debian 13, fără niciun client HTTP                                | Un health check de panou construit pe `wget` marchează drept unhealthy un container complet sănătos și declanșează rollback. Deci health check-ul din panou rămâne **OFF**.                                    |

## Relația cu restul documentației

[`docs/DB_AND_ADMIN.md`](../DB_AND_ADMIN.md) rămâne ghidul operațional: baza de
date, migrările, seed-ul de administrator. Acest folder descrie **doar** traseul
imaginii: unde se construiește, cine o publică și cum ajunge în container.

**Nu există `DEPLOY.md` aici**, pentru că nu are ce adăuga. Nu am creat un ghid
paralel: a doua listă de proceduri se desincronizează de prima, iar când se
contrazic nimeni nu mai știe care are dreptate. Dacă totuși apare o contradicție,
trată asta ca pe un bug de documentație și corectează ambele în același commit.

## O întrebare pe care ar trebui să știi răspunsul fără să deschizi nimic

Dacă peste șase luni apare întrebarea _„de unde vine codul care rulează
acum?”_, răspunsul se verifică în două comenzi:

```bash
docker inspect --format '{{index .RepoDigests 0}}' `<container>`
```

și se compară cu digestul din pasul **„Record what was published”** al job-ului
`image` (vizibil în _Step summary_ al rulării CI). Un tag mutător precum
`:main` nu poate răspunde la întrebare: până citești, poate arăta deja în altă
parte.

Există și un răspuns mai ieftin, din interior: `GET /api/health` întoarce
`commit`, prins din `GIT_SHA` la build. Dar endpointul nu atinge baza de date și
aruncă întotdeauna `200` — el dovedește că procesul stă în picioare și numește
build-ul, **nu** că PostgreSQL răspunde. Un container care arată sănătos cu
`/api/health` și cu baza de date căzută este exact cazul pe care un health check
bazat pe acest endpoint nu îl prinde.

> **Atenție:** în acest repo `docs/` este versionat în întregime — `.gitignore`
> nu conține nicio regulă de tip vault Obsidian, deci acest runbook urcă în Git
> odată cu codul. Ce **nu** ajunge în imagine e altă regulă, din
> `.dockerignore`: `docs/` și `*.md` sunt excluse din build context, pentru că
> nu participă la `vite build`. Un runbook care există doar pe un laptop nu este
> un runbook; un folder de documentație de 200 MB în contextul de build este o
> slăbiciune.
