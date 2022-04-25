import { NodeType } from './ast';

const openDelimiter = '{{';
const closeDelimiter = '}}';

const enum TagType {
  START,
  END,
}

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any[] = [];

  let node;
  const source = context.source;
  if (source.startsWith(openDelimiter)) {
    node = parseInterpolation(context);
  } else if (source[0] === '<') {
    if (/[a-z]/i.test(source[1])) {
      node = parseElement(context);
    }
  }
  nodes.push(node);

  return nodes;
}

function parseInterpolation(context) {
  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim();

  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeType.INTERPOLATION,
    content: {
      type: NodeType.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function parseElement(context: any) {
  const element = parseTag(context, TagType.START);

  parseTag(context, TagType.END);

  return element;
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

function createRoot(children) {
  return {
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
