import { X } from '@/X';
import { runInAction } from 'mobx';

const ComponentThatTakesNestedReactiveProps = X<{
  val: number;
  nested: {
    val: number;
    jsx: JSX.Element;
  };
}>(({ val, nested: { val: val2, jsx } }) => {
  const state = X.useState(
    () =>
      class {
        // syncedPropsModel = {}
        props = {
          val,
          nested: {
            val: val2,
            jsx,
          },
        };

        get computedVal() {
          return this.props.val * 2;
        }

        get computedNestedVal() {
          return this.props.nested.val * 2;
        }
      },
  );

  // We are testing that the first object, which is created every render, does not cause a stack overflow
  X.useProps({ val, nested: { val: val2, jsx } }, state.props);

  return (
    <>
      {state.computedVal} {state.computedNestedVal} {state.props.nested.jsx}
    </>
  );
});

const ComponentThatTakesNestedReactivePropsLessBad = X<{
  val: number;
  nested: {
    val: number;
    jsx: JSX.Element;
  };
}>((props) => {
  const state = X.useState(
    () =>
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

  // We are testing that the first object, which is created every render, does not cause a stack overflow
  X.useProps(props, state.props);

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
