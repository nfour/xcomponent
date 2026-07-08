import { observable, makeObservable, action } from 'mobx';
import { AsyncValue } from './AsyncValue';
import { BoolValue } from './BoolValue';
import { BoxedValue } from './BoxedValue';

/**
 * An easier way to handle simple value getter/setter.
 *
 * @example
 * const selectedFruit = new Value<'banana'|'apple'|undefined>(undefined)
 * selectedFruit.set('test') // TS error
 * selectedFruit.set('banana') // Valid
 * selectedFruit.value // 'banana'
 */

export class Value<STATE = any> {
  constructor(
    public value: STATE,
    annotations: Partial<Parameters<typeof makeObservable>[1]> = {},
  ) {
    makeObservable(this, {
      set: action.bound,
      value: observable,
      ...annotations,
    });
  }

  set(state: this['value']) {
    this.value = state;
  }

  static Async = AsyncValue;
  static Bool = BoolValue;
  static Boxed = BoxedValue;
}

/**
 * Type-only companion to the `Value` class, merged via TypeScript's class/namespace
 * declaration merging. This makes `Value.Async<T, P>`, `Value.Boxed<GET, SET>`, and
 * `Value.Bool` valid as both runtime constructors (`new Value.Async(...)`) and as
 * type annotations (`users: Value.Async<IUser[]>`).
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Value {
  export type Async<VALUE, PAYLOAD = any> = AsyncValue<VALUE, PAYLOAD>;
  export type Boxed<GET extends unknown, SET extends GET = GET> = BoxedValue<GET, SET>;
  export type Bool = BoolValue;
}

// interface Foo {
//   a: Value<string>;
//   b: typeof Value.Async
// }

// const foo = {
//   a: new Value(''),
//   b: new AsyncValue(() => Promise.resolve('')),
// };
