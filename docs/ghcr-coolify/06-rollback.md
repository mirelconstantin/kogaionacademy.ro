# 06 — Rollback

Rollback-ul aici nu e „rebuild și redeploy”. E **o singură operație**:
repoziționarea resursei pe digestul unei versiuni anterioare, deja existente în
registry. Durează secunde și nu atinge serverul cu un compilator.

## Ce e disponibil

| Țintă                   | Cine o menține                 | Cât timp                                                 |
| ----------------------- | ------------------------------ | -------------------------------------------------------- |
| digest fixat în Coolify | pipeline-ul, la fiecare deploy | până la următorul deploy                                 |
| tag `:sha-<commit>`     | pipeline-ul, la fiecare push   | **permanent** — GHCR nu expune TTL și nu face GC automat |

Tag-urile `:sha-` sunt ținta de rollback și nu expira: GHCR nu expune TTL și nu
garbage-colește nimic singur, de aceea eliminarea lor e o **operație manuală**,
cu comanda din [07-probleme.md](07-probleme.md) — și cu avertismentul cu care
merită.

Tag-ul e imutabil **prin convenție de CI**, nu prin garanție a registry-ului:
GHCR nu are deloc tag-uri imutabile, iar orice token cu `packages: write` îl
poate suprascrie. Ce e de neatins e digestul.

## Procedura

```bash
export KOGAION_COOLIFY_URL=https://<panel>          # fara /api/v1
export KOGAION_COOLIFY_TOKEN=...                   # token cu read + write + deploy
export COOLIFY_APP_FQDN=kogaionacademy.ro          # domeniu SAU uuid — vezi mai jos
#   sau, echivalent, fara nicio interogare:
#   export COOLIFY_APP_FQDN=319uac7occnbhmn7eui9h0wt
export ROLLBACK_TO=ghcr.io/mirelconstantin/kogaionacademy.ro:sha-<commit>

bash docs/ghcr-coolify/scripts/rollback.sh --dry-run   # arata ce ar schimba
bash docs/ghcr-coolify/scripts/rollback.sh             # efectueaza
```

`COOLIFY_APP_FQDN` e o constantă, nu o întrebare: proiectul are **un singur**
resource Docker Image pe **un singur** domeniu. Scriptul refuză oricum să
aleagă dacă domeniul ar fi servit de două resurse — alegerea greșită la două
dimineața e cum se lovește site-ul greșit.

### Cele două forme, și de ce nu trebuie să alegi între ele

`COOLIFY_APP_FQDN` acceptă **ambele** forme, iar scriptul le deosebește după
**formă**, nu după o întrebă pusă operatorului:

| Formă           | Exemplu                    | Ce face scriptul                                                   |
| --------------- | -------------------------- | ------------------------------------------------------------------ |
| domeniu         | `kogaionacademy.ro`        | `GET /api/v1/applications`, potrivește `fqdn`-ul, ia uuid-ul unice |
| uuid de resursă | `319uac7occnbhmn7eui9h0wt` | îl folosește **ca atare**, fără nicio interogare                   |

Un rollback rulează în timpul unui incident, iar în acel moment operatorul nu are
voie să-și amintească ce formă folosește pipeline-ul. O întrebare în plus în
intervenție e un pas în care se poate greși exact când greșelile sunt cele mai
scumpe.

**De ce uuid-urile Coolify nu arată ca UUID-urile.** Identificatorul de resursă al
Coolify este un șir **scurt, alfanumeric, doar litere mici și cifre** — de forma
`319uac7occnbhmn7eui9h0wt` — și **nu** forma hexazecimală cu liniițe, de **36 de
caractere**, a unui UUIDv4. Diferența nu e cosmetică: un test de validare scris din
reflexul UUID (`[0-9a-f-]{36}`) **respinge fiecare id real**, și eroarea ar fi
„uuid invalid”, nu „asta nu e un uuid”.

Dacă primesti forma scurtă din panou și o treci printr-un validator de UUID, vei
căuta o problemă care nu există.

Ce face scriptul, în ordine:

0. **Descoperă aplicația** după domeniu: `GET /api/v1/applications`, apoi
   potrivește `fqdn`-ul cu `COOLIFY_APP_FQDN` și ia uuid-ul aplicației unice.
   Dacă potrivește zero sau mai mult de una, _nu schimbă nimic_ și tipărește
   lista aplicațiilor.
1. **Pre-flight**: rezolvă `ROLLBACK_TO` în registry. Dacă nu se rezolvă,
   _nu schimbă nimic_.
2. Dacă e tag, îl rezolvă la digest și le afișează pe amândouă.
3. Citește digestul fixat acum și îl afișează.
4. `PATCH` cu digestul de rollback.
5. **Citește din nou și verifică** că scrierea a prins. Aici o eroare e
   urlată, nu tăcută.
6. `POST /api/v1/deploy`.
7. Polarizează deployment-ul până la stare terminală; ieșire non-zero la
   eșec sau timeout.

De ce verificarea de la pasul 5 e obligatorie, și nu decorativă: un nume de
câmp ignorat în tăcălă de Coolify lasă resursa ancorată la digestul curent, iar
apoiarea **arată verde** — ai face deploy fără să fi schimbat nimic, și ai
crede că ai dat înapoi.

### Cele trei forme ale răspunsului, și de ce contează

Pasul 6 nu întoarce un obiect de deploy, ci un **vector**:

```json
{ "deployments": [{ "deployment_uuid": "...", "status": "queued" }] }
```

`deployment_uuid` e **nested**, la `deployments[0].deployment_uuid`, nu la
nivelul de jos. De aceea PATCH-ul de la pasul 4 **nu** trimite
`instant_deploy`: acel flag declanșează deploy-ul chiar din PATCH, iar răspunsul
PATCH nu conține niciun `deployment_uuid` — pornirea și urmărirea ar fi un
singur pas, de nedemonstrat. Nici `build_pack` nu se trimite: enum-ul
documentat nu include `dockerimage`, deci o valoare plauzibilă poate fi
respinsă la validare — iar un PATCH respins nu fixează nimic.

Pasul 7 interoghează `GET /api/v1/deployments/{uuid}` — **plural**. Stările
terminale sunt exact trei:

| Stare               | Semnificație       |
| ------------------- | ------------------ |
| `finished`          | succes             |
| `failed`            | eșec               |
| `cancelled-by-user` | anulat de operator |

Celelalte două, `queued` și `in_progress`, sunt ne-terminale: nu se potrivesc
în lista de mai sus și bucla continuă.

**Capcana cunoscută a documentației vechi:** nu există starea `successful` și
nu există starea `cancelled`. Un poller care așteaptă `successful` nu iese
niciodată din buclă — arde tot `POLL_TIMEOUT` (implicit 900 s) și raportează
timeout un deploy perfect reușit. Așa se întâmplă un rollback de a doua ori în
timp ce primul încă rulează.

## Din interfață, dacă nu ai API-ul

La fel de valid, cu trei grijări:

1. `Configuration -> General -> Docker Registry`.
2. Înlocuiește **Docker Image Tag or Hash** cu digestul vechi, în forma
   `sha256-<64 hex>` — **cu linie, fără `:`**. E chiar forma în care Coolify
   stochează digestul în `docker_registry_image_tag`, nu forma `sha256:<hex>`
   pe care o tipărește `docker ps`.
3. **Redeploy**, nu Restart.

Atenție: **Restart retrage din nou imaginea** de la referința salvată. Cu tag
mutător (`main`, singura ramură din repo) asta înseamnă conținut diferit fără
nicio schimbare de cod; cu digest e același lucru, dar nu e motivul pentru care
preferăm digest-ul. În general, după ce schimbi porturi, label-uri, variabile
sau health check, trebuie **Redeploy sau Restart** — doar Save nu ajunge la
container.

## Cum găsesc commitul potrivit

```bash
# lista ultimelor deploy-uri, cu digestul pe care l-a primit fiecare
gh run list --workflow=CI --branch=main --limit 10
```

Apoi, în rularea aleasă, _Step summary_ de la job-ul `image` — digestul este acolo.

Sau din istoric, dacă știi ce ai schimbat:

```bash
git log --oneline -20 main
```

Ramura `staging` **nu se aplică aici**: repo-ul are o singură ramură, `main`,
și un singur workflow, `.github/workflows/ci.yml`. Nu ai de unde alege între
două medii — de aceea digestul fixat e singurul reper al buildului care rulează.

## După rollback

**Trei lucruri care trebuie spune explicit, pentru că fiecare a costat deja
pe cineva o oră de căutare:**

1. **Nu rula CI imediat după rollback.** Orice push pe `main` fixează resursa
   înapoi pe digestul nou și șterge toată urma. Verifică mai întâi site-ul:
   `EXPECTED_DIGEST=sha256-<hex> bash docs/ghcr-coolify/scripts/verify-deploy.sh`.
2. **Fixul, nu revertul, e ce trebuie commitat.** Dacă ai dat rollback ca să
   câștigi timp, hotărârea se ia în Git, nu în panou.
3. **Tag-urile `:sha-` supraviețuiesc.** Poți oricând să te uiți în istoric
   după o versiune anterioară, oricât de veche. De aceea merită păstrate — și de
   aceea curățarea lor e o operație cu ochii deschiși, nu un cron.

## Refacerea unei resurse pierdute

Dacă panoul Coolify se pierde sau resursa e ștearsă din greșeală, toate valorile
de configurare trăiesc în [03-configurare-coolify.md](03-configurare-coolify.md)
și în secrete. Ordinea de reconstrucție e în
[04-prima-o-data.md](04-prima-o-data.md); singura informație pe care nu o
găsești nicăieri — digestul pe care rula resursa — se pierde, și atunci
pipeline-ul o fixează la următorul deploy, ceea ce e exact comportamentul dorit.
