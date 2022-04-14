import { VNode } from '../runtime-core/vnode';

export const EMPTY_OBJ = {};

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

export const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toEventHandlerKey = (event: string): string => {
  return event ? 'on' + capitalize(camelize(event)) : '';
};

export const camelize = (str: string): string => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : '';
  });
};
