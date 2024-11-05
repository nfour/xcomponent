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
export function useState<P extends object, C extends typeof ClassType | object>(
  initializer: (props: P) => C,
): C extends typeof ClassType ? InstanceType<C> : C;

export function useState<P extends object, C extends typeof ClassType | object>(
  ...args: [P, (props: P) => C] | [(props: P) => C]
) {
  const hasPropsArg = args.length === 2;
  const initializer = !hasPropsArg ? args[0] : args[1];
  const propsStore = (() => {
    const props = !hasPropsArg ? undefined : args[0];

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

export const useOnMounted = (fn: () => any) => {
  useEffect(() => {
    fn();
  }, []);
};

export const useOnUnmounted = (fn: () => void) => {
  useEffect(() => fn, []);
};

/** useReaction or useAutorun based on your input lengths */
export const useOnReaction = (
  ...inputs: Parameters<typeof useReaction> | Parameters<typeof useAutorun>
) => {
  if (!(inputs[1] instanceof Function)) return useAutorun(inputs[0], inputs[1]);
  else return useReaction(inputs[0], inputs[1], inputs[2]);
};

export function useProps<P extends Record<string, any>, V extends P>(
  props: P,
  store: V,
): void;
export function useProps<
  P extends Record<string, any>,
  V extends (v: P) => void,
>(props: P, store: V): void;

export function useProps<P extends Record<string, any>>(
  props: P,
  store: P | ((v: P) => void),
) {
  useEffect(() => {
    runInAction(() => {
      if (typeof store === 'function') return store(props);

      // TODO: inspect mobx administration obj for parity before trying to update it
      if (isDeepEqual(store, props)) return;

      Object.assign(store, props);
    });
  }, [props]);
}

// Creates a mobx store on mount, then synchronizes input props into the store, only updating with prop changes
export function useObjectStore<P extends Record<string, any>>(value = {} as P) {
  const [store] = useReactState(() => makeAutoObservable({ value }));

  console.log({ store });

  useProps(value, store.value);

  return store;
}
