import { Component } from './component';
import { createVNode, VNode } from './vnode';

export function h(type: Component | string, props?: any, children?: VNode[] | string): VNode {
  return createVNode(type, props, children);
}
