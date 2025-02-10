import type { ReactNode } from 'react';
import { X } from '~/X';

export const ComponentThatExpectsObservableProps = X<{
  val: number;
  nested: {
    val: number;
    jsx: ReactNode;
  };
}>((props) => {
  const state = X.useState(
    props,
    (props) =>
      class {
        get computedVal() {
          return props.val * 8;
        }

        get computedNestedVal() {
          return props.nested.val * 12;
        }
      },
  );

  return (
    <>
      {state.computedVal} {state.computedNestedVal} {props.nested.jsx}
    </>
  );
});

export const Z = X<{ z: 1 }>((p) => {
  return <></>;
});
