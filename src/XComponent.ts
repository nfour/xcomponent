import { observer } from 'mobx-react-lite';
import { type ReactNode } from 'react';
import {
  useAutorun,
  useOnMounted,
  useOnUnmounted,
  useProps,
  useReaction,
  useState,
} from './hooks';
import { AsyncValue, BoolValue, Value, BoxedValue } from './mobx';

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
  }: {
    /** @default true
     * Set the displayName of the component to the file and line number for easer debugging
     */
    setDisplayName?: boolean;
  } = {},
) => {
  if (setDisplayName)
    try {
      throw new Error('Name');
    } catch (err: any) {
      setComponentNameForDebugging(Fn, err);
    }

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

function setComponentNameForDebugging(
  Fn: Function & Partial<Record<'name' | 'displayName', string>>,
  error: Error,
) {
  const sourceFileLine = error.stack?.split('\n')?.[3];
  // @example http://localhost:9005/root/navBar/NavBar.tsx?t=1708482663107:34:26
  const stackPath = sourceFileLine
    ?.split(/\s*at /)?.[1]
    ?.replace(/[?]t=\d+/, '');

  const fileName = stackPath?.match(/\/([^/]+)\.tsx?/)?.[1];
  const name = `COMPONENT in ${fileName} ${stackPath}`;

  return Object.defineProperties(Fn, {
    name: { value: name },
    displayName: { value: name },
  });
}

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
