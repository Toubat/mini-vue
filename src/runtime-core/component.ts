import { shallowRaedonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initProps } from './componentProps';
import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initSlots } from './componentSlots';
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
  slots: any;
  provides: any;
  el: HTMLElement | null;
  proxy: any;
  parent: ComponentInstance | null;
  emit: Emit;
  render?: () => VNode;
}

let currentInstance: ComponentInstance | null = null;

export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInstance | null
): ComponentInstance {
  console.log('parent: ', parent);
  const instance: ComponentInstance = {
    type: vnode.type,
    vnode,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    el: null,
    proxy: null,
    parent: parent,
    emit: () => {},
  };

  instance.emit = emit.bind(null, instance);
  return instance;
}

export function setupComponent(instance: ComponentInstance) {
  // initProps
  initProps(instance, instance.vnode.props);
  // initSlots
  initSlots(instance, instance.vnode.children);

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: ComponentInstance) {
  const Component: Component = instance.type;

  instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    // set global currentInstance variable to be used in setup()
    setCurrentInstance(instance);
    // Return function or object
    const setupResult = setup(shallowRaedonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);
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

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance: ComponentInstance | null) {
  currentInstance = instance;
}
