import { renderHook } from '@testing-library/react';
import * as mobx from 'mobx';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useObjectStore } from '../hooks';

describe('useObjectStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('describes React element prop paths and preserves the MobX error as its cause', () => {
    const mobxError = new Error('MobX could not make the value observable');

    vi.spyOn(mobx, 'makeAutoObservable').mockImplementation(() => {
      throw mobxError;
    });

    try {
      renderHook(() =>
        useObjectStore({
          title: <span>Title</span>,
          items: [<span key="item">Item</span>],
          nested: { content: <span>Content</span> },
        }),
      );
    } catch (error) {
      expect(error).toMatchObject({ cause: mobxError });
      expect(error).toHaveProperty(
        'message',
        expect.stringContaining(
          'prop path(s) [title, items[], nested.content]',
        ),
      );
      expect(error).toHaveProperty(
        'message',
        expect.stringContaining('someProp: () => <>Foo</>'),
      );

      return;
    }

    throw new Error('Expected useObjectStore to throw');
  });

  it('rethrows the original error when props do not contain React elements', () => {
    const mobxError = new Error('MobX could not make the value observable');

    vi.spyOn(mobx, 'makeAutoObservable').mockImplementation(() => {
      throw mobxError;
    });

    expect(() => renderHook(() => useObjectStore({ title: 'Title' }))).toThrow(
      mobxError,
    );
  });
});
