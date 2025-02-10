import { AsyncValue, useRootState, X } from '~/X';
import { AppLayout } from '../App';
import { Col } from '~/__common/Grid';

export const UserProfile = X(() => {
  const { router, dataApi } = useRootState();
  const state = X.useState(
    () =>
      class AppProfileState {
        get route() {
          return router.routes.appProfile;
        }

        get username() {
          return this.route.pathname.username;
        }

        user = new AsyncValue(() =>
          dataApi.getUser({ username: this.username }),
        );
      },
  );

  X.useOnMounted(() => {
    state.user.query();
  });

  return (
    <AppLayout>
      {(() => {
        if (state.user.isPending) return <h1>Loading...</h1>;
        if (state.user.error) return <h1>Error: {state.user.error.message}</h1>;

        return (
          <Col>
            <h2>{state.user.value?.username}</h2>
            <div>{state.user.value?.name}</div>
          </Col>
        );
      })()}
    </AppLayout>
  );
});
