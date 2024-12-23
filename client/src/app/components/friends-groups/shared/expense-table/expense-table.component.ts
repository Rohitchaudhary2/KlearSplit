import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { ExpenseData } from "../../friends/friend.model";
import { GroupExpenseData, GroupSettlementData } from "../../groups/groups.model";


type ExpenseType = ExpenseData | GroupExpenseData | GroupSettlementData
@Component({
  selector: "app-expense-table",
  standalone: true,
  imports: [ MatIconModule, MatButtonModule, DatePipe ],
  templateUrl: "./expense-table.component.html",
  styleUrls: [ "./expense-table.component.css" ],
})
export class ExpenseTableComponent {
  expenses = input<ExpenseType[]>(); // Array of ExpenseData or GroupExpenseData
  loading = input<boolean>(false); // Input for loading state
  updateExpense = output<ExpenseType>(); // Event for updating expense
  deleteExpense = output<{
    id: string;
    payerId: string;
    debtorAmount: string;
  }>(); // Event for deleting expense
  downloadExpenses = output<void>(); // Event for downloading expenses
  cancel = output<void>(); // Event for closing the modal

  onUpdateExpense(expense: ExpenseType) {
    this.updateExpense.emit(expense);
  }

  onDeleteExpense(expense: ExpenseType) {
    if (this.isExpenseData(expense)) {
      this.deleteExpense.emit({
        id: expense.friend_expense_id,
        payerId: expense.payer_id,
        debtorAmount: expense.debtor_amount,
      });
    } else if (this.isGroupExpenseData(expense)) {
      this.deleteExpense.emit({
        id: expense.group_expense_id,
        payerId: expense.payer_id,
        debtorAmount: expense.user_debt,
      });
    } else {
      this.deleteExpense.emit({
        id: expense.group_settlement_id,
        payerId: expense.payer_id,
        debtorAmount: expense.settlement_amount,
      });
    }
  }

  onDownloadExpenses() {
    this.downloadExpenses.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  // Type guard to differentiate between ExpenseData, GroupExpenseData, and GroupSettlementData
  isExpenseData(expense: ExpenseType): expense is ExpenseData {
    return (expense as ExpenseData).friend_expense_id !== undefined;
  }

  // Type guard to differentiate between ExpenseData, GroupExpenseData, and GroupSettlementData
  isGroupExpenseData(expense: ExpenseType): expense is GroupExpenseData {
    return (expense as GroupExpenseData).group_expense_id !== undefined;
  }
}
