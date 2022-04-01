let activeEffect: any;
let targetMap = new WeakMap();

class ReactiveEffect {
  private _fn: any;

  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    const res = this._fn();
    activeEffect = null;

    return res;
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();

  // bind "this" pointer to _effect
  return _effect.run.bind(_effect);
}

export function track(target, key) {
  // Create a depdendencies map target -> key
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // Create a dependency map key -> effect
  let depMap = depsMap.get(key);
  if (!depMap) {
    depMap = new Set();
    depsMap.set(key, depMap);
  }

  // Add effect to the dependency map
  if (activeEffect) {
    depMap.add(activeEffect);
  }
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const depMap = depsMap.get(key);

  depMap.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}
