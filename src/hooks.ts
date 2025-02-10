import {
  autorun,
  reaction,
  comparer,
  makeAutoObservable,
  isObservable,
  runInAction,
} from 'mobx';
import { useEffect, useState as useReactState } from 'react';
import { isDeepEqual } from 'remeda';

export const useReaction: typeof reaction = (fn1, fn2, opts): any => {
  useEffect(
    () =>
      reaction(fn1, fn2, {
        fireImmediately: true as any,
        equals: comparer.structural,
        ...opts,
      }),
    [],
  );
};

export const useAutorun: typeof autorun = (...params): any => {
  useEffect(() => autorun(...params), []);
};

class ClassType {}
/**
 * Use a class, function, or object as a stateful store
 * makeAutoObservable/makeAutoObservable is optional.
 * @example
 * useState(() => class { count = 0 })
 * useState(() => ({ count: 0 }))
 * useState(() => {
 *   const count = X.Value(0)
 *   return { count, get double() { return count.value * 2 } }
 * })
 *
 * You can also pass in props to make them observable.
 *
 * @example
 * useState(props, (props) => class {
 *   get sum() { return props.a + props.b }
 * })
 */
export function useState<P extends object, C extends typeof ClassType | object>(
  props: P,
  initializer: (props: P) => C,
): C extends typeof ClassType ? InstanceType<C> : C;
/**
 * Use a class, function, or object as a stateful store
 * makeAutoObservable/makeAutoObservable is optional.
 * @example
 * useState(() => class { count = 0 })
 * useState(() => ({ count: 0 }))
 * useState(() => {
 *   const count = X.Value(0)
 *   return { count, get double() { return count.value * 2 } }
 * })
 */
export function useState<P extends object, C extends typeof ClassType | object>(
  initializer: (props: P) => C,
): C extends typeof ClassType ? InstanceType<C> : C;

export function useState<P extends object, C extends typeof ClassType | object>(
  ...args: [P, (props: P) => C] | [(props: P) => C]
) {
  const hasPropsArg = args.length === 2;
  const initializer = !hasPropsArg ? args[0] : args[1];
  const propsStore = (() => {
    const props = !hasPropsArg ? ({} as P) : args[0];

    if (hasPropsArg) return useObjectStore(props);

    return { value: {} as P };
  })();

  const state = useReactState(() => {
    const store = (() => {
      const uninitializedStore = initializer(propsStore.value);

      if (typeof uninitializedStore === 'function') {
        const ClassStore = uninitializedStore as typeof ClassType;

        return new ClassStore();
      }

      return uninitializedStore;
    })();

    if (isObservable(store)) return store;

    return makeAutoObservable(store);
  })[0] as C extends typeof ClassType ? InstanceType<C> : C;

  return state;
}

/** Triggers once on component mount */
export const useOnMounted = (fn: () => any) => {
  useEffect(() => {
    fn();
  }, []);
};

/** Triggers once on component unmount */
export const useOnUnmounted = (fn: () => void) => {
  useEffect(() => fn, []);
};

/**
 *  Creates a mobx store on mount, then synchronizes input props into the store, only updating with prop changes
 */
export function useObjectStore<P extends Record<string, any>>(value: P) {
  const [store] = useReactState(() => makeAutoObservable({ value }));

  useEffect(() => {
    runInAction(() => {
      // TODO: inspect mobx administration obj for parity before trying to update it
      if (isDeepEqual(store.value, value)) return;

      Object.assign(store.value, value);
    });
  }, [value]);

  return store;
}
