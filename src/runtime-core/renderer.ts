import { visitNode } from '../../node_modules/typescript/lib/typescript';
import { isElement, isObject } from '../shared/index';
import { ShapeFlag } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent, Component, ComponentInstance } from './component';
import { VNode } from './vnode';

export function render(vnode: VNode, container: HTMLElement) {
  // patch
  patch(vnode, container);
}

function patch(vnode: VNode, container: HTMLElement) {
  // ShapeFlags
  const { shapeFlag } = vnode;

  // Check if vnode is of element type
  if (shapeFlag & ShapeFlag.ELEMENT) {
    // process element
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
    // STATEFUL_COMPONENT
    // process component
    processComponent(vnode, container);
  }
}

function processElement(vnode: VNode, container: HTMLElement) {
  mountElement(vnode, container);
}

function processComponent(vnode: VNode, container: HTMLElement) {
  mountComponent(vnode, container);
}

function mountElement(vnode: VNode, container: HTMLElement) {
  const { type, props, children, shapeFlag } = vnode;

  // @ts-ignore
  const el: HTMLElement = (vnode.el = document.createElement(type));

  // String/Array
  if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
    // @ts-ignore
    el.textContent = children;
  } else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
    // @ts-ignore
    moundChildren(children, el);
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

function mountComponent(initialVNode: VNode, container: HTMLElement) {
  // Create component instance
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: ComponentInstance, container) {
  const { proxy } = instance;

  if (!instance.render) return;
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);

  // After element mounted
  instance.vnode.el = subTree.el;
}

function moundChildren(children: VNode[], container: HTMLElement) {
  children.forEach((child) => {
    patch(child, container);
  });
}
