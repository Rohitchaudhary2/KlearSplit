import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-friends-expense',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './friends-expense.component.html',
  styleUrl: './friends-expense.component.css',
})
export class FriendsExpenseComponent implements OnInit {
  dialogRef = inject(MatDialogRef<FriendsExpenseComponent>);
  data = inject(MAT_DIALOG_DATA);
  showAdditionalFields = signal<boolean>(false);
  participants = [this.data[0], this.data[1].friend];
  participant1_share = 0;
  participant2_share = 0;

  form = new FormGroup({
    expense_name: new FormControl('', {
      validators: [Validators.required],
    }),
    total_amount: new FormControl('', {
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      validators: [Validators.maxLength(150)],
    }),
    payer_id: new FormControl('', {
      validators: [Validators.required],
    }),
    split_type: new FormControl<'EQUAL' | 'UNEQUAL' | 'PERCENTAGE'>('EQUAL', {
      validators: [Validators.required],
    }),
    receipt: new FormControl<File | null>(null),
  });

  ngOnInit(): void {
    this.form.get('split_type')!.valueChanges.subscribe((value) => {
      this.showAdditionalFields.set(
        value === 'UNEQUAL' || value === 'PERCENTAGE',
      );
    });
  }

  selectImage(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.form.value.receipt = file;
    }
  }

  onAdd(): void {
    if (this.form.valid) {
      let debtor_share;
      if (
        this.form.value.split_type === 'UNEQUAL' ||
        this.form.value.split_type === 'PERCENTAGE'
      ) {
        debtor_share =
          this.form.value.payer_id === this.participants[0].user_id
            ? this.participant2_share
            : this.participant1_share;
      }
      const debtor_id =
        this.form.value.payer_id === this.participants[0].user_id
          ? this.participants[1].user_id
          : this.participants[0].user_id;
      this.dialogRef.close({ ...this.form.value, debtor_share, debtor_id });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
