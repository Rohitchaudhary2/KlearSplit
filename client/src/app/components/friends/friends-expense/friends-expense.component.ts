import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgClass } from '@angular/common';
import { PayerComponent } from './payer/payer.component';

@Component({
  selector: 'app-friends-expense',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    NgClass,
  ],
  templateUrl: './friends-expense.component.html',
  styleUrl: './friends-expense.component.css',
})
export class FriendsExpenseComponent implements OnInit {
  dialogRef = inject(MatDialogRef<FriendsExpenseComponent>);
  data = inject(MAT_DIALOG_DATA);
  showAdditionalFields = signal<boolean>(false);
  participants = [this.data[0], this.data[1].friend];
  private dialog = inject(MatDialog);

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
    payer_id: new FormControl(`${this.participants[0].user_id}`, {
      validators: [Validators.required],
    }),
    participant1_share: new FormControl(''),
    participant2_share: new FormControl(''),
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
      if (this.showAdditionalFields()) {
        this.form
          .get('participant1_share')
          ?.setValidators([Validators.required]);
        this.form
          .get('participant2_share')
          ?.setValidators([Validators.required]);
      } else {
        this.form.get('participant1_share')?.clearValidators();
        this.form.get('participant2_share')?.clearValidators();
      }
      this.form.get('participant1_share')?.updateValueAndValidity();
      this.form.get('participant2_share')?.updateValueAndValidity();
    });

    this.dialogRef.updateSize('30%', '65%');
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
            ? this.form.value.participant2_share
            : this.form.value.participant1_share;
      }
      const debtor_id =
        this.form.value.payer_id === this.participants[0].user_id
          ? this.participants[1].user_id
          : this.participants[0].user_id;
      this.dialogRef.close({ ...this.form.value, debtor_share, debtor_id });
    }
  }

  getPayerName() {
    const id = this.form.value.payer_id;
    if (id === this.participants[0].user_id) return 'you';
    else
      return `${this.participants[1].first_name} ${this.participants[1].last_name[0]}.`;
  }

  openSecondDialog(): void {
    const dialogRef = this.dialog.open(PayerComponent, {
      panelClass: 'second-dialog',
      width: '30%',
      data: this.participants,
      position: {
        right: '7%', // Adjust as needed
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.form.value.payer_id = result.id;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
