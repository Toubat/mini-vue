import { render } from './renderer';
import { createVNode } from './vnode';

export function createApp(rootComponent) {
  return {
    mount(rootSelector) {
      // Convert to VNode
      // component -> VNode
      const vnode = createVNode(rootComponent);

      const rootContainer = document.querySelector(rootSelector);
      render(vnode, rootContainer);
    },
  };
}
