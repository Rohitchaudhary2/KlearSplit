import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import {
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
} from "@angular/router";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";
import { provideToastr, ToastrModule } from "ngx-toastr";

import { routes } from "./app.routes";
// import { authInterceptor } from './components/auth/auth.interceptor';
import { errorInterceptor } from "./components/shared/error.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({
        paramsInheritanceStrategy: "always",
      }),
    ),
    provideHttpClient(withInterceptors([ errorInterceptor ])),
    provideAnimations(), // required animations providers
    provideToastr(),
    importProvidersFrom(
      ToastrModule.forRoot({
        preventDuplicates: true,
        timeOut: 3000,
        progressBar: true,
        easing: "ease-out",
      }),
    ),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
  ],
};
