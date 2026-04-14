const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeUrl = (rawUrl: string): string => {
  const value = String(rawUrl || '').trim();
  if (!value) return '';
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return '';
};

const renderInlineMarkdown = (input: string): string => {
  let html = escapeHtml(input);

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    const safeHref = sanitizeUrl(href);
    const safeLabel = label || href;
    if (!safeHref) return safeLabel;
    return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  return html;
};

export const markdownToHtml = (markdown: string): string => {
  const normalized = String(markdown || '').replace(/\r\n?/g, '\n');
  if (!normalized.trim()) return '';

  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let cursor = 0;

  while (cursor < lines.length) {
    const currentLine = lines[cursor];

    if (!currentLine.trim()) {
      blocks.push('<div><br/></div>');
      cursor += 1;
      continue;
    }

    if (/^\s*-\s+/.test(currentLine)) {
      const listItems: string[] = [];
      while (cursor < lines.length && /^\s*-\s+/.test(lines[cursor])) {
        listItems.push(lines[cursor].replace(/^\s*-\s+/, ''));
        cursor += 1;
      }
      blocks.push(
        `<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(currentLine)) {
      const listItems: string[] = [];
      while (cursor < lines.length && /^\s*\d+\.\s+/.test(lines[cursor])) {
        listItems.push(lines[cursor].replace(/^\s*\d+\.\s+/, ''));
        cursor += 1;
      }
      blocks.push(
        `<ol>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ol>`,
      );
      continue;
    }

    blocks.push(`<div>${renderInlineMarkdown(currentLine)}</div>`);
    cursor += 1;
  }

  return blocks.join('');
};

const renderChildrenToMarkdown = (element: Element): string =>
  Array.from(element.childNodes)
    .map((node) => renderNodeToMarkdown(node))
    .join('');

const renderListToMarkdown = (element: Element, ordered: boolean): string => {
  const items = Array.from(element.children).filter((item) => item.tagName.toLowerCase() === 'li');
  if (items.length === 0) return '';

  return items
    .map((item, index) => {
      const prefix = ordered ? `${index + 1}. ` : '- ';
      return `${prefix}${renderChildrenToMarkdown(item).trim()}`;
    })
    .join('\n');
};

const renderNodeToMarkdown = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case 'br':
      return '\n';
    case 'strong':
    case 'b':
      return `**${renderChildrenToMarkdown(element)}**`;
    case 'em':
    case 'i':
      return `*${renderChildrenToMarkdown(element)}*`;
    case 'u':
      return `__${renderChildrenToMarkdown(element)}__`;
    case 's':
    case 'strike':
    case 'del':
      return `~~${renderChildrenToMarkdown(element)}~~`;
    case 'a': {
      const label = renderChildrenToMarkdown(element).trim() || 'link';
      const href = sanitizeUrl(element.getAttribute('href') || '');
      return href ? `[${label}](${href})` : label;
    }
    case 'ul':
      return `${renderListToMarkdown(element, false)}\n`;
    case 'ol':
      return `${renderListToMarkdown(element, true)}\n`;
    case 'div':
    case 'p': {
      const content = renderChildrenToMarkdown(element).trim();
      return content ? `${content}\n` : '\n';
    }
    default:
      return renderChildrenToMarkdown(element);
  }
};

export const htmlToMarkdown = (html: string): string => {
  const container = document.createElement('div');
  container.innerHTML = html || '';

  const markdown = Array.from(container.childNodes)
    .map((node) => renderNodeToMarkdown(node))
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
};
