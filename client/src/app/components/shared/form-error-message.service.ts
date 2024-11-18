import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FormErrorMessageService {
  /**
   * Retrieves the error message for a specific field in a form group.
   *
   * @param form - The `FormGroup` containing the field to validate.
   * @param field - The name of the field for which the error message is needed.
   * @returns A string containing the error message, or `null` if there is no error.
   *
   * This method checks for standard validation errors like `required`, `email`,
   * `minlength`, etc., and returns appropriate error messages. It also delegates
   * to specific helper methods for field-specific validation, such as `password`
   * and `phone` validation.
   */
  getErrorMessage(form: FormGroup, field: string): string | null {
    const control: AbstractControl | null = form.get(field);

    if (control?.hasError('required') && control.touched) {
      return 'This field is required.';
    } else if (control?.hasError('email') && control.touched) {
      return 'Please enter a valid email.';
    } else if (control?.hasError('minlength') && control.touched) {
      return `Minimum length should be ${control.errors?.['minlength'].requiredLength}.`;
    } else if (control?.hasError('maxlength') && control.touched) {
      return `Maximum length should be ${control.errors?.['maxlength'].requiredLength}.`;
    } else if (control?.hasError('max') && control.touched) {
      return `Maximum amount should be ${control.errors?.['max'].max}.`;
    } else if (control?.hasError('min') && control.touched) {
      return `Minimum amount should be ${control.errors?.['min'].min}.`;
    } else if (
      control?.hasError('outOfRange') && // Check for outOfRange error
      control.touched
    ) {
      return `Amount must be greater than 0 and less than or equal to ${control.errors?.['outOfRange'].max}.`;
    }

    // Check for specific field types
    if (field === 'password') {
      return this.getPasswordErrorMessage(control);
    } else if (field === 'phone') {
      return this.getPhoneErrorMessage(control);
    }

    return null;
  }

  /**
   * Retrieves error messages specific to the `password` field.
   *
   * @param control - The form control for the `password` field.
   * @returns A string containing the password error message, or `null` if there is no error.
   *
   * This method checks for a custom `pattern` error on the password field.
   * It ensures the password contains at least one lowercase letter, one digit,
   * and is between 8 and 20 characters long.
   */
  private getPasswordErrorMessage(
    control: AbstractControl | null,
  ): string | null {
    if (control?.hasError('pattern') && control.touched) {
      const value = control.value;

      // Check for multiple password patterns
      if (!/[a-z]/.test(value)) {
        return 'Password must contain at least one lowercase letter.';
      }
      if (!/[0-9]/.test(value)) {
        return 'Password must contain at least one digit.';
      }
      if (value.length < 8 || value.length > 20) {
        return 'Password must be between 8 and 20 characters long.';
      }
    }
    return null;
  }

  /**
   * Retrieves error messages specific to the `phone` field.
   *
   * @param control - The form control for the `phone` field.
   * @returns A string containing the phone error message, or `null` if there is no error.
   *
   * This method checks for a custom `pattern` error on the phone field.
   * It validates the phone number against a standard numeric pattern (e.g., US phone numbers).
   */
  private getPhoneErrorMessage(control: AbstractControl | null): string | null {
    if (control?.hasError('pattern') && control.touched) {
      const value = control.value;

      // Phone number pattern (example for US phone numbers)
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(value)) {
        return 'Please enter a valid phone number.';
      }
    }
    return null;
  }
}
