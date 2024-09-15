import { makeAutoObservable } from 'mobx';
import type { AuthApiState } from './AuthApiState';
import { MOCKED_API_URL } from '@/__mocks__/api/fetchMocks';

// Lets use a mock URL to simulate an actual api flow
const BASE_URL = MOCKED_API_URL;

export class DataApiState {
  constructor(public ctx: () => { authApi: AuthApiState }) {
    makeAutoObservable(this);
  }

  getUser = async ({ username }: { username: string }) => {
    await new Promise((r) => setTimeout(r, 1000));

    return this.getAllUsers().then((users) =>
      users.find((u) => u.username === username),
    );
  };

  getAllUsers = async () => {
    await new Promise((r) => setTimeout(r, 1000));

    return this.fetch<{ username: string; name: string }[]>(`/api/users`);
  };

  /**
   * We made a fetch method that adds the Authorization header to the request
   * and thus demonstrates a dependency on RootState.authApi class.
   *
   * Also provides a return type for the fetch method.
   */
  private fetch = <R>(path: string, opts?: RequestInit) => {
    const { authToken } = this.ctx().authApi;

    // Fetch data from the mock server
    return fetch(BASE_URL + path, {
      ...opts,
      headers: {
        ...opts?.headers,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    }).then((res) => res.json() as Promise<R>);
  };
}
