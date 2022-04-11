const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get(instance, key) {
    // setupState
    const { setupState } = instance;
    if (key in setupState) {
      return Reflect.get(setupState, key);
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
