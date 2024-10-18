import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  accountDeleted = signal<boolean>(false);

  setAccountDeleted(isDeleted: boolean) {
    this.accountDeleted.set(isDeleted);
  }
}
