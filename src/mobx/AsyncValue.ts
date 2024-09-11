import {
  action,
  makeObservable,
  observable,
  autorun,
  AnnotationMapEntry,
  computed,
  runInAction,
} from 'mobx';

type MaybeCancellablePromise<T> = Promise<T> & {
  cancel?(): void;
};

/**
 * A simple way to encapsulate async value access.
 *
 * Read the example closely:
 *
 * @example
 * async function fetchFiles(c: { userId: string; foo: number }): Promise<{ name: string }[]> {
 *   return []
 * }
 *
 * class ExampleModel {
 *   constructor() { makeAutoObservable(this) }
 *   activeUserId = '22'
 *   files = new AsyncValue(async ({ foo }: { foo: number }) =>
 *     fetchFiles({ userId: this.activeUserId, foo })
 *   )
 * }
 *
 * const example = new ExampleModel()
 * example.files.value?.[0]?.name // undefined - missing data
 * await example.files.query({ foo: 22 }) // foo is strongly typed, inferred!
 * example.files.value?.[0]?.name // 'myFile.txt' - has data!
 *
 * @example
 *
 * const v = new AsyncValue(() => fetchUsersList())
 * await v.query() // Don't need to provide params as none are defined
 * v.value // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
 */
export class AsyncValue<VALUE, PAYLOAD = any> {
  constructor(
    private _query: (payload: PAYLOAD) => MaybeCancellablePromise<VALUE>,
    private config: {
      /** Initial value */
      value?: VALUE;
      /** Changes the mobx value annotation for fine grained observability */
      valueAnnotation?: AnnotationMapEntry;
      /** @default false */
      disablePromiseCancellingOnReset?: boolean;
    } = {},
  ) {
    const { value, valueAnnotation = observable } = config;

    this.value = value;

    makeObservable(this, {
      value: valueAnnotation,
      queue: observable,
      isPending: computed,
      error: observable,
      query: action.bound,
      set: action.bound,
      reset: action.bound,
      setError: action.bound,
    });
  }

  /** This is just for typescript */
  protected PAYLOAD!: PAYLOAD;

  get isPending() {
    return this.queue.size > 0;
  }

  hasBeenQueried = false;

  value?: VALUE = undefined;
  error?: Error = undefined;

  /** This is used to ensure the `isPending` boolean works with concurrent queries */
  queue = new Set<MaybeCancellablePromise<VALUE>>();

  /**
   * @example
   * // Valid usage:
   * new AsyncValue((foo: number) => {}).query(22222222)
   * new AsyncValue((foo: { a: number }) => {}).query({ a: 222222})
   * new AsyncValue(() => {}).query()
   */
  async query<P extends PAYLOAD extends {} ? [PAYLOAD] : undefined[]>(
    ...[payload]: P
  ) {
    this.setError(undefined);

    runInAction(() => (this.hasBeenQueried = true));

    const promise = this._query(payload as PAYLOAD);

    this.queue.add(promise);

    try {
      this.set(await promise);
    } catch (err: any) {
      this.setError(err);
    } finally {
      this.queue.delete(promise);
    }

    return this;
  }

  /** Clones this instance allowing seperate values to be stored with the same configuration */
  clone = () => {
    return new AsyncValue(this._query, this.config);
  };

  /** Sets the value */
  set(value: this['value']) {
    this.value = value;

    return this;
  }

  /** Reset value to undefined */
  reset() {
    if (!this.config.disablePromiseCancellingOnReset) {
      this.queue.forEach((promise) => promise?.cancel?.());
      this.queue.clear();
    }

    this.value = undefined;

    return this;
  }

  setError = (v: this['error']) => (this.error = v);

  /** Creates an autorun reaction whenever the error changes */
  onError = (cb: (err: this['error']) => void) => autorun(() => cb(this.error));

  /** Creates an autorun reaction whenever the value changes */
  onValue = (cb: (v: this['value']) => void) => autorun(() => cb(this.value));
}
