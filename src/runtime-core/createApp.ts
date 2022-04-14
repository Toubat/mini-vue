import { createVNode } from './vnode';

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootSelector) {
        // Convert to VNode
        // component -> VNode
        const vnode = createVNode(rootComponent);

        const rootContainer =
          typeof rootSelector === 'string' ? document.querySelector(rootSelector) : rootSelector;
        render(vnode, rootContainer);
      },
    };
  };
}
