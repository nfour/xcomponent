import { observer as mobxObserver } from 'mobx-react-lite';
import { type ReactNode } from 'react';
import {
  useAutorun,
  useOnMounted,
  useOnUnmounted,
  useReaction,
  useState,
} from './hooks';
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
  Fn: ((p: { className?: string } & PROPS) => ReactNode) & {
    displayName?: string;
  },
  {
    setDisplayName = true,
  }: {
    /**
     * @default true
     * Set the displayName of the component to the file and line number for easer debugging
     */
    setDisplayName?: boolean;
  } = {},
) => {
  if (setDisplayName && !Fn.displayName)
    try {
      throw new Error('Name');
    } catch (err: any) {
      setComponentNameForDebugging(Fn, err);
    }

  const observed = mobxObserver(Fn);

  const withMembers = <MEMBERS extends object>(members: MEMBERS) => {
    Object.assign(observed, members);

    return observed as typeof observed & MEMBERS;
  };

  return Object.assign(observed, { with: withMembers }) as typeof observed & {
    with: typeof withMembers;
  };
};

xcomponent.useState = useState;
xcomponent.useOnMounted = useOnMounted;
xcomponent.useOnUnmounted = useOnUnmounted;
xcomponent.useReaction = useReaction;
xcomponent.useAutorun = useAutorun;

export { xcomponent as X };
