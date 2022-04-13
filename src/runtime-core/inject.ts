import { ComponentInstance, getCurrentInstance } from './component';

export function provide(key, value) {
  // store
  const currentInstance: ComponentInstance | null = getCurrentInstance();

  if (!currentInstance) {
    console.warn('[provide] should be called in setup()');
    return;
  }

  let { provides } = currentInstance;
  const parentProvides = currentInstance.parent?.provides;

  // init - only run once
  if (provides === parentProvides) {
    // point the prototype of currentInstance provider to parent instance provider
    provides = currentInstance.provides = Object.create(parentProvides);
  }

  provides[key] = value;
}

export function inject(key, defaultValue) {
  // access
  const currentInstance: ComponentInstance | null = getCurrentInstance();

  if (!currentInstance) {
    console.warn('[inject] should be called in setup()');
    return;
  }

  const { parent } = currentInstance;
  const parentProvides = parent?.provides;

  if (key in parentProvides) return parentProvides[key];

  if (defaultValue) {
    if (typeof defaultValue === 'function') return defaultValue();
    return defaultValue;
  }
}
