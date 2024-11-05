import { X } from '~/X';

export const ComponentThatExpectsObservableProps = X<{
  val: number;
  nested: {
    val: number;
    jsx: JSX.Element;
  };
}>((props) => {
  const state = X.useState(
    () =>
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
