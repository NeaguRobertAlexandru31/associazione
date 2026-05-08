import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const token  = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      // Non riprovare se è già una chiamata al refresh (evita loop)
      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      return auth.refresh().pipe(
        switchMap(({ access_token }) => {
          auth.persistToken(access_token);
          const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${access_token}` } });
          return next(retryReq);
        }),
        catchError(() => {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => err);
        }),
      );
    }),
  );
};
