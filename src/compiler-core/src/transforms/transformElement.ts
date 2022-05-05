import { NodeType } from '../ast';
import { CREATE_ELEMENT_VNODE } from '../runtime-helpers';

export function transformElement(node, context) {
  if (node.type === NodeType.ELEMENT) {
    return () => {
      const vnodeTag = `'${node.tag}'`;

      let vnodeProps = null;

      const children = node.children;
      let vnodeChildren = children[0] || 'null';

      const vnodeElement = {
        type: NodeType.ELEMENT,
        tag: vnodeTag,
        props: vnodeProps,
        children: vnodeChildren,
      };

      node.codegenNode = vnodeElement;
    };
  }
}
