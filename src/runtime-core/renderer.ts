import { visitNode } from '../../node_modules/typescript/lib/typescript';
import { isElement, isObject } from '../shared/index';
import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
  // patch
  patch(vnode, container);
}

function patch(vnode, container) {
  // Check if vnode is of element type
  if (isElement(vnode)) {
    // process element
    processElement(vnode, container);
  } else if (isObject(vnode)) {
    // process component
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountElement(vnode, container) {
  const { type, props, children } = vnode;

  const el = (vnode.el = document.createElement(type));

  // String/Array
  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    moundChildren(vnode, el);
  }

  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  container.append(el);
}

function mountComponent(initialVNode, container) {
  // Create component instance
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);

  // After element mounted
  instance.vnode.el = subTree.el;
}

function moundChildren(vnode, container) {
  vnode.children.forEach((child) => {
    patch(child, container);
  });
}
