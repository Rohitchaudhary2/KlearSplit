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
  styleUrl: "./group-details.component.css"
})
export class GroupDetailsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly groupsService = inject(GroupsService);
  private readonly dialogRef = inject(MatDialogRef<GroupDetailsComponent>);
  data = inject<GroupData>(MAT_DIALOG_DATA);

  groupMembers = signal<GroupMemberData[]>([]);
  currentUserId = this.authService.currentUser()?.user_id;

  ngOnInit(): void {
    this.fetchGroupMembers();
  }

  fetchGroupMembers() {
    this.groupsService.fetchGroupMembers(this.data.group_id).subscribe((response) => {
      this.groupMembers.set(response.data);
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
