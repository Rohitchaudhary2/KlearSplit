import { Component, inject } from '@angular/core';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  authService = inject(AuthService);
}
