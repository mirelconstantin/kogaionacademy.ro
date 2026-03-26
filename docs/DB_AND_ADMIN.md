# Bază de date și cont admin

## Baza de date

Aplicația folosește variabila de mediu **DATABASE_URL** (în `.env`). Exemplu pentru baza nouă:

```env
DATABASE_URL="postgres://postgres:PASSWORD@HOST:PORT/clients?sslmode=disable"
```

### Migrare date din baza veche în cea nouă

1. În baza nouă rulezi migrările: `bun run db:migrate`
2. Setezi **OLD_DATABASE_URL** = conexiunea la baza veche (sursă) și **DATABASE_URL** = baza nouă (destinație)
3. Rulezi: `OLD_DATABASE_URL=... DATABASE_URL=... bun run scripts/migrate-db-to-new.ts`

### Populare baza nouă (fără migrare din baza veche)

După ce rulezi migrările pe baza nouă:

1. **`bun run db:migrate`** – aplică schema (tabele mentor, program, program_locale, program_mentor, site_section, hero_settings, contact_settings, etc.).
2. **`bun run db:seed:mentors`** – populează mentori din `scripts/mentors-seed-data.ts`.
3. **`bun run db:seed:content`** – populează programe și conținut per limbă (RO/EN) din `programs-data` și mesaje.
4. **`bun run db:seed:cms`** – setări implicite pentru contact și hero (ro/en).
5. (Opțional) **`bun run db:seed:admin`** – setează rolul de editor pentru contul **pazalgroup@gmail.com** (rulează după primul login cu Google cu acel email).
6. Migrarea **`0011_forms_platform`** adaugă tabelele pentru formulare (definiții, trimiteri, evenimente, metrici). După migrare: **`bun run db:seed:permissions`** (include permisiunile `forms.*`) și opțional **`bun run db:seed:forms`** – publică formularul `contact` implicit (v1) dacă lipsește.
7. Migrarea **`0012_forms_definition_revision`** adaugă tabelul **`forms_definition_revision`** (istoric la fiecare salvare de ciornă în admin). Rulează **`bun run db:migrate`** după pull.
8. (Opțional) **`bun run db:seed:legal`** – inserează în **`site_setting`** cheia **`legal_policies`** (șabloane RO pentru politica cookie, confidențialitate și text banner) dacă lipsește.

Toate seed-urile sunt idempotente (pot fi rulate din nou).

## Eroarea la `bun run db:migrate`

Dacă vezi **ECONNREFUSED**, înseamnă că **PostgreSQL nu rulează** sau nu e accesibil la adresa din `DATABASE_URL`.

1. Pornește PostgreSQL / verifică conexiunea la server.
2. Setează `DATABASE_URL` în `.env`.
3. Rulează din nou: `bun run db:migrate`.

## Cont admin (doar Google)

Autentificarea este **doar prin Google** (fără email/parolă).

1. **Super admin:** contul **pazalgroup@gmail.com** are mereu acces de admin. După primul login cu Google cu acest email, rulează o dată **`bun run db:seed:admin`** (sau POST `http://localhost:5173/api/seed-admin` cu body `{}`) ca să i se seteze rolul `editor` în DB. Dacă userul nu există încă, seed-ul returnează un mesaj: „Loghează-te mai întâi cu Google (pazalgroup@gmail.com); rulează din nou seed-ul după primul login.”
2. În **development** nu e nevoie de `SEED_ADMIN_SECRET`. În **production** seteați `SEED_ADMIN_SECRET` în env și trimiteți-l în body: `{ "secret": "valoarea-ta" }` la POST `/api/seed-admin`.

## Autentificare (login)

- **Pagină login:** `/login` – doar Google (fără înregistrare).
- **Super admin:** contul **pazalgroup@gmail.com** are mereu acces de admin, indiferent de rol în DB.
- Dacă nu ești logat și accesezi ceva protejat (ex. `/admin`), ești redirecționat la `/login`, apoi după login la `/admin`.
- Adminii logați văd o **bară de administrare** (cine e autentificat, link Panou, Deconectare).

## Editare inline (hover)

Când ești autentificat ca editor, pe paginile publice (Mentori, Programe, detaliu program) poți da **hover** pe un card/articol și apăsa **Edit**. Se deschide un popup unde editezi datele; la Salvează, modificările se salvează în baza de date și se reîncarcă datele pe site, deci se văd peste tot (aceeași entitate – mentor sau program – e folosită în listă și în alte pagini).

## Formulare (admin)

- **Rută:** `/admin/forms` – listă definiții, detaliu per id (răspunsuri tip tabel, analiză, export CSV/XLSX, publicare versiune nouă).
- **Design:** tab **Design** – builder vizual (drag-and-drop, palette, JSON brut colapsabil) **și previzualizare** pe aceeași pagină (`FormRenderer` mod `preview`). La **Salvează ciornă** se validează schema și se scrie în `forms_definition`.
- **Răspunsuri:** tabel cu câmpuri dinamice + coloană **Detalii** (pagină sursă, referrer, IP mascat, user-agent, UTM, snapshot consimțământ, fingerprint sesiune, utilizator logat dacă există).
- **Istoric:** după fiecare salvare reușită se inserează un rând în **`forms_definition_revision`** (păstrate ultimele ~100 per formular). Din listă poți **Restaurează** o versiune anterioară (titlu + `schema_json`).
- **Tracking:** evenimentele de analiză se înregistrează doar dacă vizitatorul a acceptat categoria de consimțământ pentru analiză (banner cookie). GA4 opțional: `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` în `.env`.

## Politici legale & GDPR

- **Admin:** `/admin/legal` (vizualizare cu `pages.view`, salvare cu `pages.edit`) – texte în **Markdown** pentru politica cookie, confidențialitate, banner de consimțământ și date operator. Stocare: **`site_setting`**, cheie **`legal_policies`** (JSON).
- **Public:** `/politica-cookie-uri` și `/politica-de-confidentialitate` – același conținut, randat HTML **sanitizat** server-side (`marked` + DOMPurify).
- **Banner:** conținutul titlului și al textului vine din DB; linkuri către cele două pagini. **Footer:** linkuri către aceleași rute.
