import { effect } from '../effect';
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

  it('should make array reactive', () => {
    const original = [1, 2, 3];
    const observed = reactive(original);
    let num;

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);

    effect(() => (num = observed[0]));
    expect(num).toBe(1);
    observed[0] = 2;
    expect(num).toBe(2);
  });

  it('should make array length reactive', () => {
    const original = [1, 2, 3];
    const observed = reactive(original);
    let num;

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);

    effect(() => (num = observed.length));
    expect(num).toBe(3);
    observed.push(4);
    expect(num).toBe(4);
  });

  it('should make array of objects reactive', () => {
    const original = [{ text: '123' }];
    const observed = reactive(original);
    let text;

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);

    effect(() => (text = observed[0].text));
    expect(text).toBe('123');
    observed[0].text += '4';
    expect(text).toBe('1234');
  });
});
