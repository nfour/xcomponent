import { XRouter, XRoute } from 'xroute';
import { createBrowserHistory } from 'history';

export class RouterState {
  router = new XRouter(
    [
      XRoute('home')
        .Resource('/') // @example url: /
        .Type<{
          pathname: {};
          search: { section?: string };
        }>(),
      XRoute('login').Resource('/login'), // @example url: /login
      XRoute('logout').Resource('/logout'), // @example url: /logout
      XRoute('profile').Resource('/profile/:userId').Type<{
        pathname: { userId: string };
        search: {};
      }>(),
      XRoute('app').Resource('/app'),
      XRoute('notFound').Resource('*'),
    ],
    createBrowserHistory(),
  );
}
