import { mutableHandlers, readonlyHandlers } from './baseHandlers';

export const enum ReactiveFlag {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(target) {
  return createActiveObject(target, mutableHandlers);
}

export function readonly(target) {
  return createActiveObject(target, readonlyHandlers);
}

export function isReactive(target) {
  return !!target[ReactiveFlag.IS_REACTIVE];
}

export function isReadonly(target) {
  return !!target[ReactiveFlag.IS_READONLY];
}

function createActiveObject(target, baseHandlers) {
  return new Proxy(target, baseHandlers);
}
