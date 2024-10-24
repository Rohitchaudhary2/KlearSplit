import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { API_URLS } from '../../../../constants/api-urls';
import { ExpenseData } from '../../friend.model';

@Component({
  selector: 'app-view-expenses',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, DatePipe],
  templateUrl: './view-expenses.component.html',
  styleUrl: './view-expenses.component.css',
})
export class ViewExpensesComponent {
  dialogRef = inject(MatDialogRef<ViewExpensesComponent>);
  data = inject(MAT_DIALOG_DATA);
  expenses = signal(this.data[0]);
  conversation_id = this.data[1];

  private httpClient = inject(HttpClient);
  private readonly deleteExpensesUrl = API_URLS.deleteExpense;

  onDeleteExpense(id: string) {
    this.httpClient
      .delete(`${this.deleteExpensesUrl}/${this.conversation_id}`, {
        body: { friend_expense_id: id },
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          const updatedExpenses = this.expenses().filter(
            (expense: ExpenseData) => expense.friend_expense_id !== id,
          );
          this.expenses.set(updatedExpenses);
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
