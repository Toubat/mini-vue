import { track, trigger } from './effect';

export function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);

      // Track dependency
      track(target, key);

      return res;
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver);

      // Trigger effect
      trigger(target, key);

      return res;
    },
  });
}
