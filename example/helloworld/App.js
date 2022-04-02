import { h } from '../../lib/mini-vue.esm.js';

window.self = null;
export const App = {
  setup() {
    return {
      msg: 'mini-vue',
    };
  },

  render() {
    window.self = this;
    return h('div', { id: 'root', class: ['red', 'hard'] }, [
      h('p', { class: 'red' }, 'Hi, ' + this.msg),
      h('p', { class: 'blue' }, 'mini-vue'),
    ]);
  },
};
