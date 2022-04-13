import { h, provide, inject, ref } from '../../lib/mini-vue.esm.js';
import { Foo } from './Foo.js';

export const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooVal');
    provide('bar', 'barVal');
  },
  render() {
    return h('div', {}, [h('div', {}, [h('p', {}, `Provider`), h(Middle)])]);
  },
};

export const Middle = {
  name: 'Middle',
  setup() {
    provide('foo', 'fooTwo');
    const foo = inject('foo');

    return {
      foo,
    };
  },
  render() {
    return h('div', {}, [h('div', {}, [h('p', {}, `Middle foo: ${this.foo}`), h(Consumer)])]);
  },
};

export const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo');
    const bar = inject('bar');
    const baz = inject('baz', () => 'bazDefault');

    return {
      foo,
      bar,
      baz,
    };
  },

  render() {
    return h('div', {}, `Consumer: ${this.foo} - ${this.bar} - ${this.baz}`);
  },
};
