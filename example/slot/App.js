import { h, createTextVNode } from '../../lib/mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {
  name: 'App',
  setup() {
    return {
      msg: 'mini-vue',
    };
  },

  render() {
    window.self = this;
    // object key
    const bar = h(
      Foo,
      {},
      {
        header: ({ age }) => [h('p', {}, 'header ' + age), 'Hello World'],
        footer: () => h('p', {}, 'footer'),
      }
    );

    return h(
      'div',
      {
        onClick() {
          console.log('click');
        },
      },
      ['ADADADASD', bar]
    );
  },
};
