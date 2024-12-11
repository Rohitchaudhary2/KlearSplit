import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { GroupMemberData } from "../../groups.model";

@Component({
  selector: "app-split-type-groups",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule
  ],
  templateUrl: "./groups-split-type.component.html",
  styleUrls: [ "./groups-split-type.component.css" ],
})
export class GroupsSplitTypeComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<GroupsSplitTypeComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);

  participants: GroupMemberData[] = this.data.participants;
  totalAmount = this.data.totalAmount.total_amount;
  activeItem: "EQUAL" | "UNEQUAL" | "PERCENTAGE" = "EQUAL";

  selectedParticipants = [ ...this.participants ];
  calculatedShares: Record<string, number> = {};
  remainingTotal: number = this.totalAmount;

  ngOnInit(): void {
    this.dialogRef.updateSize("25%");
    this.initializeShares();
    this.setActive("EQUAL");
  }

  initializeShares() {
    this.participants.forEach((participant) => {
      this.calculatedShares[participant.group_membership_id] = 0;
    });
    this.updateRemainingTotal();
  }

  toggleParticipant(participant: GroupMemberData) {
    if (this.selectedParticipants.includes(participant)) {
      this.selectedParticipants = this.selectedParticipants.filter(
        (p) => p.group_membership_id !== participant.group_membership_id
      );
    } else {
      this.selectedParticipants.push(participant);
    }
  }

  setActive(item: "EQUAL" | "UNEQUAL" | "PERCENTAGE") {
    this.activeItem = item;
    if (item === "EQUAL") {
      const share =
        this.totalAmount / (this.selectedParticipants.length || 1);
      this.selectedParticipants.forEach(
        (participant) =>
          (this.calculatedShares[participant.group_membership_id] = share)
      );
    } else {
      this.participants.forEach((participant) => {
        this.calculatedShares[participant.group_membership_id] = 0;
      });
    }
    this.updateRemainingTotal();
  }

  updateTotal() {
    this.updateRemainingTotal();
  }

  updateRemainingTotal() {
    const total = Object.values(this.calculatedShares).reduce(
      (acc, val) => acc + (val || 0),
      0
    );
    this.remainingTotal =
      this.activeItem === "UNEQUAL"
        ? this.totalAmount - total
        : 100 - total;
  }

  sendSplitType() {
    const debtors = this.selectedParticipants.map((participant) => ({
      debtor_id: participant.group_membership_id, // Assuming this is the unique identifier for a participant
      debtor_share: this.calculatedShares[participant.group_membership_id] || 0, // Use the calculated share or default to 0
    }));
    this.dialogRef.close({
      split_type: this.activeItem,
      debtors,
      selectedParticipants: this.selectedParticipants
    });
  }

  isValidSplit(): boolean {
    const total = Object.values(this.calculatedShares).reduce(
      (acc, val) => acc + (val || 0),
      0
    );
  
    switch (this.activeItem) {
      case "UNEQUAL":
        return total === this.totalAmount;
      case "PERCENTAGE":
        return total === 100;
      default:
        // For 'EQUAL' or other cases
        return true;
    }
  }
  

  onCancel() {
    this.dialogRef.close(null);
  }
}
