import { makeAutoObservable } from 'mobx';
import type { DataApiState } from '../api/DataApiState';

export class AppState {
  constructor(public ctx: () => { dataApi: DataApiState }) {
    makeAutoObservable(this);
  }
}
