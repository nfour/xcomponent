// @vitest-environment jsdom

import { isObservableProp, makeAutoObservable } from 'mobx';
import { it, describe, expect } from 'vitest';
import { useProps } from '../hooks';
import { renderHook } from '@testing-library/react';
// import '@testing-library/jest-dom';

describe('useProps', () => {
  it('should make each prop observable', () => {
    const props = { a: 1, b: 2 };
    const store = makeAutoObservable({ props: {} as typeof props });

    expect(isObservableProp(store.props, 'a')).toBe(false);
    expect(isObservableProp(store.props, 'b')).toBe(false);

    renderHook(() => {
      useProps(props, store.props);
    });

    expect(isObservableProp(store.props, 'a')).toBe(true);
    expect(isObservableProp(store.props, 'b')).toBe(true);
  });

  it('should update nested props', () => {
    const props = { a: { b: 1, c: 2 } };
    const store = makeAutoObservable({ props: {} as typeof props });

    renderHook(() => {
      useProps(props, store.props);
    });

    expect(isObservableProp(store.props.a, 'b')).toBe(true);
    expect(isObservableProp(store.props.a, 'c')).toBe(true);
  });

  // it('')
});
