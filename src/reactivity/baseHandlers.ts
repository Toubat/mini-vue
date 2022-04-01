import { track, trigger } from './effect';
import { ReactiveFlag } from './reactive';

// cache the getter and setter so it will only be called once
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
  return function get(target, key) {
    // check to see whether isReactive or isReadonly is called
    if (key === ReactiveFlag.IS_REACTIVE) {
      return !isReadonly;
    } else if (key == ReactiveFlag.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (!isReadonly) {
      // Track dependency
      track(target, key);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    // Trigger effect
    trigger(target, key);

    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key: ${key} cannot be set, since target is readonly.`, target);
    return true;
  },
};
