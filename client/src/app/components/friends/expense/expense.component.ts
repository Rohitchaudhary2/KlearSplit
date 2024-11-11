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

  isCurrentUserPayer(): boolean {
    return this.expense()?.payer_id === this.currentUserId();
  }

  startsWithAdding(expense_id: string): boolean {
    return /^adding/.test(expense_id);
  }

  startsWithError(expense_id: string): boolean {
    return /^error/.test(expense_id);
  }

  startsWithRetry(expense_id: string): boolean {
    return /^retry/.test(expense_id);
  }

  onRetryExpenseAddition(id: string) {
    this.onRetry.emit(id);
  }
}
