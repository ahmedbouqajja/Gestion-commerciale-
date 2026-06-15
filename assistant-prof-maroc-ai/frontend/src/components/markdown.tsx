// Rendu Markdown léger (titres, listes, gras, citations) sans dépendance externe.
import { Fragment } from 'react';

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*.+?\*\*|`.+?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${keyPrefix}-${i}`} className="rounded bg-muted px-1 py-0.5 text-sm">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length) {
      blocks.push(
        <ul key={key} className="my-2 list-disc space-y-1 ps-6">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.replace(/\s+$/, '');
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      listItems.push(line.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, ''));
      return;
    }
    flushList(`list-${idx}`);
    if (line.trim() === '') return;
    if (line.startsWith('### ')) {
      blocks.push(<h3 key={idx} className="mt-4 mb-1 text-base font-semibold">{renderInline(line.slice(4), `h3-${idx}`)}</h3>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={idx} className="mt-5 mb-2 text-lg font-bold">{renderInline(line.slice(3), `h2-${idx}`)}</h2>);
    } else if (line.startsWith('# ')) {
      blocks.push(<h1 key={idx} className="mt-5 mb-2 text-xl font-bold">{renderInline(line.slice(2), `h1-${idx}`)}</h1>);
    } else if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={idx} className="my-2 border-s-4 border-muted ps-3 text-sm text-muted-foreground">
          {renderInline(line.slice(2), `q-${idx}`)}
        </blockquote>,
      );
    } else {
      blocks.push(<p key={idx} className="my-1.5 leading-relaxed">{renderInline(line, `p-${idx}`)}</p>);
    }
  });
  flushList('list-end');

  return <div className="text-sm">{blocks}</div>;
}
