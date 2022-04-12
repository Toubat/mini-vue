import { h } from '../../lib/mini-vue.esm.js';
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
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
      },
      [
        h('div', {}, 'hi, ' + this.msg),
        h(Foo, {
          count: 1,
          // on + Event
          onAdd(a, b) {
            console.log('onAdd', a, b);
          },
          // add-foo -> on + AddFoo
          onAddFoo() {
            console.log('onAddFoo');
          },
        }),
      ]
    );
  },
};
