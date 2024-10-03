import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and set withCredentials to true so that requests include the cookies
  req = req.clone({
    withCredentials: true,
  });
  return next(req);
};
