import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from './token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  // Clone the request and set the Authorization header if token exists
  req = req.clone({
    setHeaders: {
      Authorization: token ? `${token}` : '',
    },
  });
  return next(req);
};
