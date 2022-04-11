import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { VNode } from './vnode';

export interface Component {
  setup?: () => any;
  render?: () => VNode;
}

export interface ComponentInstance {
  type: any;
  vnode: VNode;
  setupState: any;
  el: HTMLElement | null;
  proxy: any;
  render?: () => VNode;
}

export function createComponentInstance(vnode): ComponentInstance {
  const instance: ComponentInstance = {
    type: vnode.type,
    vnode,
    setupState: {},
    el: null,
    proxy: null,
  };
  return instance;
}

export function setupComponent(instance: ComponentInstance) {
  // TODO: initProps()
  // TODO: initSlots()

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: ComponentInstance) {
  const Component: Component = instance.type;

  instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    // Return function or object
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance: ComponentInstance, setupResult: any) {
  // TODO: function

  if (typeof setupResult === 'object') {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: ComponentInstance) {
  const Component: Component = instance.type;

  if (!instance.render) {
    instance.render = Component.render;
  }
}
