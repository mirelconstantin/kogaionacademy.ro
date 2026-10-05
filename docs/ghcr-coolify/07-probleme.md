# 07 — Probleme

Tabelul de mai jos e primul loc în care te uiți. Fiecare rând e un simptom pe
care l-ai observat deja, cauza lui, și ce se schimbă concret ca să-l rezolvi.

Dacă simptomul tău nu e aici, secțiunile de după tabel dezvoltă cazurile care
merită mai mult decât un rând — în special **CI verde, site-ul vechi**, care
e singurul simptom în care pipeline-ul nu te avertizează.

Proiectul are **o singură ramură** (`main`), **o singură resursă** Coolify de tip
Docker Image și **un singur domeniu**. De aceea nimic din tabel nu vorbește despre
alegerea între două medii: fiecare cauză e despre _această_ resursă.

| #   | Simptom                                                                                  | Cauză                                                                                                                                                        | Reparare                                                                                     |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 1   | `503` la domeniu, containerul arată healthy                                              | Ports / Exposes e 80 (implicit pentru resurse Docker Image), aplicația ascultă pe 3000                                                                       | pune `3000` în Ports / Exposes și redeploy                                                   |
| 2   | `error from registry: unauthorized` în logul de deployment                               | serverul nu are credentiale pentru `ghcr.io`, sau le are pe cele ale unui token revocat, **pentru utilizatorul SSH exact al lui Coolify**                    | logout, apoi login cu un PAT **clasic** nou, ca acel utilizator                              |
| 3   | `manifest unknown`                                                                       | Coolify e configurat pe un tag pe care nimic nu îl publică — acest pipeline nu publică niciodată `latest`                                                    | fixează pe digest; confirmă ținta cu `scripts/rollback.sh` înainte                           |
| 4   | `denied: denied` de la GHCR                                                              | token **expirat sau revocat** — altă eroare decât `unauthorized: authentication required`                                                                    | revocă și reemite un PAT clasic cu `read:packages`, login din nou, redeploy                  |
| 5   | CI verde, site-ul arată în continuare versiunea anterioară                               | digestul fixat e altul, propagarea tag-ului în GHCR, sau cache de browser/CDN                                                                                | secțiunea 5, în ordine                                                                       |
| 6   | Jobul `deploy` pică cu `::error::missing: KOGAION_DEPLOY_WEBHOOK` sau `…COOLIFY_TOKEN`   | secretele trăiesc în repository, nu în environment-ul `production` pe care jobul l-a selectat                                                                | adaugă **ambele** în environment-ul `production`                                             |
| 7   | Jobul `deploy` pică la pasul PATCH, cu o eroare de validare                              | formatul digestului: Coolify îl stochează `sha256-<64 hex>`, **cu linie**, fără colon                                                                        | conversia e chiar în pipeline; vezi secțiunea 7                                              |
| 8   | Jobul `deploy` pică cu `Coolify answered 403`                                            | API Access e OFF la Settings → Configuration → Advanced, sau IP-ul runnerului nu e în Allowed IPs                                                            | pornește API Access și lasă **gol** câmpul de IP-uri; vezi secțiunea 8                       |
| 9   | Jobul `deploy` pică cu `Coolify answered 401`                                            | tokenul lipsește, e greșit, a expirat sau a fost revocat                                                                                                     | token nou, cu read + write + deploy; vezi secțiunea 9                                        |
| 10  | Jobul `deploy` se oprește cu „did not reach a terminal state"                            | pollerul așteaptă `successful`, care **nu există** în enum-ul Coolify                                                                                        | terminalele sunt `finished`, `failed`, `cancelled-by-user`; vezi secțiunea 10                |
| 11  | Jobul `deploy` pică cu „the panel accepted the deploy request but created no deployment" | `deployment_uuid` e **nested**, la `.deployments[0].deployment_uuid`, nu la nivelul de jos                                                                   | citește-l din `deployments[0]`; vezi secțiunea 11                                            |
| 12  | Deploymentul se încheie failed imediat după `Pulling latest images from the registry.`   | pull-ul din registry a eșuat — de obicei credentiale                                                                                                         | eroarea e în **logul de deployment**, nu în log-urile de runtime                             |
| 13  | `New container is not healthy, rolling back to the old container`                        | două cauze distincte: healthcheck HTTP din panou fără client HTTP în imagine, sau aplicația nu pornește                                                      | **nu** instala `curl`; vezi secțiunea 13                                                     |
| 14  | Crash-loop cu `Missing required environment variable(s): ...`                            | variabila lipsește, sau a fost pusă ca **build argument** — proiectul citește exclusiv din `process.env`                                                     | pune-o în Coolify ca variabilă de **Runtime**, apoi Restart                                  |
| 15  | `403` pe POST-uri, cu `Cross-site POST form submissions are forbidden`                   | `ORIGIN` e greșit: SvelteKit compară headerul `origin` cu origin-ul serverului                                                                               | `ORIGIN` exact origin-ul public, cu `https://`; vezi secțiunea 15                            |
| 16  | `curl: not found` sau `bun: command not found` în logul de healthcheck                   | ai activat healthcheck-ul din panou; imaginea nu are client HTTP                                                                                             | **dezactivează** healthcheck-ul din panou: imaginea are deja `HEALTHCHECK`                   |
| 17  | Containerul rulează ca `root`                                                            | imaginea publicată nu mai are `USER 1001:1001`, sau panoul rescrie utilizatorul                                                                              | verifică cu `docker exec <container> id`; vezi secțiunea 17                                  |
| 18  | Imaginea e foarte mare, deploy-ul e lent                                                 | `node_modules` cu devDependencies ajungea în runner: ~1,6 GB înainte de optimizare                                                                           | stadiu `prod-deps` cu `bun install --production --frozen-lockfile` → ~350–400 MB             |
| 19  | `no matching manifest for linux/arm64-v8`                                                | serverul Coolify nu e amd64, iar CI publică doar `linux/amd64`                                                                                               | nu se repară din panou — se repară în workflow, cu build QEMU                                |
| 20  | Cota GHCR plină, lista de tag-uri e ilizibilă                                            | GHCR nu are TTL pentru tag-urile de imagine; fiecare tag `sha-` e stocare permanentă                                                                         | secțiunea 20 — comenzi manuale, cu avertisment                                               |
| 21  | Rollback-ul „a reușit", dar site-ul arată tot versiunea nouă                             | rollback-ul a fixat un digest și a deployat, iar **rularea CI următoare a fixat din nou înainte**                                                            | verifică cu `scripts/verify-deploy.sh` **imediat** după rollback                             |
| 22  | Link de webhook greșit, sau secret vechi                                                 | `KOGAION_DEPLOY_WEBHOOK` copiat de pe o resursă ștearsă sau de pe alt panou (404), sau tăiat (nu e `https://…/api/v1/deploy?…`), sau tokenul a expirat (401) | recapează linkul din Configuration → Webhooks; tokenul se rotește separat; vezi secțiunea 22 |

---

## 1. `503` la domeniu, containerul arată healthy

Cauza: **Ports / Exposes e 80**. Resursele Docker Image pornesc pe 80 implicit,
iar aplicația ascultă pe 3000 — `ENV PORT=3000` și `HOST=0.0.0.0` în `Dockerfile`.

> Port expus | `3000` — resursele Docker Image pornesc pe 80 implicit
> — [README.md](README.md), „Numerele care contează"

Reparare: `3000` în Ports / Exposes, apoi redeploy.

De ce e înșelător: containerul e healthy **corect** — el chiar ascultă. Proxy-ul
forwardează către un port pe care nu există proces. Un `503` de la un container
healthy nu înseamnă niciodată „aplicația a căzut".

## 2. `error from registry: unauthorized`

Cauza: serverul de deploy nu are credentiale pentru `ghcr.io`, sau le are pe
cele ale unui token revocat, **pentru utilizatorul exact sub care Coolify
rulează Docker** (panou → Servers → serverul tău → General → SSH user).

> Run it on the deploy host, over SSH, as the exact user the panel runs Docker
> as. Coolify never logs in on your behalf: deploying a "Docker Image" resource
> makes it shell out to the docker CLI on the server, and that CLI reads
> credentials from the HOME directory of the user who owns the process.
> — `scripts/login-registry.sh`

Reparare, în această ordine:

```bash
docker logout ghcr.io
printf '%s' "$REG_TOKEN" | docker login ghcr.io \
  --username "$REGISTRY_USERNAME" --password-stdin
```

Tokenul trebuie să fie **clasic**, cu scope `read:packages`. Un fine-grained PAT
nu are, la rădăcină, niciun scope de Packages — nu poate trage nimic, oricât
altceva i s-ar fi acordat. După login, rulează `scripts/login-registry.sh` și cere
linia `RESULT: PASS (5 of 5 checks passed)`: logout-ul uneori nu șterge entry-ul
vechi, iar `docker login` singur poate păstra o autentificare memorată într-un
credential helper.

O precizare care taie jumătate din căutări: repository-ul GitHub e **public**, dar
pachetul din GHCR e obiect separat, cu vizibilitatea proprie, mostenită de la
primul push. Pe pachet privat, orice pull făcut fără credential e anonim și
moare cu `unauthorized` **chiar dacă tokenul e perfect**. Iei cele două cazuri
laolaltă cu o singură comandă: un `401` la `docker manifest inspect` înseamnă
pachet privat.

## 3. `manifest unknown`

Cauza: Coolify e configurat cu un tag pe care **nimic nu îl publică**.

| Tag            | Status în acest pipeline                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `sha-<commit>` | există — imutabil **prin convenție de CI**, nu prin garanție a registry-ului; ținta de rollback |
| `main`         | există — tag mutător, pentru privire umană și redeploy manual din panou                         |
| `latest`       | **nu există** — pipeline-ul nu publică niciodată `latest`                                       |
| orice altceva  | nu există, cu excepția unui tag șters manual din GHCR                                           |

Reparare: **fixează pe digest**, nu pe tag. Un digest nu poate fi absent și nu
poate fi depășit.

> A digest cannot be stale. There is nothing left to resolve.
> — `.github/workflows/ci.yml`, pasul de pin

Verifică întâi că ținta există, cu `scripts/rollback.sh` — el confirmă că tag-ul
se rezolvă **înainte** să schimbi ceva în panou.

## 4. `denied: denied` de la GHCR

Cauza: un token **expirat sau revocat**. E o eroare diferită de
`unauthorized: authentication required`: acolo registry-ul nu a primit deloc
credentiale; aici le-a primit și le-a refuzat.

| Eroare                                  | Ce înseamnă                                    |
| --------------------------------------- | ---------------------------------------------- |
| `unauthorized: authentication required` | nu există credentiale pentru utilizatorul ăla  |
| `denied: denied`                        | există credentiale, dar tokenul nu mai e valid |

Reparare: revocă tokenul vechi la <https://github.com/settings/tokens>, emite unul
nou **clasic** cu `read:packages`, reia `docker logout` + `docker login` pe server,
ca utilizatorul SSH al panoului, apoi redeploy. Tokenurile GitHub nu avertizează
la expirare: pur și simplu nu mai funcționează.

## 5. CI verde, dar site-ul arată versiunea anterioară

Acesta e singurul simptom din tabel în care **nimic nu e roșu**. Pipeline-ul a
publicat corect, Coolify a răspuns corect, health-ul trece, iar codul live e cel
dinainte.

**Înainte de orice teorie, verifică o condiție de fapt:** în acest proiect un push
pe `main` **nu livrează nimic**. Jobul `deploy` rulează doar la
`workflow_dispatch`, cu inputul `deploy` bifat, în environment-ul `production`. Un
run verde înseamnă _publicat_, nu _livrat_ — vezi secțiunea „Ce NU este o
problemă".

### a) Coolify a fixat digestul greșit

Prima cauză, și cea mai verificabilă. Pipeline-ul citește înapoi ce a stocat
Coolify înainte să declare succes:

> Read back what the panel stored rather than trusting the 200. A
> silently-ignored field name would leave the resource pinned to the
> previous digest forever, and every deploy would still look fine.

Dacă `deploy` a fost **red** cu `Coolify stored ... after the PATCH`, pipeline-ul
s-a oprit înainte de deployment — iar resursa nu s-a schimbat deloc. Dacă a fost
**verde**, digestul stocat e cel rulat.

Verificare:

```bash
EXPECTED_DIGEST=sha256-<64 hex> \
  bash docs/ghcr-coolify/scripts/verify-deploy.sh
```

Scriptul tipărește containerele și verifică că rulează o imagine cu prefix de
registry — lipsa prefixului e cel mai rapid mod de a deosebi „a construit local"
de „a tras imaginea ta".

### b) Propagarea tag-ului în GHCR

A doua cauză, și cea pe care **pin-ul o elimină**.

> GHCR's CDN has not finished propagating the tag you just pushed, the
> pull resolves to the PREVIOUS manifest, the new container starts, the
> health check passes, and the old code is live. No red job, no red
> deployment.

Aceasta e cauza _tăcută_: pipeline-ul arată verde, deployment-ul arată verde, și
totuși rulează cod vechi. De aceea jobul fixează digestul înainte de
`POST /api/v1/deploy` — un digest nu are nimic de rezolvat și nu poate fi
depășit.

Dacă totuși ai ajuns aici, înseamnă că resursa nu e fixată: e configurată pe tagul
mutător `main`. Reverifică `docker_registry_image_tag` în panou.

### c) Cache de browser sau de CDN

A treia cauză, și cea mai ieftică de exclus. Nu presupune că site-ul e greșit:
verifică endpointul, nu pagina.

| Ce verifici                | Cum                                              |
| -------------------------- | ------------------------------------------------ |
| `/api/health`              | întreabă serverul direct, fără cache de HTML     |
| Pagina                     | poate fi servită din cache de browser sau de CDN |
| Un `curl` de la altă rețea | elimină și cache-ul local                        |

Atenție la sensul unui `2xx`: `/api/health` **nu atinge baza de date** și aruncă
mereu `200`. El dovedește că procesul e în picioare și spune ce build rulează,
prin `commit`; nu dovedește ce rută răspunde la cerere și nici că PostgreSQL
răspunde.

### Comanda de comparare

```bash
docker inspect --format '{{index .RepoDigests 0}}' '<container>'
```

Comparam digestul ăsta cu cel din secțiunea **„Image published"** a jobului
`image`, în _Step summary_ al rulării. Dacă se potrivesc, pipeline-ul a făcut
exact ce trebuie; dacă nu, cineva a construit sau a pornit ceva în afara lui.
Lanțul complet de dovezi e în [05-verificare.md](05-verificare.md).

## 6. `::error::missing: KOGAION_...` în jobul `deploy`

Cauza: secretul există, dar în **repository**, nu în **GitHub Environment-ul** pe
care jobul l-a selectat.

> environment:
> name: `production`

Jobul citește **două** secrete, ambele din mediul ales:
`secrets.KOGAION_DEPLOY_WEBHOOK` și `secrets.KOGAION_COOLIFY_TOKEN`. Nu citește
nicio variabilă de repository — nu mai există. Mesajul numește fiecare secret
lipsă **și scope-ul lui**:

```text
::error::missing: KOGAION_DEPLOY_WEBHOOK (secret of the production environment)
                  KOGAION_COOLIFY_TOKEN (secret of the production environment)
```

Reparare: adaugă **ambele** în environment-ul `production`. Vezi pasul 7 din
[04-prima-o-data.md](04-prima-o-data.md).

| Secret                   | Ce e                                                              | De ce e secret                                                                          |
| ------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `KOGAION_DEPLOY_WEBHOOK` | linkul copiat din panou, la resursa ta → Configuration → Webhooks | conține hostname-ul și uuid-ul resursei; cine îl are poate declanșa un deployment pe ea |
| `KOGAION_COOLIFY_TOKEN`  | tokenul API, cu `read` + `write` + `deploy`                       | autorizează `PATCH` și `POST`                                                           |

Separate, pentru că se schimbă în momente diferite: tokenul expiră și se rotește;
linkul devine invalid doar dacă resursa e ștearsă sau recreată. O rotație de
token **nu** atinge linkul — vezi secțiunea de rotație din
[08-variabile-operator.md](08-variabile-operator.md).

Alte două eșecuri ale aceluiași prim pas, toate ieftine de verificat:

| Mesaj                                                | Cauză                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `the image job did not publish a well-formed digest` | jobul `image` n-a produs un digest — deci nu se livrează nimic neidentificabil |
| `KOGAION_DEPLOY_WEBHOOK is not a Coolify deploy URL` | linkul e tăiat, sau nu a fost copiat din panou                                 |

## 7. Eroare de validare la pasul PATCH

Cauza: **formatul digestului**. Coolify nu stochează digestul așa cum îl dă
registry-ul.

| Formă             | Unde se folosește                                            |
| ----------------- | ------------------------------------------------------------ |
| `sha256:<64 hex>` | ce raportează registry-ul și jobul `image`                   |
| `sha256-<64 hex>` | **forma pe care o stochează Coolify** — cu linie, fără colon |

Conversia e chiar în pipeline:

```bash
hex=${DIGEST#sha256:}
pinned="sha256-${hex}"
```

> Coolify stores a digest as `sha256-<64 hex>` with a HYPHEN and no colon;
> `generate_image_names()` turns that into `image@sha256:<hex>` in the
> compose file it generates.
> — `.github/workflows/ci.yml`, pasul de pin

Bună vestea: formatul greșit eșuează la **validare**, nu la deployment. E o eroare
zgomotoasă, nu tăcută — și pipeline-ul mai verifică și lungimea (64), și alfabetul
(hex), înainte să apele API-ul.

La fel de important: PATCH-ul trimite **doar două câmpuri**,
`docker_registry_image_name` și `docker_registry_image_tag`. Fără `instant_deploy`,
pentru că acel flag ar declanșa deployment-ul chiar din PATCH și ar răspunde cu un
obiect fără `deployment_uuid` de urmărit. Fără `build_pack`, pentru că enum-ul
documentat nu include `dockerimage`, iar o valoare plauzibilă poate fi respinsă
la validare — iar un PATCH respins nu fixează nimic.

## 8. Coolify răspunde `403`

Cel mai des trimis omul către ecranul greu. `403` înseamnă una dintre două lucruri,
și ambele se repară în **Settings → Configuration → Advanced**:

> `403` means API Access is OFF at Settings > Configuration > Advanced, or the
> runner IP is not in Allowed IPs for API Access (GitHub runner egress IPs are
> dynamic -- leave that field EMPTY)
> — `.github/workflows/ci.yml`

Deci **câmpul „Allowed IPs for API Access" trebuie să rămână gol**. IP-urile de
ieșire ale runner-elor GitHub sunt dinamice și diferă de la rulare la rulare; o
listă corectă ieri neagă azi, iar deploy-ul pică fără niciun motiv vizibil.

Un al treilea `403` trăiește lângă primele două și merită recunoscut: o
interstițială Cloudflare în fața panoului. Jobul o deosebește după headerul
`cf-mitigated` și după textul `just a moment`, pentru că altfel te trimite la
ecranul tokenului, unde nu e nimic de reparat. Un test de pe laptop nu dovedește
nimic aici: IP-urile de rezidență trec și cele de datacenter nu.

## 9. Coolify răspunde `401`

> `401` means the token is missing, wrong, expired or revoked
> — `.github/workflows/ci.yml`

Aici nu e nimic de reparat pe server și nici în Docker: e tokenul. Reparare în
**Keys & Tokens**, în panou, cu permisiunile **read + write + deploy** — cele
trei sunt necesare, pentru că jobul descoperă resursa (`read`), fixează digestul
(`write`) și pornește deployment-ul (`deploy`).

Tokenurile Coolify **au expirare**, iar expirarea nu se anunță: în ziua aceea
fiecare deploy pică cu același `401` și niciun log nu spune de ce. Pune un
calendar reminder la creare. Secretul actualizat trebuie ajuns în environment-ul
`production`, nu doar în repository.

## 10. „Did not reach a terminal state"

Cauza: pollerul așteaptă o stare care **nu există** în enum-ul Coolify.

| Stare                   | Cum se tratează                  |
| ----------------------- | -------------------------------- |
| `finished`              | terminală — succes               |
| `failed`                | terminală — eșec                 |
| `cancelled-by-user`     | terminală — anulat de operator   |
| `queued`, `in_progress` | **ne**terminale — bucla continuă |

> Terminal states are exactly finished, failed and cancelled-by-user. There is
> no 'successful' and no 'cancelled' in this enum, and a poller waiting for
> 'successful' never exits -- it burns the whole timeout and reports a failure
> for a deployment that finished correctly.
> — `.github/workflows/ci.yml`

Așadar: `successful` nu e synonymul lui `finished`, iar `cancelled` nu e synonymul
lui `cancelled-by-user`. Un poller scris greșit arde tot timeout-ul (900 s în
workflow) și raportează eșec pentru un deployment perfect reușit — care e exact
forma unui rollback dublu.

Endpointul de interogat e `GET /api/v1/deployments/{uuid}`, **plural**; forma
singulară dă `404`.

## 11. `deployment_uuid` citit din locul greșit

Cauza: `POST /api/v1/deploy` răspunde cu un **vector**, nu cu un obiect de
deploy:

```json
{ "deployments": [{ "deployment_uuid": "...", "status": "queued" }] }
```

> A 2xx here means ACCEPTED, not started, and not done. The panel answers 200
> with a message and no deployment at all -- which reads exactly like success.
> The uuid is NESTED, at deployments[0].deployment_uuid; reading it from the top
> level yields null and the wait below would have nothing to poll.

Reparare: `jq -r '(.deployments // [])[0].deployment_uuid // empty'`. Citit la
nivelul de jos, uuid-ul e `null` și jobul se oprește — deși deploymentul chiar a
pornit. Exact de aceea PATCH-ul **nu** trimite `instant_deploy`: răspunsul ar
conține doar un `{uuid}`, fără mânerul de urmărit.

Dacă jobul se oprește aici, **nu relua**: o a doua rulare pune al doilea
deployment în coadă peste primul. Citește pagina Deployments din panou.

## 12. Deployment failed imediat după `Pulling latest images from the registry.`

Cauza: pull-ul din registry a eșuat, de obicei pe credentiale. Linia aceea nu e
un incident: Coolify rulează `docker compose pull` înaintea fiecărui deploy de tip
Docker Image. E pasul în care o problemă de registry se vede, dacă există.

Punctul important: **unde** se vede această eroare.

| Unde                                                   | Ce conține                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| Logul de **deployment** (pagina Deployments din panou) | inclusiv eșecul de pull                                            |
| Log-urile de **runtime** ale containerului             | nimic — containerul n-a pornit, pentru că imaginea nu a fost trasă |

Reparare: tratat ca simptomul 2 (`unauthorized`) sau 4 (`denied`), în funcție de
mesajul exact. Nu căuta nimic în log-urile aplicației: procesul nu a apucat să
ruleze.

> „A build or **image-pull failure is visible here, not in the runtime
> application logs.**"
> — documentația Coolify, pagina
> [Operations / Overview](https://coolify.io/docs/operations/overview)

Și invers, un lucru care prinde:

> „A failure is written to the deployment log, but the deployment remains marked
> as successful."
> — documentația Coolify, pagina
> [Configuration / General](https://coolify.io/docs/configuration/general)

Deci **nu alerta doar pe statusul deployment-ului**. Citește logul. Și reține că
jobul `deploy` spune la ieșire că fixarea digestului **a aterizat**: resursa e
configurată pentru buildul ăsta chiar dacă nu rulează încă din el.

## 13. `New container is not healthy, rolling back to the old container`

Două cauze complet distincte, cu reparări opuse. Diferența se vede în mesajul de
mai sus și în log-urile de runtime.

### a) Healthcheck HTTP din panou, fără client HTTP în imagine

Cauza: ai activat un healthcheck HTTP în dashboard, iar imaginea nu are `curl` — și
nici `wget`, și nici `node`.

**Reparare: NU instala `curl` în imagine.**

> oven/bun:1 is Debian 13 (trixie), NOT alpine, and it has no node, curl, wget or
> busybox. That is why the healthcheck below is written in bun.
> — `Dockerfile`, comentariul de la bază

> It also means Coolify's own healthcheck setting must stay OFF: Coolify prefers
> the image's HEALTHCHECK, and a dashboard HTTP check runs inside a container that
> has no HTTP client to run it with.
> — `Dockerfile`, comentariul de la HEALTHCHECK

Consecință: setarea din dashboard e o **non-problemă**. Nu activa healthcheck-ul
în panou, pentru că imaginea își declară propriul probe, cu `bun -e` și `fetch`.
Adăugarea unui `curl` ar schimba o imagine corectă ca să rezolvi o problemă care
nu există. Vezi și simptomul 16.

### b) Aplicația nu ajunge să răspundă

A doua cauză e procesul, nu panoul: containerul pornește și moare, sau nu
ascultă pe 3000 în intervalul de toleranță al probe-ului (`start-period=25s`,
`interval=30s`, `retries=3`). Cel mai frecvent caz concret e crash-loop-ul pe
variabilă de runtime lipsă — simptomul 14.

Ce **nu** prinde acest probe, prin construcție: `/api/health` nu atinge baza de
date și aruncă mereu `200`. O bază de date căzută **nu** produce rollback și nu
apare aici; se vede ca pagini goale sau `500` pe rutele care citesc date. E o
decizie, nu o lipsă: o probă de readiness care interoghează Postgres ar declara
moarte toate containerele într-un incident de dependență recuperabil.

## 14. Crash-loop: `Missing required environment variable(s): ...`

`initAuth()` din `src/lib/server/auth.ts` verifică `DATABASE_URL`, `ORIGIN` și
`BETTER_AUTH_SECRET` și **aruncă** la pornire dacă vreunul lipsește sau e gol:

```text
Missing required environment variable(s): DATABASE_URL, ORIGIN.
They must be set on the container, not passed as Docker build args.
```

> If the variable is missing the process refuses to start, because initAuth() in
> src/hooks.server.ts checks it and throws by name. A crash-loop that names the
> missing variable is the intended failure; a silently wrong origin is not.
> — `Dockerfile`

Reparare: variabila se pune în Coolify ca **Environment Variable, tip Runtime** —
niciodată ca Build Argument. Motivul e în `Dockerfile`, nu în panou:

> No secret is ever an ARG. ARGs and ENVs live in the image history and are
> printed in clear by `docker history`, `docker image inspect` and `crane config`;
> and CI sends `provenance: mode=max`, which records resolved build arguments by
> name and value. Every secret is a Runtime variable on the container.

Proiectul citește configurația exclusiv din `process.env`, la runtime: zero
`$env/static/*`, zero `$env/dynamic/public`, zero `import.meta.env`. Nu există
nimic înglobat la build, deci un build argument nu are niciunde să ajungă. După
schimbare: **Restart sau Redeploy**, nu Save — vezi
[03-configurare-coolify.md](03-configurare-coolify.md).

**NU seta `NODE_ENV=development` în panou ca „reparare".** `Dockerfile` îl
setează deja la `production`, iar în `development` ruta `/api/seed-admin` sare
verificarea de secret și devine un endpoint deschis, care ridică rolul
utilizatorului super-admin fără nicio autentificare.

## 15. `403` pe POST-uri: `Cross-site POST form submissions are forbidden`

Cauza: `ORIGIN` nu e origin-ul public. Nu e eroare de autentificare și nici de
proxynare: e verificarea CSRF a lui SvelteKit, care compară headerul `origin` al
cererii cu origin-ul serverului.

> ORIGIN is deliberately NOT set here.
>
> adapter-node falls back to deriving the origin from request headers when ORIGIN
> is absent, and that fallback hardcodes the protocol to https. Behind an HTTP
> ingress the derived origin is wrong, and every POST / form action is then
> rejected with 403 and no visible error.
> — `Dockerfile`

De ce e atât de înșelător: procesul **pornește perfect**. `GET` răspunde 200,
health check-ul trece, deployment-ul ajunge `finished`, și doar trimiterea
formularului eșuează. Singura diferență e că `ORIGIN` a fost scris `http://` în
loc de `https://`, sau cu alt hostname decât cel pe care intră vizitatorii.

Reparare: `ORIGIN` = origin-ul public exact, cu `https://`, **fără** slash final
și fără cale. Dacă `ORIGIN` e **absent**, nu ai acest simptom: ai simptomul 14,
pentru că `initAuth()` aruncă, iar procesul moare cu `exit 1`.

## 16. `curl: not found` sau `bun: command not found` în healthcheck

Cauza: healthcheck-ul e activat **în panou**, cu un client HTTP, iar imaginea nu
are `curl`, `wget` sau `node`. Probe-ul rulează în interiorul containerului, unde
nu există programul care să-l execute.

**Reparare: dezactivează healthcheck-ul din panou**, pentru această resursă. Nu
instala nimic în imagine. Câmpul gol e configurația **corectă**: imaginea își
declară propriul `HEALTHCHECK`, iar Coolify preferă healthcheck-ul declarat în
imagine.

Probe-ul care există deja, pentru comparație:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
```

## 17. Containerul rulează ca `root`

Verificare:

```bash
docker exec '<container>' id
```

Cauza: fie imaginea publicată nu mai are instrucțiunea `USER` — de exemplu vine
dintr-o revizie veche a `Dockerfile`-ului, de dinaintea adăugării
utilizatorului — fie panoul rescrie utilizatorul containerului.

Imaginea corectă creează contul explicit, pentru că `oven/bun` nu are `adduser`,
`useradd` sau `addgroup`:

> oven/bun has no adduser/useradd/addgroup, so the account is written directly.
> USER takes a numeric uid, which means Docker never goes through su -- and so
> never checks /etc/shells. Running non-root is not decoration: it is the first
> thing that limits what a compromised renderer can reach.
> — `Dockerfile`

Deci nu „repară" contul în panou: verifică digestul fixat și reconstruiește
imaginea din `Dockerfile`-ul curent. `docker inspect` spune cine a construit
imaginea, iar digestul se compară așa cum e descris în secțiunea 5.

## 18. Imaginea e foarte mare, deploy-ul e lent

Măsurătorile, din etapa care chiar decide:

| Ce                       | Înainte                    | După                                |
| ------------------------ | -------------------------- | ----------------------------------- |
| `node_modules` în runner | 456 MB — installul complet | 246 MB — `bun install --production` |
| Imagine, total           | ~1,6 GB                    | ~350–400 MB                         |

> This is the stage that decides the size of the deployed image. A full install is
> 456 MB; this is 246 MB.
> — `Dockerfile`, etapa `prod-deps`

Originea volumului era una singură: etapa `runner` prelua `node_modules` de la
etapa de build, unde `typescript`, `vite`, `drizzle-kit`, `prettier`, `eslint` și
`@inlang/paraglide-js` sunt obligatorii la compilare și nu au ce căuta în
producție.

Porțiunea rămasă nu e balast ascuns: `static/` (~235 MB de `media/` și
`programs/`) ajunge obligatoriu în `build/client/`, pentru că reprezintă
conținutul servit utilizatorului. Deci o cifră sub ~350 MB înseamnă că ai pierdut
conținut, nu că ai optimizat ceva.

**Măsoară înainte și după**, cu `Dockerfile`-ul curent:

```bash
docker build -t kogaion:local .
docker image inspect kogaion:local --format '{{.Size}}'
```

Fără un „înainte", orice reducere e neprecizabilă — iar un commit de optimizare
fără măsurătoare e o schimbare pe care nimeni nu o poate evalua mai târziu.
Contextul și comenzile de reverificare sunt în
[01-arhitectura.md](01-arhitectura.md).

## 19. `no matching manifest for linux/arm64-v8`

Cauza: serverul de deploy nu rulează `linux/amd64`. CI publică o singură
platformă, declarată explicit:

> Declared explicitly and singly. An image the deploy host cannot run fails at
> pull, in production, which is the worst possible place. linux/arm64 here would
> mean a QEMU-emulated build several times slower, for a platform this server
> never runs.
> — `.github/workflows/ci.yml`, jobul `image`

Repararea **nu** e în panou: o resursă Docker Image care nu poate trage imaginea
nu are setare care să o convingă. Se repară în workflow, adăugând platforma
serverului la `platforms:` — și acceptând build-ul QEMU, de câteva ori mai lent.
Adăugarea unei platforme schimbă și digestul publicat, deci e un commit cu
consecințe, nu o ajustare de feld.

## 20. Cota GHCR și lista de tag-uri

Regula: **GHCR nu are TTL pentru tag-urile de imagine.** Fiecare tag `sha-<sha>`
e stocare permanentă, iar pipeline-ul publică două tag-uri la fiecare push — unul
mutător și unul de commit.

### Listarea versiunilor — doar citire

```bash
curl -sS \
  -u "$REGISTRY_USERNAME:$REG_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user/packages/container/kogaionacademy.ro/versions" \
  | jq -r '.[] | "\(.id)\t\(.updated_at)\t\(.name.container.tags // [] | join(","))"'
```

Alternativa, cu Docker, fără token — aceeași formă pe care
`scripts/rollback.sh` o afișează când un tag lipsește:

```bash
docker manifest inspect --verbose ghcr.io/mirelconstantin/kogaionacademy.ro:main
```

### Ștergerea unei versiuni

> **Atenție.** Comanda de mai jos este **permanentă și ireversibilă**. Nu șterge
> digestul pe care rulează acum containerul și nici pe care îl folosește ținta ta
> de rollback. E o comandă manuală, de rulat **o dată**, după ce ai decis ce e
> dispensabil.

```bash
curl -sS -X DELETE \
  -u "$REGISTRY_USERNAME:$REG_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user/packages/container/kogaionacademy.ro/versions/<version_id>"
```

Tokenul folosit pentru ștergere are nevoie de scope `delete:packages`; cel de
`read:packages` nu ajunge. Reține că ștergerea unei versiuni nu șterge neapărat
layer-ele nepartajate.

Pipeline-ul **nu are retenție automată**, prin decizie:

> **Nu șterge tag-uri vechi din GHCR.** O retenție automată care șterge greșit
> e mai rău decât tag-uri în plus.
> — [01-arhitectura.md](01-arhitectura.md)

## 21. Rollback „a reușit", dar site-ul arată tot versiunea nouă

Cauza: rollback-ul a funcționat ca rollback — a fixat digestul vechi și a
deployed — dar **următoarea rulare CI a fixat din nou digestul nou și a deployat
peste el**.

Astfel, între cele două momente site-ul a arătat corect. Cel care a apucat să se
uite _după_ a doua rulare vede versiunea nouă și conclude, greșit, că rollback-ul
nu a funcționat.

Reparare și, mai important, **obligație**:

| Ordine | Acțiune                                            |
| ------ | -------------------------------------------------- |
| 1      | rollback-ul, prin [06-rollback.md](06-rollback.md) |
| 2      | **imediat** `scripts/verify-deploy.sh` pe server   |
| 3      | abia _apoi_ concluzia „rollback-ul a eșuat"        |

```bash
EXPECTED_DIGEST=sha256-<64 hex> \
  bash docs/ghcr-coolify/scripts/verify-deploy.sh
```

Iar la pasul 2, compară digestul cu cel al commitului țintă, nu doar cu „ceva
vechi". Altfel orice rulare mai veche trece drept succes.

---

## 22. Link de webhook greșit, sau secret vechi

Jobul `deploy` primește **două** secrete, și ele pot fi greșite independent:

| Secret                   | Ce identifică                                                        | Ce se strică                                               |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `KOGAION_DEPLOY_WEBHOOK` | **ținta**: rădăcina panoului și uuid-ul resursei, într-un singur șir | copiat de pe o resursă ștearsă, de pe alt panou, sau tăiat |
| `KOGAION_COOLIFY_TOKEN`  | **acțiunea**: cine are voie să scrie și să declanșeze                | expiră, e revocat, sau aparține altei echipe               |

Faptul că sunt două nu e un accident: Coolify autentifică prin headerul
`Authorization: Bearer`, nu prin query string. Query string-ul **identifică** ținta,
headerul **autorizează** acțiunea.

> The URL identifies the deployment target, but the Bearer token authorizes the
> action.
> — documentația Coolify, pagina deploy webhooks

De aceea un token în URL n-ar autentifica nimic, iar un token în secretul de
environment se rotește fără să atingă linkul.

### Cele patru simptome, și de ce dau mesaje diferite

```text
::error::KOGAION_DEPLOY_WEBHOOK is not a Coolify deploy URL
::error::expected https://<panel>/api/v1/deploy?uuid=<uuid>&force=false
```

| Simptom                                              | Cauză                                                                                                                                                                                  | Reparare                                                                                                                                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `KOGAION_DEPLOY_WEBHOOK is not a Coolify deploy URL` | linkul e **tăiat**: nu începe cu `https://…/api/v1/deploy`, sau e copiat doar parțial. `sed` nu a extras nimic, rădăcina a rămas goală, iar jobul se oprește **înainte de orice apel** | recapează din Configuration → **Webhooks**, rândul „Deploy Webhook (auth required)”, și copiază șirul **întreg**                                                                                                               |
| `the webhook URL carries no usable uuid`             | uuid-ul lipsește, e incomplet, sau are majuscule / liniițe                                                                                                                             | la fel: recapează linkul complet. Verifică forma: Coolify folosește un șir **scurt, alfanumeric, litere mici și cifre** (`319uac7occnbhmn7eui9h0wt`) — **nu** forma hexazecimală cu liniițe, de 36 de caractere, a unui UUIDv4 |
| `Coolify answered 404`                               | linkul a fost copiat de pe o resursă **ștearsă**, sau de pe **alt panou**. Tokenul a ajuns corect, dar nu există ce vedea                                                              | recapează linkul de pe resursa curentă. Dacă panoul e altul, și hostname-ul din link e altul, deci greșala e acolo                                                                                                             |
| `Coolify answered 401`                               | **linkul e corect**, tokenul nu e: lipsește, e greșit, a expirat sau a fost revocat                                                                                                    | token nou din Keys & Tokens, cu `read` + `write` + `deploy`, pus în environment-ul `production`. **Linkul nu se atinge**                                                                                                       |
| `Coolify answered 403`                               | nici linkul, nici tokenul: API Access e OFF la Settings → **Configuration → Advanced**, sau IP-ul runner-ului nu e în „Allowed IPs for API Access”                                     | pornește API Access și lasă **gol** câmpul de IP-uri — IP-urile de ieșire ale runner-elor GitHub sunt dinamice                                                                                                                 |

### De ce `404` și `401` înseamnă lucruri diferite chiar când ambele par de la „secret”

Pentru că provin din **surse diferite**, iar jobul le separă înainte să le numească.
Cele două secrete sunt independente prin construcție, deci și diagnosticul trebuie să
fie:

- **`404` pleacă din `KOGAION_DEPLOY_WEBHOOK`.** Tokenul a fost acceptat — altfel
  răspunsul ar fi `401` sau `403` — și totuși panoul nu găsește resursa. Deci uuid-ul
  e din altă resursă, din alt panou, sau din una ștearsă.
- **`401` pleacă din `KOGAION_COOLIFY_TOKEN`.** Panoul a primit cererea și a refuzat
  identificarea. Deci linkul e corect — altfel am fi avut `404`.

Trecerea dintre ele e cea mai utilă informație din tot simptomul: `404` se repară
recopiat un link, `401` se repară emițând un token, și **nimic din asta nu le schimbă pe
celălalt**. De aceea nu se regenerează amândouă de fiecare dată — o rotație de token e
operație de cinci secunde, nu de o jumătate de oră în panou.

Verifică rapid, fără să rulezi pipeline-ul — o comandă, un răspuns:

```bash
export KOGAION_COOLIFY_TOKEN=...                   # token cu read + write + deploy
curl -sS -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer ${KOGAION_COOLIFY_TOKEN}" \
  "https://coolify.pazalgroup.com/api/v1/applications/319uac7occnbhmn7eui9h0wt"
# 200 = ambele secrete se potrivesc.  401 = tokenul.  404 = linkul.
```

Pentru `404`, **nu** e deosebit dacă resursa nu există sau dacă tokenul nu o vede:
Coolify răspunde la fel în ambele cazuri, prin design — confirmarea existenței unei
resurse cărei nu ai acces ar fi tot un canal de enumerare. Repararea e aceeași în
ambele: recapează linkul de pe resursa pe care o vezi acum în panou.

## Ce NU este o problemă

Patru lucruri pe care oamenii le urmăresc timp de ore, fără să existe un defect.

### 1. Pipeline verde, dar producția nu s-a schimbat

Nu e un defect: **e contractul**. Jobul `deploy` nu pornește la push.

> Production is delivered deliberately. A push to main builds and publishes; it
> does not ship.
> — `.github/workflows/ci.yml`

El rulează doar la `workflow_dispatch`, cu inputul `deploy` bifat, în
environment-ul `production`. Așadar „CI verde" înseamnă _imaginea e publicată_;
_producția are cod nou_ se verifică prin compararea digestului, în
[05-verificare.md](05-verificare.md).

### 2. Build-ul de câteva minute

Aici **nu se aplică** explicația clasică a unui job de e2e scos din lanț: în
acest repository nu există niciun job `e2e`, niciun runner de teste și niciun
Playwright — vezi [01-arhitectura.md](01-arhitectura.md), secțiunea „De ce nu
există `unit` și `e2e`".

Timpul e în `docker buildx build`: installul complet de dependențe, un
`vite build` cu ~235 MB de conținut servit copiat în `build/client/`, apoi
push-ul unei imagini de ~350–400 MB. Cache-ul de layere
(`scope=kogaion-image`, `mode=max`) e ce îl ține la acest nivel: un commit care
schimbă doar `src/` nu invalidează instalarea. Căutarea unei optimizări aici
înseamnă, de regulă, să anulezi exact ce îl face rapid.

### 3. Imaginea de ~350–400 MB

Cifra e **aproximativă** — o măsurătoare făcută local, nu o garanție pentru
nicio imagine viitoare — și e explicată: `static/` (~235 MB) ajunge obligatoriu în
`build/client/`, iar runnerul primește `node_modules` de producție (246 MB) în
locul installului complet (456 MB). Nu e corupție și nu e o scurgere de fișiere de
build în stage-ul de runtime: [01-arhitectura.md](01-arhitectura.md) descrie
contractul dintre `vite build` și `Dockerfile`, iar acesta e respectat.

Dacă vrei să o micșorezi, vezi secțiunea 18 — cu măsurătoare înainte și după.

### 4. Absența unui healthcheck în dashboard

Nu ai de ce să activezi unul. Imaginea își declară propriul `HEALTHCHECK`, pe
`GET /api/health`, scris cu `bun -e`:

> This HEALTHCHECK is also what makes Coolify's panel configuration a non-issue:
> Coolify prefers the healthcheck declared in the image over the one configured
> in the dashboard.
> — `Dockerfile`

Câmpul gol din panou e configurația **corectă**. Activarea lui ar fi repararea
unui simptom inexistent, într-un loc unde n-ar face nimic — și ar declanșa
rollback la fiecare deploy, pentru că în imagine nu există clientul HTTP pe care
să-l ruleze. Vezi secțiunea 16.
