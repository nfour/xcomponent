import { RouterState } from '../RouterState';
import { AuthApiState } from './api/AuthApiState';
import { DataApiState } from './api/DataApiState';

export class RootState {
  router = new RouterState();
  authApi = new AuthApiState();
  dataApi = new DataApiState(() => this);
}
