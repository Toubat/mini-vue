import { ref, h } from '../../lib/mini-vue.esm.js';

const nextChildren = 'newChild';
const prevChildren = 'oldChild';

export default {
  name: 'ArrayToText',
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return {
      isChange,
    };
  },
  render() {
    const self = this;

    return self.isChange === true ? h('div', {}, nextChildren) : h('div', {}, prevChildren);
  },
};
