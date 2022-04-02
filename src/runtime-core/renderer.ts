import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
  // patch
  patch(vnode, container);
}

function patch(vnode, container) {
  // TODO: check if vnode is of element type
  // process element
  processElement(vnode, container);
  // process component
  processComponent(vnode, container);
}

function processElement(vnode, container) {}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  // Create component instance
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}
