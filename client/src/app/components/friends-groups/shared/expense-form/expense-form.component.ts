import { Component, inject, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

import { FormErrorMessageService } from "../../../shared/form-error-message.service";

@Component({
  selector: "app-expense-form",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: "./expense-form.component.html",
  styleUrl: "./expense-form.component.css"
})
export class ExpenseFormComponent {
  private readonly formErrorMessages = inject(FormErrorMessageService);
  form = input<FormGroup>();
  title = input<string>();
  participants = input();
  splitType = input<string>();
  imageName = input<string>();
  payerName = input<string>("you");

  submit = output<void>();
  cancel = output<void>();
  payerDialog = output<void>();
  splitTypeDialog = output<void>();
  fileSelect = output<Event>();

  /**
   * Retrieves the error message for a given form field.
   *
   * @param {string} field - The name of the form field for which the error message is being requested.
   *
   * @returns {string | null} The error message if validation fails, or null if the field is valid.
   */
  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form()!, field);
  }

  /**
   * Trims the leading and trailing whitespace from the value of a specific form control.
   * This is used to ensure no accidental spaces are included in form fields like 'expense_name' or 'description'.
   *
   * @param controlName - The name of the form control whose value will be trimmed.
   */
  trimInput(controlName: string) {
    const control = this.form()!.get(controlName);
    if (control) {
      const trimmedValue = control.value.trim();
      control.setValue(trimmedValue, { emitEvent: false });
    }
  }
}
