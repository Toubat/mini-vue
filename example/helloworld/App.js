import { h } from '../../lib/mini-vue.esm.js';

export const App = {
  setup() {
    return {
      msg: 'mini-vue',
    };
  },

  render() {
    return h('div', 'Hi, ' + this.msg);
  },
};
