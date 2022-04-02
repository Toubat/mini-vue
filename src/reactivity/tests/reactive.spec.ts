import { isProxy, isReactive, reactive } from '../reactive';

describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);
  });

  it('should differentiate reactive object', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });

  it('should make nested object reactive', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);

    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
    expect(isReactive(original.nested.foo)).toBe(false);
  });

  it('should differentiate whether proxy is created from reactive', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(isProxy(observed)).toBe(true);
  });
});
