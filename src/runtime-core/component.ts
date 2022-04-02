export function createComponentInstance(vnode) {
  const component = {
    type: vnode.type,
    vnode,
  };
  return component;
}

export function setupComponent(instance) {
  // TODO: initProps()
  // TODO: initSlots()

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  const { setup } = Component;

  if (setup) {
    // Return function or object
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  // TODO: function

  if (typeof setupResult === 'object') {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;

  if (!instance.render) {
    instance.render = Component.render;
  }
}
