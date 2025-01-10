import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { AuthService } from "../auth/auth.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [ RouterLink, RouterLinkActive ],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
})
export class NavbarComponent {
  authService = inject(AuthService);
  user = this.authService.currentUser;
  userName = `${this.user()?.first_name} ${this.user()?.last_name}`.trim();

  onLogout() {
    this.authService.logout();
  }
}
