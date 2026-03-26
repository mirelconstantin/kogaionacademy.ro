
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { basename, extname, join, resolve } from 'path';

/**
 * Valideaza linkurile HTTP/HTTPS din articole markdown.
 * Rulare:
 *  - bun blogs/workflow/validate_links.ts <cale_catre_articol.md>
 *  - bun blogs/workflow/validate_links.ts (valideaza toate .md din blogs/articles/.md)
 */

const inputPath = process.argv[2];
const repoRoot = resolve(process.cwd());
const defaultArticlesDir = join(repoRoot, 'blogs', 'articles', '.md');

const markdownLinkRegex = /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;

function collectDefaultArticleFiles(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .map((name) => join(dir, name))
        .filter((filePath) => statSync(filePath).isFile() && extname(filePath).toLowerCase() === '.md');
}

function extractLinks(content: string): string[] {
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const match of content.matchAll(markdownLinkRegex)) {
        const url = match[1];
        if (!seen.has(url)) {
            seen.add(url);
            urls.push(url);
        }
    }
    return urls;
}

async function checkUrl(url: string, context: string) {
    try {
        const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (headResponse.ok) {
            console.log(`✅ [OK] ${context}: ${url}`);
            return true;
        }

        const getResponse = await fetch(url, { method: 'GET', redirect: 'follow' });
        if (getResponse.ok) {
            console.log(`✅ [OK] ${context}: ${url} (GET fallback)`);
            return true;
        }

        console.error(`❌ [FAIL] ${context}: ${url} (Status: ${getResponse.status})`);
        return false;
    } catch (error) {
        console.error(`❌ [ERROR] ${context}: ${url} (${error})`);
        return false;
    }
}

async function validateFile(filePath: string) {
    if (!existsSync(filePath)) {
        console.error(`❌ Fișierul nu există: ${filePath}`);
        return false;
    }

    const content = readFileSync(filePath, 'utf-8');
    const urls = extractLinks(content);
    const fileLabel = basename(filePath);

    if (urls.length === 0) {
        console.log(`ℹ️  Niciun link HTTP/HTTPS găsit în ${fileLabel}.`);
        return true;
    }

    console.log(`\n🔍 Validare linkuri pentru ${fileLabel} (${urls.length} linkuri)...`);

    let allOk = true;
    for (let i = 0; i < urls.length; i += 1) {
        const ok = await checkUrl(urls[i], `${fileLabel}#${i + 1}`);
        if (!ok) allOk = false;
    }

    return allOk;
}

async function main() {
    const filesToValidate = inputPath
        ? [resolve(inputPath)]
        : collectDefaultArticleFiles(defaultArticlesDir);

    if (filesToValidate.length === 0) {
        console.error('❌ Nu există fișiere .md de validat.');
        process.exit(1);
    }

    let hasErrors = false;
    for (const filePath of filesToValidate) {
        const ok = await validateFile(filePath);
        if (!ok) hasErrors = true;
    }

    if (hasErrors) {
        console.error('\nValidare linkuri eșuată.');
        process.exit(1);
    }

    console.log('\nToate linkurile validate cu succes. ✅');
}

main().catch((error) => {
    console.error('❌ Eroare neașteptată la validarea linkurilor:', error);
    process.exit(1);
});
