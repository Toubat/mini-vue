import { mutableHandlers, readonlyHandlers, shalowReadonlyHandlers } from './baseHandlers';

export const enum ReactiveFlag {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers);
}

export function shallowRaedonly(target) {
  return createReactiveObject(target, shalowReadonlyHandlers);
}

export function isReactive(target) {
  return !!target[ReactiveFlag.IS_REACTIVE];
}

export function isReadonly(target) {
  return !!target[ReactiveFlag.IS_READONLY];
}

export function isProxy(target) {
  return isReactive(target) || isReadonly(target);
}

function createReactiveObject(target, baseHandlers) {
  return new Proxy(target, baseHandlers);
}
