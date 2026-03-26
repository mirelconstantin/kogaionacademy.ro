# Workflow Generare Articole Blog - Kogaion Academy

**Ghid Complet Pentru AI - Generare Articole de Calitate Superioară (Stil Engineer Bootcamp)**

> **IMPORTANT:** Acest document conține instrucțiuni EXACTE, PAS CU PAS pentru generarea de articole de blog. Urmează cu strictețe ordinea pașilor și respectă toate regulile marcate cu ⚠️ sau 🔴.

---

## 📋 Structura Finală (Obiectiv)

Articolele nu sunt livrate în array-uri TypeScript, ci ca **fișiere Markdown (.md)** ce vor fi ulterior convertite în Word (.docx).

**Structura de directoare (obligatorie):**
- Articole `.md`: `blogs/articles/.md/`
- Articole convertite `.docx`: `blogs/articles/.doc/`
- Referințe program: `blogs/references/`
- Reguli și validare: `blogs/workflow/`

**Structura obligatorie a fișierului Markdown:**
```markdown
# Titlul Articolului (Obligatoriu H1)

Introducere puternică, directă (fără "în era digitală").

## Subtitlu 1 (H2)
Conținut profund psihologic/educațional.

## Subtitlu 2 (H2)
Legătura cu programele Kogaion (ex. Interior Architecture, ConectOM).

---
**Date Contact / CTA:**
Te așteptăm la Kogaion Gifted Academy.
Telefon: 0720 529 398
Website: [kogaionacademy.ro](https://kogaionacademy.ro)
```

---

## 🎯 PAS 1: Pregătire și Planificare 

### 1.0 Studierea Referințelor Oficiale (CRITIC)
Înainte de orice, citește analiza detaliată a programului promovat din `blogs/references/`.

**În etapa curentă, folosește EXCLUSIV:**
- `Program_Kogaion_Engineer_Bootcamp_Advanced_Reference.md`
- `Program_Kogaion_Engineer_Bootcamp_Advanced_Reference.json`
- (opțional) `Program_Kogaion_Engineer_Bootcamp_Raw_Capture_2026-03-20.md`

**Scopul articolului:** promovarea maximă a programului Engineer Bootcamp, folosind informații exacte (mentori, locație, activități, beneficii, date logistice, CTA).

### 1.1 Alege Subiectele

**Criterii de selecție:**
- **Ton:** Inspirațional, științific, profund, aplicat pentru copii.
- **Public Țintă:** Părinți de copii 7-12 ani.
- **Beneficii:** Focus pe dezvoltare practică (inginerie, fizică), echilibru emoțional și cooperare.

**Exemple de subiecte bune:**
- "Cum construiește un copil încredere reală prin proiecte inginerești practice"
- "Ce înseamnă o tabără STEM care dezvoltă și autocunoașterea, nu doar competențe tehnice"

### 1.2 Definește Keywords

⚠️ **REGULI STRICTE KEYWORDS:**
1. **DOAR în ROMÂNĂ**
2. **Specific, nu generic:** 
   - ❌ "tabără de vară"
   - ✅ "tabără inginerie copii", "fizică experimentală copii", "tabără problem solving copii"
3. **Fiecare keyword** trebuie menționat **cel puțin o dată** în articol.

---

## 🔍 PAS 2: Structura și Tonul (Stil "Bootcamp")

### 2.1 Fără Introduceri Plictisitoare
Începe direct cu o întrebare puternică sau o afirmație care provoacă ("Cum îl ajuți pe copil să-și construiască încrederea prin experiențe reale, nu doar teorie?").

### 2.2 Profunzime
Folosește termeni de specialitate explicați accesibil: *gândire inginerească aplicată*, *relație cauză-efect*, *autoreglare emoțională*, *reziliență*. Reliefează contrastul dintre educația bazată pe memorare și educația experiențială Kogaion (aplicabilitate, natură, colaborare).

---

## 📊 PAS 3: Optimizare SEO și Formatare

### 3.1 Titlu (H1 Obligatoriu)
- ⚠️ **CRITIC:** Prima linie reală de text trebuie să fie `# Titlul Articolului`. 
- Titlul trebuie să capteze atenția părinților. Poate fi mai lung și descriptiv (ex: *De ce perioada de după pubertate este critică pentru devenirea adultului: "Fereastra de Oportunitate" pe care nu vrei să o ratezi*).

### 3.2 Subtitluri (Minim două H2)
- Folosește `##` pentru a împărți textul logic.

### 3.3 Lungime (CRITIC)
- 🔴 **MINIM 1000 DE CUVINTE**. Un articol bun se întinde adesea pe 3-5 pagini A4 pentru a fi exhaustiv și a convinge părinții prin argumentație solidă.

---

## 📞 PAS 4: Apel la Acțiune (CTA)

Orice articol trebuie să se încheie cu un CTA clar, al cărui scop principal este să convingă părinții să își înscrie copiii.

**Template CTA Obligatoriu (Engineer Bootcamp):**
```markdown
Dacă ai citit până aici, probabil îți dorești mai mult decât o tabără de vacanță pentru copilul tău.
Descoperă **Kogaion Engineer Bootcamp** și oferă-i un context real de dezvoltare prin știință, natură, cooperare și autocunoaștere.

**Detalii Program Kogaion Engineer Bootcamp:**
• Când: 12–17 iulie 2026 (6 zile)
• Unde: Moieciu de Sus, Pensiunea Nicoleta Moieciu de Sus
• Cine: Copii 7–9 ani și 10–12 ani
• Formular înscriere: [kogaionacademy.ro/programe/kogaion-engineer-bootcamp-2/inscriere](https://kogaionacademy.ro/programe/kogaion-engineer-bootcamp-2/inscriere/)
• Telefon: 0720 529 398
```
---

## ✅ PAS 5: Validare Finală (Checklist)

Înainte de a livra textul sau a genera documentul Word, rulează validarea:
`bun blogs/workflow/validate_new_articles.ts blogs/articles/.md/<nume_articol>.md`

**Checklist:**
- [ ] Începe cu `# Titlu` (H1) ✓
- [ ] Conține minim două `## Subtitluri` (H2) ✓
- [ ] Lungime peste 1000 de cuvinte ✓
- [ ] Conține termeni specifici Engineer Bootcamp (inginerie, fizică experimentală, cunoaștere de sine, problem solving etc.) ✓
- [ ] Conține CTA / date de contact (0720, link formular înscriere Engineer Bootcamp) ✓
- [ ] Tonul este serios, educațional, profund ✓

## ⚙️ PAS 6: Pipeline Automat (Recomandat)

Pentru rulare cap-coadă (validare articol -> autofix iterativ -> validare linkuri -> conversie docx), folosește:

`bun blogs/workflow/run_article_pipeline.ts blogs/articles/.md/<nume_articol>.md`

Sau pentru toate articolele din `blogs/articles/.md/`:

`bun blogs/workflow/run_article_pipeline.ts --all`

---

**Versiune Document:** 3.0 (Februarie 2026 - Update Kogaion Academy)
