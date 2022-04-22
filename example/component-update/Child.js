import { h } from '../../lib/mini-vue.esm.js';

export const Child = {
  name: 'Child',
  setup(props, { emit }) {},
  render(proxy) {
    return h('div', {}, 'foo: ' + this.$props.msg);
  },
};
