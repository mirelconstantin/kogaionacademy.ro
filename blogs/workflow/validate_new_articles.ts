import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Script pentru validarea articolelor noi Kogaion Academy (Engineer Bootcamp).
 * Rulare: bun blogs/workflow/validate_new_articles.ts <cale_catre_fisier_md>
 */

const filePath = process.argv[2];

if (!filePath) {
    console.error('Te rog specifică calea către fișierul markdown.');
    process.exit(1);
}

if (!existsSync(filePath)) {
    console.error(`Fișierul nu a fost găsit: ${filePath}`);
    process.exit(1);
}

const content = readFileSync(filePath, 'utf-8');
const resolvedPath = resolve(filePath).replace(/\\/g, '/');

const mentionsAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));

// Reguli de validare
const rules = [
    {
        name: 'Locație fișier articol (.md)',
        check: () => /\/blogs\/articles\/\.md\/.+\.md$/i.test(resolvedPath),
        error: 'Articolul trebuie salvat în blogs/articles/.md/ cu extensia .md.',
    },
    {
        name: 'Structură H1 (Prima linie)',
        check: (text: string) => /^\s*#\s+.+/.test(text.trim()),
        error: 'Articolul trebuie să înceapă cu un titlu principal (H1).',
    },
    {
        name: 'Structură H2',
        check: (text: string) => (text.match(/^##\s+.+/gm) || []).length >= 2,
        error: 'Articolul trebuie să aibă cel puțin 2 subtitluri principale (H2).',
    },
    {
        name: 'Menționare Program (Engineer Bootcamp)',
        check: (text: string) => /Kogaion Engineer Bootcamp|Engineer Bootcamp|Kogaion/i.test(text),
        error: 'Articolul trebuie să menționeze explicit Kogaion Engineer Bootcamp.',
    },
    {
        name: 'Tematică program (minimum 3 piloni)',
        check: (text: string) => {
            const thematicPatterns = [
                /construct|cuptor de lut|inginer/i,
                /fizic|magnetism|electricitate|presiun|for[țt]e/i,
                /cunoa[șs]tere de sine|semin[țt]ele bucuriei|autoreglare|rezilien/i,
                /drume[țt]ie|natur|outdoor/i,
                /problem solving|cooperare|echip/i,
            ];
            const matchedCount = thematicPatterns.filter((pattern) => pattern.test(text)).length;
            return matchedCount >= 3;
        },
        error: 'Articolul trebuie să includă minimum 3 piloni specifici Engineer Bootcamp (inginerie, fizică, cunoaștere de sine, natură, cooperare/problem solving).',
    },
    {
        name: 'Apel la acțiune (CTA) Detaliat',
        check: (text: string) => {
            const hasPhone = /0720\s*529\s*398/i.test(text);
            const hasWebsite = /kogaionacademy\.ro\/programe\/kogaion-engineer-bootcamp-2\/inscriere/i.test(text);
            const hasDetails = /Când\s*:|Unde\s*:|Cine\s*:/i.test(text);
            return hasPhone && hasWebsite && hasDetails;
        },
        error: 'Articolul trebuie să conțină un bloc CTA Engineer Bootcamp cu Când/Unde/Cine, link de înscriere și telefon 0720 529 398.',
    },
    {
        name: 'Lungime minimă (cuvinte)',
        check: (text: string) => {
            const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
            return wordCount >= 1000;
        },
        error: 'Articolul este prea scurt. Trebuie să aibă minim 1000 de cuvinte.',
    },
    {
        name: 'Tone of voice Kogaion',
        check: (text: string) =>
            mentionsAny(text, [
                /dezvoltare/i,
                /copii/i,
                /încredere|incredere/i,
                /echilibru/i,
                /bucurie/i,
                /înv[aă]țare|invatare/i,
            ]),
        error: 'Articolul nu pare aliniat cu tonul Kogaion (dezvoltare, copii, echilibru, bucurie, învățare).',
    }
];

let hasErrors = false;

console.log(`\nValidare articol: ${filePath}\n`);

rules.forEach((rule) => {
    if (!rule.check(content)) {
        console.error(`[X] EROARE: ${rule.error}`);
        hasErrors = true;
    } else {
        console.log(`[✓] ${rule.name}`);
    }
});

if (hasErrors) {
    console.log('\nValidare eșuată. Te rog corectează problemele și încearcă din nou.');
    process.exit(1);
} else {
    console.log('\nArticolul respectă structura cerută! ✅');
}
