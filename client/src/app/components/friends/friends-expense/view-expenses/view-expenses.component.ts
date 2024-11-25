import { DatePipe } from "@angular/common";
import { Component, inject, OnInit, output, signal } from "@angular/core";
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

import { ConfirmationDialogComponent } from "../../../confirmation-dialog/confirmation-dialog.component";
import { ExpenseData, ExpenseResponse } from "../../friend.model";
import { FriendsService } from "../../friends.service";
import { FriendsExpenseComponent } from "../friends-expense.component";

@Component({
  selector: "app-view-expenses",
  standalone: true,
  imports: [ MatIconModule, MatButtonModule, DatePipe ],
  templateUrl: "./view-expenses.component.html",
  styleUrl: "./view-expenses.component.css",
  providers: [ DatePipe ],
})

/**
 * The `ViewExpensesComponent` is responsible for displaying and managing the expenses
 * between users in a specific conversation. It fetches the list of expenses related
 * to a selected user and provides options to update or delete those expenses.
 */
export class ViewExpensesComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ViewExpensesComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly friendsService = inject(FriendsService);

  user = this.data[0]; // Logged in user
  selectedUser = this.data[1]; // Friend associated in expenses

  totalExpenses = signal<ExpenseData[] | []>([]);

  // A boolean flag to track the loading state while fetching expenses
  loading = false;

  updateLoader = "";

  // Output signal that will emit the expense data when an expense is deleted.
  expenseDeleted = output<{
    id: string;
    payerId: string;
    debtorAmount: string;
  }>();

  // Output signal that will emit updated expenses data when an expense is updated
  updatedExpense = output<{
    expenses: ExpenseData[];
    updatedExpense: ExpenseData;
  }>();

  constructor(private readonly datePipe: DatePipe) {}

  /**
   * `ngOnInit` lifecycle hook. This method is called when the component is initialized.
   * It starts by setting the `loading` flag to true, then fetches all the expenses
   * for the selected user via the `friendsService`. The expenses are then set in the
   * `totalExpenses` signal and the loading flag is set to false once the data is fetched.
   */
  ngOnInit() {
    this.loading = true;
    this.friendsService
      .fetchAllExpenses(this.selectedUser.conversation_id)
      .subscribe({
        next: (expenses) => {
          this.totalExpenses.set(expenses);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
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
  onDeleteExpense(id: string, payerId: string, debtorAmount: string) {
    // Open a confirmation dialog to ask the user if they are sure they want to delete the expense
    const confirmationDialogRef = this.dialog.open(
      ConfirmationDialogComponent,
      {
        data: "Are you sure you want to delete this expense?",
      },
    );

    confirmationDialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      // API call to back-end to delete the expense
      this.friendsService
        .deleteExpense(this.selectedUser.conversation_id, id)
        .subscribe({
          next: () => {
            const updatedExpenses = this.totalExpenses().filter(
              (expense: ExpenseData) => expense.friend_expense_id !== id,
            );
            this.totalExpenses.set(updatedExpenses);
            this.toastr.success("Expense Deleted successfully", "Success");
          },
        });
      this.expenseDeleted.emit({ id, payerId, debtorAmount });
    });
  }

  /**
   * Opens a dialog to update an existing expense. Passes the current expense data
   * to the dialog and updates the expense after it is modified.
   *
   * @param expense - The expense data to be updated
   */
  onUpdateExpense(expense: ExpenseData) {
    // Open a dialog to allow the user to update the expense. Pass the current expense data.
    const dialogRef = this.dialog.open(FriendsExpenseComponent, {
      data: [ "Update Expense", expense, this.user, this.selectedUser ],
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "200ms",
    });
    dialogRef.afterClosed().subscribe((data) => {
      const result = data.formData;
      if (!result) {
        return;
      }

      // Appending the original expense ID to the form data
      result.append("friend_expense_id", expense.friend_expense_id);

      // Call the service to update the expense on the server
      this.friendsService
        .updateExpense(this.selectedUser.conversation_id, result)
        .subscribe({
          next: (response: ExpenseResponse) => {
            const expenses = this.totalExpenses();
            const updatedExpenses = expenses.map((expenseData) => {
              return expenseData.friend_expense_id === expense.friend_expense_id
                ? response.data
                : expenseData;
            });
            this.totalExpenses.set(updatedExpenses);
            this.updatedExpense.emit({
              expenses: this.totalExpenses(),
              updatedExpense: response.data,
            });
            this.toastr.success("Expense Updated successfully", "Success");
          },
        });
    });
  }

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
    const extractedExpense = this.totalExpenses().map((expense) => ({
      date: this.datePipe.transform(expense.createdAt, "d MMM y"),
      name: expense.expense_name,
      amount: expense.total_amount,
      payer: expense.payer,
      splitType: expense.split_type,
      debtAmount: expense.debtor_amount,
      description: expense.description,
    }));

    // Convert the array of objects (expenses) into array of arrays for the autoTable body
    const body = extractedExpense.map((expense) => Object.values(expense));

    // Generate the table in the PDF using the autoTable
    autoTable(doc, {
      head: [ columns.map((col) => col.header) ],
      body,
    });

    // Save the generated PDF with the filename 'expense_report.pdf'
    doc.save("expense_report.pdf");
  }

  /**
   * Closes the dialog without passing any result.
   *
   * This method is called when the user clicks the "Cancel" button in the dialog.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
