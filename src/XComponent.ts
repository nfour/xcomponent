import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, type ReactNode } from 'react';
import { useAutorun, useReaction } from './hooks';
import { AsyncValue, BoolValue, Value, Boxed } from './mobx';

class ClassType {}
export const useStateClass = <C extends typeof ClassType>(
  initializer: () => C,
) =>
  useState(() => {
    try {
      // improve logic to actually check if the class is mobxified
      return makeAutoObservable(new (initializer())());
    } catch {
      return new (initializer())();
    }
  })[0] as InstanceType<C>;

export const useOnMounted = (fn: () => any) => {
  useEffect(() => fn(), []);
};

export const useOnUnmounted = (fn: () => void) => {
  useEffect(() => fn, []);
};

export const useOnReaction = (
  ...inputs: Parameters<typeof useReaction> | Parameters<typeof useAutorun>
) => {
  if (!(inputs[1] instanceof Function)) return useAutorun(inputs[0]);
  else return useReaction(inputs[0], inputs[1], inputs[2]);
};

export const onProps = <
  P extends Record<string, any>,
  V extends Value<Record<string, any>>,
>(
  props: P,
  store: V,
) => {
  // TODO: need to only update specific props that actually changed, not spread all em in
  useEffect(() => {
    const propsObjectButOnlyChanged = Object.fromEntries(
      Object.entries(props).filter(
        ([key, value]) => store.value[key] !== value,
      ),
    );

    store.set({ ...store.value, ...propsObjectButOnlyChanged });
  }, [props]);
};

export const onOnUpdate = <
  P extends Record<string, any>,
  V extends (props: P) => void,
>(
  props: P,
  cb: V,
) => {
  let previousProps: P; // todo put in usestate

  useEffect(() => {
    const propsObjectButOnlyChanged = Object.fromEntries(
      Object.entries(props).filter(
        ([key, value]) => previousProps[key] !== value,
      ),
    );

    cb(propsObjectButOnlyChanged as P);

    previousProps = props;
  }, [props]);
};

/**
 * A `observer` wrapped component with type support for static props
 *
 * @example
 *
 * // Simple component
 * const MyComponent = component<{ prop1: number}>(({ prop1 }) => <>{prop1}</>)
 *
 * // With members
 * const Dialog = component<{ prop1: number}>(({ prop1 }) => <>{prop1}</>)
 *   .with({ Head: component<{ prop2: number}>(({ prop2 }) => <>{prop2}</>) })
 *
 * // later
 *
 * <MyComponent prop1={1} />
 * <Dialog prop1={1} />
 * <Dialog.Head prop2={1} />
 */
export const xcomponent = <PROPS extends {}>(
  Fn: (p: { className?: string } & PROPS) => ReactNode,
) => {
  const observed = observer(Fn);

  const withMembers = <MEMBERS extends { [k: string]: any }>(
    members: MEMBERS,
  ) => {
    Object.assign(observed, members);

    return observed as typeof observed & MEMBERS;
  };

  Object.assign(observed, { with: withMembers });

  return observed as typeof observed & { with: typeof withMembers };
};

/**
 * A hook to create a stateful class instance, for mobx class stores
 * Enables react-refresh optimizations by using the `useState` name
 * - The contained component can be edited as normal without regenerating this store
 * - When code within this store is edited, the store will be recreated, just like React.useState
 */
xcomponent.useState = useStateClass;
xcomponent.useOnMounted = useOnMounted;
xcomponent.useOnUnmounted = useOnUnmounted;
xcomponent.useReaction = useOnReaction;
xcomponent.useProps = onProps;
xcomponent.useOnUpdate = onProps;
xcomponent.Value = Value;
xcomponent.AsyncValue = AsyncValue;
xcomponent.BoolValue = BoolValue;
xcomponent.Boxed = Boxed;

xcomponent.extend = <P extends object>(members: P): typeof xcomponent & P =>
  Object.assign(xcomponent, members);

export { xcomponent as X, xcomponent as default, xcomponent as component };
