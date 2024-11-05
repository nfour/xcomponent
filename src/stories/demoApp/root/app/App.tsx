import { Col, Row } from '~/__common/Grid';
import { Navbar } from '~/root/navigation/Navbar';
import { X } from '~/X';
import type { ReactNode } from 'react';
import { UserProfile } from './userProfile/UserProfile';

export const App = X(() => {
  const { router } = X.useRootState();

  /**
   * Here we demonstrate multiple pages being gated by a nested component.
   * the `App` component controls how its children pages are rendered by checking the current route.
   * This lets `App` keep full control over the layout of the app while avoiding the need for the root-level routes to
   * be contaminated with logic that `App` should be responsible for.
   */
  switch (router.route?.key) {
    case 'appProfile':
      return <UserProfile />;
    case 'appLogin':
      return <LoginPage />;
    case 'appLogout':
      return <LogoutPage />;

    default:
      return <AppHome />;
  }
});

export const AppLayout = X(({ children }: { children: ReactNode }) => (
  <Col
    css={{
      justifyContent: 'space-between',
    }}
  >
    <Navbar />
    <Col>{children}</Col>
    <Row css={{ flexGrow: 0 }}>...</Row>
  </Col>
));

const AppHome = X(() => {
  const { router, dataApi } = X.useRootState();
  const state = X.useState(
    () =>
      class {
        users = new X.AsyncValue(() => dataApi.getAllUsers());
      },
  );

  X.useOnMounted(() => {
    state.users.query();
  });

  return (
    <AppLayout>
      <h1>App dashboard</h1>
      <p>Currently the app does nothing besides showing user profiles.</p>
      <Col>
        <h2>Here is a bunch of user profiles</h2>
        <Col>
          {(() => {
            if (state.users.isPending) return <div>Loading...</div>;

            return state.users.value?.map((user) => (
              <Row key={user.username}>
                <button
                  onClick={() =>
                    router.routes.appProfile.push({
                      pathname: { username: user.username },
                    })
                  }
                >
                  {user.username} - {user.name}
                </button>
              </Row>
            ));
          })()}
        </Col>
      </Col>
    </AppLayout>
  );
});

const LoginPage = X(() => {
  const { authApi, router } = X.useRootState();
  const state = X.useState(
    () =>
      class {
        username = new X.Value('');
        password = new X.Value('');

        get isInputValid() {
          return (
            this.username.value.length > 0 && this.password.value.length > 0
          );
        }

        login = () =>
          authApi.login.query({
            username: this.username.value,
            password: this.password.value,
          });
      },
  );

  X.useReaction(
    () => authApi.isLoggedIn,
    (isLoggedIn) => {
      if (isLoggedIn) {
        router.routes.app.push();
      }
    },
  );

  return (
    <AppLayout>
      <h1>Login</h1>
      <input
        placeholder="username"
        value={state.username.value}
        onChange={(e) => state.username.set(e.target.value)}
      />
      <input
        placeholder="password"
        value={state.password.value}
        onChange={(e) => state.password.set(e.target.value)}
      />
      <button disabled={!state.isInputValid} onClick={state.login}>
        Login
      </button>
    </AppLayout>
  );
});

const LogoutPage = X(() => {
  const { router, authApi } = X.useRootState();

  X.useOnMounted(() => {
    authApi.logout.query();
  });

  return (
    <AppLayout>
      <h1>
        {authApi.logout.isPending ? 'Logging out...' : 'You are now logged out'}
      </h1>
      <button
        onClick={() => {
          router.routes.app.push();
        }}
      >
        Go back to the app
      </button>
    </AppLayout>
  );
});
