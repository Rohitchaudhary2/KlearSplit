import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-view-expenses',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, DatePipe],
  templateUrl: './view-expenses.component.html',
  styleUrl: './view-expenses.component.css',
})
export class ViewExpensesComponent {
  dialogRef = inject(MatDialogRef<ViewExpensesComponent>);
  expenses = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close();
  }
}
