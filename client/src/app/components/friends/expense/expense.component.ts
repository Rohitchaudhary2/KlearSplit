import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

interface Expense {
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

  isCurrentUserPayer(): boolean {
    return this.expense()?.payer_id === this.currentUserId();
  }
}
