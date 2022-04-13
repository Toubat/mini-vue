import { h, getCurrentInstance } from '../../lib/mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {
  name: 'App',
  setup() {
    const instance = getCurrentInstance();
    console.log('App: ', instance);
  },

  render() {
    return h('div', {}, [h('p', {}, [h('p', {}, 'currentInstance demo'), h(Foo)])]);
  },
};
