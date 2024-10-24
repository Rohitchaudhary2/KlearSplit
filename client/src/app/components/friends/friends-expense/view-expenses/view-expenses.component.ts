import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseData } from '../../friend.model';
import { FriendsService } from '../../friends.service';

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
  friendsService = inject(FriendsService);

  onDeleteExpense(id: string) {
    this.friendsService.deleteExpense(this.conversation_id, id).subscribe({
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
