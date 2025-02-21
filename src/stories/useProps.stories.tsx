import { X } from '~/X';
import { runInAction } from 'mobx';

const ComponentThatTakesNestedReactivePropsLessBad = X<{
  val: number;
  nested: {
    val: number;
    jsx: React.ReactNode;
  };
}>((props) => {
  const state = X.useState(
    props,
    (props) =>
      class {
        // syncedPropsModel = {}
        props = props;

        get computedVal() {
          return this.props.val * 2;
        }

        get computedNestedVal() {
          return this.props.nested.val * 2;
        }
      },
  );

  console.log(props, state.props);

  return (
    <>
      {state.computedVal} {state.computedNestedVal} {state.props.nested.jsx}
    </>
  );
});

export const TestUseProps = X(() => {
  const state = X.useState(
    () =>
      class {
        v = 0;

        timer = setInterval(() => {
          runInAction(() => this.v++);
        }, 500);
      },
  );

  X.useOnUnmounted(() => clearInterval(state.timer));

  return (
    <ComponentThatTakesNestedReactivePropsLessBad
      nested={{
        jsx: <>Hi</>,
        val: state.v * 2,
      }}
      val={state.v}
    />
  );
});
