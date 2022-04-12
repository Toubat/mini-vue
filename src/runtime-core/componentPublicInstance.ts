import { hasOwn } from '../shared/index';

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get(instance, key) {
    // setupState
    const { setupState, props } = instance;

    if (hasOwn(setupState, key)) {
      return Reflect.get(setupState, key);
    } else if (hasOwn(props, key)) {
      return Reflect.get(props, key);
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
