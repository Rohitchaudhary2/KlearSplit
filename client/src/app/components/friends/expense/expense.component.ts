import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';

interface Expense {
  expense_id: string;
  expense_name: string;
  total_amount: string;
  debtor_amount: string;
  payer_id: string;
}

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [NgClass],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.css',
})
export class ExpenseComponent {
  expense = input<Expense>();
  currentUserId = input<string>();
  friendImageUrl = input<string>();
  friendName = input<string>();
  currentUserImageUrl = input<string>();
  onRetry = output<string>();

  /**
   * Checks if the current user is the payer for the given expense.
   *
   * @returns {boolean} - Returns true if the current user is the payer; otherwise, false.
   */
  isCurrentUserPayer(): boolean {
    return this.expense()?.payer_id === this.currentUserId();
  }

  /**
   * Checks if the given expense ID starts with a specific prefix.
   *
   * @param expense_id The ID of the expense to check.
   * @param prefix The prefix to check for in the expense ID.
   * @returns {boolean} - Returns true if the expense ID starts with the specified prefix, otherwise false.
   */
  startsWithPrefix(expense_id: string, prefix: string): boolean {
    return expense_id.startsWith(prefix);
  }

  /**
   * Emits an event to retry the addition of an expense to friends-expense component.
   *
   * @param id The ID of the expense to retry.
   */
  onRetryExpenseAddition(id: string) {
    this.onRetry.emit(id);
  }
}
