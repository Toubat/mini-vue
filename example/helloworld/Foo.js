import { h } from '../../lib/mini-vue.esm.js';

export const Foo = {
  setup(props) {
    // props.count
    console.log(props);

    // 3. readonly
  },

  render() {
    return h('div', {}, 'foo: ' + this.count);
  },
};
