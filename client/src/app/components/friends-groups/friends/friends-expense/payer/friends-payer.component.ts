import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { PayerComponent } from "../../../shared/payer/payer.component";
import { AddedFriend } from "../../friend.model";

@Component({
  selector: "app-friends-payer",
  standalone: true,
  imports: [ MatButtonModule, PayerComponent ],
  templateUrl: "./friends-payer.component.html",
  styleUrl: "./friends-payer.component.css",
})
export class FriendsPayerComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<FriendsPayerComponent>);
  participants = inject<AddedFriend[]>(MAT_DIALOG_DATA);
  participantsData!: { id: string, first_name: string, last_name: string }[];

  ngOnInit(): void {
    this.dialogRef.updateSize("25%");
    this.participantsData = this.participants.map((participant) => ({
      id: participant.user_id,
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
