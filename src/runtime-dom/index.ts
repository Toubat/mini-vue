import { createRenderer } from '../runtime-core';

function createElement(type: string): HTMLElement {
  return document.createElement(type);
}

function patchProps(el: HTMLElement, key: string, prevVal: any, nextVal: any) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);

  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function insert(el: HTMLElement, container: HTMLElement) {
  container.appendChild(el);
}

function remove(el: HTMLElement | Text) {
  const parent = el.parentNode;

  if (parent) parent.removeChild(el);
}

function setElementText(el: HTMLElement, text: string) {
  el.textContent = text;
}

const renderer = createRenderer({
  createElement,
  patchProps,
  insert,
  remove,
  setElementText,
});

export function createApp(rootComponent: HTMLElement) {
  return renderer.createApp(rootComponent);
}

export * from '../runtime-core';
