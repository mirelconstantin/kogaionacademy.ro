# 09 — Aplică pattern-ul la alt proiect

Acest document este de extras: nu depinde de kogaionacademy.ro și se poate copia
în orice alt repository. E singurul document din folder care vorbește despre un
proiect pe care nu îl cunoaște — și tocmai de aceea merită citit: fiecare bug de
la „ce a mers greșit" a costat câte o rulare de CI aici și produce exact aceeași
urmă în orice alt proiect. Tot ce aici a fost **descoperit pe teren**, nu din
documentație.

## 1. Invariantul

```
SERVERUL DE PRODUCȚIE NU CONSTRUIEȘTE NIMIC.
```

GitHub Actions este singurul loc unde se produce imaginea. Coolify _trage_ un
artefact finit, fixat pe digest. Nu există cale de build-pack și nu există
variabilă care să o reactiveze: lipsa unei condiții trebuie să **oprească**
deploy-ul, nu să mute build-ul înapoi pe server. Pentru aplicația concretă a
regulii, vezi [01-arhitectura.md](01-arhitectura.md).

Proiectul din care vine documentul are **o singură** ramură, **o singură**
resursă Docker Image, **un singur** domeniu. Fiecare pas de mai jos e scris pentru
acea formă, iar unde forma diferă, e spus explicit — o instrucțiune care nu se
aplică e mai periculoasă decât una absentă.

## 2. Ce copiezi

| Din acest repo             | În proiectul nou           | Ce se schimbă                                                   |
| -------------------------- | -------------------------- | --------------------------------------------------------------- |
| `Dockerfile`               | `Dockerfile`               | nimic, dacă proiectul e tot SvelteKit + `adapter-node` pe `bun` |
| `.dockerignore`            | `.dockerignore`            | adaugă directoarele scratch ale proiectului                     |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | vezi tabelul de înlocuiri de mai jos                            |
| `docs/ghcr-coolify/`       | `docs/ghcr-coolify/`       | golește exemplele specifice proiectului                         |

`ci.yml` conține **un singur** punct dependent de proiect: linkul de deploy, care
vine dintr-un secret și ascunde în el atât hostname-ul panoului, cât și uuid-ul
resursei. Numele imaginii se derivă din `github.repository`. Deci workflow-ul se
copiază **literal**, cu excepția acelui secret — iar motivul pentru care n-are altă
constantă e în 5.19.

### Înlocuiri necesare

| În `ci.yml`                               | Aici                   | În proiectul nou                                                                                                                                   |
| ----------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ghcr.io/${repo}` din `github.repository` | normalizat lowercase   | **nimic**, se derivă singur                                                                                                                        |
| `branches: [main]`                        | o ramură               | ramurile de build ale tale                                                                                                                         |
| `BUN_VERSION: '1.3.14'`                   | —                      | versiunea ta de runtime                                                                                                                            |
| `scope=kogaion-image`                     | —                      | scope-ul tău de cache                                                                                                                              |
| `KOGAION_DEPLOY_WEBHOOK`                  | environment **secret** | linkul copiat din panou: resursa ta → **Configuration → Webhooks** → „Deploy Webhook (auth required)”. Conține hostname-ul și uuid-ul dintr-o dată |
| `KOGAION_COOLIFY_TOKEN`                   | environment **secret** | tokenul din panoul tău, cu `read` + `write` + `deploy`                                                                                             |
| `environment: production`                 | —                      | environment-ul în care vrei revieweri și secrete                                                                                                   |
| `org.opencontainers.image.source`         | `Dockerfile`           | URL-ul repo-ului tău                                                                                                                               |

Trei lucruri **nu** au ce înlocui, pentru că nu există aici și nici într-un
proiect SvelteKit bine scris: prefixul `NEXT_PUBLIC_*`, perechea de domenii de
stagiu, și orice build arg cu valoare publică. Motivul e în 5.3, iar un
proiect cu o singură ramură nu are ce să promoveze între medii.

### Numărul de medii dictează complexitatea

Relația e simplă, și merită spusă înainte de prima rulare, pentru că e decizia de
arhitectură a pipeline-ului, nu un detaliu de configurare:

| Medii         | Ce configurezi                | Cum arată                                                          |
| ------------- | ----------------------------- | ------------------------------------------------------------------ |
| **unul**      | un link de webhook + un token | un singur environment, două secrete                                |
| **mai multe** | **aceeași schemă**, per mediu | un link și un token per mediu; environment-ul se alege după ramură |

Numărul de medii **nu** schimbă forma — schimbă numărul. Schema rămâne aceeași
pentru că Coolify identifică ținta prin link și autorizează prin header, deci nu
există o cale „mai ieftină” pentru un singur mediu care să nu se degradeze la mai
multe: fiecare mediu primește propria pereche, cu aceleași două nume, în
environment-ul lui.

## 3. Setup, în ordine

### 3.1 Coolify: API Access

**Settings → Configuration → Advanced → API Access → ON.** Fără asta, `/api/v1/*`
răspunde **403**, nu `401`. Diferența schimbă diagnosticul: `401` trimite
operatorul la token, `403` îl trimite la pagina de setări a instanței.

Verifică în aceeași pagină și câmpul **„Allowed IPs for API Access"**: trebuie să
fie **gol**. IP-urile de ieșire ale runner-elor GitHub sunt dinamice, deci o listă
populată respinge fiecare deploy, la fiecare deploy, cu același mesaj.

### 3.2 Coolify: token

**Keys & Tokens → API Tokens → Create**, cu trei permisiuni:

| Permisiune | Pentru ce                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| `read`     | citește resursa, ca digestul deja fixat să poată fi comparat înainte de deploy |
| `write`    | fixează digestul pe resursă                                                    |
| `deploy`   | pornește deployment-ul                                                         |

Un token doar-`deploy` nu ajunge: nu poate citi resursa, deci nu o poate nici
fixa. Pune-i expirare și un reminder în calendar — expirarea lui înseamnă `401`
la fiecare deploy, într-o zi fără motiv vizibil.

### 3.3 Registry: autentificare pe server

Coolify trage imaginea ca **user-ul SSH cu care rulează Docker**. Nu există obiect
de registry în panou; credentialele stau în `~/.docker/config.json` al acelui
user.

```bash
printf '%s' "$GH_TOKEN" | docker login ghcr.io --username "$GITHUB_USERNAME" --password-stdin
```

Tokenul trebuie să fie **clasic** (`github.com/settings/tokens/new`, fără
`?type=fine-grained`), scope `read:packages`. Registry-ul GitHub Packages nu
onorează tokenurile fine-grained.

### 3.4 Resursa Docker Image

**Una singură**, pentru că există o singură ramură. Nu una pentru două medii:
resursa Coolify ar ajunge să nu mai poată fi identificată fără o cheie
configurată, iar pipeline-ul ar trebui să oprească la o ambiguitate pe care nimeni
nu a creat-o. Motive în 5.18; cu o singură resursă, uuid-ul configurat e mai
simplu și nu poate fi interpretat greșit.

| Câmp                                                               | Valoare                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| Tip                                                                | **Docker Image**                                     |
| Image Name                                                         | `ghcr.io/<owner>/<repo>`                             |
| Ports Exposes                                                      | `3000` (resursele Docker Image pornesc pe **80**)    |
| Health check                                                       | **dezactivat în panou** — imaginea are `HEALTHCHECK` |
| Port Mappings / Consistent Container Names / Custom Container Name | **gol / oprit**                                      |

Cinci setări opresc **rolling update-ul**, și toate sunt pe aceeași resursă:
Port Mappings, Consistent Container Names, Custom Container Name, `--ip` în
Custom Docker Options, și pull-request preview. Coolify nu poate reprezenta
două containere cu același nume sau cu aceeași adresă, iar o mapare de port care
nu corespunde e mai rea decât niciuna. Nu au ce căuta la o resursă cu o singură
imagine. Valorile fiecărui câmp, cu motivul, sunt în
[03-configurare-coolify.md](03-configurare-coolify.md).

### 3.5 GitHub

```bash
# Environment-ul se creează EXPLICIT, altfel un job îl auto-crează fără
# protecție și poarta devine decor
gh api --method PUT "repos/<owner>/<repo>/environments/production" --silent

# 1. Linkul de webhook. Se copiază din panou, pe resursa ta:
#    Configuration -> Webhooks -> "Deploy Webhook (auth required)".
#    Copiază-l ÎNTREG, cu tot cu query string-ul — și cu hostname-ul panoului tău,
#    pentru că din el se extrag atât rădăcina, cât și uuid-ul.
read -rs -p "KOGAION_DEPLOY_WEBHOOK: " W; echo
printf '%s' "$W" | gh secret set KOGAION_DEPLOY_WEBHOOK --repo <owner>/<repo> \
  --env production --body-file -
unset W

# 2. Tokenul API, cu read + write + deploy
read -rs -p "KOGAION_COOLIFY_TOKEN: " T; echo
printf '%s' "$T" | gh secret set KOGAION_COOLIFY_TOKEN --repo <owner>/<repo> \
  --env production --body-file -
unset T
```

**Zero `gh variable set`.** Nu mai există `KOGAION_COOLIFY_URL`, nici
`KOGAION_APP_UUID`, nici `KOGAION_PUBLIC_URL`: hostname-ul panoului și uuid-ul
resursei stau ambele în link, și sunt extrase cu `sed` la începutul jobului.

| Secret                   | Ce conține                              | De ce e secret                                            |
| ------------------------ | --------------------------------------- | --------------------------------------------------------- |
| `KOGAION_DEPLOY_WEBHOOK` | hostname-ul panoului + uuid-ul resursei | cine îl are poate declanșa un deployment pe resursa aceea |
| `KOGAION_COOLIFY_TOKEN`  | tokenul API                             | autorizează `PATCH` și `POST`                             |

**Un singur environment aici**, `production`, pentru că o singură ramură
livrează. Un environment de stagiu ar fi folosit de aceeași ramură, cu aceleași
secrete, pe același domeniu — ar izola exact nimic, în timp ce ar crea iluzia
unei protecții. **Nu se aplică aici.**

## 4. De ce apare un hostname DNS-only pentru panou

Dacă panoul e în spatele Cloudflare cu protecție bot, **runner-ele GitHub sunt
challenge-uite** și răspunsul e `403` + HTML `Just a moment…`. Tokenul nu
ajunge niciodată la Coolify.

Cloudflare trece IP-urile rezidențiale și blochează IP-urile de datacenter — deci
**un test făcut de pe laptop nu demonstrează nimic**. Singurul test concludent e
un runner.

| Răspuns                                  | Ce înseamnă                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `401` + `{"message":"Unauthenticated."}` | ai ajuns la Coolify; token lipsă, invalid sau expirat                                                                |
| `403` + JSON                             | ai ajuns la Coolify; **API Access e OFF**, sau IP-ul runner-ului nu e în lista de IP-uri — care trebuie să fie goală |
| `403` + HTML + header `cf-mitigated`     | **Cloudflare; tokenul nu a fost văzut**                                                                              |

Repară, în ordine:

1. **Security → WAF → Custom rules → Skip** pe `uri.path starts_with "/api/"`,
   cu _All managed rules_ + _Browser Integrity Check_ bifate.
2. **Dar:** pe planul Free, **Bot Fight Mode nu poate fi sărit prin regulă** —
   trebuie oprit pentru zonă (Security → Settings → Bots).
3. **Varianta robustă, fără să slăbești nimic:** un hostname **DNS-only** pentru
   panou.

```
Cloudflare DNS:  A  coolify-deploy  <ip-server>  Proxy: DNS only (nor gri)
Coolify:        Settings -> Instance URLs -> https://coolify-deploy.exemplu.ro
                (si un Instance URL nou apare in panou, de unde se recapeaza linkul)
GitHub:         recapeaza linkul de webhook de la resursa ta -> Configuration
                -> Webhooks. Hostname-ul nou apare in el, deci nu se editeaza nimic
```

Verifică că e DNS-only — un IP Cloudflare înseamnă că n-a mers:

```bash
dig +short coolify-deploy.exemplu.ro    # 2.31.2.226  = direct, BINE
dig +short coolify.exemplu.ro          # 104.21.x.x  = Cloudflare, INCORect
```

### 4.1 Certificatul trebuie să existe înainte de prima rulare

Aceasta e etapa care se uită cel mai des. Un hostname DNS-only proaspăt **nu are
certificat**, iar CI-ul primește `curl: (60)` — care nu e un cod HTTP și nu apare
printre 401/403/404. Diagnosticul greșește zona de reparare.

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://coolify-deploy.exemplu.ro/api/v1/applications
# 401 = SANATATE: TLS merge, doar tokenul lipseste
# (60) = nu are certificat, inca
```

Ordinea corectă:

1. creează înregistrarea DNS, **Proxy: DNS only**
2. în Coolify: **Settings → Instance URLs → adaugă hostname-ul** — proxy-ul îl va
   servi și va solicita certificatul
3. **așteaptă emiterea certificatului** (statusul domeniului în panou)
4. abia apoi recapează linkul de webhook de pe resursă și publică-l ca
   `KOGAION_DEPLOY_WEBHOOK` — hostname-ul nou apare în el, deci nu se
   construiește nimic manual. Lasă abia apoi CI-ul să se conecteze.

## 5. Ce a mers greșit, pe rând

Toate au fost bug-uri reale, găsite abia în rulare.

### 5.0 `curl: (60)` nu este un răspuns HTTP

Un hostname nou, DNS-only, fără certificat, eșuează **înainte** de orice status.
Codul de ieșire al lui `curl` e 60 și nu apare în niciun tabel de status-uri,
deci cine se uită doar la HTTP nu vede nimic. Testează explicit:

```bash
# testeaza direct hostname-ul, nu o variabila de pipeline: aici nu exista inca
# niciuna, si tocmai de aceea nu poti folosi una ca sa verifici ceva
curl -sS -o /dev/null -w '%{http_code}\n' https://coolify-deploy.exemplu.ro/api/v1/applications
```

### 5.1 Cache mount-urile BuildKit nu fac nimic pe CI

`RUN --mount=type=cache` e per-builder, iar `docker/setup-buildx-action` creează
un builder nou la fiecare job. Deci pornește **gol**, la fiecare rulare.

> „BuildKit doesn't preserve cache mounts in the GitHub Actions cache by
> default." — documentația Docker pentru CI cache

Elimină-le. Ce funcționează e cache-ul de **layere**: `cache-to: type=gha,mode=max`.

### 5.2 Un `ENV` care se schimbă invalidează stratul scump

`ENV` intră în cheia de cache a stratului. O valoare care se schimbă la fiecare
commit invalidează exact stratul care costă minute — compilarea — și transformă
cache-ul de layere în decor.

`GIT_SHA` se schimbă la fiecare commit și e neapărat citit de procesul care
rulează. Deci în `Dockerfile` e `ARG` + `ENV` în stadiul **runner**, nu în
stadiul `builder`: valoarea ajunge în imagine după ce compilarea e deja în
cache. Mutată în `builder`, ar rescrie `bun run build` la fiecare push.

Aceeași regulă se aplică și la un proiect care construiește un număr de
versiune: un CalVer nu se calculează în două locuri. Contextul CI și contextul imaginii
primesc **aceleași** valori, prin ieșiri de job, nu recalculate.

### 5.3 Variabila decorativă: `NEXT_PUBLIC_*` într-un proiect care nu e Next.js

Caută în repo și vezi **cine** citește efectiv. Numele pe care îl setezi în CI
poate fi complet decorativ: setarea lui `APP_VERSION` nu ajunge la nimic dacă
config-ul citește `PUBLIC_APP_VERSION`.

| Proiect          | Cum ajunge o valoare în browser                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js          | **doar** prin prefixul `NEXT_PUBLIC_*`, înlocuit la build                                                                                       |
| Vite / SvelteKit | **doar** prin `PUBLIC_*` (SvelteKit) sau `VITE_*` (Vite), și **numai** dacă sunt citite din `$env/static/public` sau `import.meta.env.PUBLIC_*` |

Diferența care contează: un proiect care folosește `$env/dynamic/public` sau
`$env/dynamic/private` **nu are absolut nimic public la build**. Valorile se
citesc la runtime și nu au ce să fie îngropate în bundle. Deci nu are nevoie de
build arg public, și nu are ce să se îngroape.

O aserțiune pe artefact, nu pe cod:

```bash
grep -rl "$VERSION" build/client | head || { echo "version not in the bundle"; exit 1; }
```

**Aici nu se aplică deloc:** proiectul are zero `$env/static/*`, zero
`$env/dynamic/public`, zero `import.meta.env`. Citește exclusiv
`process.env`, la runtime. Nu există build arg public — și nu e o lipsă, e
consecința alegerii.

### 5.4 Runnerul musl nu poate încărca binare native din build

Dacă builderul e glibc și runnerul e alpine, binarele native din
`node_modules` se încarcă la runtime și pican pe prima cale de cod care le
atinge — în producție. Alege **o singură familie** libc pentru ambele etape, și
nu folosi o imagine de runtime mai „subțire” decât poate.

Aici nu se aplică: `oven/bun:1.3.14` este Debian 13 (trixie) în builder și în
runner. Dar asta e o proprietate a imaginii de bază, nu o garanție — verific-o
înainte să schimbi tag-ul.

### 5.5 `COPY --link` nu vede un user creat cu o instrucțiune mai sus

```
ERROR: failed to solve: invalid user index: -1
```

`--link` rezolvă `--chown` contra rootfs-ului **bazei**, nu al stadiului. Folosește
id-uri numerice: `--chown=1001:1001`.

### 5.6 `github.repository` păstrează capitalizarea

```
ERROR: invalid tag "ghcr.io/MirelConstantin/ProiectulMeu:sha-…": repository name must be lowercase
```

Normalizează o dată, într-un pas, și folosește rezultatul peste tot. Nu în
`docker push`, unde e prea târziu.

### 5.7 `env:` nu se propagă între pași

Un pas de verificare care folosește o variabilă setată doar pe pasul anterior
moare cu `unbound variable` sub `set -u`. Repetă `env:` pe fiecare pas.

### 5.8 `jq` + `@tsv` numără greșit

`jq -r '[…] | @tsv'` emite **o singură linie** cu tab-uri. Două potriviri se numără
ca una, deci verificarea de ambiguititate nu se declanșează niciodată. Folosește
`| .[]`.

### 5.9 `curl -f` ascunde cauza

`curl: (22)` nu spune nimic. Capturează statusul și corpiul, și deosebește
explicit răspunsurile care arată la fel:

```bash
code="$(curl -sS -o body.json -D headers.txt -w '%{http_code}' … || true)"
if [ "$code" != 200 ]; then
  if grep -qi cf-mitigated headers.txt && grep -qi '<title>[[:space:]]*just a moment' body.json; then
    echo "::error::Cloudflare intercepted the request; the token was never seen."
    exit 1
  fi
  # aici: 401 = token, 403 = API Access sau IP-allowlist, 404 = cale
fi
```

### 5.10 Comutatorul „dezactivează mai târziu" a costat un build pe server

Un `ENABLE_IMAGE_BUILD` oprit implicit înseamnă: jobul nu produce nimic, jobul de
deploy trage oricum, iar serverul construiește imaginea. Verde peste tot, greșit
subtot. **Nu pune un astfel de comutator.** Dacă vrei să migrezi în siguranță,
îl iei din ramura, nu din env.

Aici variabila **nu mai există**: jobul `image` rulează necondiționat la push,
iar `deploy` e `workflow_dispatch` cu inputul `deploy`. Lipsa ei e a treia
strat de apărare, nu o optimizare.

### 5.11 Contextul rulării îngheață la început

Dacă setezi un secret _după_ ce rularea a pornit, jobul tot nu îl vede — și
raportează `missing:` pentru ceva care există. Ridică runul nou, nu îl relua.

### 5.12 `devDependencies` în runner: o imagine de 1,6 GB

Etapa de runtime prelua `node_modules` de la etapa de build, unde `typescript`,
`vite`, `drizzle-kit`, `prettier`, `eslint` și `paraglide` sunt obligatorii
la compilare și nu au ce căuta în producție.

|                          | Înainte                    | După                                |
| ------------------------ | -------------------------- | ----------------------------------- |
| `node_modules` în runner | 456 MB — installul complet | 246 MB — `bun install --production` |
| Imagine, total           | **~1,6 GB**                | **~350–400 MB**                     |

Repararea e un stadiu `prod-deps` care rulează același install cu
`--production --frozen-lockfile`, pe aceleași manifesturi. E corect pentru că
Vite externalizează **doar** pachete din `dependencies`; ce e importat din
`devDependencies` în `src/` ajunge înglobat în chunk-urile de server și nu are
nevoie de intrare în `node_modules` la runtime.

### 5.13 Un pachet extern lăsat în `build/server/` dispare din imagine

Excepția care iese din regula de mai sus, și iese tocmai din ea: un pachet cu
**binare native** — `sharp`, un driver, un addon — declarat în
`devDependencies` și importat în `src/` poate rămâne **literal** în
`build/server/`, pentru că Rollup nu poate îngloba un `.node`. Acolo nu mai
ajunge în bundle și trebuie rezolvat din `node_modules` la runtime. Cum stadiul
`prod-deps` nu îl conține, procesul pican în producție, pe prima rută care îl
atinge — și nu la build, pentru că build-ul nu îl atinge niciodată.

Presupunerea nu se verifică înainte, ci **după**:

```bash
docker run --rm --entrypoint sh <image> -c \
  "grep -rhoE \"from '[^.'][^']*'\" build/server | sort -u"
```

Orice import care începe fără `.` trebuie să aibă intrare în `node_modules` la
runtime. Aici `sharp` e importat literal în două module de rută și a fost mutat
în `dependencies` din acest motiv; verificarea rămâne obligatorie după **fiecare**
schimbare de dependențe.

### 5.14 `instant_deploy: true` îți fură `deployment_uuid`

Dacă trimiți `instant_deploy: true` în PATCH, Coolify pornește deployment-ul din
interiorul acelei cereri și răspunde doar cu `{uuid}` — fără
`deployment_uuid` de urmărit. Mâna care trebuia să urmărească rularea dispare
chiar în pasul care ar fi pornit-o.

Trimit **doar** cele două câmpuri, și pornește tu cu `POST /api/v1/deploy`:

```json
{
	"docker_registry_image_name": "ghcr.io/<owner>/<repo>",
	"docker_registry_image_tag": "sha256-<64 hex>"
}
```

`build_pack` nu se trimite deloc: enum-ul documentat nu include `dockerimage`
și validarea poate respinge.

### 5.15 `deployment_uuid` e imbricat, la `.deployments[0]`

Răspunsul la `POST /api/v1/deploy` are forma asta:

```bash
jq -r '(.deployments // [])[0].deployment_uuid // empty' deploy.json
```

Citit de la nivelul de sus, dă `null`, și bucla de așteptare rămâne fără ce
urmări. Iar un `2xx` aici înseamnă doar **ACCEPTAT**: panoul poate răspunde
`200` cu un mesaj și fără niciun deployment, ceea ce arată exact ca succes.
Dacă uuid-ul e gol, **nu relua jobul** — o a doua rulare pune în coadă un al
doilea deployment peste primul.

### 5.16 `403` are două cauze, și niciuna nu e tokenul

`401` înseamnă token lipsă, invalid sau expirat. `403` înseamnă că cererea a
ajuns la panou și a fost refuzată la poartă, înainte de a se uita măcar la
token — din două setări pe care le controlezi:

| Cauză              | Unde                                         | Reparare |
| ------------------ | -------------------------------------------- | -------- |
| API Access e OFF   | Settings → Configuration → Advanced          | `ON`     |
| IP-allowlist nevid | aceeași pagină, „Allowed IPs for API Access" | **gol**  |

IP-urile de ieșire ale runner-elor GitHub sunt dinamice și se schimbă între
rulări, deci orice listă populată respinge **fiecare** deploy. Un operator
care nu știe câți IP-uri intră în listă nu are cum să o întrețină corect —
deci câmpul trebuie gol, nu „gol pentru acum".

### 5.17 Pollerul: endpointul are `s`, iar stările terminale sunt trei

Endpointul de interogare e `GET /api/v1/deployments/{uuid}` — **cu `s`**.
Forma singulară dă `404`, deci pollerul moare pe o eroare de URL și raportează
un deployment defect drept un deployment inexistent.

Stările terminale sunt exact trei:

| Stare                   | Terminal?                             |
| ----------------------- | ------------------------------------- |
| `finished`              | da, și e singura care înseamnă succes |
| `failed`                | da                                    |
| `cancelled-by-user`     | da                                    |
| `queued`, `in_progress` | nu                                    |

Nu există `successful` și nu există `cancelled` în acest enum. Un poller care
așteaptă `successful` **nu iese niciodată din buclă**: arde tot timeout-ul și
raportează eșec pentru un deployment care s-a încheiat corect — iar dacă
tratamentul e un rollback, îl declanșează de două ori, o dată pentru starea
necunoscută și o dată pentru cea reală.

Orice stare nerecunoscută se tratează ca „continuă”, nu ca succes. Un timeout
e totuși un eșec: înseamnă doar că nu ai învățat rezultatul.

### 5.18 Descoperirea după domeniu nu e gratuită: cu o singură resursă, uuid-ul câștigă

Cea mai bună trăsătură a descoperirii după domeniu e că elimină o valoare de
configurat. În schimb, plătește cu trei lucruri concrete, care trebuie numărate
înainte de a o alege:

| Cost            | Ce e                                                                                |
| --------------- | ----------------------------------------------------------------------------------- |
| un apel în plus | `GET /api/v1/applications` la fiecare deploy, pentru a afla uuid-ul                 |
| un parser       | `jq` cu un filtru pe `fqdn`, plus validarea lui cu `\| .[]` (vezi 5.8)              |
| o clasă de eșec | `No Coolify application serves X` și `More than one ...` — ambele **oprește jobul** |

Cu **mai multe resurse pe domenii diferite**, prețul se amortizează: fiecare mediu
ar necesita alt uuid, copiat manual și păstrat sincron în repository, iar o resursă
recriată din panou primește alt uuid și vechiul tace în tăcere, pentru că nu mai
există nimic care să-l verifice. Acolo descoperirea e alegerea corectă.

Cu **o singură resursă**, potrivirea după domeniu nu elimină nicio ambiguitate:
există un singur candidat prin definiție. Descoperirea nu rezolvă nimic și plătește
plin cu cele trei costuri de mai sus — iar cel mai scump nu e parserul, e clasa de
eșec. O literă greșită în domeniu nu trimite deploy-ul greșit (potrivirea e și ea
verificată: zero potriviri opresc jobul), dar îl blochează, într-o zi în care nu
ai nevoie de încă un eșec.

> **Regula: numărul de medii dictează complexitatea, nu preferința.**
> Mai multe medii → un link de webhook și un token per mediu, cu aceleași două
> nume. Un singur mediu → tot o pereche, dar cu un singur environment și două
> secrete. Schema nu se schimbă niciodată: Coolify identifică ținta prin link și
> autorizează prin header, deci nu există o cale „mai ieftină” pentru un singur mediu
> care să se degradeze la mai multe.

Aici, unde proiectul are o singură ramură, o singură resursă Docker Image și un
singur environment `production`, jobul de `deploy` nu mai interoghează deloc lista
aplicațiilor: citește rădăcina panoului și uuid-ul **din linkul de webhook**, ambele
extrase cu `sed`.

`scripts/rollback.sh` face excepție, intenționat: `COOLIFY_APP_FQDN` acceptă
**ambele forme**, iar dacă valoarea arată a uuid e folosită ca atare, fără
interogare. Un rollback rulează în timpul unui incident, iar în acel moment
operatorul nu are voie să-și amintească ce formă folosește pipeline-ul — un script
care cere alegerea corectă devine un pas în care se poate greși tocmai când
greșelile sunt cele mai scumpe.

### 5.19 Tokenul de API nu merge în query string

Două greșeli care par naturale, și care dau exact aceleași simptome: puni
tokenul în URL, sau crezi că `_TOKEN=…` în query string îl autorizează.

```text
::error::the panel refused the deploy (HTTP 401)
```

Nu merge, pentru că Coolify **nu** citește tokenul din query string. Query string-ul
**identifică ținta**; headerul `Authorization: Bearer` **autorizează** acțiunea:

> The URL identifies the deployment target, but the Bearer token authorizes the
> action.
> — documentația Coolify, pagina deploy webhooks

| Ce ai pus                            | De ce e greșit                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `…/api/v1/deploy?uuid=X&token=Y`     | `Y` nu autorizează nimic; panoul răspunde `401` și niciun log nu spune că sursa e greșită |
| `…/api/v1/deploy?uuid=X&api_token=Y` | aceeași eroare, alt nume de parametru                                                     |
| `…/api/v1/deploy?uuid=X` fără header | corect: cu `Authorization: Bearer` lipsește pur și simplu                                 |

Trei consecințe, în ordinea în care contează:

1. **Nu funcționează.** Un token în query string e un parametru oarecare.
2. **Se scurge în mai multe locuri decât un header.** Un header ajunge doar la
   destinație. Un query string ajunge în log-ul rulării, în log-ul de acces al
   panoului, în istoricul shell-ului și în orice tool care scrapează un URL.
3. **Se rupe silent la rotire.** Dacă tokenul e în secret și șirul în altul, o
   rotație actualizează un singur loc și celălalt continuă să trimită cereri care
   mor cu `401`, fără ca vreun log să indice sursa.

Asta e motivul pentru care cele două secrete sunt separate, și nu unul care le
conține pe amândouă:

| Operație           | Ce atingi                | Ce nu atingi |
| ------------------ | ------------------------ | ------------ |
| rotirea tokenului  | `KOGAION_COOLIFY_TOKEN`  | **linkul**   |
| refacerea resursei | `KOGAION_DEPLOY_WEBHOOK` | **tokenul**  |

Codul de tranzit, corect:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer ${KOGAION_COOLIFY_TOKEN}" \
  "${KOGAION_DEPLOY_WEBHOOK}"
```

Doar headerul. `KOGAION_DEPLOY_WEBHOOK` intră în URL **exact cum a fost copiat**, cu
tot cu query string-ul — uuid și `force=false`.

## 6. Ce verifici înainte de a declara gata

Pasul 2 rulează **pe serverul de deploy**, ca utilizatorul sub care Coolify face
SSH; de acolo vine [05-verificare.md](05-verificare.md).

```bash
# 1. imaginea chiar s-a publicat?
gh run list --workflow=CI --limit 1
gh run view <id> --log | grep -E 'digest:|moving tag:'

# 2. digestul containerului de pe server e cel publicat?
HEALTH_URL=https://<domeniu>/api/health \
EXPECTED_DIGEST=sha256-<64 hex> \
  bash docs/ghcr-coolify/scripts/verify-deploy.sh

# 3. logul de deploy conține linia asta?
#    'Pulling latest images from the registry.'
#    Lipsă = instanță Coolify prea veche; webhook-ul nu re-trage imaginea.
```

Cele trei semne împreună înseamnă că artefactul testat e cel livrat. Un `2xx` de
la `/api/health` dovedește că procesul e în picioare — **nu** ce rulează. Iar
un endpoint de health care nu atinge baza de date și aruncă mereu `200` nu
poate spune nimic despre Postgres: un container sănătos cu baza căzută e
exact cazul pe care un health check bazat pe el nu îl prinde.

## 7. Ce rămâne deschis, în orice proiect

Ce se poate acoperi cu un rollback scurt e în [06-rollback.md](06-rollback.md);
ce nu se poate, e mai jos.

|                                              | De ce nu e în workflow                                                                                                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Migrările nu rulează în pipeline**         | cere o decizie despre cine deține `DATABASE_URL` la momentul migrării și ce se întâmplă cu o migrare care pică pe jumătate. Un pas uman, documentat, e mai bun decât una automatizată greșit. |
| **Tag-urile vechi nu se curăță**             | GHCR nu are TTL, dar o ștergere automată care șterge greșit e mai rea decât tag-uri în plus.                                                                                                  |
| **Test cu `docker run` înainte de deploy**   | ar necesita reproducerea tuturor variabilelor de runtime; un astfel de job care nu reușește blochează toate deploy-urile.                                                                     |
| **Livrarea în producție e un act deliberat** | `main` construiește și publică; livrarea e un `workflow_dispatch` cu un input explicit. Inversa asta în conștință, nu din obicei.                                                             |
