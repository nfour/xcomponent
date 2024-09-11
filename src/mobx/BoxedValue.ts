import { makeObservable } from 'mobx';

/** A wrapper for getting/setting values
 *
 *
 * @example
 *
 * const somethingFromUri = new BoxedValue(
 *   () => uriRoutes.someRoute.search.something,
 *   (newValue) => uriRoutes.someRoute.push((uri) => ({ search: { something: newValue } })),
 * )
 *
 * somethingFromUri.value // 'foo'
 * somethingFromUri.set('bar')
 * somethingFromUri.value // 'bar'
 *
 * @example
 *
 * const somethingWrappedToOptimizeObservability = new BoxedValue(
 *   () => this.something,
 * )
 *
 * somethingWrappedToOptimizeObservability.value // 'something'
 * somethingWrappedToOptimizeObservability.set('foo') // does nothing
 */
export class BoxedValue<GET extends unknown, SET extends GET = GET> {
  constructor(
    public getter: () => GET,
    public set: (value: SET) => any = () => void 0,
  ) {
    makeObservable(this, {
      set: true,
      value: true,
      getter: true,
    });
  }

  public get value() {
    return this.getter();
  }
}
