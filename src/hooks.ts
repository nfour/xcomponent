import {
  autorun,
  reaction,
  comparer,
  makeAutoObservable,
  isObservable,
} from 'mobx';
import { useEffect, useState as useReactState } from 'react';
import microdiff from 'microdiff';

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

export function useProps<P extends Record<string, any>, V extends P>(
  props: P,
  store: V,
): void;
export function useProps<
  P extends Record<string, any>,
  V extends (v: P) => void,
>(props: P, store: V): void;

export function useProps<
  P extends Record<string, any>,
  V extends P | ((v: P) => void),
>(props: P, store: V) {
  useEffect(() => {
    // runInAction(() => {
    if (typeof store === 'function') return store(props);

    const diff = microdiff(store, props);

    console.log({ diff });

    if (diff.length === 0) return;

    Object.assign(store, props);
    // });
  }, [props]);
}
