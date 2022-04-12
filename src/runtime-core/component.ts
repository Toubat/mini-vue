import { shallowRaedonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initProps } from './componentProps';
import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { VNode } from './vnode';

export type Emit = (event: string, ...args: any[]) => void;

export interface Component {
  setup?: (props: any, { emit }: { emit: Emit }) => any;
  render?: () => VNode;
}

export interface ComponentInstance {
  type: any;
  vnode: VNode;
  setupState: any;
  props: any;
  emit: Emit;
  el: HTMLElement | null;
  proxy: any;
  render?: () => VNode;
}

export function createComponentInstance(vnode): ComponentInstance {
  const instance: ComponentInstance = {
    type: vnode.type,
    vnode,
    setupState: {},
    props: {},
    emit: () => {},
    el: null,
    proxy: null,
  };

  instance.emit = emit.bind(null, instance);
  return instance;
}

export function setupComponent(instance: ComponentInstance) {
  // TODO: initProps()
  initProps(instance, instance.vnode.props);
  // TODO: initSlots()

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: ComponentInstance) {
  const Component: Component = instance.type;

  instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    // Return function or object
    const setupResult = setup(shallowRaedonly(instance.props), {
      emit: instance.emit,
    });

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
