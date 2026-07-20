import {
  autorun,
  reaction,
  comparer,
  makeAutoObservable,
  isObservable,
  runInAction,
} from 'mobx';
import { isValidElement, useEffect, useState as useReactState } from 'react';
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

/** Finds the keys (or `key.nestedKey` for one level of array/object nesting) whose values are React elements */
function findReactElementPropPaths(value: Record<string, any>): string[] {
  const paths: string[] = [];

  for (const [key, propValue] of Object.entries(value)) {
    if (isValidElement(propValue)) {
      paths.push(key);

      continue;
    }

    if (Array.isArray(propValue)) {
      if (propValue.some(isValidElement)) paths.push(`${key}[]`);

      continue;
    }

    if (propValue && typeof propValue === 'object') {
      for (const nestedKey of Object.keys(propValue)) {
        if (isValidElement(propValue[nestedKey]))
          paths.push(`${key}.${nestedKey}`);
      }
    }
  }

  return paths;
}

/**
 * Throws a clearer error when `useObjectStore`'s makeAutoObservable call fails because
 * the props contain React elements (which mobx cannot/should not make observable).
 * Otherwise rethrows the original error.
 */
function enhanceObservablePropsError(
  error: unknown,
  value: Record<string, any>,
): never {
  const reactElementPropPaths = findReactElementPropPaths(value);

  if (reactElementPropPaths.length) {
    throw new Error(
      `useObjectStore: React elements cannot be made observable. Found React element(s) at ` +
        `prop path(s) [${reactElementPropPaths.join(
          ', ',
        )}]. Pass a function that returns ` +
        `the element instead of the element itself, e.g.\n\n` +
        `// bad\nsomeProp: <>Foo</>\n\n` +
        `// good\nsomeProp: () => <>Foo</>`,
      { cause: error },
    );
  }

  throw error;
}

/**
 *  Creates a mobx store on mount, then synchronizes input props into the store, only updating with prop changes
 */
export function useObjectStore<P extends Record<string, any>>(value: P) {
  const [store] = useReactState(() => {
    try {
      return makeAutoObservable({ value });
    } catch (error) {
      enhanceObservablePropsError(error, value);

      return { value };
    }
  });

  useEffect(() => {
    runInAction(() => {
      // TODO: inspect mobx administration obj for parity before trying to update it
      if (isDeepEqual(store.value, value)) return;

      Object.assign(store.value, value);
    });
  }, [value]);

  return store;
}
