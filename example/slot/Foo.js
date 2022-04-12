import { h, renderSlots } from '../../lib/mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {},

  render() {
    const foo = h('p', {}, 'foo');
    const age = 18;

    // foo.vnode.children
    console.log(this.$slots);
    // renderSlots
    // 1. Get element to render
    // 2. Get render position

    return h('div', {}, [
      renderSlots(this.$slots, 'header', {
        age,
      }),
      foo,
      renderSlots(this.$slots, 'footer'),
    ]);
  },
};
