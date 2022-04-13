import { ShapeFlag } from '../shared/shapeFlags';
import { ComponentInstance } from './component';

export function initSlots(instance: ComponentInstance, children: any) {
  const { vnode } = instance;

  if (vnode.shapeFlag & ShapeFlag.SLOT_CHILDREN) {
    // children -> object
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key];
    // slot
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
