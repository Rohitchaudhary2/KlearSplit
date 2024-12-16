import { Routes } from "@angular/router";

import { AuthGuard } from "./components/auth/auth.guard";
import { LoginComponent } from "./components/auth/login/login.component";
import { RegisterComponent } from "./components/auth/register/register.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { FriendsComponent } from "./components/friends-groups/friends/friends.component";
import { GroupsComponent } from "./components/friends-groups/groups/groups.component";
import { GroupsDetailsComponent } from "./components/friends-groups/groups/groups-details/groups-details.component";
import { HomeComponent } from "./components/home/home.component";
import { GuestGuard } from "./components/shared/guest.gaurd";

export const routes: Routes = [
  {
    path: "",
    component: HomeComponent,
    canActivate: [ GuestGuard ],
  },
  {
    path: "register",
    component: RegisterComponent,
    canActivate: [ GuestGuard ],
  },
  {
    path: "login",
    component: LoginComponent,
    canActivate: [ GuestGuard ],
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [ AuthGuard ],
  },
  {
    path: "friends",
    component: FriendsComponent,
    canActivate: [ AuthGuard ],
  },
  {
    path: "groups",
    component: GroupsComponent,
    canActivate: [ AuthGuard ],
  },
  {
    path: "groups/details",
    component: GroupsDetailsComponent,
    canActivate: [ AuthGuard ],
  },
];
