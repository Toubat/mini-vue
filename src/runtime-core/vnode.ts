import { ShapeFlag } from '../shared/shapeFlags';
import { Component, ComponentInstance } from './component';

export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text');

export interface VNode {
  key: any;
  type: Component | string | typeof Fragment | typeof Text;
  props: any;
  children?: VNode[] | string;
  shapeFlag: ShapeFlag;
  el: HTMLElement | Text | null;
  instance: ComponentInstance | null;
}

export function createVNode(
  type: Component | string | typeof Fragment | typeof Text,
  props: any = {},
  children?: VNode[] | string
): VNode {
  const vnode: VNode = {
    key: (props && props.key) || null,
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
    instance: null,
  };

  if (typeof children === 'string') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.ARRAY_CHILDREN;
  } else if (vnode.shapeFlag & ShapeFlag.STATEFUL_COMPONENT && typeof children === 'object') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.SLOT_CHILDREN;
  }

  return vnode;
}

export function createTextVNode(text: string): VNode {
  return createVNode(Text, {}, text);
}

export function getShapeFlag(type) {
  return typeof type === 'string' ? ShapeFlag.ELEMENT : ShapeFlag.STATEFUL_COMPONENT;
}
