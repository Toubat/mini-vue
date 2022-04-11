import { ReactiveEffect } from './effect';

class ComputedImpl {
  private _getter: () => any;
  private _dirty = true; // indicate whether dependency has changed
  private _value: any;
  private _effect: ReactiveEffect;

  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }

    return this._value;
  }
}

export function computed(getter) {
  return new ComputedImpl(getter);
}
