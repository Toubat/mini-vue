import { h, getCurrentInstance, renderSlots } from '../../lib/mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  setup() {
    const instance = getCurrentInstance();
    console.log('Foo: ', instance);
    return {};
  },

  render() {
    return h('div', {}, [
      renderSlots(this.$slots, 'header'),
      'Text Node',
      renderSlots(this.$slots, 'footer'),
    ]);
  },
};
