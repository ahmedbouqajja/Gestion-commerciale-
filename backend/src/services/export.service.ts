import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from 'docx';

// Conversion d'un contenu Markdown simple vers PDF et Word.
// Gère : titres (#, ##, ###), listes (-, *, 1.), citations (>), texte gras **...**.

interface Line {
  type: 'h1' | 'h2' | 'h3' | 'li' | 'quote' | 'p' | 'blank';
  text: string;
}

function parseMarkdown(md: string): Line[] {
  return md.split('\n').map((raw): Line => {
    const line = raw.replace(/\s+$/, '');
    if (line.trim() === '') return { type: 'blank', text: '' };
    if (line.startsWith('### ')) return { type: 'h3', text: line.slice(4) };
    if (line.startsWith('## ')) return { type: 'h2', text: line.slice(3) };
    if (line.startsWith('# ')) return { type: 'h1', text: line.slice(2) };
    if (line.startsWith('> ')) return { type: 'quote', text: line.slice(2) };
    if (/^\s*[-*]\s+/.test(line)) return { type: 'li', text: line.replace(/^\s*[-*]\s+/, '') };
    if (/^\s*\d+\.\s+/.test(line)) return { type: 'li', text: line.replace(/^\s*\d+\.\s+/, '') };
    return { type: 'p', text: line };
  });
}

// Supprime les marqueurs **gras** pour le rendu PDF (texte simple).
function stripInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`(.+?)`/g, '$1');
}

export async function toPdf(title: string, markdown: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 56 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c as Buffer));

  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.font('Helvetica-Bold').fontSize(20).text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#666')
    .text('Assistant Prof Maroc AI', { align: 'center' });
  doc.fillColor('#000');
  doc.moveDown(1);

  for (const line of parseMarkdown(markdown)) {
    const text = stripInline(line.text);
    switch (line.type) {
      case 'h1':
        doc.moveDown(0.5).font('Helvetica-Bold').fontSize(17).text(text);
        doc.moveDown(0.2);
        break;
      case 'h2':
        doc.moveDown(0.4).font('Helvetica-Bold').fontSize(14).text(text);
        doc.moveDown(0.2);
        break;
      case 'h3':
        doc.moveDown(0.3).font('Helvetica-Bold').fontSize(12).text(text);
        break;
      case 'li':
        doc.font('Helvetica').fontSize(11).text(`•  ${text}`, { indent: 12 });
        break;
      case 'quote':
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#555').text(text);
        doc.fillColor('#000');
        break;
      case 'blank':
        doc.moveDown(0.4);
        break;
      default:
        doc.font('Helvetica').fontSize(11).text(text);
    }
  }

  doc.end();
  return done;
}

// Construit des TextRun en gérant le **gras** pour Word.
function runsFrom(text: string): TextRun[] {
  const parts = text.split(/(\*\*.+?\*\*)/g).filter(Boolean);
  return parts.map((p) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return new TextRun({ text: p.slice(2, -2), bold: true });
    }
    return new TextRun({ text: p.replace(/`(.+?)`/g, '$1') });
  });
}

export async function toDocx(title: string, markdown: string): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: title, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Assistant Prof Maroc AI', color: '888888', size: 18 })],
    }),
    new Paragraph({ text: '' }),
  ];

  for (const line of parseMarkdown(markdown)) {
    switch (line.type) {
      case 'h1':
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runsFrom(line.text) }));
        break;
      case 'h2':
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runsFrom(line.text) }));
        break;
      case 'h3':
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: runsFrom(line.text) }));
        break;
      case 'li':
        children.push(new Paragraph({ bullet: { level: 0 }, children: runsFrom(line.text) }));
        break;
      case 'quote':
        children.push(
          new Paragraph({ children: [new TextRun({ text: line.text, italics: true, color: '555555' })] }),
        );
        break;
      case 'blank':
        children.push(new Paragraph({ text: '' }));
        break;
      default:
        children.push(new Paragraph({ children: runsFrom(line.text) }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
