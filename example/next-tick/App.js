import { h, ref, getCurrentInstance, nextTick } from '../../lib/mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {
  name: 'App',
  setup() {
    const count = ref(0);
    const instance = getCurrentInstance();

    const onClick = async () => {
      for (let i = 0; i < 100; i++) {
        count.value++;
      }
      debugger;
      await nextTick();
      console.log(instance);
    };

    return {
      count,
      onClick,
    };
  },

  render() {
    window.self = this;
    return h(
      'div',
      {
        onClick: this.onClick,
      },
      [h('div', {}, 'hi, ' + this.count)]
    );
  },
};
