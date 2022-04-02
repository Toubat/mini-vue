import { render } from './renderer';
import { createVNode } from './vnode';

export function creatApp(rootComponent) {
  return {
    mount(rootContainer) {
      // Convert to VNode
      // component -> VNode
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    },
  };
}
