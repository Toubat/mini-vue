import { h } from '../../lib/mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {
    return {
      x: 150,
      y: 100,
    };
  },

  render() {
    return h('rect', { x: this.x, y: this.y });
  },
};
