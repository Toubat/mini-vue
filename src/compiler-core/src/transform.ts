import { NodeType } from './ast';
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from './runtime-helpers';

type TransformPlugin = (node: any, context?: TransformContext) => void;

export interface TransformOptions {
  nodeTransforms: TransformPlugin[];
}

export interface TransformContext {
  root: any;
  nodeTransforms: TransformPlugin[];
  helpers: Map<string, 1>;
  helper(key: string): void;
}

export function transform(root, options: TransformOptions = { nodeTransforms: [] }) {
  const context = createTransformContext(root, options);

  // DFS
  traverseNode(root, context);

  // root.codegenNode
  createRootCodegen(root);

  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root) {
  const child = root.children[0];
  if (child.type === NodeType.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}

function createTransformContext(root, options: TransformOptions): TransformContext {
  const context: TransformContext = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };

  return context;
}

function traverseNode(node, context) {
  const nodeTransforms = context.nodeTransforms;
  const exitFns: any[] = [];

  nodeTransforms.forEach((transform) => {
    const exit = transform(node);
    if (typeof exit === 'function') exitFns.push(exit);
  });

  switch (node.type) {
    case NodeType.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeType.ROOT:
      traverseChildren(node, context);
      break;
    case NodeType.ELEMENT:
      context.helper(CREATE_ELEMENT_VNODE);
      traverseChildren(node, context);
      break;
    default:
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(node, context) {
  const children = node.children;

  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      traverseNode(node, context);
    }
  }
}
