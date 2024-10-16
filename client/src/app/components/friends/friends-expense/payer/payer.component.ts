import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-payer',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './payer.component.html',
  styleUrl: './payer.component.css',
})
export class PayerComponent implements OnInit {
  dialogRef = inject(MatDialogRef<PayerComponent>);
  participants = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.dialogRef.updateSize('25%', '65%');
  }

  sendPayer(id: string) {
    this.dialogRef.close({ id });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
