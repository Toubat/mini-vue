import { getCombinedNodeFlags } from 'typescript';
import { isString } from '../../shared';
import { NodeType } from './ast';
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from './runtime-helpers';

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;

  genFunctionPreamble(ast, context);

  const functionName = 'render';
  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');

  push(`function ${functionName}(${signature}) {`);

  push('return ');
  genNode(ast.codegenNode, context);

  push('}');

  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast, context) {
  const { push } = context;

  const VueBinging = 'Vue';
  const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;

  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging};`);
    push('\n');
  }

  push('return ');
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source;
    },
    _(key) {
      return `_${helperMapName[key]}`;
    },
  };

  return context;
}

function genNode(node, context) {
  switch (node.type) {
    case NodeType.TEXT:
      genText(node, context);
      break;
    case NodeType.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeType.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeType.ELEMENT:
      genElement(node, context);
      break;
    case NodeType.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    default:
      break;
  }
}

function genCompoundExpression(node: any, context: any) {
  const { push } = context;

  node.children.forEach((child) => {
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  });
}

function genElement(node: any, context: any) {
  const { push, _ } = context;
  const { tag, children, props } = node;

  push(`${_(CREATE_ELEMENT_VNODE)}(`);
  genArgList(genNullable([tag, props, children]), context);

  push(')');
}

function genArgList(args, context) {
  const { push } = context;
  args.forEach((arg, i) => {
    if (isString(arg)) {
      push(arg);
    } else {
      genNode(arg, context);
    }

    if (i < args.length - 1) {
      push(', ');
    }
  });
}

function genNullable(args) {
  return args.map((arg) => arg || 'null');
}

function genExpression(node: any, context: any) {
  const { push } = context;

  push(`${node.content}`);
}

function genInterpolation(node, context) {
  const { push, _ } = context;

  push(`${_(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}

function genText(node: any, context: any) {
  const { push } = context;
  push(`'${node.content}'`);
}
