import { visitNode } from '../../node_modules/typescript/lib/typescript';
import { isElement, isObject } from '../shared/index';
import { ShapeFlag } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent, Component, ComponentInstance } from './component';
import { createTextVNode, Fragment, Text, VNode } from './vnode';

export function render(vnode: VNode, container: HTMLElement) {
  // patch
  patch(vnode, container, null);
}

function patch(vnode: VNode, container: HTMLElement, parentInstance: ComponentInstance | null) {
  // ShapeFlags
  const { shapeFlag, type } = vnode;

  // Fragment -> only render children
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentInstance);
      break;
    case Text:
      processText(vnode, container);
    default:
      // Check if vnode is of element type or component type
      if (shapeFlag & ShapeFlag.ELEMENT) {
        // process element
        processElement(vnode, container, parentInstance);
      } else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
        // process component
        processComponent(vnode, container, parentInstance);
      }
  }
}

function processFragment(
  vnode: VNode,
  container: HTMLElement,
  parentInstance: ComponentInstance | null
) {
  const { children } = vnode;

  mountChildren(children as VNode[], container, parentInstance);
}

function processText(vnode: VNode, container: HTMLElement) {
  const { children } = vnode;

  const textNode = (vnode.el = document.createTextNode(children as string));
  container.append(textNode);
}

function processElement(
  vnode: VNode,
  container: HTMLElement,
  parentInstance: ComponentInstance | null
) {
  mountElement(vnode, container, parentInstance);
}

function processComponent(
  vnode: VNode,
  container: HTMLElement,
  parentInstance: ComponentInstance | null
) {
  mountComponent(vnode, container, parentInstance);
}

function mountElement(
  vnode: VNode,
  container: HTMLElement,
  parentInstance: ComponentInstance | null
) {
  const { type, props, children, shapeFlag } = vnode;

  // @ts-ignore
  const el: HTMLElement = (vnode.el = document.createElement(type));

  // String/Array
  if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
    el.textContent = children as string;
  } else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
    mountChildren(children as VNode[], el, parentInstance);
  }

  for (const key in props) {
    const val = props[key];

    const isOn = (key: string) => /^on[A-Z]/.test(key);

    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
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
  const { proxy } = instance;

  if (!instance.render) return;
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container, instance);

  // After element mounted
  instance.vnode.el = subTree.el;
}

function mountChildren(
  children: VNode[],
  container: HTMLElement,
  parentInstance: ComponentInstance | null
) {
  children.forEach((child) => {
    if (typeof child === 'string') {
      patch(createTextVNode(child), container, parentInstance);
    } else {
      patch(child, container, parentInstance);
    }
  });
}
