import { Injectable, signal } from '@angular/core';
import { fromEvent, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  readonly isOnline$: Observable<boolean>;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline$ = merge(
        of(navigator.onLine),
        fromEvent(window, 'online').pipe(map(() => true)),
        fromEvent(window, 'offline').pipe(map(() => false))
      );

      this.isOnline$.subscribe(status => {
        this.isOnline.set(status);
      });
    } else {
      this.isOnline$ = of(true);
    }
  }
}
