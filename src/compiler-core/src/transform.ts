import { NodeType } from './ast';
import { helperMapName, TO_DISPLAY_STRING } from './runtime-helpers';

type TransformPlugin = (node: any) => void;

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
  root.codegenNode = root.children[0];
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

  nodeTransforms.forEach((transform) => {
    transform(node);
  });

  switch (node.type) {
    case NodeType.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeType.ROOT:
      traverseChildren(node, context);
      break;
    case NodeType.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
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
