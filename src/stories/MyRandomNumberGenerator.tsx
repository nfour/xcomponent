import { X } from '../XComponent';
import { css } from '@emotion/react';
import { SomeObservableComponentWithAIntervalTimer } from './SomeObservableComponentWithAIntervalTimer';
import { makeAutoObservable } from 'mobx';

export const MyRandomNumberGenerator = X<{
  maximumGenerationAttempts: number;
  range: { from: number; to: number };
}>((props) => {
  throw new Error('This is a demo error');

  const { api } = useSomeRootState();
  // `component.useState`, due to the name, gets picked up by react-refresh and operates correctly between hot-reloads
  // Ideally this would be `component.state(() => ...)`
  // Additionally, we are able to provide a `class` as the state initializer,
  // which will be `makeAutoObservable`'d if there is no constructor present.
  // With this we can achieve consistant syntax across all state definitions, whether local or global state
  const state = X.useState(
    () =>
      class {
        constructor() {
          makeAutoObservable(this);

          console.log(
            'state constructed. should only see this on first render, or when this classes code is edited on hot reload',
          );
        }

        // `Value` is just a mobx boxed store: { value: T, set: (v: T) => void }
        // We make `props` observable so we can react to changes within this class,
        // without complicated useEffects
        props = new X.Value(props);
        generationCount = new X.Value(0);

        // AsyncValue is a mobx store which essentially wraps a async value ergonomically (similar to react-query?),
        // providing .value, .error, .isPending, .query(), .set(), .progress, .clearQueue() etc.
        // Types are also inferred nicely
        myGeneratedNumber = new X.AsyncValue(
          ({ from, to }: { from: number; to: number }) =>
            api.fetchSomeNumber({ from, to }).then((data) => data?.someNumber),
        );

        get isOutOfAttempts() {
          return (
            this.generationCount.value >=
            this.props.value.maximumGenerationAttempts
          );
        }

        generateNumber = async () => {
          if (this.isOutOfAttempts) return;

          this.generationCount.set(this.generationCount.value + 1);

          await this.myGeneratedNumber.reset().query({
            from: this.props.value.range.from,
            to: this.props.value.range.to,
          });
        };

        reset = () => {
          this.generationCount.set(0);
          this.myGeneratedNumber.reset();
        };
      },
  );

  const funcState = X.useState(() => ({
    someState: 'hello',
  }));

  // Whenever a new react prop object values change occurs,
  // update the Value store with only those changed
  X.useProps(props, state.props);

  // effectively `useEffect(() => fn(), [])`
  X.useOnMounted(() => {
    state.generateNumber();
  });

  X.useOnUnmounted(() => {
    // cleanup
  });

  X.useAutorun(() => {
    console.log('fetchin number', state.myGeneratedNumber.isPending);
  });

  X.useReaction(
    () => state.myGeneratedNumber.value,
    (newNumber) => {
      console.log('cool a new number', newNumber);
    },
  );

  return (
    <div>
      {state.myGeneratedNumber.error && (
        <div>Something broke {state.myGeneratedNumber.error?.message}</div>
      )}
      <div>
        Your number: {state.myGeneratedNumber.value}{' '}
        {state.myGeneratedNumber.isPending && (
          <span
            css={css`
              opacity: 0.5;
              display: inline-block;
              transform: translateX(30px) rotate(20deg);
            `}
          >
            Loading... ...
          </span>
        )}
      </div>
      <div
        css={{
          'display': 'flex',
          'outline': '1px solid #000a',
          'padding': '5px',
          'margin': '5px 0',
          '& button': {
            color: 'green',
          },
        }}
      >
        <button
          disabled={state.myGeneratedNumber.isPending || state.isOutOfAttempts}
          onClick={state.generateNumber}
        >
          New number please!
        </button>
        <button onClick={state.reset}>Reset</button>
      </div>
      <div
        className={MyRandomNumberGenerator.classes.generationAttemptsWrapper}
      >
        Made {state.generationCount.value}/
        <span
          className={MyRandomNumberGenerator.classes.generationAttempts}
          css={css`
            ${state.isOutOfAttempts &&
            css`
              color: red;
            `}
          `}
        >
          {props.maximumGenerationAttempts}
        </span>{' '}
        requests so far.
      </div>
      {state.isOutOfAttempts && <div>Reached maximum generation attempts</div>}
    </div>
  );
}).with({
  // Demonstrating the .with() method to add additional components
  // Typically this would be used like: Table (Main component), Table.Row, Table.Cell, etc.
  SomeObservableComponentWithAIntervalTimer,

  // example of a static prop that is both used outside to help target for styling
  // and within the component itself to assign those classes
  // no typescript issues
  classes: {
    generationAttemptsWrapper: 'foo-class',
    generationAttempts: 'bar-class',
  },
});

const useSomeRootState = () => {
  return {
    api: {
      async fetchSomeNumber({ from, to }: { from: number; to: number }) {
        await new Promise((resolve) => setTimeout(resolve, 200));

        return {
          // number in range:
          someNumber: Math.floor(Math.random() * (to - from) + from),
        };
      },
    },
  };
};
