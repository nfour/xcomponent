import { XRoute, XRouter } from 'xroute';
import 'xroute/x/esm/XRouteSchema';
import { createMemoryHistory } from 'history';

export const createRouter = () =>
  new XRouter(
    [
      XRoute('home')
        .Resource('/') // @example url: /
        .Type<{
          pathname: {};
          search: { section?: string };
        }>(),
      XRoute('app').Resource('/app'),
      XRoute('appLogin').Resource('/app/login'), // @example url: /login
      XRoute('appLogout').Resource('/app/logout'), // @example url: /logout
      XRoute('appProfile').Resource('/app/profile/:username').Type<{
        pathname: { username: string };
        search: {};
      }>(),
      XRoute('notFound').Resource('/(.*)'), // @example url: /not-found
    ],
    createMemoryHistory({
      initialEntries: ['/'],
    }),
  );
