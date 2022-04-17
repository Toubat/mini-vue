import { effect } from '../reactivity/effect';
import { EMPTY_OBJ } from '../shared';
import { ShapeFlag } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent, Component, ComponentInstance } from './component';
import { createAppAPI } from './createApp';
import { createTextVNode, Fragment, Text, VNode } from './vnode';

export interface RendererOptions {
  createElement: (type: string) => any;
  patchProps: (el: HTMLElement, key: string, prevVal: any, nextVal: any) => void;
  insert: (el: HTMLElement, container: HTMLElement) => void;
  remove: (el: HTMLElement | Text) => void;
  setElementText: (el: HTMLElement, text: string) => void;
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
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
      patchElement(prevNode, currNode, container, parentInstance);
    }
  }

  function patchElement(
    prevNode: VNode,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null = null
  ) {
    // TODO: patch props
    const oldProps = prevNode.props || EMPTY_OBJ;
    const newProps = currNode.props || EMPTY_OBJ;

    const el = (currNode.el = prevNode.el) as HTMLElement;

    patchChildren(prevNode, currNode, el, parentInstance);
    patchProps(el, oldProps, newProps);
    // TODO: patch children
  }

  function patchChildren(
    prevNode: VNode,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null
  ) {
    const { shapeFlag, children } = currNode;
    const { shapeFlag: prevShapeFlag, children: prevChildren } = prevNode;

    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      // Array -> Text
      if (prevShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
        // Remove children
        unmountChildren(prevNode.children);
      }
      // Update text content
      if (prevChildren !== children) {
        hostSetElementText(container, children as string);
      }
    } else {
      if (prevShapeFlag & ShapeFlag.TEXT_CHILDREN) {
        hostSetElementText(container, '');
        mountChildren(children as VNode[], container, parentInstance);
      }
    }
  }

  function unmountChildren(children: VNode[] | string | undefined) {
    if (!Array.isArray(children)) return;

    children.forEach((child, i) => {
      // Remove
      const el = child.el;
      if (el) hostRemove(el);
    });
  }

  function patchProps(el: HTMLElement, oldProps, newProps) {
    // Optimization ??
    if (oldProps === newProps) return;

    // Add or modify existing prop
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];

      if (prevProp !== nextProp) {
        hostPatchProps(el, key, prevProp, nextProp);
      }
    }

    if (oldProps === EMPTY_OBJ) return;

    // Remove old prop
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProps(el, key, oldProps[key], null);
      }
    }
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
      hostPatchProps(el, key, null, val);
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
        // instance.vnode.el = subTree.el;
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
