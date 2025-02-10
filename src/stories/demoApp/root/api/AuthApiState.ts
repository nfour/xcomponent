import { AsyncValue } from '~/X';

export class AuthApiState {
  get authToken() {
    return this.login.value?.token;
  }

  get isLoggedIn() {
    return !!this.authToken;
  }

  login = new AsyncValue(
    async ({ username, password }: { username: string; password: string }) => {
      // Pretend we're logging in with a username and password

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        username,
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.',
      };
    },
  );

  logout = new AsyncValue(async () => {
    // Pretend we're logging out
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.login.reset();
  });
}
