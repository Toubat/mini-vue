import { createRenderer } from '../runtime-core';

function createElement(type: string): HTMLElement {
  return document.createElement(type);
}

function patchProps(el: HTMLElement, key: string, val: any) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);

  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    el.setAttribute(key, val);
  }
}

function insert(el: HTMLElement, container: HTMLElement) {
  container.appendChild(el);
}

const renderer = createRenderer({
  createElement,
  patchProps,
  insert,
});

export function createApp(rootComponent: HTMLElement) {
  return renderer.createApp(rootComponent);
}

export * from '../runtime-core';
