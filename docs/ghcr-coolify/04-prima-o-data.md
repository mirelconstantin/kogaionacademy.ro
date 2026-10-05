# 04 — Prima oară, de la zero

Checklist-ul din acest document este **în ordine strictă**. Nu pentru că pașii ar
depinde unii de alții într-un mod dramatic, ci pentru că verificarea fiecărui pas
este exact ceea ce face pasul următor posibil. Dacă sări peste pasul 3 și peste
pasul 7, primul deploy va eșua și nu vei ști din care parte.

Fiecare pas are trei rânduri: **ce faci**, **unde** și **cum verifici**. Ultima
e obligatorie. Un pas fără verificare e un pas în care nimeni nu are încredere.

Proiectul are **o singură ramură** (`main`) și **o singură resursă** Coolify.
Tot ce în documentele vechi presupunea o pereche staging/producție nu se
aplică aici, iar acolo unde nu se aplică e spus explicit — pentru că o
instrucțiune care nu se aplică e mai periculoasă decât una absentă.

---

## Pasul 0 — Precondiții

| Cerință                            | Unde se verifică                     | Cum arată că e adevărat                          |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------ |
| Instanța Coolify e accesibilă      | bara de adresă a panoului            | panoul se încarcă și îți arată lista de proiecte |
| Ai admin pe GitHub                 | <https://github.com/settings/tokens> | pagina îți permite să creezi un token            |
| Ai admin pe panoul Coolify         | panou → setările instanței           | poți deschide pagina de setări                   |
| Ai acces SSH pe serverul de deploy | orice terminal                       | `ssh <utilizator>@<server>` intră                |

**NU este precondiție** existența pachetului în GHCR. Pachetul nu apare decât la
primul push, adică la pasul 6. Dacă încerci să îl cauți înainte, vei deduce
greșit că pipeline-ul nu scrie în registry.

> **Verifică tu:** versiunea exactă a instanței tale Coolify. Pasul 6 are o
> consecință directă asupra ei, iar tu trebuie să o cunoști înainte de prima
> rulare, nu după.

---

## Pasul 1 — Activează API Access pe instanță

**Ce faci:** în panoul Coolify, deschide setările instanței și pune
**Settings → Configuration → Advanced → API Access** pe `ON`.

Calea e `Configuration → Advanced`, nu `Advanced` de la rădăcină: comutatorul
livrează împreună cu setările de configurație ale resurselor, nu cu pagina de
setări generale a serverului.

**De ce:** fără asta, `GET /api/v1/applications`, `PATCH /api/v1/applications/{uuid}`
și `POST /api/v1/deploy` sunt respinse înainte să se uite măcar la token.
Pipeline-ul nu verifică acest lucru — el doar raportează codul la primul apel.

| Cod   | Ce înseamnă                                                                    |
| ----- | ------------------------------------------------------------------------------ |
| `403` | **API Access e stins.** Tokenul n-a fost deloc evaluat.                        |
| `401` | ai ajuns la Coolify: tokenul lipsește, e invalid, a expirat sau a fost revocat |

Cei doi se deosebesc printr-un singur cuvânt, dar conduc la ecrane complet
diferite: `403` te trimite la pasul 1, `401` te trimite la pasul 2. Dacă
jonglezi între ele, pierzi timp în locul greșit.

**Consecință:** un token perfect, copiat corect, e totuși inutil cât timp
comutatorul e stins. E prima cauză de „deci nu merge” la prima încercare.

| Verificare                            | Rezultat așteptat                   |
| ------------------------------------- | ----------------------------------- |
| Deschide pagina de setări a instanței | câmpul **API Access** apare activat |

---

## Pasul 2 — Creează tokenul API în Coolify

**Ce faci:** panou → **Keys & Tokens → API Tokens → Create**.

### De ce sunt necesare trei permisiuni, nu una

Regula: tokenul are nevoie de **read**, **write** **și** **deploy**.

| Permisiune | Ce face concret în pipeline                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `read`     | citește resursa înainte de pin, ca să compare digestul deja stocat cu cel nou: `GET /api/v1/applications/{uuid}` |
| `write`    | face `PATCH /api/v1/applications/{uuid}` cu `docker_registry_image_tag` — **fixează** digestul                   |
| `deploy`   | `POST /api/v1/deploy` pornește deployment-ul                                                                     |

Mai există `read:sensitive` și `root`. Nu sunt necesare aici, și nu trebuie
cerute: `root` ar permite ștergerea resursei cu același token care o actualizează.

**De ce contează `write`, concret:** un token `deploy-only` _nu poate_ fixa
digestul. Fără pin, Coolify ar trage tagul mutător, iar asta este exact calea
de eșuc tăcut descrisă în [07-probleme.md](07-probleme.md): propagarea lentă
a tag-ului în GHCR face ca deployment-ul să reușească, cu codul vechi live.

### 2a. Copiază linkul de deploy din panou

**Unde:** resursa ta Docker Image → **Configuration → Webhooks →** rândul
**„Deploy Webhook (auth required)”**.

Obiectul din secțiune este chiar linkul, complet:

```
https://coolify.pazalgroup.com/api/v1/deploy?uuid=319uac7occnbhmn7eui9h0wt&force=false
```

Copiază-l **întreg**, cu tot cu query string-ul. Jobul îl trimite așa cum l-ai
copiat, fără să-l reconstrucă — și pentru că nu are rost să ajungă într-un alt
loc, unde ar putea diverge de acesta.

**De ce uuid-ul Coolify nu arată așa cum arată un UUID.** Identificatorul de resursă
al Coolify este un șir **scurt, alfanumeric, doar litere mici și cifre** — de forma
`319uac7occnbhmn7eui9h0wt` — și **nu** forma hexazecimală cu liniițe, de 36 de
caractere, a unui UUIDv4. Cine verifică lungimea din reflexul UUID respinge fiecare
id real. Workflow-ul verifică **clasa de caractere** și o limită superioară generoasă
(8–40), nu lungimea fixă.

| Verificare     | Rezultat așteptat                                                      |
| -------------- | ---------------------------------------------------------------------- |
| Linkul copiat  | începe cu `https://`, conține `/api/v1/deploy?uuid=` și `&force=false` |
| uuid-ul din el | litere mici și cifre, fără liniițe, fără majuscule                     |

### De ce tokenul e secret **separat** de link

Pentru că sunt două lucruri diferite, cu vieți diferite. Linkul identifică **ținta**
și se schimbă când schimbi resursa; tokenul autorizează **acțiunea** și se schimbă
când expiră sau îl rotești. Legate într-un singur șir, o rotație de token ar fi
ținută minte de două ori, iar Coolify **nu** acceptă token în query string (vezi
Pasul 7).

### Pune-i o expirare și un memento

Duratele oferite sunt **7, 30, 60, 90 de zile, 1 an sau `Never`**.
**Verifică tu:** data concretă pe care o alegi — depinde de cât de repede se
rotește personalul.

> Un token care expiră în tăcere transformă fiecare deploy într-un `401` în
> cel mai prost moment posibil: la prima lansare după vacanță, cu cineva
> în panou.

**O corecție de contract, verificată pe v4.3.23:** tokenurile API Coolify **au
expirare**, iar **schimbarea parolei utilizatorului le revoca pe toate** —
inclusiv pe cele create de o persoană care nu s-a atins de ele. Dacă cineva
își resetează parola într-o zi de martie, pipeline-ul tău moare în martie.

### Despre valoarea tokenului

Panoul o arată **o singură dată**, la creare. Copiaz-o imediat în secretul de
mediu din pasul 8; după închiderea ferestrei, nu se mai poate citi.

| Verificare                                              | Rezultat așteptat                              |
| ------------------------------------------------------- | ---------------------------------------------- |
| Secretul de mediu din GitHub conține valoarea tokenului | valoarea e salvată înainte să navighezi undeva |
| Panoul nu mai afișează tokenul după reîncărcare         | e o singură vizibilitate, prin design          |

---

## Pasul 3 — Creează resursa Docker Image

**Ce faci:** în proiectul tău Coolify, **+ New → Docker Image**. Fă **una
singură**, pe domeniul unic al proiectului.

> **De ce una singură.** Un uuid se copiază din panou într-un singur loc, și
> atât. O a doua resursă ar însemna un al doilea uuid de urmărit la fiecare
> deploy, fără nicio poartă care să verifice dacă ai copiat-o pe cea greșită.
>
> Proiectul nu are staging, deci nu există un al doilea mediu în care să
> trăiască. Nu creea a doua resursă „de rezervă”, nici pe un subdomeniu: în
> momentul în care o creezi, nu mai ai un singur loc de unde se uită pipeline-ul.

| Câmp            | Valoare la prima configurare                |
| --------------- | ------------------------------------------- |
| Image Name      | `ghcr.io/mirelconstantin/kogaionacademy.ro` |
| Tag             | **gol**                                     |
| SHA256 Digest   | **gol**                                     |
| Ports / Exposes | `3000`                                      |

Tag-ul și digestul rămân **intenționat goale** la prima rulare. Ele sunt
populate de CI la pasul 6 și de fiecare rulare ulterioară.

**De ce numele e tot lowercase, cu punct:** GHCR cere ca tot segmentul
`owner/name` să fie lowercase. `github.repository` păstrează capitalizarea
repo-ului, deci CI normalizează explicit înainte de `docker push`. Nu e
cosmetizare — o literă mare în push înseamnă repository inexistent.

### De ce `3000` și nu `80`

Aplicația ascultă pe 3000 (`ENV PORT=3000` și `EXPOSE 3000` în
`Dockerfile`, plus `bun ./build/index.js` ca `CMD`). Resursa Docker Image
pornește însă cu 80. Proxy-ul forwardează către ce a crezut el că e portul
aplicației, și nu ajunge nimic — vezi [07-probleme.md](07-probleme.md), primul
rând.

### Variabilele de runtime, pe aceeași resursă

Toate **Runtime**, pentru că proiectul nu are nicio variabilă de build cu
valoare publică: zero `$env/static/*`, zero `$env/dynamic/public`, zero
`import.meta.env`.

| Variabilă                                   | obligatorie | De ce                                                                                                       |
| ------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                              | da          | Internal URL-ul resursei Postgres din Coolify, nu IP-ul serverului                                          |
| `ORIGIN`                                    | da          | fără ea procesul **moare cu exit 1** — `initAuth()` în `src/hooks.server.ts` o verifică și aruncă după nume |
| `BETTER_AUTH_SECRET`                        | da          | minim 32 de caractere; `/api/health` îl raportează la `checks.authSecret`                                   |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | da          | unica metodă de autentificare: Google OAuth                                                                 |
| `PUBLIC_SITE_URL`                           | recomandată | originul public, folosit de linkurile din interfață                                                         |

> **De ce `ORIGIN` e obligatoriu și nu opțional:** `initAuth()` verifică
> `DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET` și **aruncă la pornire**
> dacă vreuna lipsește. Deci nu degradează lin — moare. Iar dacă ar trece,
> `adapter-node` ar deduce protocolul **hardcodat `https`** din header-e, și
> fiecare POST ar fi respins cu `403`, fără mesaj.

> **NU seta `NODE_ENV=development` în Coolify.** `/api/seed-admin` sare
> verificarea de secret în development și devine un endpoint deschis de
> escaladare de rol. `Dockerfile` pune deja `NODE_ENV=production` în runner;
> dacă îl suprascrii în panou, nu câștigi nimic și pierzi singura verificare
> care există.

### De ce „fără sursă” e starea corectă

Un build-pack Docker ar necesita un repository atașat la resursă, iar resursa
noastră nu are repository — are o referință de imagine. Dacă resursa ar avea
sursă, Coolify ar avea o cale prin care să construiască, iar regula „serverul
de producție nu construiește nimic” ar fi încălcată de un câmp lăsat gol.

| Verificare                       | Rezultat așteptat                                                              |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Lista de proiecte din panou      | **o singură** resursă, cu imaginea `ghcr.io/mirelconstantin/kogaionacademy.ro` |
| Domeniul resursei                | un singur domeniu: `kogaionacademy.ro`                                         |
| Pagina resursei raportează sursa | raportează **nicio sursă**                                                     |
| Câmpul Ports / Exposes           | `3000`                                                                         |
| Environment Variables            | cele cinci de mai sus, toate marcate **Runtime**                               |

---

## Pasul 4 — Repository public înseamnă pachet public?

**Nu.** Sunt două obiecte distincte, cu două setări distincte.

|               | Vizibilitatea         | Unde se schimbă               | Cine o moștenește                |
| ------------- | --------------------- | ----------------------------- | -------------------------------- |
| Repository    | **public**            | Settings → repository         | —                                |
| Pachetul GHCR | **public sau privat** | pagina pachetului în registry | se stabilește la **primul push** |

Pachetul moștenește vizibilitatea din momentul în care a fost creat, adică la
primul push din pipeline. **Nimic din deploy nu o rescrie ulterior** — schimbarea
e un click pe pagina pachetului, nu o variabilă și nu un secret.

**De ce contează:** vizibilitatea pachetului decide dacă pasul 5 e obligatoriu
sau opțional, iar răspunsul greșit se manifestă ca `unauthorized` la pull,
adică un deployment roșu fără nicio legătură vizibilă cu vreun secret.

**Cum le deosebești, fără să ghicești** — pe server, cu un token sau fără:

```bash
docker manifest inspect ghcr.io/mirelconstantin/kogaionacademy.ro:main >/dev/null 2>&1   && echo "PUBLIC: se rezolvă anonim"   || echo "PRIVAT: cere autentificare"
```

Un `401` acolo înseamnă **privat**. Pe un pachet privat, orice pull fără
credential memorat e anonim și pică cu:

```
error from registry: unauthorized
```

| Verificare                | Rezultat așteptat                               |
| ------------------------- | ----------------------------------------------- |
| Comanda de mai sus        | tipărește explicit `PUBLIC` sau `PRIVAT`        |
| Pagina pachetului în GHCR | vizibilitatea e cea raportată, nu cea presupusă |

---

## Pasul 5 — Credentialele de registry, PE SERVERUL DE DEPLOY

Dacă pasul 4 a răspuns `PUBLIC`, ai putea să sari peste autentificare.
**Fă-le oricum**: e singurul pas prin care rămâi învestit dacă vizibilitatea
se schimbă peste un an, iar costul e o comandă.

### 5a. Creează tokenul de registry

**Ce faci:** deschide <https://github.com/settings/tokens/new> și creează un
token.

| Setare       | Valoare                       | De ce                                         |
| ------------ | ----------------------------- | --------------------------------------------- |
| query string | **fără** `?type=fine-grained` | GitHub Packages acceptă doar tokenuri clasice |
| scope        | `read:packages`               | serverul doar _trage_ imaginea; nu publică    |

### De ce nu merge un token fine-grained

Regula: GitHub Packages acceptă **doar tokenuri personale clasice**.

> GitHub Packages only accepts CLASSIC personal access tokens; a fine-grained
> PAT has a Packages repository permission but the registry does not honour it.

Concret: un fine-grained PAT _are_ permisiunea de repository Packages, în
interfața lui, aproape de unde ai creat tokenul — iar registry-ul nu o onorează.
E o capcană bună: interfața confirmă permisiunea, iar `docker pull` spune
`unauthorized`.

### 5b. Loghează-te pe server, ca utilizatorul corect

**Unde:** prin SSH, ca **exact utilizatorul sub care Coolify rulează Docker**.
Acel utilizator e în panou la **Servers → serverul tău → General → SSH user**.

> Run it on the deploy host, over SSH, as the exact user the panel runs Docker
> as. Coolify never logs in on your behalf: deploying a "Docker Image" resource
> makes it shell out to the docker CLI on the server, and that CLI reads
> credentials from the HOME directory of the user who owns the process.
> — `scripts/login-registry.sh`

**Ce comanzi:**

```bash
printf '%s' "$GH_TOKEN" | docker login ghcr.io \
  --username "$GITHUB_USERNAME" --password-stdin
```

Credentialele ajung în `~/.docker/config.json` al acelui utilizator. **Nu** în
baza de date a lui Coolify: în Coolify 4.x nu există un model de credentiale de
registry, iar `docker login` este întregul mecanism.

| Verificare                    | Rezultat așteptat                                    |
| ----------------------------- | ---------------------------------------------------- |
| `docker login`                | `Login Succeeded`                                    |
| `ls -l ~/.docker/config.json` | fișierul există și îi aparține utilizatorului curent |

### 5c. Rulează scriptul din acest repo

De aici încolo comenzile se rulează din **rădăcina repository-ului**, de unde
scriptul e apelat pe calea completă.

```bash
REGISTRY_USERNAME=mirelconstantin \
REGISTRY_TOKEN=ghp_... \
  bash docs/ghcr-coolify/scripts/login-registry.sh
```

Tag-ul implicit al scriptului este `main`, pentru că proiectul are o singură
ramură. Pasa `TAG=sha-<commit>` doar când vrei digestul unui commit anume.

Scriptul are **cinci** verificări și se oprește la prima care pică.

| Verificare                                    | Rezultat așteptat                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| Pasul 1 — există un Docker funcțional aici    | `OK` — CLI-ul e pe PATH, iar daemon-ul răspunde la `docker info`         |
| Pasul 2 — `docker login` e acceptat           | `OK` — GHCR a primit credentialele                                       |
| Pasul 3 — credentialul e unde panoul îl caută | `OK` — fișierul de config există și are intrare pentru `ghcr.io`         |
| Pasul 4 — tokenul chiar duce `read:packages`  | `OK` — lista de tag-uri din API-ul v2 răspunde `200`                     |
| Pasul 5 — ținta se rezolvă, cu digestul ei    | `OK` — `docker manifest inspect` rezolvă referința și digestul e tipărit |

**Criteriul de acceptare: scriptul afișează linia
`RESULT: PASS (5 of 5 checks passed)`.** Un `FAIL` la pasul 3 înseamnă că ai
făcut login ca altcineva. Un `FAIL` la pasul 4, cu `OK` la pasul 2, înseamnă că
scope-ul tokenului e greșit.

**Citește avertismentul pe care îl tipărește scriptul la început.** Pe un
pachet `PUBLIC`, pașii 4 și 5 **nu** dovedesc că tokenul e bun — dovedesc că
registry-ul e accesibil. Doar pe un pachet privat ele sunt proba, și doar acolo
`docker login` din pasul 2 e obligatoriu. Un verde care înseamnă mai puțin
decât pare e mai periculos decât un roșu.

---

## Pasul 6 — Indică resursei o imagine publicată

**Ce faci:** întâi, fă un push pe `main`, ca tagul să existe în registry — de
acel moment apare și pachetul, deci răspunsul la pasul 4 devine disponibil.
Apoi, alegi una dintre două căi:

| Cale    | Ce faci                                                          | Când                                            |
| ------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| Manual  | panou → resursă → **Configuration → General → Docker Registry**  | prima rulare, ca să vezi un deployment de probă |
| Prin CI | nu face nimic; jobul `deploy` fixează digestul la fiecare rulare | configurația de durată                          |

Nu ambele. Dacă editezi în panou și apoi rulezi CI, pipeline-ul va suprascrie
digestul cu cel al rulării curente — corect, dar te-a costat un deployment de
probă.

### De ce această linie din log contează mai mult decât pare

Coolify rulează `docker compose pull` înaintea fiecărui deployment de tip
`dockerimage`, deci tagul **este** rezolvat din nou. Dacă în logul
deployment-ului apare linia **`Pulling latest images from the registry.`**,
instanța ta re-trage imaginea la fiecare deployment.

**Dacă acea linie lipsește**, calea webhook a instanței tale nu re-trage
imaginea: vei vedea containerul nou pornind cu vechea imagine și niciun
deployment roșu. **Oprește-te aici și fă upgrade la instanță** — nicio
configurare a credentialelor nu repară o instanță care nu re-trage.

| Verificare                   | Rezultat așteptat                                        |
| ---------------------------- | -------------------------------------------------------- |
| Pagina Deployments din panou | logul conține `Pulling latest images from the registry.` |
| Același log                  | linia **e prezentă**; dacă e absentă, stop și upgrade    |

---

## Pasul 7 — Cele două secrete, și zero variabile

**Unde:** GitHub → repository → **Settings → Environments → `production` →
Secrets → New repository secret**.

| Nume                     | Ce e                                                                                     | Notă                                      |
| ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| `KOGAION_DEPLOY_WEBHOOK` | `https://coolify.pazalgroup.com/api/v1/deploy?uuid=319uac7occnbhmn7eui9h0wt&force=false` | copiat **literal** din panou, la pasul 2a |
| `KOGAION_COOLIFY_TOKEN`  | tokenul API cu `read` + `write` + `deploy`                                               | copiat la pasul 2                         |

**Variabilele de repository sunt ZERO.** Nu există `KOGAION_COOLIFY_URL`, nici
`KOGAION_APP_UUID`, nici `KOGAION_PUBLIC_URL`. Rădăcina panoului și uuid-ul se
extrag **ambele** din link, cu `sed`, la începutul jobului:

```bash
COOLIFY_URL="$(printf '%s' "$DEPLOY_WEBHOOK" | sed -nE 's#^(https?://[^/]+)/api/v1/deploy\b.*#\1#p')"
APP_UUID="$(printf '%s' "$DEPLOY_WEBHOOK" | sed -nE 's#.*[?&]uuid=([A-Za-z0-9-]+).*#\1#p')"
```

Ambele modele sunt ancorate pe întregul șir: o valoare care nu are forma așteptată
lasă variabila **goală**, și goală e prinsă de verificările de mai jos — în loc să
producă discret o cerere către altă gazdă.

### De ce ambele valori stau într-un singur secret

Pentru că un link de deploy și o variabilă cu uuid-ul lui sunt **două locuri în
care se scrie aceeași țintă**, iar două locuri înseamnă două lucruri care pot diverge
în tăcere: se schimbă resursa în panou, se actualizează uuid-ul, și se uită linkul.
Când ambele provin din același șir, ele **nu pot** diverge — și nu mai există nimic
de actualizat în doi pași.

E o simplificare deliberată față de designul MedPaz, unde ținta se descopera după
domeniu prin `GET /api/v1/applications` și un `jq` cu potrivire parțială. Când
proiectul are **o singură** resursă Docker Image, descoperirea nu elimina nicio
ambiguitate: costa un apel la fiecare deploy și introducea două clase de eșec care
nu ar fi apărut niciodată — „nicio resursă nu servește …” și „mai mult de una servește
…”. Un uuid scris în link nu poate fi greșit prin potrivire.

### De ce linkul se trimite exact cum a fost copiat

Fără reconstruire. Workflow-ul face `POST` pe `${DEPLOY_WEBHOOK}`, cu tot cu
query string-ul. Dacă ar descompune linkul și l-ar amâna, ar reintroduce exact un al
**doilea** loc în care ținta e scrisă — tocmai ceea ce prima linie elimină.

`force=false` rămâne în link pentru că nu e o opțiune: un deployment deja în curs e
pus în coadă în loc de a fi oprit și repornit. Nimic nu se construiește la acel
deploy — imaginea e deja publicată — deci `force` ar adăuga doar o cale de a întrerupe
un container sănătos.

### De ce tokenul **nu** poate fi în URL

Pentru că Coolify nu autentifică deploy-ul prin query string. Query string-ul
**identifică** ținta; headerul `Authorization: Bearer` **autorizează** acțiunea.

> The URL identifies the deployment target, but the Bearer token authorizes the
> action.
> — documentația Coolify, pagina deploy webhooks

Trei consecințe, toate decisive:

1. **Un token în URL n-ar autentifica nimic.** `?token=...` e un query string oarecare;
   Coolify îl ignoră și răspunde `401`.
2. **Un token în URL se scurge.** Ar ajunge în log-ul rulării, în log-ul de acces al
   panoului, în istoricul shell-ului și în orice tool care scrapează un URL — adică
   în mai multe locuri decât un header, care ajunge doar la destinație.
3. **Un token în URL se rupe silent.** Un secret rotit rămâne valid în secret, dar
   vechea valoare continuă să trimită cereri care eșuează cu `401` — fără ca vreun
   log să spună că sursa e greșită.

| Verificare                  | Rezultat așteptat                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Environment-ul `production` | există **explicit** creat, nu auto-creat de primul job                               |
| `KOGAION_DEPLOY_WEBHOOK`    | începe cu `https://`, conține `/api/v1/deploy?uuid=` și se termină în `&force=false` |
| `KOGAION_COOLIFY_TOKEN`     | tokenul de la pasul 2, copiat întreg                                                 |
| Jobul `deploy`, la rulare   | tipărește `panel …`, `uuid …`, `-> <nume> <domeniu>`                                 |

**Verifică tu**, fără să rulezi pipeline-ul — comanda răspunde într-o secundă și nu
scrie nimic:

```bash
curl -fsS -H "Authorization: Bearer $KOGAION_COOLIFY_TOKEN" \
  "https://coolify.pazalgroup.com/api/v1/applications/319uac7occnbhmn7eui9h0wt" \
  | jq '{name, fqdn, docker_registry_image_tag}'
```

`fqdn` trebuie să fie domeniul tău. Dacă nu e, linkul a fost copiat de pe altă
resursă, iar deploy-ul ar fixa digestul pe containerul greșit.

### Ce folosesc scripturile, ca să nu le confunzi

```bash
HEALTH_URL="https://kogaionacademy.ro/api/health" \
EXPECTED_DIGEST=sha256-<64 hex> \
  bash docs/ghcr-coolify/scripts/verify-deploy.sh
```

Scripturile de operator folosesc aceleași două nume, dar în environment-ul
shell-ului, nu în GitHub. `rollback.sh` folosește în plus `COOLIFY_APP_FQDN`, unde
**ambele forme sunt acceptate**: dacă valoarea arată ca un uuid de Coolify, e
folosită ca atare, fără nicio interogare; altfel se descoperă după domeniu. Deci
`COOLIFY_APP_FQDN=kogaionacademy.ro` și
`COOLIFY_APP_FQDN=319uac7occnbhmn7eui9h0wt` ajung în același loc — vezi
[06-rollback.md](06-rollback.md).

## Pasul 8 — GitHub Environments

**Unde:** GitHub → repository → **Settings → Environments**.

Creează **un singur** environment, exact cu acest nume:

| Environment  | Secrete de adăugat                                |
| ------------ | ------------------------------------------------- |
| `production` | `KOGAION_DEPLOY_WEBHOOK`, `KOGAION_COOLIFY_TOKEN` |

Două secrete, **ambele** aici, și nicio variabilă de repository. Linkul e secret
pentru că e o adresă de deploy cu `uuid`-ul resursei tale: cine o deține poate
declanșa deployment-ul, chiar fără token. Tokenul e secret pentru că autorizează.

Le **amândoi** în environment, nu la nivel de repository, pentru că environment-ul
e un scope de secrete separat: de aici rezultă trei lucruri concrete. Tokenul de
staging nu ajunge la jobul de producție. Aici se poate pune un reviewer
obligatoriu înainte de deploy, nu după. Și se poate limita ramurile — un
environment poate fi restricționat la `main`, care e singura ramură a proiectului.

**De ce nu `staging`, și de ce nu e o lipsă:** proiectul are o singură ramură,
`main`, și o singură resursă. Un environment `staging` ar fi folosit de
aceeași ramură, cu același token, pe același domeniu — deci ar izola exact
nimic, în timp ce ar crea iluzia unei protecții. **Nu se aplică aici.**

### Ce câștigi în continuare, cu un singur environment

Un GitHub Environment e un **scope de secrete separat de repository**, nu o
etichetă. De aici rămân trei lucruri concrete:

| Ce                                                  | De ce contează                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Tokenul nu ajunge la joburile care nu sunt `deploy` | `check`, `lint`, `schema`, `build` și `image` nu văd niciodată tokenul de Coolify |
| Aici se pune reviewerul obligatoriu                 | o aprobare umană înainte de deploy, nu după                                       |
| Aici se poate limita ramurile                       | environment-ul poate fi restricționat la `main`                                   |

Dacă environment-ul cu numele ăla nu există, GitHub îl creează automat — fără
secrete, deci cu `401`. De aceea numele trebuie să coincidă.

| Verificare                  | Rezultat așteptat                                             |
| --------------------------- | ------------------------------------------------------------- |
| Lista de Environments       | conține `production`, și nimic altceva                        |
| Secretele lui               | `KOGAION_COOLIFY_TOKEN`, și nimic altceva                     |
| Environment-ul `production` | decizia despre reviewer e luată și **scrisă** — vezi pasul 10 |

---

## Pasul 9 — Primul deploy

**Ce faci:** `git push origin main` și urmărește rularea în Actions.

### Citiți asta înainte de a vă aștepta la un verde

**Două joburi sunt roșii în prezent**, nu trei. Cum `image` depinde de `build`,
iar `build` depinde de `check` și `lint`, **nimic nu se publică și nimic nu se
deployează** până se repară amândouă.

| Verificare locală                                             | Starea reală                                    | Unde stă                                   |
| ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| `bun run check`                                               | **35 de erori și 5 avertismente în 10 fișiere** | toate în `src/lib/components/edra/`        |
| `bun run lint`                                                | **198 de fișiere neformatate**                  | proiect întreg, nu doar edra               |
| `bun run build`                                               | trece (exit 0)                                  | fără `.env`, fără rețea, fără bază de date |
| `bunx drizzle-kit check --out ./drizzle --dialect postgresql` | trece (exit 0)                                  | fără `DATABASE_URL`                        |

Mecanismul celor 35 de erori e simplu și îl repetă: `src/lib/components/edra/`
e o **copie vendored a editorului**, scrisă pentru o versiune mai veche a
tipurilor Tiptap. Erorile sunt de forma „Property `unsetLink` does not exist on
type `ChainedCommands`” și „Property `searchAndReplace` does not exist on type
`Storage`” — extensii instalate, tipuri neactualizate. Nu sunt bug-uri ale
aplicației tale; sunt un editor terțiar aflat în afara granițelor pe care
svelte-check le verifică. `src/routes/api/health/+server.ts` adaugă zero erori.

Cele 198 de fișiere sunt problema mai simplă: `bun run format`.

**De ce contează ordinea:** orice commit făcut acum pentru a repara pipeline-ul
va fi el însuși blocat de pipeline. Repară local, rulează local, apoi push.

### Ce înseamnă fiecare job

| Job      | Ce spune despre tine                                            | Ce spune despre aplicație                   |
| -------- | --------------------------------------------------------------- | ------------------------------------------- |
| `check`  | codul trece svelte-check în sensuri stricte                     | nimic                                       |
| `lint`   | regulile de stil și eslint respectate                           | nimic                                       |
| `schema` | `drizzle-kit check` nu raportează drift între schemă și migrări | **baza de date se poate actualiza**         |
| `build`  | bundle-ul adapter-node e complet                                | artefactul pe care îl va copia `Dockerfile` |
| `image`  | imaginea a fost construită și publicată în GHCR                 | **ce cod rulează acum**                     |
| `deploy` | digestul a fost fixat și deployment-ul a ajuns terminal         | **ce cod rulează acum, pe server**          |

Jobul `schema` nu are nevoie de `DATABASE_URL` și nu atinge nicio bază de
date: compară fișiere. Doar comanda e fragilă — `drizzle.config.ts` nu are
cheie `out`, deci **ambele** flag-uri sunt obligatorii:

```bash
bunx drizzle-kit check --out ./drizzle --dialect postgresql
```

Fără `--out`, drizzle-kit moare cu un mesaj despre „AWS Data API driver”, care
nu are nicio legătură cu proiectul.

**Nu există joburi de teste unitare și nu există Playwright/e2e.** Nu e o
lipsă a setup-ului, e starea proiectului: nu are niciunul, nici în repo, nici
în CI. Nu căuta un job `unit` sau `e2e` în log — nu există.

Un job roșu îți spune, în ordine, _unde_ s-a rupt:

| Job roșu         | Interpretare                                 | Nu înseamnă                                       |
| ---------------- | -------------------------------------------- | ------------------------------------------------- |
| `check` / `lint` | codul nu e acceptat încă                     | nimic despre imagine                              |
| `schema`         | ai schimbat schema fără migrare generată     | nimic despre imagine                              |
| `build`          | contractul artefactului nu se respectă       | imaginea nu s-a construit                         |
| `image`          | push-ul în GHCR a eșuat                      | serverul nu a fost atins                          |
| `deploy`         | fixarea digestului sau deployment-ul a eșuat | serverul e **neatinse** — jobul nu apasă Redeploy |

### Verificarea obligatorie

| Verificare                                             | Rezultat așteptat                                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Resursa cu uuid-ul din `KOGAION_DEPLOY_WEBHOOK`        | e cea care servește domeniul tău — verificată **înainte** de prima rulare, prin comanda de la pasul 7 |
| _Step summary_ al rulării                              | conține digestul publicat și commitul corespunzător                                                   |
| Pagina Deployments din panou                           | deployment-ul a ajuns într-o stare **terminală**                                                      |
| `docs/ghcr-coolify/scripts/verify-deploy.sh` pe server | digestul containerului care rulează e **identic** cu cel din _Step summary_                           |

**Stările terminale sunt exact trei:** `finished`, `failed` și
`cancelled-by-user`. Cele ne-terminale sunt `queued` și `in_progress`.

> **`successful` nu există**, și nici `cancelled` simplu nu există. Un
> poller sau un ochi care așteaptă șirul greșit rămâne blocat la infinit pe un
> deployment reușit. Jobul de deploy tratează `finished` drept succes.

Scriptul de verificare are cinci secțiuni: containerele care rulează, ce rulează
fiecare, dacă build-ul rulat e cel așteptat, dacă aplicația răspunde, și dacă
corpul health-ului numește commitul. **Verificarea centrală e potrivirea
digestului** cu `EXPECTED_DIGEST`.

Health-ul e doar ultima secțiune, și are o limită declarată cu voce tare:
`/api/health` (`src/routes/api/health/+server.ts`) **nu atinge baza de date**
și aruncă întotdeauna `200`. Cu Postgres oprit, răspunde tot `200`, cu
`status: "ok"`. E o decizie, nu un defect: un probe care interoghează baza ar
declară morți toate replica într-o incidentă de dependență. De aceea
`checks.authSecret` e singurul câmp din corp care raportează o
misconfigurare reală — citește-l.

> **Verifică tu:** notează digestul exact într-un loc unde îl vei găsi peste
> trei săptămâni. Un digest pe care nu l-ai notat nu dovedește nimic.

---

## Pasul 10 — Cablarea producției

**Ce faci:** merge în `main`. Pipeline-ul **construiește și publică** imaginea —
și atât. Un push pe `main` nu face deploy.

Producția se deployează doar printr-o rulare manuală: `workflow_dispatch` cu
input-ul `deploy` bifat, sau un **Redeploy** manual din panou.

```
merge în main  (sau workflow_dispatch)
   └── check + lint + schema + build + image
         └── imaginea e publicată în GHCR — nimic nu e deployat
               └── deploy job → doar la workflow_dispatch cu deploy=true
                     └── environment: production
                           └── token din secretele mediului production
```

Asimetria e **intenționată**: fără staging, orice push pe unica ramură ar fi
decizia implicită de a schimba producția. Interogarea explicită e cea care
transformă un merge într-o intenție.

În panou, producția are nevoie de **resursa ei** — cea unică, creată la pasul 3.
Resursa de producție trebuie să fie cea al cărei uuid e în linkul din
`KOGAION_DEPLOY_WEBHOOK`, și nimic altceva: pipeline-ul nu mai caută nimic și nu
mai potrivește nimic — folosește exact uuid-ul pe care i l-ai dat, trimis așa cum
a fost copiat.

### Decizia pe care trebuie să o iei explicit

**Cere sau nu un reviewer obligatoriu pe `production`?** Cele două răspunsuri
sunt defensabile; ce nu e defensabil e să nu alegi.

| Opțiune       | Ce câștigi                                                                                                                                               | Ce plătești                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Fără reviewer | `main` e calea rapidă; un hotărâtor nu blochează un fix urgent                                                                                           | fiecare deploy rămâne un `workflow_dispatch` manual cu `deploy=true`, fără o a doua verificare înainte de el |
| Cu reviewer   | nimeni nu schimbă producția singur; reviewerul blochează **dispatch-ul**, nu push-ul în `main`, deci corectările urgente merg prin push și apoi aprobare | o latură de așteptare la fiecare deploy                                                                      |

**Verifică tu:** care dintre cele două ai ales, și **scrie-o** într-un commit
care adaugă sau nu reviewerul. O decizie ținută în memorie nu supraviețuiește
unei rotiri de personal.

### Două setări care prind primul deploy, verificat pe v4.3.23

| Setare                         | Starea corectă  | De ce                                                                                                                         |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Allowed IPs for API Access** | **gol**         | IP-urile de ieșire ale runner-elor GitHub sunt dinamice; un allowlist completat face ca deploy-ul să pică cu `403` fără motiv |
| **Rate limiting**              | conștient de el | API-ul răspunde `429` cu `Retry-After`; un poller fără respectarea header-ului se auto-șoarbe                                 |

---

## Dacă ceva nu merge, nu începe de aici

Cel mai frecvent eșuc la primul deploy **nu** e un secret, un token sau un
webhook. E un singur câmp:

> **Ports / Exposes lăsat pe 80.**

Containerul pornește. Health-ul trece. Deployment-ul se încheie cu succes. Și
domeniul răspunde `503` — un cod care arată exact ca o aplicație căzută, și te
duce să citești log-uri de aplicație care nu au nimic de spus.

| Ce vezi               | Ce e de fapt                                                  |
| --------------------- | ------------------------------------------------------------- |
| `503` la domeniu      | proxy-ul forwardează către un port pe care nu ascultă nimeni  |
| Container „healthy”   | procesul chiar ascultă — doar pe 3000, nu pe ce i-a fost spus |
| Deployment „finished” | nu verifică niciodată dacă cererea ajunge la aplicație        |

Al doilea, tot la prima rulare: **fără `ORIGIN`, fiecare POST întoarce
`403`**. `adapter-node` deduce protocolul **hardcodat `https`**, iar
pagina de autentificare se încarcă perfect — până când cineva încearcă să se
logueze. Dacă procesul nu pornește deloc, cauza e tot `ORIGIN`, dar pe cealaltă
cale: `initAuth()` aruncă după numele variabilei.

Repararea e un câmp, trăind în Coolify. Vezi
[07-probleme.md](07-probleme.md).

**În rest, începe de la [07-probleme.md](07-probleme.md)** — simptomul e deja
catalogat acolo, cu cauza și repararea lui.
