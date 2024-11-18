import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormErrorMessageService } from '../../../shared/form-error-message.service';

function amountRangeValidator(totalAmount: number): ValidatorFn {
  return (control: AbstractControl): { outOfRange: { max: number } } | null => {
    const value = control.value;
    if (value === null || value === '') {
      return null; // No error if the control is empty
    }
    const isInvalid = value <= 0 || value > totalAmount;
    return isInvalid ? { outOfRange: { max: totalAmount } } : null;
  };
}

@Component({
  selector: 'app-settlement',
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './settlement.component.html',
  styleUrl: './settlement.component.css',
})
export class SettlementComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SettlementComponent>);
  formErrorMessages = inject(FormErrorMessageService);

  payer_name: string;
  debtor_name: string;
  total_amount: string;
  payer_image: string;
  debtor_image: string;

  constructor() {
    const data = inject(MAT_DIALOG_DATA);
    ({
      payer_name: this.payer_name,
      debtor_name: this.debtor_name,
      total_amount: this.total_amount,
      debtor_image: this.debtor_image,
      payer_image: this.payer_image,
    } = data);
  }

  form: FormGroup = new FormGroup({});

  ngOnInit() {
    this.form = new FormGroup({
      settlement_amount: new FormControl(this.total_amount, {
        validators: [
          Validators.required,
          amountRangeValidator(parseFloat(this.total_amount)),
        ],
      }),
    });
  }

  /**
   * Retrieves the error message for a specific form field.
   * @param field - The name of the field for which to retrieve the error message.
   * @returns The error message for the field or null if no errors.
   */
  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

  /**
   * Sends the settlement type and amount back to the friends-expense component when the form is valid.
   * This method is triggered when the user confirms the settlement.
   */
  sendSplitType() {
    if (this.form.valid) {
      this.dialogRef.close({
        split_type: 'SETTLEMENT',
        total_amount: this.form.value.settlement_amount,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
