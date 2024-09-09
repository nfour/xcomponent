import { autorun, reaction, comparer } from 'mobx';
import { useEffect } from 'react';

export const useReaction: typeof reaction = (fn1, fn2, opts): any => {
  useEffect(
    () =>
      reaction(fn1, fn2, {
        fireImmediately: true as any,
        equals: comparer.structural,
        ...opts,
      }),
    [],
  );
};

export const useAutorun: typeof autorun = (...params): any => {
  useEffect(() => autorun(...params), []);
};
