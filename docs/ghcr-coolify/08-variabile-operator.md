# 08 — Variabile: pipeline și operator

Un singur loc care spune ce trebuie setat, unde, și ce se strică dacă lipsește.
Împărțirea care contează, pentru că fiecare compartiment se schimbă la alt ritm:

| Unde                                                         | Cine le pune                   | Ce se schimbă fără rebuild                 |
| ------------------------------------------------------------ | ------------------------------ | ------------------------------------------ |
| **Variabile GitHub** — _nu există_                           | —                              | —                                          |
| **Secrete GitHub Environment** (`production`)                | un operator, din UI, la rotire | pipeline-ul, la următoarea rulare          |
| **Variabile Coolify** (Environment Variables, toate Runtime) | un operator, din panou         | containerul, la următorul Restart/Redeploy |
| **Variabile de shell** pentru scripturi                      | un operator, la rulare         | doar ieșirea scriptului                    |

## Variabile GitHub — nivel repository: **zero**

Nu există **nicio** variabilă de repository. Nu `KOGAION_COOLIFY_URL`, nu
`KOGAION_APP_UUID`, nu `KOGAION_PUBLIC_URL`. Tab-ul **Variables** al repository-ului
rămâne gol, și nu e o omisiune.

Rădăcina panoului și uuid-ul resursei se extrag **ambele** din linkul de webhook,
cu `sed`, la începutul jobului:

```bash
COOLIFY_URL="$(printf '%s' "$DEPLOY_WEBHOOK" | sed -nE 's#^(https?://[^/]+)/api/v1/deploy\b.*#\1#p')"
APP_UUID="$(printf '%s' "$DEPLOY_WEBHOOK" | sed -nE 's#.*[?&]uuid=([A-Za-z0-9-]+).*#\1#p')"
```

E o simplificare **deliberată** față de designul MedPaz, unde ținta se configura în
două locuri — un link de webhook și o variabilă cu uuid-ul — iar o resursă
schimbată în panou cu un link uitat lăsa pipeline-ul să apleze spre gol, fără niciun
erroare vizibilă.

| Ce se schimbă                          | Cu variabile                                      | Cu link în secret |
| -------------------------------------- | ------------------------------------------------- | ----------------- |
| Locuri în care ținta e scrisă          | **două**                                          | **unul**          |
| Ce se întâmplă dacă resursa e recreată | uiți un link, uiți o variabilă                    | uiți un link      |
| Poate diverge în tăcere                | **da**                                            | **nu**            |
| Costul                                 | un apel în plus la fiecare deploy, ca să verifici | niciunul          |

### De ce nu mai există descoperirea după domeniu

Proiectul are **o singură** resursă Docker Image și **un singur** domeniu. Potrivirea
după domeniu nu elimina nicio ambiguitate: costa un `GET /api/v1/applications` la
fiecare deploy, un `jq` cu potrivire parțială, și două clase de eșec care n-ar fi
apărut niciodată — „nicio resursă nu servește …” și „mai mult de una servește …”.
Un uuid scris în link nu poate fi greșit prin potrivire.

| Verificare                              | Rezultat așteptat                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Tab-ul **Variables** al repository-ului | **gol**                                                                                    |
| Linkul din secret                       | începe cu `https://`, conține `/api/v1/deploy?uuid=` și `&force=false`                     |
| uuid-ul din el                          | litere mici și cifre, 8–40 de caractere — Coolify **nu** folosește forma UUIDv4 cu liniițe |

## Secrete GitHub Environment

**Un** environment, `production`, cu **două** secrete. Nu se aplică aici un mediu
`staging`: proiectul are o singură ramură și o singură resursă, deci un al doilea
environment ar izola exact nimic și ar crea iluzia unei protecții.

| Nume                     | Mediu        | Ce e                                                                                                 |
| ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------- |
| `KOGAION_DEPLOY_WEBHOOK` | `production` | linkul copiat din panou, la resursa ta → Configuration → Webhooks → „Deploy Webhook (auth required)” |
| `KOGAION_COOLIFY_TOKEN`  | `production` | token API Coolify, **read + write + deploy**                                                         |

### De ce sunt două secrete, și nu unul care le conține pe amândouă

Pentru că sunt două lucruri diferite, cu vieți diferite:

|                              | Linkul                     | Tokenul                            |
| ---------------------------- | -------------------------- | ---------------------------------- |
| Ce face                      | **identifică ținta**       | **autorizează acțiunea**           |
| Se schimbă când              | schimbi resursa sau panoul | expiră, îl rotești, schimbi parola |
| Se poate genera din celălalt | **nu**                     | **nu**                             |

Coolify autentifică deploy-ul prin headerul `Authorization: Bearer`, nu prin query
string. Query string-ul identifică ținta; headerul autorizează acțiunea:

> The URL identifies the deployment target, but the Bearer token authorizes the
> action.
> — documentația Coolify, pagina deploy webhooks

Deci un token în URL n-ar autentifica nimic, iar un link în secret ar ține minte de
două ori același uuid.

Cele trei permisiuni ale tokenului, fiecare cu rolul ei:

| Permisiune | Ce face fără ea                                                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read`     | `GET /api/v1/applications/<uuid>` e refuzat, deci jobul nu își verifică ținta înainte să scrie ceva                                                                                                                                             |
| `write`    | nu fixează digestul: `PATCH` cu `docker_registry_image_tag` e refuzat, iar resursa rămâne pe ce era — corectitudinea deploy-ului depinde atunci de faptul că Coolify rezolvă din nou un tag mutător, adică de propagarea CDN-ului registry-ului |
| `deploy`   | `POST` pe linkul de webhook nu pornește nimic                                                                                                                                                                                                   |

Un token doar-`deploy` nu ajunge: nu poate nici citi resursa, nici fixa digestul.
Costă un permisiu în plus și cumpără eliminarea singurului drum de eșec tăcut din
pipeline.

> **Environment-ul trebuie creat EXPLICIT**, înainte de primul deploy. Un job creează
> automat un Environment lipsă — fără revieweri, fără restricții de ramură — deci o
> praxisă omisă ar transforma poarta în decor: jobul trece, și nimeni nu a văzut o
> decizie umană.

Singurul avantaj real al unui Environment aici: **niciunul** dintre cele două secrete
nu ajunge la `check`, `lint`, `schema`, `build` și `image`. Doar jobul `deploy` le
vede.

## Variabile Coolify — toate Runtime, niciuna Build Variable

Nimic nu se construiește pe panou, deci un Build Variable n-ar avea ce injecta și
ar creea doar o cale prin care un secret ajunge în istoricul imaginii. Pentru
motivul complet, vezi [02-variabile-de-construit.md](02-variabile-de-construit.md);
pentru câmpurile panoului, [03-configurare-coolify.md](03-configurare-coolify.md).

| Nume                                                  | Rol                                              | Ce se strică dacă lipsește                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                        | Internal URL-ul resursei Postgres din Coolify    | obligatoriu. `initAuth()` din `src/hooks.server.ts` îl verifică și aruncă la pornire. Fără el, `src/lib/server/db/index.ts` cade **tăcut** pe `postgres://localhost:5432/kogaion`, deci o lipsă arată ca „site fără conținut”, nu ca o eroare de configurare. Nu adăuga `?sslmode=disable`: postgres.js citește parametrul ca „negociază TLS” și pică la serverele plaintext |
| `ORIGIN`                                              | originul public, identic cu domeniul din Coolify | obligatoriu. `initAuth()` îl verifică și aruncă: fără el procesul moare cu `exit 1`. Cu el **greșit**, nu apare nicio eroare la pornire — `adapter-node` deduce protocolul din headerele cererii, fixează `https`, și fiecare POST de formular răspunde 403 `Cross-site POST form submissions are forbidden`                                                                 |
| `BETTER_AUTH_SECRET`                                  | semnarea sesiunilor, minimum 32 de caractere     | obligatoriu. `initAuth()` îl verifică și aruncă; cine are cheia poate forja o sesiune. `/api/health` îl raportează în `checks.authSecret.healthy`, cu lista de probleme                                                                                                                                                                                                      |
| `GOOGLE_CLIENT_ID`                                    | client ID Google OAuth                           | obligatoriu pentru funcționare, dar **neverificat la pornire**: `getAuth()` trece `?? ''`, deci procesul urcă normal și eșuează doar la primul login                                                                                                                                                                                                                         |
| `GOOGLE_CLIENT_SECRET`                                | client secret Google OAuth                       | idem                                                                                                                                                                                                                                                                                                                                                                         |
| `PUBLIC_SITE_URL`                                     | bază canonică pentru URL-uri absolute de media   | recomandat. Fără el se folosește `ORIGIN`; fără ambele, adresele absolute pentru fișiere nu se pot construi                                                                                                                                                                                                                                                                  |
| `SEED_ADMIN_SECRET`                                   | secretul lui `POST /api/seed-admin`              | opțional. Fără el endpointul răspunde 403 `SEED_ADMIN_SECRET not set`                                                                                                                                                                                                                                                                                                        |
| `GA4_MEASUREMENT_ID` + `GA4_API_SECRET`               | Measurement Protocol, server-side                | opționale, **împreună sau deloc**: `sendGa4Events()` întoarce imediat dacă lipsește oricare                                                                                                                                                                                                                                                                                  |
| `NODE_ENV`                                            | —                                                | **NU se setează.** Runner-ul pornește deja cu `NODE_ENV=production`. Setat pe `development`, verificarea de secret din `/api/seed-admin` sare, iar endpointul devine o escaladare de rol deschisă din internet                                                                                                                                                               |
| `RESEND_API_KEY`, `SMTP_URL`, `INVITE_MAIL_TRANSPORT` | —                                                | **nu se configurează**, și nici nu ajută: singurul lor efect este `hasMailTransport` în `admin/team/+page.server.ts`, care schimbă doar un mesaj de avertizare. `INVITE_MAIL_TRANSPORT` e citit ca boolean, fără valoare de transport, și în proiect **nu există cod de trimitere email**                                                                                    |
| `BETTER_AUTH_URL`                                     | —                                                | **nu se configurează**: variabilă moartă, eliminată. Zero citiri în `src/`; `baseURL` vine din `ORIGIN`                                                                                                                                                                                                                                                                      |

`/api/health` nu atinge baza de date și aruncă mereu `200`. El dovedește că
procesul stă în picioare și numește build-ul (`commit`, `version`, `startedAt`,
`uptime`) — **nu** că PostgreSQL răspunde.

## Variabile de shell, pentru scripturi

Nu sunt secrete GitHub; sunt secrete de sesiune. Nu le pune într-un `.env`
versionat și nu le lăsa în shell history.

| Variabilă               | Folosită de                        | Obligatorie                                                               | Implicit                                                                        |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `REGISTRY_USERNAME`     | `login-registry.sh`                | da                                                                        | —                                                                               |
| `REGISTRY_TOKEN`        | `login-registry.sh`                | da — token **clasic**, scope `read:packages`                              | —                                                                               |
| `IMAGE`                 | `login-registry.sh`, `rollback.sh` | nu                                                                        | `ghcr.io/mirelconstantin/kogaionacademy.ro`                                     |
| `TAG`                   | `login-registry.sh`                | nu                                                                        | `main` — singura ramură, deci singurul tag mutător                              |
| `KOGAION_COOLIFY_URL`   | `rollback.sh`                      | da                                                                        | — fără `/api/v1`; scriptul îl verifică și spune dacă l-a rescris                |
| `KOGAION_COOLIFY_TOKEN` | `rollback.sh`                      | da                                                                        | —                                                                               |
| `COOLIFY_APP_FQDN`      | `rollback.sh`                      | da — domeniul servit, ex. `kogaionacademy.ro`. Fără `https://`, fără path | uuid-ul e descoperit din el; zero sau mai mult de una potrivire opresc scriptul |
| `ROLLBACK_TO`           | `rollback.sh`                      | da — tag `:sha-<commit>`, referință completă, sau digest                  | —                                                                               |
| `HEALTH_URL`            | `verify-deploy.sh`                 | nu                                                                        | `https://kogaionacademy.ro/api/health`                                          |
| `EXPECTED_DIGEST`       | `verify-deploy.sh`                 | **da, în practică**                                                       | acceptă `sha256-<hex>`, `sha256:<hex>`, `@sha256:<hex>` sau hex simplu          |
| `CURL_MAX_TIME`         | `verify-deploy.sh`                 | nu                                                                        | `15`                                                                            |

`REGISTRY_USERNAME` și `REGISTRY_TOKEN` sunt pentru `docker login` **pe
server**, ca utilizatorul SSH cu care rulează Coolify — acolo unde trage
imaginea. **Nu sunt pentru CI**: în workflow, `docker/login-action` folosește
`secrets.GITHUB_TOKEN`, cu scope `packages: write` pe jobul `image`, și
`image` nu rulează pe `pull_request`, ca un fork să nu poată scrie în
registry-ul acestui repository.

`verify-deploy.sh` nu citește **niciuna** dintre variabilele Coolify: primește
doar `HEALTH_URL`, `EXPECTED_DIGEST` și `CURL_MAX_TIME`, și nu atinge API-ul
panoului. `rollback.sh` citește în plus `POLL_TIMEOUT` (implicit `900`).

```bash
# pe server, ca utilizatorul SSH al lui Coolify
REGISTRY_USERNAME=... REGISTRY_TOKEN=... bash docs/ghcr-coolify/scripts/login-registry.sh
```

## Secrete care NU mai sunt folosite

| Nume vechi                 | De ce a dispărut                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_WEBHOOK`           | URL-ul de webhook cu `?uuid=` a fost înlocuit cu apeluri API explicite, care fixează digestul înainte de deploy |
| `EASYPANEL_DEPLOY_WEBHOOK` | alias dintr-o platformă care nu mai e folosită                                                                  |
| `ENABLE_IMAGE_BUILD`       | comutatorul care lăsa build-ul pe server                                                                        |
| `EXPECTED_IMAGE_PATTERN`   | înlocuit cu `EXPECTED_DIGEST`: un tipar de nume nu poate deosebi `:main` de `:main` de acum trei ore            |

Dacă vreunul există încă în repository sau în secretele vechi, **șterge-l**. Un
secret orfan e un secret pe care nimeni nu îl mai rotește — iar rotația e singura
protecție reală.

## Rotația

| Secret                   | De ce                                                                           | Cum                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KOGAION_COOLIFY_TOKEN`  | are expirare; când expiră, **fiecare** deploy eșuează cu `401`                  | alege **30–90 de zile** din variantele `7/30/60/90` de zile, `1 an` sau `Never`; creează unul nou în Keys & Tokens, actualizează environment-ul `production`, revocă pe cel vechi |
| `REGISTRY_TOKEN`         | la fel — expirarea lui face ca pull-ul să eșueze în deploy, nu la autentificare | `https://github.com/settings/tokens/new`, fără `?type=fine-grained`, scope `read:packages`, apoi `docker logout ghcr.io && docker login` pe server                                |
| `BETTER_AUTH_SECRET`     | cine are cheia poate forja o sesiune de admin                                   | vezi rotația completă în [`docs/DB_AND_ADMIN.md`](../DB_AND_ADMIN.md)                                                                                                             |
| `KOGAION_DEPLOY_WEBHOOK` | nu expiră, dar devine invalid **în tăcere** dacă resursa e ștearsă sau recreată | recapează din panou → resursa ta → **Configuration → Webhooks** → „Deploy Webhook (auth required)”, apoi actualizează secretul                                                    |

Două revocări pe care nu le declanșează tu, și de aceea nici nu le vezi în panoul
de secrete:

| Eveniment                                 | Efect                                         |
| ----------------------------------------- | --------------------------------------------- |
| schimbarea parolei utilizatorului Coolify | revocă **toate** tokenurile acelui utilizator |
| eliminarea utilizatorului din echipă      | revoca tokenurile de echipă ale acelei echipe |

Pun un calendar reminder pe expirarea tokenului Coolify. Nu pentru că expirarea e
subtilă — pentru că e un `401` la ora 9 dimineața într-o zi fără motiv vizibil.

### De ce rotirea tokenului nu atinge linkul

Sunt **independente prin construcție**, și asta e toată pointul separării în două
secrete:

| Operație                                                         | Ce atingi                         | Ce **nu** atingi           |
| ---------------------------------------------------------------- | --------------------------------- | -------------------------- |
| rotirea tokenului (expirat, revocat, rotit din cauză de angajat) | doar `KOGAION_COOLIFY_TOKEN`      | **linkul**                 |
| schimbarea resursei (recreeată, mutată)                          | doar `KOGAION_DEPLOY_WEBHOOK`     | **tokenul**                |
| schimbarea panoului                                              | doar linkul — hostname-ul e în el | tokenul, dacă nu a expirat |

Așadar o rotație de token e o operație de **cinci secunde** și nu te duce în panou.
Dacă ar fi fost un singur secret, aceeași rotație ar fi cerut un drum în panou
pentru un lucru care nu avea niciun motiv să se schimbe.

Direcția inversă e la fel de simplă: **regenerarea linkului nu invalidează tokenul.**
Deci dacă resursa e recreată, iei linkul nou și schimbi un singur secret — tokenul
merge în continuare, pentru că el autorizează acțiunea, nu identifică ținta.

Procedura de punere în picioare, cu verificare după fiecare pas, e în
[04-prima-o-data.md](04-prima-o-data.md); rollback-ul, în
[06-rollback.md](06-rollback.md).
