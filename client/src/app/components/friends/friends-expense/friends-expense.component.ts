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
import { SplitTypeComponent } from './split-type/split-type.component';
import { FormErrorMessageService } from '../../shared/form-error-message.service';

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
  private formErrorMessages = inject(FormErrorMessageService);
  dialogRef = inject(MatDialogRef<FriendsExpenseComponent>);
  data = inject(MAT_DIALOG_DATA);
  showAdditionalFields = signal<boolean>(false);
  participants = [this.data[0], this.data[1].friend];
  private dialog = inject(MatDialog);
  imageName = signal<string>('Upload Bill Receipt');
  splitType = 'EQUAL';

  form = new FormGroup({
    expense_name: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    total_amount: new FormControl('', {
      validators: [
        Validators.required,
        Validators.min(0.1),
        Validators.max(999999999999.99),
      ],
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

  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

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

    this.dialogRef.updateSize('30%');
  }

  trimInput(controlName: string) {
    const control = this.form.get(controlName);
    if (control) {
      const trimmedValue = control.value.trim();
      control.setValue(trimmedValue, { emitEvent: false });
    }
  }

  selectImage(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.form.get('receipt')?.setValue(file);
      this.imageName.set(file.name);
    }
  }

  // onAdd(): void {
  //   if (this.form.value.split_type === 'EQUAL') {
  //     this.form
  //       .get('participant1_share')
  //       ?.setValue(
  //         JSON.stringify(parseFloat(this.form.value.total_amount!) / 2),
  //       );
  //     this.form
  //       .get('participant2_share')
  //       ?.setValue(
  //         JSON.stringify(parseFloat(this.form.value.total_amount!) / 2),
  //       );
  //   }
  //   if (this.form.valid) {
  //     let debtor_share;
  //     if (
  //       this.form.value.split_type === 'UNEQUAL' ||
  //       this.form.value.split_type === 'PERCENTAGE'
  //     ) {
  //       debtor_share =
  //         this.form.value.payer_id === this.participants[0].user_id
  //           ? this.form.value.participant2_share
  //           : this.form.value.participant1_share;
  //     }
  //     const debtor_id =
  //       this.form.value.payer_id === this.participants[0].user_id
  //         ? this.participants[1].user_id
  //         : this.participants[0].user_id;
  //     this.dialogRef.close({ ...this.form.value, debtor_share, debtor_id });
  //   }
  // }

  onAdd(): void {
    if (this.form.value.split_type === 'EQUAL') {
      this.form
        .get('participant1_share')
        ?.setValue(
          JSON.stringify(parseFloat(this.form.value.total_amount!) / 2),
        );
      this.form
        .get('participant2_share')
        ?.setValue(
          JSON.stringify(parseFloat(this.form.value.total_amount!) / 2),
        );
    }
    if (this.form.valid) {
      const formData = new FormData();
      formData.append(
        'expense_name',
        this.form.get('expense_name')?.value as string,
      );
      formData.append(
        'total_amount',
        this.form.get('total_amount')?.value as string,
      );
      if (this.form.get('description')?.value)
        formData.append(
          'description',
          this.form.get('description')?.value as string,
        );
      formData.append(
        'split_type',
        this.form.get('split_type')?.value as string,
      );
      formData.append('payer_id', this.form.get('payer_id')?.value as string);
      formData.append(
        'participant1_share',
        this.form.get('participant1_share')?.value as string,
      );
      formData.append(
        'participant2_share',
        this.form.get('participant2_share')?.value as string,
      );
      if (this.form.get('receipt')?.value)
        formData.append('receipt', this.form.get('receipt')?.value as File);

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

      formData.append('debtor_share', debtor_share as string);
      formData.append('debtor_id', debtor_id as string);
      this.dialogRef.close(formData);
    }
  }

  getPayerName() {
    const id = this.form.value.payer_id;
    if (id === this.participants[0].user_id) return 'you';
    else
      return `${this.participants[1].first_name}${this.participants[1].last_name ? ` ${this.participants[1].last_name}` : ''}`;
  }

  openPayerDialog(): void {
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
        this.form.get('payer_id')?.setValue(result.id);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  openSplitTypeDialog(): void {
    const dialogRef = this.dialog.open(SplitTypeComponent, {
      panelClass: 'second-dialog',
      width: '30%',
      data: [this.participants, this.form.value.total_amount],
      position: {
        right: '7%', // Adjust as needed
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.splitType =
          result.split_type !== 'PERCENTAGE' ? result.split_type : 'PERCENT';
        this.form.get('split_type')?.setValue(result.split_type);
        this.form
          .get('participant1_share')
          ?.setValue(JSON.stringify(result.participant1_share));
        this.form
          .get('participant2_share')
          ?.setValue(JSON.stringify(result.participant2_share));
      }
    });
  }
}
