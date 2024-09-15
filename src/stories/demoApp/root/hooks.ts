import { createContext, useContext } from 'react';
import { RootState } from './RootState';

export const RootStateProvider = createContext<RootState | null>(null);

export const useRootState = () => {
  const rootState = useContext(RootStateProvider);

  if (!rootState) throw new Error('RootStateProvider not found');

  return rootState;
};
