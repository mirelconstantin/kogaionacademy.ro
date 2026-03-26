import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Tab,
    HeadingLevel,
    AlignmentType,
    type FileChild,
} from 'docx';

const filePath = process.argv[2];

if (!filePath || !existsSync(filePath)) {
    console.error('Usage: bun blogs/workflow/md_to_docx.ts <path_to_md_file>');
    process.exit(1);
}

const mdContent = readFileSync(filePath, 'utf-8');
const lines = mdContent.split('\n');

const FONT = { body: 22, heading1: 26, heading2: 24, title: 28 }; // 11pt, 13pt, 12pt, 14pt (half-points)

function parseInlineMarkup(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);

    for (const part of parts) {
        if (!part) continue;
        if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({ text: part.substring(2, part.length - 2), bold: true, size: FONT.body }));
        } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new TextRun({ text: part.substring(1, part.length - 1), italics: true, size: FONT.body }));
        } else if (part.startsWith('[') && part.includes('](')) {
            // Very naive link parsing: [Text](URL)
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                // Just display text as underlined
                runs.push(new TextRun({ text: match[1], underline: {}, color: "0563C1", size: FONT.body }));
            } else {
                runs.push(new TextRun({ text: part, size: FONT.body }));
            }
        } else {
            runs.push(new TextRun({ text: part, size: FONT.body }));
        }
    }
    return runs;
}

const children: FileChild[] = [];

let docTitle = "Articol_Kogaion";
let isFirstH1 = true;

for (let line of lines) {
    line = line.trim();
    if (!line) {
        continue;
    }

    if (line.startsWith('# ')) {
        const text = line.substring(2);
        docTitle = text.replace(/[<>:"\/\\|?*]+/g, '').trim().substring(0, 100).replace(/\s+/g, '_');

        if (isFirstH1) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text,
                            bold: true,
                            size: FONT.title,
                        }),
                    ],
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 320 },
                })
            );
            isFirstH1 = false;
        } else {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text,
                            bold: true,
                            size: FONT.heading1,
                        }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 360, after: 160 },
                })
            );
        }
    } else if (line.startsWith('## ')) {
        const text = line.substring(3);
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text,
                        bold: true,
                        size: FONT.heading2,
                    }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
            })
        );
    } else if (line.startsWith('• ') || line.startsWith('- ')) {
        const text = line.substring(2);
        children.push(
            new Paragraph({
                children: [new Tab(), new TextRun({ text: `• `, size: FONT.body }), ...parseInlineMarkup(text)],
                spacing: { after: 100 },
            })
        );
    } else {
        children.push(
            new Paragraph({
                children: [new Tab(), ...parseInlineMarkup(line)],
                spacing: { after: 200 },
            })
        );
    }
}

const doc = new Document({
    title: 'Articol Kogaion Gifted Academy',
    creator: 'Kogaion',
    sections: [
        {
            properties: {},
            children,
        },
    ],
});

async function save() {
    const buffer = await Packer.toBuffer(doc);
    const fileName = docTitle + '.docx';
    const outputDir = resolve(process.cwd(), 'blogs', 'articles', '.doc');
    mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, fileName);
    writeFileSync(outputPath, buffer);
    console.log(`Document generat cu succes: ${outputPath}`);
}

save().catch(console.error);
