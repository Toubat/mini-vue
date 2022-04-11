import { Component } from './component';

export interface VNode {
  type: Component | string;
  props?: any;
  children?: VNode[] | string;
  el: HTMLElement | null;
}

export function createVNode(type: Component | string, props?, children?): VNode {
  const vnode: VNode = {
    type,
    props,
    children,
    el: null,
  };

  return vnode;
}
