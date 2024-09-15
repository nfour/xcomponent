import { X } from '@/X';

export class AuthApiState {
  get authToken() {
    return this.login.value?.token;
  }

  get isLoggedIn() {
    return !!this.authToken;
  }

  login = new X.AsyncValue(
    async ({ username, password }: { username: string; password: string }) => {
      // Pretend we're logging in with a username and password

      await new Promise((r) => setTimeout(r, 1000));

      return {
        username,
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.',
      };
    },
  );

  logout = new X.AsyncValue(async () => {
    // Pretend we're logging out
    await new Promise((r) => setTimeout(r, 1000));
    this.login.reset();
  });
}
