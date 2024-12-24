import { CurrencyPipe, NgClass } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, inject, viewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";

import { AuthService } from "../../../auth/auth.service";
import { AbsoluteValuePipe } from "../../../shared/pipes/absolute-value.pipe";
import { FriendsGroupsService } from "../../shared/friends-groups.service";
import { CreateGroupComponent } from "../create-group/create-group.component";
import { GroupsService } from "../groups.service";
import { GroupsSettlementComponent } from "../groups-expense/groups-settlement/groups-settlement.component";
import { GroupsListComponent } from "../groups-list/groups-list.component";

@Component({
  selector: "app-groups-details",
  standalone: true,
  imports: [
    CurrencyPipe,
    AbsoluteValuePipe,
    GroupsListComponent,
    MatIconModule,
    NgClass
  ],
  templateUrl: "./groups-details.component.html",
  styleUrls: [ "./groups-details.component.css", "../../friends/friends.component.css" ]
})
export class GroupsDetailsComponent {
  // Reference to the messae container element, accessed via ViewChild
  messageContainer = viewChild<ElementRef>("messageContainer");
  private readonly cdr = inject(ChangeDetectorRef); // Change detector for manual view updates
  private readonly authService = inject(AuthService);
  private readonly groupsService = inject(GroupsService);
  private readonly commonService = inject(FriendsGroupsService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  hoveringImage = false;

  // Access signals from the GroupsService
  selectedGroup = this.groupsService.selectedGroup;
  groupMembers = this.groupsService.groupMembers;
  currentMember = this.groupsService.currentMember;
  expenses = this.groupsService.expenses;
  combinedView = this.groupsService.combinedView;
  groupInvites = this.groupsService.groupInvites;
  groups = this.groupsService.groups;

  currentUserId = this.authService.currentUser()?.user_id;

  /**
   * Converts a string representation of a balance amount to a number.
   *
   * @param {string} balanceAmount - The balance amount in string format.
   * @returns {number} The parsed number representing the balance amount.
   */
  getBalanceAsNumber(balanceAmount: string | undefined): number {
    if (!balanceAmount) {
      return 0;
    }
    return parseFloat(balanceAmount);
  }

  /**
   * Determines the "settle up" status based on the selected user's balance.
   * If the balance is 0, it returns 'All Settled'. Otherwise, it returns 'Settle up'.
   *
   * @returns A string representing the current settle up status ('All Settled' or 'Settle up').
   */
  getSettleUpStatus(balance: string) {
    if (parseFloat(balance) === 0) {
      return true;
    }
    return false;
  }

  /**
   * Handles the settlement process between the current user and the selected member of group.
   * If there is a balance amount to be settled, this function opens a dialog for the user to add the settlement.
   * After confirmation, the settlement is processed by adding an settlement entry and updating the balances.
   */
  onSettleBalance(memberId: string) {
    // Member to settle
    const memberToSettle = this.groupMembers().find(
      (member) => memberId === member.group_membership_id);

    // Check if balance is already settled up
    if (this.getSettleUpStatus(memberToSettle!.balance_with_user)) {
      this.toastr.info("You are already settled up", "Info");
      return;
    }
    const totalAmount = Math.abs(
      parseFloat(memberToSettle!.balance_with_user)
    );

    // Determine whether the currentMember is the payer
    const isPayer = parseFloat(memberToSettle!.balance_with_user) > 0;

    // Assign payer and debtor details using destructuring
    const { fullName: payerName, imageUrl: payerImage } = isPayer
      ? this.commonService.getFullNameAndImage(this.currentMember()) // Current member is the payer
      : this.commonService.getFullNameAndImage(memberToSettle); // Other member is the payer

    const { fullName: debtorName, imageUrl: debtorImage } = isPayer
      ? this.commonService.getFullNameAndImage(memberToSettle) // Other member is the debtor
      : this.commonService.getFullNameAndImage(this.currentMember()); // Current member is the debtor
    
    // Open dialog to add settlement
    const dialogRef = this.dialog.open(GroupsSettlementComponent, {
      data: {
        payerName,
        payerImage,
        debtorName,
        debtorImage,
        totalAmount,
      },
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "200ms",
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      result.payer_id = isPayer ? this.currentMember()!.group_membership_id : memberToSettle?.group_membership_id;
      result.debtor_id = isPayer ? memberToSettle?.group_membership_id : this.currentMember()!.group_membership_id;
      this.groupsService
        .addSettlements(this.selectedGroup()!.group_id, result)
        .subscribe({
          next: (response) => {
            if (response.data.payer_id === this.currentMember()!.group_membership_id) {
              response.data.payer = this.commonService.getFullNameAndImage(this.currentMember());
              response.data.debtor = this.commonService.getFullNameAndImage(memberToSettle);
            } else {
              response.data.payer = this.commonService.getFullNameAndImage(memberToSettle);
              response.data.debtor = this.commonService.getFullNameAndImage(this.currentMember());
            }
            this.expenses.set([ ...this.expenses(), response.data ]);
            const combinedData = [
              ...this.combinedView(),
              { ...response.data, type: "settlement" }
            ];
            this.combinedView.set(combinedData);
            this.cdr.detectChanges();
            this.commonService.scrollToBottom(this.messageContainer()!);
            this.selectedGroup()!.balance_amount = this.commonService.updateBalance(
              this.selectedGroup()!.balance_amount,
              parseFloat(response.data.settlement_amount),
              isPayer
            );
            this.groupInvites().forEach((invite) => {
              if (invite.group_id === this.selectedGroup()!.group_id) {
                invite.balance_amount = this.selectedGroup()!.balance_amount;
              }
            });
            this.groups().forEach((group) => {
              if (group.group_id === this.selectedGroup()!.group_id) {
                group.balance_amount = this.selectedGroup()!.balance_amount;
              }
            });
            this.groupMembers().forEach((member) => {
              if (member.group_membership_id === response.data.payer_id) {
                member.balance_with_user = this.commonService.updateBalance(
                  member.balance_with_user,
                  parseFloat(response.data.settlement_amount),
                  true
                );
                member.total_balance = this.commonService.updateBalance(
                  member.total_balance,
                  parseFloat(response.data.settlement_amount),
                  true
                );
              }
              if (member.group_membership_id === response.data.debtor_id) {
                member.balance_with_user = this.commonService.updateBalance(
                  member.balance_with_user,
                  parseFloat(response.data.settlement_amount),
                  false
                );
                member.total_balance = this.commonService.updateBalance(
                  member.total_balance,
                  parseFloat(response.data.settlement_amount),
                  false
                );
              }
            });
            this.cdr.detectChanges();
            this.toastr.success("Settled up successfully", "Success");
          }
        });
    });
  }

  onUpdateGroupDetails() {
    const dialogRef = this.dialog.open(CreateGroupComponent, {
      width: "500px",
      data: "Update Group",
      enterAnimationDuration: "500ms",
      exitAnimationDuration: "500ms",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      const groupData = result.formData;
      // Call the createGroup method in the GroupService to send a group invite to the selected users
      this.groupsService.updateGroup(this.selectedGroup()!.group_id, groupData).subscribe({
        next: (response) => {
          const updatedGroup = response.data[1][0];
          this.toastr.success("Group updated successfully", "Success");
          this.selectedGroup.update((group) =>
            ({ ...group,
              ...updatedGroup,
              // Explicitly fill in the missing fields with undefined to match the expected type
              balance_amount: group!.balance_amount,
              status: group!.status,
              role: group!.role,
              has_blocked: group!.has_blocked,
            })
          );
          this.groups().forEach((group) => {
            if (group.group_id === this.selectedGroup()?.group_id) {
              Object.assign(group, updatedGroup);
            }
          });
          this.groupInvites().forEach((group) => {
            if (group.group_id === this.selectedGroup()?.group_id) {
              Object.assign(group, updatedGroup);
            }
          });
        }
      });
    });
  }
}
