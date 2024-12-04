import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { AuthService } from "../../../auth/auth.service";
import { GroupData, GroupMemberData } from "../groups.model";
import { GroupsService } from "../groups.service";

@Component({
  selector: "app-group-details",
  standalone: true,
  imports: [ CommonModule, CurrencyPipe ],
  templateUrl: "./group-details.component.html",
  styleUrl: "./group-details.component.css",
})
export class GroupDetailsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly groupsService = inject(GroupsService);
  private readonly dialogRef = inject(MatDialogRef<GroupDetailsComponent>);
  data = inject<GroupData>(MAT_DIALOG_DATA);
  loading = false;

  groupMembers = signal<GroupMemberData[]>([]);
  currentUserId = this.authService.currentUser()?.user_id;

  ngOnInit(): void {
    this.loading = true;
    this.data.role = `${this.data.role[0]}${this.data.role.slice(1).toLowerCase()}`;
    this.fetchGroupMembers();
  }

  /**
   * This function calls the service to fetch the group details containing all the members.
   * The response contains the balance of the current user with each member and the total balance of that member.
   */
  fetchGroupMembers() {
    this.groupsService
      .fetchGroupMembers(this.data.group_id)
      .subscribe((response) => {
        const filteredMembers = response.data.filter(
          (member) => member.member_id !== this.currentUserId,
        ).map((member) => {
          switch (member.role) {
            case "ADMIN":
              return { ...member, role: "Admin" };
            case "COADMIN":
              return { ...member, role: "Co-Admin" };
            case "CREATOR":
              return { ...member, role: "Creator" };
            case "USER":
              return { ...member, role: "" };
            default:
              return member;
          }
        });
        this.groupMembers.set(filteredMembers);
        this.loading = false;
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
