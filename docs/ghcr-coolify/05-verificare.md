# 05 — Verificare: ce rulează cu adevărat

Un deploy care reușește înseamnă că Coolify a primit cererea. Nu înseamnă că
rulează codul nou. Documentul acesta este despre diferența dintre aceste două
lucruri.

Aici nu există staging: există o singură ramură (`main`), un singur
environment de deploy (`production`), o singură resursă Docker Image în
Coolify și un singur domeniu. De aceea fiecare verificare de mai jos e o
întrebare despre _acel_ server, nu despre o variantă.

## De ce contează

Există trei moduri prin care un pipeline complet verde poate să lase în
producție cod vechi, și **niciunul** dintre ele nu arată ca o eroare:

1. Coolify e ancorat pe alt digest — cineva a editat
   `docker_registry_image_tag` în panou, sau un rollback a mutat resursa înapoi
   și nu a fost urmat de un deploy.
2. Propagarea tag-ului în GHCR nu s-a terminat. Plauzibil doar cu tagul
   mutător `:main`, imposibil cu digest: un digest e adresabil, un tag se
   rezolvă la momentul pull-ului.
3. Cache de browser sau de CDN. Se verifică pe `/api/health`, nu pe pagina de
   start: aceasta poate veni din cache zece minute, răspunsul health nu.

Toate trei se prind în același mod: **comparația digestului**.

## 1. Ce a publicat pipeline-ul

La fiecare push, job-ul `image` scrie în _Step summary_, la pasul „Record what
was published”:

```
### Image published

- repository:    ghcr.io/mirelconstantin/kogaionacademy.ro
- sha:           9d1f4c0e7b2a...
- digest:        sha256:9f2c...
- built:         2026-10-04T09:12:33Z
- moving tag:    ghcr.io/mirelconstantin/kogaionacademy.ro:main
- immutable tag: ghcr.io/mirelconstantin/kogaionacademy.ro:sha-9d1f4c0e...
```

Digestul din runul acela e referința. Nu e o valoare de afișat — e o valoare de
**comparat**. Repo-ul e public, deci oricine poate verifica în afara
pipeline-ului că acel digest există și indică o imagine; scriptul
[scripts/login-registry.sh](scripts/login-registry.sh) îl afișează local, pentru
situația în care nu mai ai la îndemână rularea CI.

Și o observație care scutește o confuzie: **un push verde nu livrează nimic.**
Job-ul `image` scrie în registry, job-ul `deploy` rulează doar la
`workflow_dispatch` cu inputul `deploy` bifat, în environment-ul
`production`. Deci „pipeline verde” înseamnă _publicat_, iar „producția are cod
nou” se verifică aici, în continuare.

## 2. Comandantul: pipeline → imagine → proces

Deploy-ul are trei legături, și fiecare are propria dovadă. Nu e o
formalitate: un `HTTP 200` nu acoperă niciuna dintre ele, pentru că un
container vechi răspunde la fel de bucat ca unul nou.

| Legătură           | Dovada                                      | Unde se citește             |
| ------------------ | ------------------------------------------- | --------------------------- |
| pipeline → imagine | digestul publicat de job-ul `image`         | _Step summary_ al rulării   |
| imagine → proces   | digestul din `RepoDigests` al containerului | `docker inspect`, pe server |
| proces → cod       | commitul raportat de `/api/health`          | răspunsul endpointului      |

Citite împreună, cele trei închid lanțul: pipeline la commitul **X** a
publicat digestul **D**, containerul de pe server rulează digestul **D**, iar
procesul din el spune că a fost construit din **X**. Doar atunci „deploy-ul a
mers” e o afirmație despre aplicație, nu despre Docker.

```bash
# 1. ce a publicat pipeline-ul?   -> Step summary, job-ul image
# 2. ce ruleaza acum?
EXPECTED_DIGEST=sha256-<64 hex> bash docs/ghcr-coolify/scripts/verify-deploy.sh

# 3. ce spune procesul despre el însuși?
curl -s https://kogaionacademy.ro/api/health | jq '.commit, .checks'
```

Cele trei valori sunt legate prin `GIT_SHA`, singurul build argument cu valoare
publică din proiect. El ajunge în imagine la build, ajunge în
`/api/health` prin `process.env`, și ajunge și în eticheta OCI
`org.opencontainers.image.revision`. Nu e secret — e exact valoarea pe care
job-ul `image` scrie lângă digest, și de aceea poate fi comparată cu el fără
să încapă în istoricul imaginii ceva care trebuie ascuns.

**Atenție la sensul unui 2xx.** `/api/health` răspunde `200` dacă procesul e în
picioare. Nu dovedește ce build rulează, nu dovedește că rutele noi funcționează,
nu dovedește că deploy-ul s-a terminat. Comparația digestului e partea care
contează, iar asta e scris explicit în chiar script.

Și `/api/health` **nu atinge baza de date**: cu Postgres oprit, inaccesibil sau
la mijlocul unui failover, endpointul răspunde tot `200`, cu
`status: "ok"`. E o decizie, nu un defect — o probă de readiness care
interoghează Postgres ar declara moarte toate replicile într-un incident de
dependență recuperabil și ar reporni ce era doar degradat. Stratul de date se
verifică ieftin, altfel: încarci o pagină care îl citește sau întrebi baza de
date direct.

## 3. Ce rulează pe server

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'

# digestul real al imaginii rulate, nu numele tagului
docker inspect --format '{{index .RepoDigests 0}}' '<container>'
```

Containerul va afișa **digestul**, nu `ghcr.io/...:main` — pentru că CI a
fixat resursa pe digest, iar Coolify a scris `image@sha256:<hex>` în compose.
Asta e exact ce voiam: un container care rulează alt cod decât cel așteptat
arată imediat, ca șir de 64 de caractere, nu ca „se mișcă ceva ciudat”.

Cele două forme se compară fără să le editezi: scriptul normalizează
`sha256-<hex>`, `sha256:<hex>`, `<repo>@sha256:<hex>` și hexul gol la aceeași
valoare. Prima e forma pe care Coolify o ține în `docker_registry_image_tag`,
a doua e forma Docker — și un operator care copiază din panou și unul care
copiază din compose nu trebuie să primească „digestele diferă”.

Scriptul face comparația și codifică verdictul:

```bash
bash docs/ghcr-coolify/scripts/verify-deploy.sh
```

Rulează-l **pe hostul de deploy**, ca utilizatorul în care se duce Coolify prin
SSH, ca „docker ps” să descrie mașina care servește efectiv trafic. Rulat pe un
laptop, răspunde la altă întrebare și e fără valoare. Scriptul e strict de
citit: nu creează, nu modifică, nu șterge nimic.

## 4. Sănătatea aplicației

Ruta e `src/routes/api/health/+server.ts`; job-ul `build` din
[.github/workflows/ci.yml](../../.github/workflows/ci.yml) verifică că
`api/health` e în manifestul rutelor compilate, pentru ca un endpoint
disprărut din build să nu lase `HEALTHCHECK` din imagine să cadă abia pe
server.

```bash
curl -s https://kogaionacademy.ro/api/health | jq
```

```json
{
	"status": "ok",
	"commit": "9d1f4c0e7b2a...",
	"version": "9d1f4c0",
	"startedAt": "2026-10-04T09:12:33.481Z",
	"uptime": 41.2,
	"checks": { "authSecret": { "healthy": true, "problems": [] } }
}
```

`commit` vine din `GIT_SHA`, prins în imagine la build — de aici vine a treia
`commit` vine din `GIT_SHA`, prins în imagine la build — de aici vine a treia
dovadă. `checks` e sub-obiect pentru că verificările sunt mai multe și pot
crește; `authSecret` e prima dintre ele, iar `runtime` raportează versiunile de
bun și node efectiv prezente în container ( imaginea nu are node, deci acea
valoare e `null` în producție, și asta e o informație, nu o lipsă ).

### Ce înseamnă `authSecret.healthy: false`

```json
{
	"status": "ok",
	"commit": "9d1f4c0e7b2a...",
	"checks": {
		"authSecret": {
			"healthy": false,
			"problems": ["BETTER_AUTH_SECRET is only 24 characters (minimum 32)"]
		}
	}
}
```

Liveness **rămâne 200** chiar cu secret slab, pentru că un secret slab nu e
motiv să repornești containerul în aceeași configurație: repornirea readuce
exact același secret. E semnal de alertare, nu de sănătate. Și nu e
auto-corectabil prin restart — se repară în Coolify, pe resursa Docker Image,
ca variabilă de **runtime**; un build argument ar cere un rebuild.

Dar e o alertă reală: **cine are cheia poate forja o sesiune de admin fără să
treacă măcar prin Google.** Aplicația nu are formular de parolă — un singur
provider OAuth — dar secretul semnează cookie-ul de sesiune, deci cine îl
cunoaște emite unul valid pentru orice utilizator, rolul fiind doar un câmp în
payload. `better-auth` aruncă excepție doar pentru secretul _implicit_; pentru
unul prea scurt sau cu entropie scăzută doar avertizează — un warning în log,
indescifrabil printre restul. De aceea câmpul e sub `checks`, lângă celelalte
verificări, nu la rădăcina răspunsului.

## 5. Log-urile, și unde se uită

| Întrebarea                            | Unde se răspunde                            |
| ------------------------------------- | ------------------------------------------- |
| De ce a eșuat pull-ul imaginii?       | pagina **Deployments**                      |
| De ce a eșuat pornirea containerului? | **Deployments** + log-urile aplicației      |
| Ce endpoint a răspuns 503?            | log-urile aplicației + log-urile proxy-ului |

Citesc din Coolify:

> „A build or **image-pull failure is visible here, not in the runtime
> application logs.**”
> — documentația Coolify, pagina
> [Operations / Overview](https://coolify.io/docs/operations/overview)

Așadar: o eroare de registry **nu apare** în log-urile aplicației. Dacă te
uiți acolo și nu vezi nimic, problema e în Deployment.

Și invers, un lucru care prinde:

> „A failure is written to the deployment log, but the deployment remains
> marked as successful.”
> — documentația Coolify, pagina
> [Configuration / General](https://coolify.io/docs/configuration/general)

Deci **nu alerta doar pe statusul deployment-ului**. Citește log-ul.

Linia „Pulling latest images from the registry.” din log **nu** e un incident:
Coolify rulează `docker compose pull` înaintea fiecărui deploy de tip Docker
Image. E pasul în care o problemă de registry se vede, dacă există.

## 6. Probe din afara sistemului

Verificările de mai sus sunt _din interiorul_ deployment-ului. Un detector de
timp de indisponibilitate extern, care să bată periodic în `/api/health` și să
tragă clopot când răspunsul nu mai e 200 cu `status: "ok"`, prinde exact clasa
de incidente pe care niciun log de deployment nu o arată — de exemplu o
resursă pornită, health check-ul trecut, și aplicația răspunzând greșit prin
proxy, sau un domeniu care întoarce 200 pentru orice.

## Ce nu se aplică aici

| Nu se aplică               | De ce                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| staging vs production      | O singură ramură (`main`), un singur environment (`production`), o singură resursă, un singur domeniu. Nu există un „alt environment” cu care să compari.                                                                                                                                                                                   |
| teste unitare sau e2e      | Nu există niciunele, și nici Playwright. Verificările din CI sunt `bun run check` (svelte-check), `bun run lint` (prettier + eslint) și `bunx drizzle-kit check` (migrările). De aceea „pipeline verde” înseamnă _imaginea s-a construit și s-a fixat_, nu _a fost testat ceva_ — și de aceea comparația digestului e cu atât mai necesară. |
| variabile de build publice | Proiectul folosește exclusiv runtime: zero `$env/static/*`, zero `$env/dynamic/public`, zero `import.meta.env`. Nu există echivalentul lui `NEXT_PUBLIC_APP_URL` — și nu e nevoie, fiindcă singurul build argument cu valoare publică e `GIT_SHA`.                                                                                          |
| locale multiple            | Nu se folosește `next-intl`. Localizarea e paraglide-js (`messages/`), compilată în build; nu există comutare de locale la runtime.                                                                                                                                                                                                         |

## Checklist de deploy

```bash
# 1. ce a publicat pipeline-ul?
#    -> Step summary al job-ului image

# 2. ce ruleaza acum?
EXPECTED_DIGEST=sha256-<64 hex> bash docs/ghcr-coolify/scripts/verify-deploy.sh

# 3. se potriveste digestul?  DA -> deploy reusit, indiferent ce spun butoanele
#    si commitul din /api/health e cel din rulare -> lantul e inchis

# 4. daca NU: cine a prins digestul? resursa e cea cu uuid-ul din link
curl -fsS -H "Authorization: Bearer $KOGAION_COOLIFY_TOKEN" \
  "https://coolify.pazalgroup.com/api/v1/applications/319uac7occnbhmn7eui9h0wt" \
  | jq -r '.docker_registry_image_tag'
```

Punctul 4 e cel care schimbă diagnosticul: dacă Coolify arată alt digest decât
cel publicat, problema e în fixare, nu în pull — și pipeline-ul verifică exact
astfel, **după** ce a trimis PATCH-ul: dacă read-back-ul nu coincide cu digestul
așteptat, jobul se oprește înainte de `POST /api/v1/deploy`. PATCH-ul a fost
aplicat în acel moment; ce e refuzat e continuarea.

Punctul 4 rulează de pe calculatorul tău, unde `jq` există, nu de pe hostul de
deploy — acolo `jq` lipsește, de aceea `scripts/verify-deploy.sh` folosește un
cititor `sed` în locul lui.

Nu reporni containerul ca reparare: repornirea re-trage același digest fixat,
deci primești înapoi același build vechi — și pierzi dovezile despre ce s-a
întâmplat.
