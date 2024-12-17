import { Component, inject, input, output } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

import { FormErrorMessageService } from "../../../shared/form-error-message.service";

function amountRangeValidator(totalAmount: number): ValidatorFn {
  return (control: AbstractControl): { outOfRange: { max: number } } | null => {
    const value = control.value;
    if (value === null || value === "") {
      return null; // No error if the control is empty
    }
    const isInvalid = value <= 0 || value > totalAmount;
    return isInvalid ? { outOfRange: { max: totalAmount } } : null;
  };
}

@Component({
  selector: "app-settlement",
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./settlement.component.html",
  styleUrl: "./settlement.component.css"
})
export class SettlementComponent {
  payerName = input<string>();
  payerImage = input<string>();
  debtorName = input<string>();
  debtorImage = input<string>();
  totalAmount = input<string>();

  submitSettlement = output<string>();
  cancelSettlement = output<void>();

  private readonly formErrorMessages = inject(FormErrorMessageService);

  form: FormGroup = new FormGroup({});
  
  ngOnInit() {
    this.form = new FormGroup({
      settlement_amount: new FormControl(this.totalAmount(), {
        validators: [
          Validators.required,
          amountRangeValidator(parseFloat(this.totalAmount()!)),
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
   * Emits the settlement data when the form is valid.
   */
  onSubmit() {
    if (!this.form.valid) {
      return;
    }
    this.submitSettlement.emit(this.form.value.settlement_amount,);
  }

  /**
   * Emits a cancellation event.
   */
  onCancel(): void {
    this.cancelSettlement.emit();
  }
}
