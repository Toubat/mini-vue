import { reactive } from '../reactive';
import { effect, stop } from '../effect';

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

it('stop', () => {
  let dummy;
  const obj = reactive({ prop: 1 });
  const runner = effect(() => {
    dummy = obj.prop;
  });

  obj.prop = 2;
  expect(dummy).toBe(2);

  stop(runner);
  obj.prop = 3;
  expect(dummy).toBe(2);

  // stopped effect should still be manually callable
  runner();
  expect(dummy).toBe(3);
});

it('onStop', () => {
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
