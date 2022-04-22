import { hasOwn } from '../shared/index';
import { ComponentInstance } from './component';

const publicPropertiesMap = {
  $el: (i: ComponentInstance) => i.vnode.el,
  $slots: (i: ComponentInstance) => i.slots,
  $props: (i: ComponentInstance) => i.props,
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
