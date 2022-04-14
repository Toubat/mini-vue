import { effect } from '../reactivity/effect';
import { ShapeFlag } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent, Component, ComponentInstance } from './component';
import { createAppAPI } from './createApp';
import { createTextVNode, Fragment, Text, VNode } from './vnode';

export interface RendererOptions {
  createElement: (type: string) => any;
  patchProps: (el: HTMLElement, key: string, val: any) => void;
  insert: (el: HTMLElement, container: HTMLElement) => void;
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
  } = options;

  function render(vnode: VNode, container: HTMLElement) {
    // patch
    patch(null, vnode, container, null);
  }

  function patch(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    // ShapeFlags
    const { shapeFlag, type } = currNode;

    // Fragment -> only render children
    switch (type) {
      case Fragment:
        processFragment(prevNode, currNode, container, parentInstance);
        break;
      case Text:
        processText(prevNode, currNode, container);
      default:
        // Check if vnode is of element type or component type
        if (shapeFlag & ShapeFlag.ELEMENT) {
          // process element
          processElement(prevNode, currNode, container, parentInstance);
        } else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
          // process component
          processComponent(prevNode, currNode, container, parentInstance);
        }
    }
  }

  function processFragment(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    const { children } = currNode;

    mountChildren(children as VNode[], container, parentInstance);
  }

  function processText(prevNode: VNode | null, currNode: VNode, container: HTMLElement) {
    const { children } = currNode;

    const textNode = (currNode.el = document.createTextNode(children as string));
    container.append(textNode);
  }

  function processElement(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    if (!prevNode) {
      mountElement(currNode, container, parentInstance);
    } else {
      patchElement(prevNode, currNode, container);
    }
  }

  function patchElement(prevNode: VNode, currNode: VNode, container: HTMLElement) {
    console.log('patchElement');
    console.log('n1', prevNode);
    console.log('n2', currNode);

    // TODO: patch props

    // TODO: patch children
  }

  function processComponent(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    mountComponent(currNode, container, parentInstance);
  }

  function mountElement(
    vnode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    const { type, props, children, shapeFlag } = vnode;

    // debugger;
    // @ts-ignore
    const el: HTMLElement = (vnode.el = hostCreateElement(type));

    // String/Array
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      el.textContent = children as string;
    } else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
      mountChildren(children as VNode[], el, parentInstance);
    }

    for (const key in props) {
      const val = props[key];

      hostPatchProps(el, key, val);
    }

    // container.append(el);
    hostInsert(el, container);
  }

  function mountComponent(
    initialVNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    // Create component instance
    const instance = createComponentInstance(initialVNode, parentInstance);

    setupComponent(instance);
    setupRenderEffect(instance, container);
  }

  function setupRenderEffect(instance: ComponentInstance, container) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;

        if (!instance.render) return;
        const subTree = (instance.subTree = instance.render.call(proxy));

        // vnode -> patch
        patch(null, subTree, container, instance);

        // After element mounted
        instance.vnode.el = subTree.el;

        instance.isMounted = true;
      } else {
        const { proxy, subTree: prevSubTree } = instance;

        if (!instance.render) return;
        const subTree = (instance.subTree = instance.render.call(proxy));

        patch(prevSubTree, subTree, container, instance);
        instance.vnode.el = subTree.el;
      }
    });
  }

  function mountChildren(
    children: VNode[],
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    children.forEach((child) => {
      if (typeof child === 'string') {
        patch(null, createTextVNode(child), container, parentInstance);
      } else {
        patch(null, child, container, parentInstance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
