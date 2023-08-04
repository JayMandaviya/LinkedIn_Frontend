import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return of(localStorage.getItem('token')).pipe(
      switchMap((token: string | null) => {
        if (token) {
          const clonedRequest = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + token),
          });
          return next.handle(clonedRequest);
        }
        return next.handle(req);
      })
    );
  }
}
