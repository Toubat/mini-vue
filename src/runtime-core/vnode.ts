import { ShapeFlag } from '../shared/shapeFlags';
import { Component } from './component';

export interface VNode {
  type: Component | string;
  props: any;
  children?: VNode[] | string;
  shapeFlag: ShapeFlag;
  el: HTMLElement | null;
}

export function createVNode(
  type: Component | string,
  props: any = {},
  children?: VNode[] | string
): VNode {
  const vnode: VNode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
  };

  if (typeof children === 'string') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.ARRAY_CHILDREN;
  }

  return vnode;
}

export function getShapeFlag(type) {
  return typeof type === 'string' ? ShapeFlag.ELEMENT : ShapeFlag.STATEFUL_COMPONENT;
}
