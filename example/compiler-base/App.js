import { h, ref } from '../../lib/mini-vue.esm.js';

// 复杂一点
// template 包含 element 和 interpolation
export default {
  template: `<div>hi, {{count}}</div>`,
  setup() {
    const count = (window.count = ref(1));

    return {
      count,
      msg: 'mini-vue',
    };
  },
};
