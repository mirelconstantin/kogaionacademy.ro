# 03 — Configurarea resursei în Coolify

Toate valorile de mai jos sunt pentru o resursă de tip **Docker Image**, și pentru
**una singură**: proiectul are o resursă, un domeniu, o ramură. Tipul resursei se
alege la creare și **nu se poate converti ulterior**: dacă ai o resursă existentă
construită din repository, creezi una nouă și migrezi.

Coolify nu construiește nimic aici. Tot ce rulează pe serverul de producție vine
tras din GHCR ca artefact gata — regula e în [01-arhitectura.md](01-arhitectura.md).

## 1. Crearea resursei

| Pas                    | Valoare                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project și environment | **aceleași** ca resursa Postgres. Alt environment înseamnă că hostname-ul intern al bazei nu rezolvă, containerul pornește și moare la prima interogare. |
| Tip                    | **Docker Image**                                                                                                                                         |
| Image Name             | `ghcr.io/mirelconstantin/kogaionacademy.ro`                                                                                                              |
| Tag / SHA256 Digest    | lăsate **goale** la creare; CI le fixează la fiecare deploy                                                                                              |
| Ports Exposes          | `3000`                                                                                                                                                   |

Numele package-ului în GHCR e obligatoriu minuscule. `github.repository` păstrează
capitalizarea, deci CI normalizează numele înainte de `docker push`; panoul
primește doar numele corect și nu are de ce să știe asta.

Nu există staging aici. Repository-ul are o singură ramură, `main`, deci un
deployment separat ar însemna o a doua resursă, un al doilea domeniu și o regulă de
alegere a țintei — trei lucruri care nu au ce fi aici.

Coolify separă automat un tag sau un digest lipit în câmpul de imagine și îl
mută în câmpul potrivit. Când introduci digestul manual, introdu **doar cele 64
de caractere hexadecimale, fără prefixul `sha256:`**.

Doar pentru referință: în interfața de creare digestul e acceptat fără prefix;
în `Configuration -> General` valoarea stocată arată `sha256-<64 hex>`, **cu
liniță**. `generate_image_names()` o transformă în `image@sha256:<hex>` în
compose-ul pe care îl generează Coolify.

## 2. Câmpuri, cu valoarea și motivul

| Câmp                                                    | Valoare                                     | De ce                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Configuration -> General -> Domains**                 | `https://kogaionacademy.ro`                 | TLS se emite automat prin proxy-ul Coolify, iar `ORIGIN` trebuie să fie exact această valoare: fără ea adapter-node deduce protocolul `https` și refuză toate POST-urile cu 403                                                                                                                                      |
| **Network -> Ports Exposes**                            | `3000`                                      | resursele Docker Image pornesc pe **80**; proxy-ul trimite acolo și răspunde 503 cu un container perfectly healthy                                                                                                                                                                                                   |
| **Network -> Port Mappings**                            | **gol**                                     | orice port publicat pe host blochează rolling update-ul (secțiunea 3)                                                                                                                                                                                                                                                |
| **Build -> Docker Image**                               | `ghcr.io/mirelconstantin/kogaionacademy.ro` |                                                                                                                                                                                                                                                                                                                      |
| **Build -> Docker Image Tag or Hash**                   | `sha256-<64 hex>`                           | CI scrie asta la fiecare deploy                                                                                                                                                                                                                                                                                      |
| **Build -> Custom Docker Options**                      | **gol**                                     | un `--entrypoint` se luptă cu `CMD ["bun","./build/index.js"]` din imagine                                                                                                                                                                                                                                           |
| **Healthcheck**                                         | **dezactivat în panou**                     | vezi subsecțiunea de mai jos                                                                                                                                                                                                                                                                                         |
| **Advanced -> Container -> Consistent Container Names** | **oprit**                                   | dezactivează rolling update-ul                                                                                                                                                                                                                                                                                       |
| **Advanced -> Container -> Custom Container Name**      | **gol**                                     | idem                                                                                                                                                                                                                                                                                                                 |
| **Advanced -> Operations -> Stop Grace Period**         | `30` (implicit)                             | adapter-node închide conexiunile acumulate înainte de shutdown, iar `CMD` e în formă exec ca SIGTERM să ajungă direct la `build/index.js`                                                                                                                                                                            |
| **Advanced -> Operations -> Max Restart Count**         | implicit                                    |                                                                                                                                                                                                                                                                                                                      |
| **Advanced -> Proxy -> Force Https**                    | pornit                                      |                                                                                                                                                                                                                                                                                                                      |
| **Labels -> Readonly labels**                           | **pornit**                                  | altfel preiei tu ownership-ul label-urilor pe care le scrie Coolify                                                                                                                                                                                                                                                  |
| **Resource Limits -> Maximum Memory**                   | cca. `4g`                                   | ca aplicația să nu poată OOM-killa baza de date de pe aceeași mașină                                                                                                                                                                                                                                                 |
| **Environment Variables**                               | toate **Runtime**                           | proiectul nu folosește niciun `$env/static/*`, nici `$env/dynamic/public`, nici `import.meta.env` — deci nu există build arg cu valoare publică și nu există echivalentul lui `NEXT_PUBLIC_APP_URL`. Un Build Variable n-ar avea ce injecta și ar creea doar o cale prin care un secret ajunge în istoricul imaginii |
| **Environment Variables -> NODE_ENV**                   | **nu se setează**                           | runner-ul pornește deja cu `NODE_ENV=production`. Setat pe `development`, verificarea de secret din `/api/seed-admin` sare, iar endpointul devine o escaladare de rol deschisă din internet                                                                                                                          |

### Nu activați health check-ul din panou

`Dockerfile`-ul declară `HEALTHCHECK` pe `GET /api/health`, iar Coolify
**preferă health check-ul din imagine** peste cel configurat în panou.

Tocmai de aceea, dacă _totuși_ activezi un HTTP health check în panou, el rulează
**în interiorul containerului** și are nevoie de `curl` sau `wget`. Iar imaginea
noastră nu are niciunul: `oven/bun:1.3.14` e Debian 13 (trixie), nu alpine, și nu
conține `node`, `curl`, `wget` sau `busybox`. Rezultatul e un container
declarat unhealthy și **roat înapoi**, deși aplicația a pornit perfect:

```
/bin/sh: 1: curl: not found
New container is not healthy, rolling back to the old container.
```

Proba din imagine e deliberată: `bun -e "fetch(...)"` în loc de `wget`. Bun este
singurul runtime prezent acolo, deci proba nu depinde de ce applete de busybox
leagă o bază de alpine și folosește `fetch` global. Un probe `node -e` — forma
din documentația SvelteKit — **nu pornește** în această imagine.

Reține asta ca regulă generală, nu ca remediu: **dacă imaginea are
`HEALTHCHECK`, nu îl suprascrii în panou; dacă nu are, atunci lipsa unui client
HTTP într-o imagine slim e o cauză reală de rollback.**

## 3. Cele cinci setări care opresc rolling update-ul

Rolling update înseamnă: containerul nou pornește **alături** de cel curent,
trece proba de sănătate, și abia apoi îl înlocuiește. Orice setare care face cele
două containere să se ciocnească transformă mecanismul într-un down-and-up, iar
panoul nu mai anunță nimic. Sunt **cinci**, nu trei:

| #   | Setare                                        | De ce blochează                                                                   |
| --- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | **Port Mappings** cu un port publicat pe host | cele două containere ar rezerva același port de pe host                           |
| 2   | **Consistent Container Names**                | ar rezerva același nume de container                                              |
| 3   | **Custom Container Name**                     | idem, prin altă setare                                                            |
| 4   | `--ip` în **Custom Docker Options**           | o adresă IP fixă e, pentru Compose, tot o resursă unică                           |
| 5   | deployment de tip **pull-request preview**    | nu e o setare, ci un tip de deployment care nu trece prin calea de rolling update |

Primele patru sunt câmpuri pe care le poți umple din panou. Al cincilea **nu se
aplică aici** — resursa nu are sursă Git, deci panoul nu are de unde crea un
preview — dar apare în cod ca al cincilea motiv, și merită numit ca să fie
recunoscut dacă îl întâlnești într-un panou configurat altfel.

Iar ca un container de înlocuire să poată exista, proba trebuie să existe: fără
health check, Coolify tratează un container pornit cu succes ca fiind gata. Aici
ea vine din imagine, deci „pornit” înseamnă „`/api/health` a răspuns 200”.

## 4. Deploy-ul, cum se declanșează

Resursa Docker Image **nu are** sursă Git, deci nu are nici Auto Deploy, nici
Watch Paths. Deploy-urile vin exclusiv din pipeline.

### De ce API-ul, și nu webhook-ul

Nu există o acțiune oficială Coolify pentru GitHub Actions. Abordarea documentată
e un **deploy webhook**, cu un token care are doar permisiunea `deploy` — dar
webhook-ul _pornește_ un deploy, nu schimbă imaginea. Fixarea resursei pe digest e
o **scriere** în `docker_registry_image_tag`, deci pentru pin pe digest API-ul brut
e obligatoriu.

Tokenul pipeline-ului are **read + write + deploy**, toate trei: `write` pentru
`PATCH`, `deploy` pentru `POST /api/v1/deploy`, `read` pentru descoperirea
resursei. Pentru deploy manual rămâne butonul Redeploy din panou.

### Pașii

1. `GET /api/v1/applications` — **descoperă** resursa: potrivește domeniul din
   `COOLIFY_APP_FQDN` cu `fqdn`-ul fiecărei aplicații și ia uuid-ul celei unice.
   Nu e configurat nicăieri: zero potriviri sau mai mult de una opresc jobul,
   pentru că o resursă aleasă greșit primește digestul celeilalte. Nu căutăm un
   uuid într-o variabilă de build — în acest proiect **nu există** un
   `NEXT_PUBLIC_APP_URL` care să poată juca rolul acela. Domeniul există deja:
   e ce arată browserul și ce răspunde deployment-ul.
2. `GET /api/v1/applications/{uuid}` — citește digestul curent.
3. `PATCH /api/v1/applications/{uuid}` cu
   `{"docker_registry_image_name": ..., "docker_registry_image_tag": "sha256-<hex>"}`.
4. `GET` din nou — **verifică că scrierea a prins**. Un nume de câmp ignorat
   în tăcălă ar lăsa resursa ancorată la digestul precedent la nesfârșit, iar
   fiecare deploy ar arăta perfect.
5. `POST /api/v1/deploy` cu `{"uuid":"...","force":false}`. Răspunsul e
   `{"deployments":[{"deployment_uuid":"..."}]}`: uuid-ul e **nested**, la
   `deployments[0].deployment_uuid`, nu la nivelul de jos.
6. `GET /api/v1/deployments/{uuid}` în buclă, până la stare terminală. Endpointul
   e la **plural**.

Ce **nu** se trimite în `PATCH`: `instant_deploy` declanșează deploy-ul chiar în
PATCH, iar răspunsul nu mai conține `deployment_uuid`; și nici `build_pack`, al
cărui enum documentat nu include `dockerimage`.

Starile de așteptat: terminale sunt `finished` (succes), `failed` și
`cancelled-by-user`; non-terminale sunt `queued` și `in_progress`. **Nu există**
`successful` și **nu există** `cancelled` — un poller care așteaptă `successful`
nu iese niciodată din buclă și raportează drept timeout un deployment perfect. Un
429 în timpul așteptării e absorbit după `Retry-After`, nu încheie bucla.

### De ce fixa digestul, și nu doar tagul mutător

Coolify chiar rulează `docker compose pull` înaintea fiecărui deploy de tip
`dockerimage` — linia `Pulling latest images from the registry.` din log e
confirmarea că acest pull s-a întâmplat. Deci tagul se rezolvă din nou, corect.
Dar există un mod de eșec pe care panoul îl raportează ca **SUCCES**:

> CDN-ul GHCR nu a terminat propagarea tag-ului pe care tocmai l-ai publicat,
> pull-ul rezolvă la manifestul **precedent**, containerul nou pornește, health
> check-ul trece, și codul vechi e live. Niciun job roșu, niciun deployment
> roșu.

Digestul nu poate fi învechit. Nu mai există nimic de rezolvat. Costă o
singură apelare API și elimină singurul drum de eșec tăcut din pipeline.

### Despre `force`

`force=true` înseamnă **rebuild fără cache**, nu „retrage imaginea”. Pentru o
resursă `dockerimage` nu se construiește nimic, deci nu are efect. Îl lăsăm
implicit.

Indiferent: **un 2xx înseamnă „pus în coadă”, nu „gata”.** De aceea pasul 6
există. Un rollback care nu a pornit e altceva decât un rollback care a
funcționat, și fără acel pas totul rămâne verde.

## 5. Registry privat

Coolify trage imaginea ca **user-ul SSH cu care rulează Docker**. Nu există un
obiect „registry” în panou, și nici în Coolify 4.x nu există un model de
credentiale de registry — `docker login` este întregul mecanism:

```bash
printf '%s' "$GH_TOKEN" | docker login ghcr.io --username "$GITHUB_USERNAME" --password-stdin
```

Detalii, inclusiv de ce tokenul trebuie să fie **clasic** și de ce package-ul
GHCR nu moștenește automat vizibilitatea repository-ului public: în
[04-prima-o-data.md](04-prima-o-data.md). Scriptul e
[scripts/login-registry.sh](scripts/login-registry.sh).

## 6. Baza de date

Postgres rămâne resursă Coolify, pe **aceeași rețea**. În `DATABASE_URL` se
folosește **Internal URL**-ul resursei
(`postgres://user:pass@<container-db>:5432/kogaion`), nu IP-ul serverului. Nu
expune portul `5432` public.

## 7. Ce verifici după primul deploy

| Verificare                                                                                     | Unde                                                                  |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Logul conține `Pulling latest images from the registry.`                                       | pagina Deployments                                                    |
| Logul conține `Rolling update started`, `New container is healthy`, `Rolling update completed` | pagina Deployments                                                    |
| Containerul rulează non-root                                                                   | `docker exec <c> id` → `uid=1001`                                     |
| Commitul raportat de aplicație e cel al build-ului nou                                         | `curl -s <url>/api/health` → `commit`, prins în imagine din `GIT_SHA` |
| Digestul containerului e cel publicat de CI                                                    | `scripts/verify-deploy.sh`                                            |

Dacă `Rolling update` **lipsește** din log, una dintre cele cinci setări din
secțiunea 3 e activă.

### Ce trebuie deschis ca pipeline-ul să poată vorbi cu panoul

Primele două sunt în **Settings -> Configuration -> Advanced**, nu în
`Settings -> Advanced`:

| Setare                         | Valoare                              | De ce                                                                                                                                           |
| ------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enable API Access**          | **pornit**                           | cât timp e oprit, orice apel primește `403`, oricât de bun ar fi tokenul                                                                        |
| **Allowed IPs for API Access** | **gol**                              | IP-urile de ieșire ale runner-elor GitHub sunt dinamice și diferă la fiecare rulare; o listă corectă ieri neagă azi, și deploy-ul pică cu `403` |
| **Settings -> API Tokens**     | token cu `read` + `write` + `deploy` | vede mai sus de ce sunt necesare toate trei                                                                                                     |

Lăsatul gol pe allowlist nu e neglijentă, ci configurația susținută pentru un token
de CI: nu există un interval de IP-uri pe care să-l garantezi, pentru că runner-ul
nu are unul.

`401` înseamnă token lipsă, invalid, expirat sau revocat. `403` înseamnă că
tokenul e probabil bun, iar panoul l-a refuzat oricum: comutatorul oprit,
allowlist-ul care nu conține IP-ul apelantului, sau o permisiune care nu acoperă
apelul. Tokenurile au **expirare** (7/30/60/90 de zile, 1 an sau `Never`), iar
schimbarea parolei utilizatorului le revoca pe toate — o revizie de pipeline
după o asemenea schimbare începe cu un token nou, nu cu o căutare de erori.

### Cloudflare în fața panoului

Orice CDN sau WAF cu protecție bot **în fața panoului blochează runner-urile GitHub
Actions**, și o face cu `HTTP 403` + un interstitial HTML:

```html
<!DOCTYPE html>
<html lang="en-US">
	<head>
		<title>Just a moment...</title>
	</head>
</html>
```

Diagnostică după **corp**, nu după status. Cele trei răspunsuri se deosebesc ușor:

| Răspuns                                               | Semnificație                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `401` + `{"message":"Unauthenticated."}`              | ai ajuns la Coolify, tokenul lipsește sau e invalid          |
| `403` + `{"message":"…"}`                             | ai ajuns la Coolify, tokenul e valid dar nu are permisiunea  |
| `403` + HTML `Just a moment…` + header `cf-mitigated` | **te-a oprit Cloudflare; tokenul nu a fost văzut niciodată** |

Ultimul caz e insidios pentru că este _tot_ `403`: o verificare bazată doar pe
status trimite operatorul la ecranul de token, unde nu are ce reparé. Pasul
_Resolve the Coolify application_ din `.github/workflows/ci.yml` verifică corpul
tocmai pentru asta.

**Reparația, în Cloudflare:**

1. **Security → WAF → Custom rules → Skip**, cu
   `http.request.uri.path starts_with "/api/"` — bifează _All managed rules_,
   _Browser Integrity Check_ și _Bot Fight Mode_.
2. Pe planul **Free**, Bot Fight Mode **nu poate fi sărit prin regulă**: trebuie
   oprit pentru zonă (Security → Bots → Off).
3. **Varianta robustă**: un hostname **DNS-only** pentru panou, înregistrat ca al
   doilea Instance URL în Coolify. Nimic nu e proxuit, deci nimic nu emite
   challenge, iar hostname-ul principal își păstrează protecția.

Verificare fără să rulezi pipeline-ul — compară răspunsul cu și fără token:

```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  https://panel.exemplu.ro/api/v1/applications
# asteapta 401 application/json -- ajungi la Coolify

curl -s https://panel.exemplu.ro/api/v1/applications | head -c 120
# asteapta {"message":"Unauthenticated."}
# daca primesti HTML, esti deja in fata unui challenge
```

Nu te bazezi pe un test făcut de pe calculatorul tău: Cloudflare trece IP-urile
rezidențiale și poate bloca IP-urile de datacenter. **Singurul test concludent
este un runner GitHub** — adică jobul de mai sus.
