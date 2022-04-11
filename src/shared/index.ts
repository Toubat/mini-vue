import { VNode } from '../runtime-core/vnode';

export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

export const isElement = (vnode: VNode) => {
  return typeof vnode.type === 'string';
};

export const hasChanged = (value, newValue) => {
  return !Object.is(value, newValue);
};
