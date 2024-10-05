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
import { AsyncValue, BoolValue, BoxedValue, Value } from './mobx';
import { setComponentNameForDebugging } from './utils';

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
    observableProps = false,
  }: {
    /** @default true
     * Set the displayName of the component to the file and line number for easer debugging
     */
    setDisplayName?: boolean;

    /**
     * Ensures props are made observable and synchronized, so they may be accessed within stores
     *
     * @default false
     * @example
     *
     * const Component = X<{ prop1: number }>((props) => {
     *  const state = X.useState(() => ({
     *    // It's automatically reactive!
     *    get double() { return props.prop1 * 2 }
     *  }))
     *
     *  return <>{state.double}</>
     * }
     *
     * */
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
        const store = useState(
          () =>
            class {
              props = props;
              // TODO: could this be smarter, and only update the props that have changed?
              set = (p: PROPS) => Object.assign(this.props, p);
            },
        );

        useEffect(() => {
          store.set(props);
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

/**
 * Configures a new xcomponent function with a new *default* configuration
 *
 * @example
 * import { xcomponent } from '@n4s/xcomponent';
 *
 * export const X = xcomponent.configure({ observableProps: true })
 */
xcomponent.configure = (config: Parameters<typeof xcomponent>[1]) => {
  const newXcomponent = ((
    fn: Parameters<typeof xcomponent>[0],
    configOverride?: Partial<Parameters<typeof xcomponent>[1]>,
  ) => xcomponent(fn, { ...config, ...configOverride })) as typeof xcomponent;

  Object.assign(newXcomponent, xcomponent);

  return newXcomponent;
};

xcomponent.extend = <P extends object>(members: P): typeof xcomponent & P =>
  Object.assign(xcomponent, members);

export { xcomponent as default, xcomponent as X };
