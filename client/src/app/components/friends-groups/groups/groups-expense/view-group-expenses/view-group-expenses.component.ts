import { DatePipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ToastrService } from "ngx-toastr";

import { ConfirmationDialogComponent } from "../../../../confirmation-dialog/confirmation-dialog.component";
import {
  CombinedGroupExpense,
  CombinedGroupMessage,
  CombinedGroupSettlement,
  ExpenseDeletedEvent,
  GroupExpenseData,
  GroupExpenseResponse,
  GroupSettlementData,
} from "../../../groups/groups.model";
import { ExpenseTableComponent } from "../../../shared/expense-table/expense-table.component";
import { FriendsGroupsService } from "../../../shared/friends-groups.service";
import { GroupsService } from "../../groups.service";
import { GroupsExpenseComponent } from "../groups-expense.component";
import { GroupsSettlementComponent } from "../groups-settlement/groups-settlement.component";

@Component({
  selector: "app-view-group-expenses",
  standalone: true,
  imports: [ MatIconModule, MatButtonModule, DatePipe, ExpenseTableComponent ],
  templateUrl: "./view-group-expenses.component.html",
  styleUrl: "./view-group-expenses.component.css",
  providers: [ DatePipe ],
})

/**
 * The `ViewExpensesComponent` is responsible for displaying and managing the expenses
 * between members in a specific group. It fetches the list of expenses related
 * to a selected group and provides options to update or delete those expenses.
 */
export class ViewGroupExpensesComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ViewGroupExpensesComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly commonService = inject(FriendsGroupsService);
  private readonly groupsService = inject(GroupsService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  user = this.data[0]; // Logged in user
  selectedGroup = this.groupsService.selectedGroup;
  currentMember = this.groupsService.currentMember;
  expenses = this.groupsService.expenses;
  combinedView = this.groupsService.combinedView;

  totalExpenses = signal<(GroupExpenseData | GroupSettlementData)[] | []>([]);

  // A boolean flag to track the loading state while fetching expenses
  loading = signal(false);

  updateLoader = signal(false);
  deleteLoader = signal(false);

  constructor(private readonly datePipe: DatePipe) {}

  /**
   * `ngOnInit` lifecycle hook. This method is called when the component is initialized.
   * It starts by setting the `loading` flag to true, then fetches all the expenses
   * for the selected user via the `friendsService`. The expenses are then set in the
   * `totalExpenses` signal and the loading flag is set to false once the data is fetched.
   */
  ngOnInit() {
    this.loading.set(true);
    this.groupsService
      .fetchAllExpensesAndSettlements(this.selectedGroup()!.group_id)
      .subscribe({
        next: (expenses) => {
          expenses.forEach((expense) => {
            const payer = this.groupsService
              .groupMembers()
              .find(
                (member) => member.group_membership_id === expense.payer_id,
              );
            expense.payer = this.commonService.getFullNameAndImage(payer);
            if (!this.isGroupExpenseData(expense)) {
              const debtor = this.groupsService.groupMembers().find((member) => member.group_membership_id === expense.debtor_id);
              expense.debtor = this.commonService.getFullNameAndImage(debtor);
            }
          });
          this.totalExpenses.set(expenses);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  /**
   * Handles the deletion of an expense. Displays a confirmation dialog and
   * proceeds with the deletion if the user confirms.
   *
   * @param id - The unique identifier for the expense to be deleted
   * @param payerId - The ID of the payer (used to update the balance)
   * @param debtorAmount - The amount that the debtor owes (used to update the balance)
   */
  onDeleteExpense({ id, payerId, debtorAmount }: ExpenseDeletedEvent) {
    this.deleteLoader.set(true);
    const expenseToDelete = this.totalExpenses().find((expense) => {
      if (this.isGroupExpenseData(expense)) {
        return expense.group_expense_id === id;
      }
      return expense.group_settlement_id === id;
    });

    // Open a confirmation dialog to ask the user if they are sure they want to delete the expense
    const confirmationDialogRef = this.dialog.open(
      ConfirmationDialogComponent,
      {
        data: `Are you sure you want to delete this ${this.isGroupExpenseData(expenseToDelete!) ? "expense" : "settlement"}?`,
      },
    );

    confirmationDialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      // API call to back-end to delete the expense
      this.groupsService
        .deleteExpenseAndSettlement(
          this.selectedGroup()!.group_id,
          this.isGroupExpenseData(expenseToDelete!),
          id,
        )
        .subscribe({
          next: () => {
            const updatedExpenses = this.totalExpenses().filter(
              (expense: GroupExpenseData | GroupSettlementData) => {
                if (this.isGroupExpenseData(expense)) {
                  return expense.group_expense_id !== id;
                }
                return expense.group_settlement_id !== id;
              },
            );
            this.totalExpenses.set(updatedExpenses);
            this.deleteLoader.set(false);
            this.toastr.success(
              `${this.isGroupExpenseData(expenseToDelete!) ? "Expense" : "Settlement"} Deleted successfully`,
              "Success",
            );
          },
          error: () => this.deleteLoader.set(false),
        });
      const balanceAmount = parseFloat(this.selectedGroup()!.balance_amount);
      const debtAmount = parseFloat(debtorAmount);
      this.selectedGroup()!.balance_amount =
        this.currentMember()?.group_membership_id === payerId
          ? JSON.stringify(balanceAmount - debtAmount)
          : JSON.stringify(balanceAmount + debtAmount);

      this.groupsService.groupInvites().forEach((invite) => {
        if (invite.group_id === this.selectedGroup()!.group_id) {
          invite.balance_amount = this.selectedGroup()!.balance_amount;
        }
      });
      this.groupsService.groups().forEach((group) => {
        if (group.group_id === this.selectedGroup()!.group_id) {
          group.balance_amount = this.selectedGroup()!.balance_amount;
        }
      });
      const updatedExpenses = this.expenses().filter(
        (expense: GroupExpenseData | GroupSettlementData) => {
          if (this.isGroupExpenseData(expense)) {
            return expense.group_expense_id !== id;
          }
          return expense.group_settlement_id !== id;
        },
      );
      this.expenses.set(updatedExpenses);
      const updatedCombinedView = this.combinedView().filter(
        (
          item:
            | CombinedGroupMessage
            | CombinedGroupExpense
            | CombinedGroupSettlement,
        ) => {
          if (this.groupsService.isCombinedExpense(item)) {
            return item.group_expense_id !== id;
          } else if (this.groupsService.isCombinedSettlement(item)) {
            return item.group_settlement_id !== id;
          }
          return false;
        },
      );
      this.combinedView.set(updatedCombinedView);
      this.groupsService.groupMembers().forEach((member) => {
        if (member.group_membership_id === payerId) {
          member.balance_with_user = this.commonService.updateBalance(
            member.balance_with_user,
            debtAmount,
            false,
          );
          member.total_balance = this.commonService.updateBalance(
            member.total_balance,
            debtAmount,
            false,
          );
        }
        if (!this.isGroupExpenseData(expenseToDelete!)) {
          if (member.group_membership_id === expenseToDelete!.debtor_id) {
            member.balance_with_user = this.commonService.updateBalance(
              member.balance_with_user,
              parseFloat(expenseToDelete!.settlement_amount),
              true,
            );
            member.total_balance = this.commonService.updateBalance(
              member.total_balance,
              parseFloat(expenseToDelete!.settlement_amount),
              true,
            );
          }
        }
      });
      this.cdr.detectChanges();
    });
  }

  /**
   * Opens a dialog to update an existing expense. Passes the current expense data
   * to the dialog and updates the expense after it is modified.
   *
   * @param expense - The expense data to be updated
   */
  onUpdateExpense(expense: GroupExpenseData | GroupSettlementData) {
    const isExpense = this.isGroupExpenseData(expense);
    this.updateLoader.set(true);

    if (isExpense) {
      // Open a dialog to allow the user to update the expense. Pass the current expense data.
      const dialogRef = this.dialog.open(GroupsExpenseComponent, {
        data: [
          "Update Expense",
          expense,
        ],
        enterAnimationDuration: "200ms",
        exitAnimationDuration: "200ms",
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          this.updateLoader.set(false);
          return;
        }
        const result = data.formData;
  
        // Appending the original expense ID to the form data
        result.append("group_expense_id", expense.group_expense_id);
  
        // Call the service to update the expense on the server
        this.groupsService
          .updateExpense(
            this.selectedGroup()!.group_id,
            result,
          )
          .subscribe({
            next: (response: GroupExpenseResponse) => {
              const expenses = this.totalExpenses();
              const updatedExpense = response.data.expense;
              const expenseParticipants = response.data.expenseParticipants;
              // Reduce the above array to add the debtor_amount of each participant into a variable debtor_amount
              const totalDebtAmount = expenseParticipants.reduce((acc, val) => acc + parseFloat(val.debtor_amount), 0);
              updatedExpense.total_debt_amount = totalDebtAmount.toString();
              if (updatedExpense.payer_id === this.currentMember()?.group_membership_id) {
                updatedExpense.payer = this.commonService.getFullNameAndImage(this.currentMember());
                updatedExpense.user_debt = (parseFloat(updatedExpense.total_amount) - totalDebtAmount).toString();
              } else {
                const payer = this.groupsService.groupMembers().find((member) => updatedExpense.payer_id === member.group_membership_id);
                updatedExpense.payer = this.commonService.getFullNameAndImage(
                  payer
                );
                updatedExpense.user_debt = (expenseParticipants.find(
                  (participant) => participant.debtor_id === this.currentMember()?.group_membership_id)!.debtor_amount);
              }
              this.expenses.update((currExpenses) =>
                currExpenses.map((currExpense) => {
                  if (!this.isGroupExpenseData(currExpense)) {
                    return currExpense;
                  }
                  return currExpense.group_expense_id === updatedExpense.group_expense_id
                    ? updatedExpense
                    : currExpense;
                })
              );
              this.combinedView.update((currView) =>
                currView.map((item) => {
                  if (this.groupsService.isCombinedExpense(item)) {
                    return item.group_expense_id === updatedExpense.group_expense_id
                      ? { ...updatedExpense, type: "expense" }
                      : item;
                  } else {
                    return item;
                  };
                })
              );
              const oldAmount = parseFloat(
                updatedExpense.payer_id === this.currentMember()?.group_membership_id
                  ? expense.total_debt_amount
                  : expense.user_debt
              );
              const newAmount = parseFloat(
                updatedExpense.payer_id === this.currentMember()?.group_membership_id
                  ? updatedExpense.total_debt_amount
                  : updatedExpense.user_debt
              );
              this.selectedGroup()!.balance_amount = this.commonService.updateBalance(
                this.selectedGroup()!.balance_amount,
                newAmount - oldAmount,
                updatedExpense.payer_id === this.currentMember()?.group_membership_id
              );
              this.groupsService.groupMembers().forEach((member) => {
                if (member.group_membership_id === expense.payer_id) {
                  member.balance_with_user = this.commonService.updateBalance(
                    member.balance_with_user,
                    newAmount - oldAmount,
                    true,
                  );
                  member.total_balance = this.commonService.updateBalance(
                    member.total_balance,
                    newAmount - oldAmount,
                    true,
                  );
                }
              });
              const updatedExpenses = expenses.map((expenseData) => {
                if (!this.isGroupExpenseData(expenseData)) {
                  return expenseData;
                }
                return expenseData.group_expense_id === expense.group_expense_id
                  ? updatedExpense
                  : expenseData;
              });
              this.totalExpenses.set(updatedExpenses);
              this.updateLoader.set(false);
              this.toastr.success("Expense Updated successfully", "Success");
            },
            error: () => this.updateLoader.set(false),
          });
        // const balanceAmount = parseFloat(this.selectedGroup()!.balance_amount);
        this.groupsService.groupInvites().forEach((invite) => {
          if (invite.group_id === this.selectedGroup()!.group_id) {
            invite.balance_amount = this.selectedGroup()!.balance_amount;
          }
        });
        this.groupsService.groups().forEach((group) => {
          if (group.group_id === this.selectedGroup()!.group_id) {
            group.balance_amount = this.selectedGroup()!.balance_amount;
          }
        });
        this.cdr.detectChanges();
      });
    } else {
      const dialogRef = this.dialog.open(GroupsSettlementComponent, {
        data: {
          payerName: expense.payer.fullName,
          payerImage: expense.payer.imageUrl,
          debtorName: expense.debtor.fullName,
          debtorImage: expense.debtor.imageUrl,
          totalAmount: expense.settlement_amount
        },
        enterAnimationDuration: "200ms",
        exitAnimationDuration: "200ms",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (!result) {
          this.updateLoader.set(false);
          return;
        }
      });
    }
  }

  /**
   * Generates a PDF report of all expenses and settlements, formatted into a table with relevant details.
   *
   * Dependencies:
   * - jsPDF: For creating the PDF document.
   * - autoTable: For rendering the table in the PDF document.
   */
  downloadExpenses() {
    const doc = new jsPDF();

    // Define the columns for the table (these will be used as headers)
    const columns = [
      { header: "Date", dataKey: "date" },
      { header: "Expense Name", dataKey: "name" },
      { header: "Total Amount", dataKey: "amount" },
      { header: "Payer Name", dataKey: "payer" },
      { header: "Split Type", dataKey: "splitType" },
      { header: "Debt Amount", dataKey: "debtAmount" },
      { header: "Description", dataKey: "description" },
    ];

    // Map through the totalExpenses and transform the data into a format compatible with the table
    const extractedExpense = this.totalExpenses().map((expense) => {
      if (this.isGroupExpenseData(expense)) {
        return {
          date: this.datePipe.transform(expense.createdAt, "d MMM y"),
          name: expense.expense_name,
          amount: expense.total_amount,
          payer: expense.payer.fullName,
          splitType: expense.split_type,
          debtAmount: expense.total_debt_amount,
          description: expense.description ?? "--",
        };
      }
      return {
        date: this.datePipe.transform(expense.createdAt, "d MMM y"),
        name: "Settlement",
        amount: expense.settlement_amount,
        payer: expense.payer.fullName,
        splitType: "--",
        debtAmount: expense.settlement_amount,
        description: expense.description ?? "--",
      };
    });

    // Convert the array of objects (expenses) into array of arrays for the autoTable body
    const body = extractedExpense.map((expense) => Object.values(expense));

    // Generate the table in the PDF using the autoTable
    autoTable(doc, {
      head: [ columns.map((col) => col.header) ],
      body,
    });

    // Save the generated PDF with the filename 'group_expense_report.pdf'
    doc.save("group_expense_report.pdf");
  }

  /**
   * Closes the dialog without passing any result.
   *
   * This method is called when the user clicks the "Cancel" button in the dialog.
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  // Type guard to differentiate between GroupExpenseData and GroupSettlementData
  isGroupExpenseData(
    expense: GroupExpenseData | GroupSettlementData,
  ): expense is GroupExpenseData {
    return (expense as GroupExpenseData).group_expense_id !== undefined;
  }
}
