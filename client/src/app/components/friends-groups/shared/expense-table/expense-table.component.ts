import { DatePipe } from "@angular/common";
import { Component, input, output, SimpleChanges } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

import { ExpenseData } from "../../friends/friend.model";
import { GroupExpenseData, GroupSettlementData } from "../../groups/groups.model";


type ExpenseType = ExpenseData | GroupExpenseData | GroupSettlementData
@Component({
  selector: "app-expense-table",
  standalone: true,
  imports: [ MatIconModule, MatButtonModule, DatePipe, MatTooltipModule ],
  templateUrl: "./expense-table.component.html",
  styleUrls: [ "./expense-table.component.css" ],
})
export class ExpenseTableComponent {
  expenses = input<ExpenseType[]>(); // Array of ExpenseData or GroupExpenseData
  loading = input<boolean>(false); // Input for loading state
  updateLoader = input<boolean>(false); // Input for loading state while updating
  deleteLoader = input<boolean>(false); // Input for loading state while deleting
  updateExpenseFriends = output<ExpenseType>(); // Event for updating expense
  updateExpenseGroups = output<ExpenseType>();
  deleteExpense = output<{
    id: string;
    payerId: string;
    debtorAmount: string;
  }>(); // Event for deleting expense
  downloadExpenses = output<void>(); // Event for downloading expenses
  cancel = output<void>(); // Event for closing the modal

  // Object to store loading state for each expense
  expenseLoadingState: Record<string, { update: boolean; delete: boolean }> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["updateLoader"] && !changes["updateLoader"].firstChange) {
      this.resetExpenseLoadingState(this.updateLoader(), "update");
    }
    if (changes["deleteLoader"] && !changes["deleteLoader"].firstChange) {
      this.resetExpenseLoadingState(this.deleteLoader(), "delete");
    }
  }

  // Method to reset the loading state for specific actions
  private resetExpenseLoadingState(loader: boolean, action: "update" | "delete") {
    if (!loader) {
      // Reset loading state for expenses that are marked as loading
      for (let expenseId in this.expenseLoadingState) {
        if (Object.hasOwn(this.expenseLoadingState, expenseId)) {
          this.expenseLoadingState[expenseId][action] = false;
        }
      }
    }
  }

  onUpdateExpense(expense: ExpenseType) {
    if (this.isExpenseData(expense)) {
      this.updateExpenseFriends.emit(expense);
      this.expenseLoadingState[expense.friend_expense_id] = { ...this.expenseLoadingState[expense.friend_expense_id], update: true };
    } else if (this.isGroupExpenseData(expense)) {
      this.updateExpenseGroups.emit(expense);
      this.expenseLoadingState[expense.group_expense_id] = { ...this.expenseLoadingState[expense.group_expense_id], update: true };
    } else {
      this.updateExpenseGroups.emit(expense);
      this.expenseLoadingState[expense.group_settlement_id] = { ...this.expenseLoadingState[expense.group_settlement_id], update: true };
    }
  }

  onDeleteExpense(expense: ExpenseType) {
    if (this.isExpenseData(expense)) {
      this.expenseLoadingState[expense.friend_expense_id] = { ...this.expenseLoadingState[expense.friend_expense_id], delete: true };
      this.deleteExpense.emit({
        id: expense.friend_expense_id,
        payerId: expense.payer_id,
        debtorAmount: expense.debtor_amount,
      });
    } else if (this.isGroupExpenseData(expense)) {
      this.expenseLoadingState[expense.group_expense_id] = { ...this.expenseLoadingState[expense.group_expense_id], delete: true };
      this.deleteExpense.emit({
        id: expense.group_expense_id,
        payerId: expense.payer_id,
        debtorAmount: expense.user_debt,
      });
    } else {
      this.expenseLoadingState[expense.group_settlement_id] = { ...this.expenseLoadingState[expense.group_settlement_id], delete: true };
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

  // Check if the expense is loading for a specific action
  isUpdateLoading(expense: ExpenseType): boolean {
    if (this.isGroupExpenseData(expense)) {
      return this.expenseLoadingState[expense.group_expense_id]?.update ?? false;
    }
    if (this.isExpenseData(expense)) {
      return this.expenseLoadingState[expense.friend_expense_id]?.update ?? false;
    }
    return false;
  }

  isDeleteLoading(expense: ExpenseType): boolean {
    if (this.isExpenseData(expense)) {
      return this.expenseLoadingState[expense.friend_expense_id]?.delete ?? false;
    } else if (this.isGroupExpenseData(expense)) {
      return this.expenseLoadingState[expense.group_expense_id]?.delete ?? false;
    } else {
      return this.expenseLoadingState[expense.group_settlement_id]?.delete ?? false;
    }
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
