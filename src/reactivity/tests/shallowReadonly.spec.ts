import { isReadonly, shallowRaedonly } from '../reactive';

describe('shallowReadonly', () => {
  it('should not make non-reactive properties reactive', () => {
    const props = shallowRaedonly({
      nested: { foo: 1 },
    });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.nested)).toBe(false);
  });

  it('warn when call set method', () => {
    // mock
    console.warn = jest.fn();

    const user = shallowRaedonly({
      age: 10,
    });

    user.age = 11;
    expect(console.warn).toBeCalled();
  });
});
