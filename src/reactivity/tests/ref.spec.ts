import { effect } from '../effect';
import { reactive } from '../reactive';
import { isRef, proxyRefs, ref, unRef } from '../ref';

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it('should be reactive', () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });

    expect(calls).toBe(1);
    expect(dummy).toBe(1);

    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it('should not trigger effect when same value is assigned', () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });

    expect(calls).toBe(1);
    expect(dummy).toBe(1);

    a.value = 1;
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
  });

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    });

    let dummy;
    effect(() => {
      dummy = a.value.count;
    });

    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });
});

describe('isRef', () => {
  it('should detect whether object is a ref', () => {
    const a = ref(1);
    const user = reactive({ age: 1 });

    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });
});

describe('unRef', () => {
  it('should unwrap ref', () => {
    const a = ref(1);

    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });
});

describe('proxyRefs', () => {
  it('should not call .value when getting a value', () => {
    const user = {
      age: ref(10),
      name: 'toubat',
    };
    const proxyUser = proxyRefs(user);

    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe('toubat');
    // template ref.value
    // setup() { return { ref }}
  });

  it('should', () => {
    const user = {
      age: ref(10),
      name: 'toubat',
    };
    const proxyUser = proxyRefs(user);

    proxyUser.age = 20;
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
