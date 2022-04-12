import { createVNode } from '../vnode';

export function renderSlots(slots, name, props) {
  const slot = slots[name];

  if (slot) {
    if (typeof slot === 'function') {
      // Create a vnode
      return createVNode('div', {}, slot(props));
    }
  }
}
