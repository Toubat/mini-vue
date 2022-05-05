import { h, ref, effect, reactive } from '../../lib/mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {
  name: 'App',
  setup() {
    const arr = reactive([1, 2, 3]);
    const msg = ref('Hello World!');

    effect(() => {
      arr.push(4);
    });

    const update = () => {
      arr[0] += 1;
    };

    return {
      arr,
      msg,
      update,
    };
  },

  render() {
    window.self = this;
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
        onClick() {
          console.log('click');
        },
        onMousedown() {
          console.log('mousedown');
        },
      },
      [h('div', {}, 'hi, ' + this.arr), h('button', { onClick: this.update }, 'update')]
    );
  },
};
