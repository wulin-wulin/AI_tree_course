import { Fragment, type ReactNode } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

type RichTextProps = {
  text?: string | null;
  className?: string;
  variant?: 'body' | 'lead' | 'compact' | 'formula';
};

type ParagraphBlock = { type: 'paragraph'; lines: string[] };
type HeadingBlock = { type: 'heading'; text: string };
type CodeBlock = { type: 'code'; code: string; language?: string };
type MathBlock = { type: 'math'; math: string };
type ListBlock = { type: 'list'; ordered: boolean; start?: number; items: string[] };
type RichBlock = ParagraphBlock | HeadingBlock | CodeBlock | MathBlock | ListBlock;

const MATH_OPTIONS = {
  throwOnError: false,
  strict: 'ignore' as const,
  output: 'html' as const,
};

export function hasRichTextContent(text?: string | null): boolean {
  if (!text) return false;
  return text.replace(/```/g, '').trim().length > 0;
}

function isEscaped(text: string, index: number): boolean {
  let count = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) count += 1;
  return count % 2 === 1;
}

function findUnescaped(text: string, token: string, from: number): number {
  let i = from;
  while (i < text.length) {
    const hit = text.indexOf(token, i);
    if (hit === -1) return -1;
    if (!isEscaped(text, hit)) return hit;
    i = hit + token.length;
  }
  return -1;
}

function stripMathDelimiters(value: string): string {
  const t = value.trim();
  if (t.startsWith('$$') && t.endsWith('$$')) return t.slice(2, -2).trim();
  if (t.startsWith('\\[') && t.endsWith('\\]')) return t.slice(2, -2).trim();
  if (t.startsWith('\\(') && t.endsWith('\\)')) return t.slice(2, -2).trim();
  if (t.startsWith('$') && t.endsWith('$')) return t.slice(1, -1).trim();
  return t;
}

function normalizeMath(value: string): string {
  return stripMathDelimiters(value)
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/，/g, ',')
    .replace(/⊙/g, '\\odot ')
    .replace(/π/g, '\\pi ')
    .replace(/φ/g, '\\phi ')
    .replace(/θ/g, '\\theta ')
    .replace(/μ/g, '\\mu ')
    .replace(/σ/g, '\\sigma ')
    .replace(/γ/g, '\\gamma ')
    .replace(/ε/g, '\\epsilon ');
}

function looksLikeStandaloneMath(value: string): boolean {
  const t = stripMathDelimiters(value);
  if (!t || /[\u4e00-\u9fa5]/.test(t)) return false;
  return /\\|[_^=<>+\-*/]|forall|exists|arg|max|min|sum|sqrt|sigma|theta|gamma|pi|KL|softmax/.test(t);
}

function MathNode({ math, display = false }: { math: string; display?: boolean }) {
  const normalized = normalizeMath(math);
  try {
    const html = katex.renderToString(normalized, { ...MATH_OPTIONS, displayMode: display });
    const Tag = display ? 'div' : 'span';
    return (
      <Tag
        className={display ? 'rich-math-block' : 'rich-math-inline'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    const Tag = display ? 'pre' : 'code';
    return <Tag className={display ? 'rich-math-fallback block' : 'rich-math-fallback'}>{math}</Tag>;
  }
}

function readSpecial(text: string, index: number): number {
  const checks = ['`', '**', '\\(', '\\[', '$'];
  const hits = checks
    .map((token) => text.indexOf(token, index))
    .filter((hit) => hit >= 0);
  return hits.length ? Math.min(...hits) : text.length;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < text.length) {
    if (text.startsWith('`', i) && !isEscaped(text, i)) {
      const end = findUnescaped(text, '`', i + 1);
      if (end > i + 1) {
        nodes.push(<code key={`${keyPrefix}-code-${i}`} className="rich-inline-code">{text.slice(i + 1, end)}</code>);
        i = end + 1;
        continue;
      }
    }

    if (text.startsWith('**', i) && !isEscaped(text, i)) {
      const end = findUnescaped(text, '**', i + 2);
      if (end > i + 2) {
        nodes.push(
          <strong key={`${keyPrefix}-strong-${i}`}>
            {renderInline(text.slice(i + 2, end), `${keyPrefix}-strong-${i}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }

    if (text.startsWith('\\(', i)) {
      const end = text.indexOf('\\)', i + 2);
      if (end > i + 2) {
        nodes.push(<MathNode key={`${keyPrefix}-math-${i}`} math={text.slice(i + 2, end)} />);
        i = end + 2;
        continue;
      }
    }

    if (text.startsWith('\\[', i)) {
      const end = text.indexOf('\\]', i + 2);
      if (end > i + 2) {
        nodes.push(<MathNode key={`${keyPrefix}-math-${i}`} math={text.slice(i + 2, end)} />);
        i = end + 2;
        continue;
      }
    }

    if (text[i] === '$' && !text.startsWith('$$', i) && !isEscaped(text, i)) {
      const end = findUnescaped(text, '$', i + 1);
      const math = end > i ? text.slice(i + 1, end).trim() : '';
      if (math) {
        nodes.push(<MathNode key={`${keyPrefix}-math-${i}`} math={math} />);
        i = end + 1;
        continue;
      }
    }

    const next = readSpecial(text, i + 1);
    nodes.push(text.slice(i, next));
    i = next;
  }

  return nodes;
}

function parseListLine(line: string): { ordered: boolean; start?: number; text: string } | null {
  const ordered = line.match(/^\s*(\d+)[.)、]\s+(.+)$/);
  if (ordered) return { ordered: true, start: Number(ordered[1]), text: ordered[2] };
  const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
  if (bullet) return { ordered: false, text: bullet[1] };
  return null;
}

function readBlockMath(lines: string[], start: number): { block: MathBlock; next: number } | null {
  const line = lines[start].trim();
  const isDollar = line.startsWith('$$');
  const isBracket = line.startsWith('\\[');
  if (!isDollar && !isBracket) return null;

  const close = isDollar ? '$$' : '\\]';
  const openLen = isDollar ? 2 : 2;
  if (line.endsWith(close) && line.length > openLen + close.length) {
    return { block: { type: 'math', math: line.slice(openLen, -close.length).trim() }, next: start + 1 };
  }

  const collected: string[] = [line.slice(openLen)];
  let i = start + 1;
  for (; i < lines.length; i += 1) {
    const current = lines[i];
    const trimmed = current.trim();
    if (trimmed.endsWith(close)) {
      collected.push(current.slice(0, current.lastIndexOf(close)));
      return { block: { type: 'math', math: collected.join('\n').trim() }, next: i + 1 };
    }
    collected.push(current);
  }

  return { block: { type: 'math', math: collected.join('\n').trim() }, next: i };
}

function parseBlocks(text: string): RichBlock[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: RichBlock[] = [];
  let paragraph: string[] = [];
  let list: ListBlock | null = null;

  const flushParagraph = () => {
    const clean = paragraph.map((line) => line.trim()).filter(Boolean);
    if (clean.length) blocks.push({ type: 'paragraph', lines: clean });
    paragraph = [];
  };
  const flushList = () => {
    if (list && list.items.length) blocks.push(list);
    list = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      const language = line.slice(3).trim() || undefined;
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i += 1;
      }
      if (code.join('').trim()) blocks.push({ type: 'code', code: code.join('\n'), language });
      continue;
    }

    const math = readBlockMath(lines, i);
    if (math) {
      flushParagraph();
      flushList();
      blocks.push(math.block);
      i = math.next - 1;
      continue;
    }

    const heading = line.match(/^\*\*(.+?)\*\*[：:]\s*(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: heading[1] });
      if (heading[2]) paragraph.push(heading[2]);
      continue;
    }

    const listLine = parseListLine(raw);
    if (listLine) {
      flushParagraph();
      if (!list || list.ordered !== listLine.ordered) {
        flushList();
        list = { type: 'list', ordered: listLine.ordered, start: listLine.start, items: [] };
      }
      list.items.push(listLine.text);
      continue;
    }

    if (list && /^\s{2,}\S/.test(raw)) {
      const last = list.items.length - 1;
      if (last >= 0) {
        list.items[last] = `${list.items[last]}\n${line}`;
        continue;
      }
    }

    flushList();
    paragraph.push(raw);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderParagraph(lines: string[], key: string) {
  return (
    <p key={key}>
      {lines.map((line, index) => (
        <Fragment key={`${key}-line-${index}`}>
          {index > 0 ? <br /> : null}
          {renderInline(line, `${key}-${index}`)}
        </Fragment>
      ))}
    </p>
  );
}

function renderBlock(block: RichBlock, index: number): ReactNode {
  const key = `rich-block-${index}`;
  switch (block.type) {
    case 'heading':
      return <h4 key={key}>{renderInline(block.text, key)}</h4>;
    case 'code':
      return (
        <pre key={key} className="rich-code-block">
          {block.language ? <span className="rich-code-language">{block.language}</span> : null}
          <code>{block.code}</code>
        </pre>
      );
    case 'math':
      return <MathNode key={key} math={block.math} display />;
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={key} className="rich-list" start={block.ordered ? block.start : undefined}>
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-item-${itemIndex}`}>
              {item.split('\n').map((line, lineIndex) => (
                <Fragment key={`${key}-item-${itemIndex}-line-${lineIndex}`}>
                  {lineIndex > 0 ? <br /> : null}
                  {renderInline(line, `${key}-item-${itemIndex}-${lineIndex}`)}
                </Fragment>
              ))}
            </li>
          ))}
        </Tag>
      );
    }
    case 'paragraph':
    default:
      return renderParagraph(block.lines, key);
  }
}

function RichText({ text, className = '', variant = 'body' }: RichTextProps) {
  if (!hasRichTextContent(text)) return null;
  const trimmed = text!.trim();
  const classes = ['rich-text', `rich-text-${variant}`, className].filter(Boolean).join(' ');

  if (variant === 'formula' && looksLikeStandaloneMath(trimmed)) {
    return (
      <div className={classes}>
        <MathNode math={trimmed} display />
      </div>
    );
  }

  const blocks = parseBlocks(trimmed);
  return <div className={classes}>{blocks.map(renderBlock)}</div>;
}

export default RichText;
