import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { X } from '../XComponent';

describe('useState', () => {
  it('should create a stateful store', () => {
    const {
      unmount,
      result: { current: store },
    } = renderHook(() =>
      X.useState(
        () =>
          class {
            count = 0;
            increment() {
              this.count++;
            }
          },
      ),
    );

    try {
      expect(store.count).toBe(0);
      store.increment();
      expect(store.count).toBe(1);
    } catch (e: any) {
      throw e;
    } finally {
      unmount();
    }
  });

  it('should create a stateful store with observable props', () => {
    const initialProps = { a: 1, b: 2 };
    const useStore = (props: typeof initialProps) =>
      X.useState(
        props,
        (props) =>
          class {
            count = 0;

            get computedFromProps() {
              return props.a + props.b + this.count;
            }

            get props() {
              return { ...props };
            }

            increment() {
              this.count++;
            }
          },
      );

    const {
      rerender,
      result: { current: store1 },
    } = renderHook((nextProps) => useStore(nextProps), { initialProps });

    expect(store1.props).toEqual({ a: 1, b: 2 });
    expect(store1.count).toBe(0);
    expect(store1.computedFromProps).toBe(3);

    store1.increment();

    expect(store1.count).toBe(1);
    expect(store1.computedFromProps).toBe(4);

    rerender({ a: 3, b: 4 });

    expect(store1.props).toEqual({ a: 3, b: 4 });
    expect(store1.count).toBe(1);
    expect(store1.computedFromProps).toBe(8);
  });

  it('can observe props even when passed in as new obj each time eg. destructured ', () => {
    const initialProps = { a: 1, b: 2, className: 'foo' };
    const useStore = ({ a }: typeof initialProps) =>
      X.useState(
        { a }, // Lets ignore `b` and `className` here
        (props) =>
          class {
            count = 0;

            get computedFromProps() {
              return props.a + this.count;
            }

            increment() {
              this.count++;
            }
          },
      );

    const {
      rerender,
      result: { current: store1 },
    } = renderHook((nextProps) => useStore(nextProps), { initialProps });

    expect(store1.count).toBe(0);
    expect(store1.computedFromProps).toBe(1);

    store1.increment();

    expect(store1.count).toBe(1);
    expect(store1.computedFromProps).toBe(2);

    rerender({ a: 3, b: 999, className: 'bar' });

    expect(store1.count).toBe(1);
    expect(store1.computedFromProps).toBe(4);
  });
});
