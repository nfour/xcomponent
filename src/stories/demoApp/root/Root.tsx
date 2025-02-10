import { X, useRootState } from '~/X';
import { RootStateProvider } from './hooks';
import { LandingPage } from './landingPage/LandingPage';
import { App } from './app/App';
import { RootState } from './RootState';

export const Root = X(() => {
  const rootState = X.useState(() => RootState);

  return (
    <RootStateProvider.Provider value={rootState}>
      <RootRoutes />
    </RootStateProvider.Provider>
  );
});

export const RootRoutes = X(() => {
  const { router } = useRootState();

  switch (router.route?.key) {
    case 'home':
      return <LandingPage />;

    case 'notFound':
      return <NotFoundPage />;

    default:
      return <App />;
  }
});

const NotFoundPage = X(() => {
  return <div>Page Not Found {':('}</div>;
});
