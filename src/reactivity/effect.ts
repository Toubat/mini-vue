import { extend } from '../shared';

// Global variables
let activeEffects: ReactiveEffect[] = [];
let targetMap = new WeakMap();
let shouldTrack;

export class ReactiveEffect {
  private _fn: any;
  deps: any = [];
  active: boolean = true;
  onStop?: () => void;
  scheduler?: () => void;

  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    if (!this.active) {
      return this._fn();
    }

    shouldTrack = true;
    activeEffects.push(this);

    const res = this._fn();

    shouldTrack = false;
    activeEffects.pop();

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

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  // Options
  extend(_effect, options);

  // bind "this" pointer to _effect
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function track(target, key) {
  if (!isTracking()) return;

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

  trackEffects(dep);
}

// function trackArray(target: any[]) {
//   target.forEach((val, i) => {
//     track(target, String(i));
//   });
// }

export function trackEffects(dep) {
  if (activeEffects) {
    activeEffects.forEach((activeEffect) => {
      trackEffect(activeEffect, dep);
    });
  }
}

export function trackEffect(effect, dep) {
  // No need to add existing dependency
  if (dep.has(effect)) return;

  // Add effect to the dependency map
  dep.add(effect);

  // Effect reverse mapping
  if (effect) {
    effect.deps.push(dep);
  }
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const dep = depsMap.get(key);

  if (dep !== undefined) {
    triggerEffects(dep);
  }
}

export function triggerEffects(dep) {
  dep.forEach((effect) => {
    if (!activeEffects.includes(effect)) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  });
}

export function stop(runner) {
  runner.effect.stop();
}

export function isTracking() {
  const activeEffect = getActiveEffect();
  return shouldTrack && activeEffect !== undefined;
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  // Reset deps
  effect.deps.length = 0;
}

function getActiveEffect(): ReactiveEffect | undefined {
  if (activeEffects) {
    return activeEffects[activeEffects.length - 1];
  }
  return undefined;
}
