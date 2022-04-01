import { reactive } from '../reactive';
import { effect, trigger } from '../effect';

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
  // 1. Generate a schueduler through the second argument of effect fn
  // 2. Execute fn when the first time effect gets called
  // 3. When reactive object is updated, fn is not called, but the schueduler is called
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
  // // should not run yet
  expect(dummy).toBe(1);
  // // manually run
  run();
  // // should have run
  expect(dummy).toBe(2);
});
