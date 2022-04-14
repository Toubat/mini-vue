import { h, ref } from '../../lib/mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  setup() {
    const count = ref(0);

    const onClick = () => {
      count.value++;
    };

    const props = ref({
      foo: 'foo',
      bar: 'bar',
    });

    const onChangePropsDemo1 = () => {
      // console.log(props.value.foo);
      props.value.foo = 'new-foo';
    };

    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };

    const onChangePropsDemo3 = () => {
      props.value = {
        foo: 'foo',
      };
    };

    const onChangePropsDemo4 = () => {
      props.value = {
        foo: 'foo',
        bar: 'bar',
      };
    };

    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      onChangePropsDemo4,
    };
  },

  render() {
    return h(
      'div',
      {
        id: 'root',
        foo: this.props.foo,
        bar: this.props.bar,
      },
      [
        h('div', {}, 'count: ' + this.count),
        h(
          'button',
          {
            onClick: this.onClick,
          },
          'Count++'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo1,
          },
          'Value is modified - update'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo2,
          },
          'Value beome undefined - delete'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo3,
          },
          'Value is deleted - delete'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo4,
          },
          'Value is deleted - delete'
        ),
      ]
    );
  },
};
