import { observer } from 'mobx-react-lite';
import { useEffect, type ReactNode } from 'react';
import {
  useAutorun,
  useOnMounted,
  useOnUnmounted,
  useProps,
  useReaction,
  useState,
} from './hooks';
import { AsyncValue, BoolValue, Value, BoxedValue } from './mobx';
import { setComponentNameForDebugging } from './utils';
import { makeObservable, observable, untracked } from 'mobx';

/**
 * A `observer` wrapped component with type support for static props
 *
 * @example
 *
 * // Simple component
 * const MyComponent = xcomponent<{ prop1: number}>(({ prop1 }) => <>{prop1}</>)
 *
 * // With members
 * const Dialog = xcomponent<{ prop1: number}>(({ prop1 }) => <>{prop1}</>)
 *   .with({ Head: xcomponent<{ prop2: number}>(({ prop2 }) => <>{prop2}</>) })
 *
 * // later
 *
 * <MyComponent prop1={1} />
 * <Dialog prop1={1} />
 * <Dialog.Head prop2={1} />
 */
export const xcomponent = <PROPS extends {}>(
  Fn: (p: { className?: string } & PROPS) => ReactNode,
  {
    setDisplayName = true,
    observableProps = true,
  }: {
    /** @default true
     * Set the displayName of the component to the file and line number for easer debugging
     */
    setDisplayName?: boolean;

    /** Wraps props in makeAutoObservable in order to make them reactive */
    observableProps?: boolean;
  } = {},
) => {
  if (setDisplayName)
    try {
      throw new Error('Name');
    } catch (err: any) {
      setComponentNameForDebugging(Fn, err);
    }

  const observed = observer(
    (() => {
      if (!observableProps) return Fn;

      return (props: PROPS) => {
        const store = useState(() => {
          return makeObservable({ props }, { props: observable.deep });
        });

        useEffect(() => {
          untracked(() => {
            if (store.props === null) {
              store.props = props;

              return;
            }

            Object.assign(store.props, props);
          });
        }, [props]);

        return Fn(store.props);
      };
    })(),
  );

  const withMembers = <MEMBERS extends object>(members: MEMBERS) => {
    Object.assign(observed, members);

    return observed as typeof observed & MEMBERS;
  };

  return Object.assign(observed, { with: withMembers }) as typeof observed & {
    with: typeof withMembers;
  };
};

/**
 * A hook to create a stateful class instance, for mobx class stores
 * Enables react-refresh optimizations by using the `useState` name
 * - The contained component can be edited as normal without regenerating this store
 * - When code within this store is edited, the store will be recreated, just like React.useState
 */
xcomponent.useState = useState;
xcomponent.useOnMounted = useOnMounted;
xcomponent.useOnUnmounted = useOnUnmounted;
xcomponent.useReaction = useReaction;
xcomponent.useAutorun = useAutorun;
xcomponent.useProps = useProps;
xcomponent.Value = Value;
xcomponent.AsyncValue = AsyncValue;
xcomponent.BoolValue = BoolValue;
xcomponent.BoxedValue = BoxedValue;

xcomponent.extend = <P extends object>(members: P): typeof xcomponent & P =>
  Object.assign(xcomponent, members);

export { xcomponent as X, xcomponent as default };
