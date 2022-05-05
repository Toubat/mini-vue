import { reactive } from '../reactive';
import { effect, stop } from '../effect';
import { computed } from '../computed';

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    });

    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);
    // update user.age
    user.age++;
    expect(nextAge).toBe(12);
  });

  it('should track nested object', () => {
    const original = {
      nested: {
        foo: 1,
      },
    };
    const observed = reactive(original);

    let dummy;
    effect(() => (dummy = observed.nested.foo));

    expect(dummy).toBe(1);
    // update observed.nested.foo
    observed.nested.foo++;
    expect(dummy).toBe(2);
  });

  it('should track array element', () => {
    const original = {
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);

    let dummy;
    effect(() => (dummy = observed.array[0].bar));

    expect(dummy).toBe(2);
    // update observed.array[0].bar
    observed.array[0].bar++;
    expect(dummy).toBe(3);
  });

  it('should return runner when call effect', () => {
    // effect -> function (runner) -> fn -> return
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return 'foo';
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe('foo');
  });

  it('scheduler', () => {
    // 1. Generate a scheduler through the second argument of effect fn
    // 2. Execute fn when the first time effect gets called
    // 3. When reactive object is updated, fn is not called, but the scheduler is called
    // 4. If runner is executed, fn is called
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );

    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);

    run();
    expect(dummy).toBe(2);
  });
});

describe('stop', () => {
  it('should stop tracking effect', () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });

    obj.prop = 2;
    expect(dummy).toBe(2);

    stop(runner);
    obj.prop++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);

    obj.prop++;
    expect(dummy).toBe(3);
  });

  it('should call onStop method', () => {
    const obj = reactive({ foo: 1 });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { onStop }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });

  it('nested effect', () => {
    const obj = reactive({ foo: 1 });
    let inner;
    let outer;

    const runner = effect(() => {
      effect(() => {
        inner = obj.foo;
      });
      outer = obj.foo;
    });

    expect(inner).toBe(1);
    expect(outer).toBe(1);

    obj.foo = 2;
    expect(inner).toBe(2);
    expect(outer).toBe(2);
  });

  it.skip('nested effect runner', () => {
    const obj = reactive({ foo: 1 });
    let inner = 0;

    const runner = effect(() => {
      const runner = effect(() => {
        inner += 1;
        console.log('inner', inner);
        return obj.foo;
      });

      return runner;
    });

    expect(obj.foo).toBe(1);
    expect(inner).toBe(1);

    obj.foo = 2;
    expect(inner).toBe(2);
  });

  it('no stack overflow', () => {
    const values = reactive([1, 2, 3]);
    effect(() => {
      values.push(4);
    });

    expect(values).toEqual([1, 2, 3, 4]);

    values.push(5);
    expect(values).toEqual([1, 2, 3, 4, 5, 4]);
  });

  it('should update array', () => {
    const values = reactive({ foo: [1, 2, 3] });
    effect(() => {
      values.foo.push(4);
    });

    expect(values.foo).toEqual([1, 2, 3, 4]);

    values.foo[0] = 2;
    expect(values).toEqual({ foo: [2, 2, 3, 4] });
  });
});
