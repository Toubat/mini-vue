import { extend } from '../shared';

let activeEffect: any;
let targetMap = new WeakMap();

class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  onStop?: () => void;
  scheduler?: () => void;

  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    const res = this._fn();
    activeEffect = null;

    return res;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

export function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
  // options
  extend(_effect, options);

  // bind "this" pointer to _effect
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function track(target, key) {
  // Create a depdendencies map target -> key
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // Create a dependency map key -> effect
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  if (!activeEffect) return;
  // Add effect to the dependency map
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
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

export function stop(runner) {
  runner.effect.stop();
}
