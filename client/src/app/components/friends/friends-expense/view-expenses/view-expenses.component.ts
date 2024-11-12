import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseData, ExpenseResponse } from '../../friend.model';
import { FriendsService } from '../../friends.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FriendsExpenseComponent } from '../friends-expense.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-view-expenses',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, DatePipe],
  templateUrl: './view-expenses.component.html',
  styleUrl: './view-expenses.component.css',
})
export class ViewExpensesComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ViewExpensesComponent>);
  data = inject(MAT_DIALOG_DATA);
  expenses = signal(this.data[0]);
  user = this.data[1];
  selectedUser = this.data[2];
  private friendsService = inject(FriendsService);
  expenseDeleted = output<{
    id: string;
    payer_id: string;
    debtor_amount: string;
  }>();
  totalExpenses = signal<ExpenseData[] | []>([]);
  loading = false;
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);

  ngOnInit() {
    this.loading = true;
    this.friendsService
      .fetchAllExpenses(this.selectedUser.conversation_id)
      .subscribe({
        next: (expenses) => {
          this.totalExpenses.set(expenses);
          this.loading = false;
        },
      });
  }

  onDeleteExpense(id: string, payer_id: string, debtor_amount: string) {
    this.friendsService
      .deleteExpense(this.selectedUser.conversation_id, id)
      .subscribe({
        next: () => {
          const updatedExpenses = this.totalExpenses().filter(
            (expense: ExpenseData) => expense.friend_expense_id !== id,
          );
          this.totalExpenses.set(updatedExpenses);
        },
      });
    this.expenseDeleted.emit({ id, payer_id, debtor_amount });
  }

  onUpdateExpense(expense: ExpenseData) {
    const dialogRef = this.dialog.open(FriendsExpenseComponent, {
      data: ['Update Expense', expense, this.user, this.selectedUser],
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
    });
    dialogRef.afterClosed().subscribe((data) => {
      const result = data.formData;
      if (result) {
        this.friendsService
          .updateExpense(this.selectedUser.conversation_id, result)
          .subscribe({
            next: (response: ExpenseResponse) => {
              const expenses = this.totalExpenses();
              const updatedExpenses = expenses.map((expenseData) => {
                return expenseData.friend_expense_id ===
                  expense.friend_expense_id
                  ? response.data
                  : expenseData;
              });
              this.totalExpenses.set(updatedExpenses);
              this.toastr.success('Expense Updated successfully', 'Success');
            },
          });
      }
    });
  }

  downloadExpenses() {
    const doc = new jsPDF();

    const columns = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Expense Name', dataKey: 'name' },
      { header: 'Total Amount', dataKey: 'amount' },
      { header: 'Payer Name', dataKey: 'payer' },
      { header: 'Split Type', dataKey: 'splitType' },
      { header: 'Debt Amount', dataKey: 'debtAmount' },
      { header: 'Description', dataKey: 'description' },
    ];

    function formatCustomDate(dateString: string): string {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };

      // Format the date and replace the comma for the desired format
      return date.toLocaleDateString('en-GB', options).replace(',', '');
    }

    const ExtractedExpense = this.totalExpenses().map((expense) => ({
      date: formatCustomDate(expense.createdAt),
      name: expense.expense_name,
      amount: expense.total_amount,
      payer: expense.payer,
      splitType: expense.split_type,
      debtAmount: expense.debtor_amount,
      description: expense.description,
    }));

    const body = ExtractedExpense.map((expense) => Object.values(expense));

    // Use autoTable to generate the table in the PDF
    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body,
    });

    doc.save('expense_report.pdf');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
