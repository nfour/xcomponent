import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo, useEffect } from 'react';
import { X } from '../XComponent';

export const SomeObservableComponentWithAIntervalTimer = observer(() => {
  const state = useMemo(
    () =>
      new (class {
        constructor() {
          makeAutoObservable(this);
        }

        number = 0;

        incr = () => {
          this.number++;
        };

        startInterval = () => {
          setInterval(() => {
            this.incr();
          }, 1000);
        };
      })(),
    [],
  );

  useEffect(() => {
    state.startInterval();
  }, []);

  console.log(state.number);

  return (
    <div>
      {state.number}
      <button onClick={state.incr}>+</button>
    </div>
  );
});

export const XSomeObservableComponentWithAIntervalTimer = X(() => {
  const state = X.useState(
    () =>
      class {
        number = 0;

        incr = () => this.number++;

        startInterval = () => {
          setInterval(() => {
            this.incr();
          }, 1000);
        };
      },
  );

  X.useOnMounted(() => {
    state.startInterval();
  });

  console.log(state.number);

  return (
    <div>
      {state.number}
      <button onClick={state.incr}>+</button>
    </div>
  );
});
