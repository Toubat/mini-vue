import { VNode } from './vnode';

export function shouldUpdateComponent(prevNode: VNode, currNode: VNode): boolean {
  const { props: prevProps } = prevNode;
  const { props: currProps } = currNode;

  for (const key in currProps) {
    if (currProps[key] !== prevProps[key]) {
      return true;
    }
  }

  return false;
}
