import { createRouter } from './router';
import { AuthApiState } from './api/AuthApiState';
import { DataApiState } from './api/DataApiState';

export class RootState {
  router = createRouter();
  authApi = new AuthApiState();
  dataApi = new DataApiState(() => this);
}
