import { Injectable } from "@angular/core";
import { AbstractControl, FormGroup } from "@angular/forms";

@Injectable({
  providedIn: "root",
})
export class FormErrorMessageService {
  /**
   * Retrieves the error message for a specific field in a form group.
   *
   * @param form - The FormGroup containing the field.
   * @param field - The name of the field.
   * @returns The error message for the field, or `null` if no error exists.
   */
  getErrorMessage(form: FormGroup, field: string): string | null {
    const control = form.get(field);
    if (!control?.touched) {
      return null;
    }

    const errorMessage = this.getCommonErrorMessages(control)
      ?? this.getFieldSpecificErrorMessage(field, control);

    return errorMessage;
  }

  /**
   * Retrieves common validation error messages for a control.
   *
   * @param control - The form control to check for errors.
   * @returns The error message, or `null` if no error exists.
   */
  private getCommonErrorMessages(control: AbstractControl): string | null {
    const errorMap: Record<string, string | (() => string)> = {
      required: "This field is required.",
      email: "Please enter a valid email.",
      minlength: () => `Minimum length should be ${control.errors?.["minlength"]?.requiredLength}.`,
      maxlength: () => `Maximum length should be ${control.errors?.["maxlength"]?.requiredLength}.`,
      max: () => `Maximum amount should be ${control.errors?.["max"]?.max}.`,
      min: () => `Minimum amount should be ${control.errors?.["min"]?.min}.`,
      outOfRange: () => `Amount must be greater than 0 and less than or equal to ${control.errors?.["outOfRange"]?.max}.`,
    };

    const errorMessage = Object.entries(errorMap).find(([ key ]) => control.hasError(key))?.[1];

    return errorMessage ? typeof errorMessage === "function" ? errorMessage() : errorMessage : null;
  }

  /**
   * Retrieves field-specific error messages for known fields.
   *
   * @param field - The name of the field.
   * @param control - The form control to check for errors.
   * @returns The error message, or `null` if no error exists.
   */
  private getFieldSpecificErrorMessage(field: string, control: AbstractControl): string | null {
    const fieldErrorHandlers: Record<string, (control: AbstractControl) => string | null> = {
      password: this.getPasswordErrorMessage,
      phone: this.getPhoneErrorMessage,
    };

    return fieldErrorHandlers[field]?.(control) ?? null;
  }

  /**
   * Retrieves the error message for password-specific validation.
   *
   * @param control - The form control for the password field.
   * @returns The password-specific error message, or `null` if no error exists.
   */
  private getPasswordErrorMessage(control: AbstractControl): string | null {
    if (!control.hasError("pattern")) {
      return null;
    }

    const value = control.value;
    const errors = [
      !/[a-z]/.test(value) && "at least one lowercase letter",
      !/[0-9]/.test(value) && "at least one digit",
      (value.length < 8 || value.length > 20) && "be between 8 and 20 characters long",
    ].filter(Boolean);

    return errors.length ? `Password must ${errors.join(", and ")}.` : null;
  }

  /**
   * Retrieves the error message for phone-specific validation.
   *
   * @param control - The form control for the phone field.
   * @returns The phone-specific error message, or `null` if no error exists.
   */
  private getPhoneErrorMessage(control: AbstractControl): string | null {
    return control.hasError("pattern") ? "Please enter a valid phone number." : null;
  }
}
