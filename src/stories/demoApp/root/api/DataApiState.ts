import { makeAutoObservable } from 'mobx';
import type { RootState } from '../RootState';
import { AsyncValue } from '../../../../mobx';

export class DataApiState {
  constructor(private ctx: () => RootState) {
    makeAutoObservable(this);
  }

  /**
   * We made a fetch method that adds the Authorization header to the request
   * and thus demonstrates a dependency on RootState.authApi class.
   *
   * Also provides a return type for the fetch method.
   */
  fetch = <R>(path: string, opts?: RequestInit) => {
    const { authToken } = this.ctx().authApi;
    const BASE_URL = 'https://api.example.com';

    return fetch(BASE_URL + path, {
      ...opts,
      headers: {
        ...opts?.headers,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    }).then((res) => res.json() as Promise<R>);
  };

  users = new AsyncValue(() =>
    this.fetch<{
      users: {
        id: number;
        name: string;
      }[];
    }>('/api/users'),
  );

  me = new AsyncValue(() =>
    this.fetch<{
      user: {
        id: number;
        name: string;
      };
    }>('/api/me'),
  );
}
