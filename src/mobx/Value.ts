import { observable, makeObservable, action } from 'mobx';

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
}

export { Value as ValueModel };
