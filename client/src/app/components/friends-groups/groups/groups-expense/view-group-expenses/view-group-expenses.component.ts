import { DatePipe } from "@angular/common";
import { Component, inject, OnInit, output, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { GroupExpenseData, GroupSettlementData } from "../../../groups/groups.model";
import { ExpenseTableComponent } from "../../../shared/expense-table/expense-table.component";
import { FriendsGroupsService } from "../../../shared/friends-groups.service";
import { GroupsService } from "../../groups.service";

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

  user = this.data[0]; // Logged in user
  selectedGroup = this.data[1]; // Friend associated in expenses

  totalExpenses = signal<(GroupExpenseData | GroupSettlementData)[] | []>([]);

  // A boolean flag to track the loading state while fetching expenses
  loading = signal(false);

  updateLoader = "";

  // Output signal that will emit the expense data when an expense is deleted.
  expenseDeleted = output<{
    id: string;
    payerId: string;
    debtorAmount: string;
  }>();

  // Output signal that will emit updated expenses data when an expense is updated
  updatedExpense = output<{
    expenses: GroupExpenseData[];
    updatedExpense: GroupExpenseData;
  }>();

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
      .fetchAllExpensesAndSettlements(this.selectedGroup.group_id)
      .subscribe({
        next: (expenses) => {
          expenses.forEach((expense) => {
            const payer = this.groupsService.groupMembers().find((member) => member.group_membership_id === expense.payer_id);
            expense.payer = this.commonService.getFullNameAndImage(payer);
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
  // onDeleteExpense({ id, payerId, debtorAmount }: ExpenseDeletedEvent) {
  //   // Open a confirmation dialog to ask the user if they are sure they want to delete the expense
  //   const confirmationDialogRef = this.dialog.open(
  //     ConfirmationDialogComponent,
  //     {
  //       data: "Are you sure you want to delete this expense?",
  //     },
  //   );

  //   confirmationDialogRef.afterClosed().subscribe((result) => {
  //     if (!result) {
  //       return;
  //     }

  //     // API call to back-end to delete the expense
  //     this.groupsService
  //       .deleteExpense(this.selectedGroup.conversation_id, id)
  //       .subscribe({
  //         next: () => {
  //           const updatedExpenses = this.totalExpenses().filter(
  //             (expense: GroupExpenseData) => expense.group_expense_id !== id,
  //           );
  //           this.totalExpenses.set(updatedExpenses);
  //           this.toastr.success("Expense Deleted successfully", "Success");
  //         },
  //       });
  //     this.expenseDeleted.emit({ id, payerId, debtorAmount });
  //   });
  // }

  /**
   * Opens a dialog to update an existing expense. Passes the current expense data
   * to the dialog and updates the expense after it is modified.
   *
   * @param expense - The expense data to be updated
   */
  // onUpdateExpense(expense: GroupExpenseData) {
  //   // Open a dialog to allow the user to update the expense. Pass the current expense data.
  //   const dialogRef = this.dialog.open(FriendsExpenseComponent, {
  //     data: [ "Update Expense", expense, this.user, this.selectedGroup ],
  //     enterAnimationDuration: "200ms",
  //     exitAnimationDuration: "200ms",
  //   });
  //   dialogRef.afterClosed().subscribe((data) => {
  //     if (!data) {
  //       return;
  //     }
  //     const result = data.formData;

  //     // Appending the original expense ID to the form data
  //     result.append("friend_expense_id", expense.friend_expense_id);

  //     // Call the service to update the expense on the server
  //     this.friendsService
  //       .updateExpense(this.selectedGroup.conversation_id, result)
  //       .subscribe({
  //         next: (response: ExpenseResponse) => {
  //           const expenses = this.totalExpenses();
  //           const updatedExpenses = expenses.map((expenseData) => {
  //             return expenseData.friend_expense_id === expense.friend_expense_id
  //               ? response.data
  //               : expenseData;
  //           });
  //           this.totalExpenses.set(updatedExpenses);
  //           this.updatedExpense.emit({
  //             expenses: this.totalExpenses(),
  //             updatedExpense: response.data,
  //           });
  //           this.toastr.success("Expense Updated successfully", "Success");
  //         },
  //       });
  //   });
  // }

  /**
   * Generates a PDF report of all expenses, formatted into a table with relevant details.
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

    // Save the generated PDF with the filename 'expense_report.pdf'
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

  // Type guard to differentiate between ExpenseData and GroupExpenseData
  isGroupExpenseData(expense: GroupExpenseData | GroupSettlementData): expense is GroupExpenseData {
    return (expense as GroupExpenseData).group_expense_id !== undefined;
  }
}
