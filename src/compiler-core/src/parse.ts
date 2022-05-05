import { NodeType } from './ast';

const openDelimiter = '{{';
const closeDelimiter = '}}';

const enum TagType {
  START,
  END,
}

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestors) {
  const nodes: any[] = [];

  while (!isEnd(context, ancestors)) {
    let node;
    const source = context.source;
    if (source.startsWith(openDelimiter)) {
      node = parseInterpolation(context);
    } else if (source[0] === '<') {
      if (/[a-z]/i.test(source[1])) {
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  const s = context.source;

  // 1. encounter end tag
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTag(s, tag)) {
        return true;
      }
    }
  }

  // 2. source has value
  return !s;
}

function parseInterpolation(context) {
  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();

  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeType.INTERPOLATION,
    content: {
      type: NodeType.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function parseElement(context: any, ancestors) {
  const element: any = parseTag(context, TagType.START);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  if (startsWithEndTag(context.source, element.tag)) {
    parseTag(context, TagType.END);
  } else {
    throw new Error(`Missing close tag: ${element.tag}`);
  }

  return element;
}

function parseText(context: any): any {
  let endIndex = context.source.length;
  // 1. Get content
  const endTokens = ['</', '{{'];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeType.TEXT,
    content: content,
  };
}

function startsWithEndTag(source: string, tag: string) {
  return (
    source.startsWith('</') && source.slice(2, tag.length + 2).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context: any, type: TagType) {
  // Parse tag
  const match: any = /^<\/?([a-z]*)/.exec(context.source);
  const tag = match[1];

  // Delete read portion
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  if (type === TagType.END) return;
  return {
    type: NodeType.ELEMENT,
    tag,
  };
}

/**
 * Parse text data and advance by text length
 * @param context
 * @param length
 * @returns text content
 */
function parseTextData(context: any, length: number) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);

  return content;
}

function createRoot(children) {
  return {
    type: NodeType.ROOT,
    children,
  };
}

function createParserContext(content: string) {
  return {
    source: content,
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}
