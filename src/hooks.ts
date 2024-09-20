import {
  autorun,
  reaction,
  comparer,
  makeAutoObservable,
  isObservable,
  runInAction,
} from 'mobx';
import { useEffect, useState as useReactState } from 'react';

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
 * useState(() => class {})
 * useState(() => X.Value({}))
 * useState(() => ({}))
 * useState(() => {
 *   const count = X.Value(0)
 *   return { count, get double() { return count.value * 2 } }
 * })
 */
export const useState = <C extends typeof ClassType | object>(
  initializer: () => C,
) =>
  useReactState(() => {
    const store = (() => {
      const uninitializedStore = initializer();

      if (typeof uninitializedStore === 'function') {
        const ClassStore = uninitializedStore as typeof ClassType;

        return new ClassStore();
      }

      return uninitializedStore;
    })();

    if (isObservable(store)) return store;

    return makeAutoObservable(store);
  })[0] as C extends typeof ClassType ? InstanceType<C> : C;

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

export function useProps<
  P extends Record<string, any>,
  V extends { value: Record<string, any>; set: (v: any) => any },
>(props: P, store: V): void;
export function useProps<
  P extends Record<string, any>,
  V extends Record<string, any>,
>(props: P, store: V): void;

export function useProps<
  P extends Record<string, any>,
  V extends { value: Record<string, any> } | Record<string, any>,
>(props: P, store: V) {
  useEffect(() => {
    const isValueWrapper =
      'value' in store && 'set' in store && store.set instanceof Function;

    const storeValue = isValueWrapper ? store.value : store;
    const onlyChangedProperties = Object.fromEntries(
      Object.entries(props).filter(([key, value]) => storeValue[key] !== value),
    );

    if (!Object.keys(onlyChangedProperties).length) return;

    // Should this be a recursive deep merge to further preserve observability?
    // Or do we just allow the user to annotate observable.structural?
    runInAction(() => {
      Object.assign(storeValue, onlyChangedProperties);
    });
  }, [props]);
}
