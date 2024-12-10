import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { PayerComponent } from "../../../shared/payer/payer.component";
import { GroupMemberData } from "../../groups.model";

@Component({
  selector: "app-groups-payer",
  standalone: true,
  imports: [
    PayerComponent
  ],
  templateUrl: "./groups-payer.component.html",
  styleUrl: "./groups-payer.component.css"
})
export class GroupsPayerComponent {
  private readonly dialogRef = inject(MatDialogRef<GroupsPayerComponent>);
  participants = inject<GroupMemberData[]>(MAT_DIALOG_DATA);
  participantsData!: { id: string, first_name: string, last_name: string }[];

  ngOnInit(): void {
    this.dialogRef.updateSize("25%");
    this.participantsData = this.participants.map((participant) => ({
      id: participant.group_membership_id,
      first_name: participant.first_name,
      last_name: participant.last_name
    }));
  }

  /**
   * Sends the selected payer ID back to friends-expense component.
   * @param id The ID of the selected payer.
   */
  sendPayer(id: string) {
    this.dialogRef.close({ id });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
