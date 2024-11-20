import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { StateService } from '../../shared/state.service';
import { AuthService } from '../auth.service';
import { RegisterUser } from '../register-types.model';

@Component({
  selector: 'app-register',
  standalone: true,

  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgClass,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'], // Fix: styleUrl -> styleUrls
})
export class RegisterComponent {
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);
  private formErrorMessages = inject(FormErrorMessageService);
  private stateService = inject(StateService);

  registerFailed = signal(false); // Indicates whether registration failed
  isRestoreMode = signal(false); // Indicates if the form is in "restore account" mode
  isOtpMode = signal(false); // Indicates if OTP input is active
  isResendDisabled = signal(true); // Disables the resend button during countdown
  isLoading = signal(false); // Depicts whether something is loading
  countdown = 30; // Countdown timer for OTP resend

  constructor() {
    // Reset registration failure status whenever the form value changes
    this.form.valueChanges.subscribe(() => {
      this.registerFailed.set(false);
    });
  }

  form = new FormGroup<{
    first_name?: FormControl<string | null>;
    last_name?: FormControl<string | null>;
    email?: FormControl<string | null>;
    phone?: FormControl<string | null>;
    restoreAccountEmail?: FormControl<string | null | undefined>;
    otp?: FormControl<string | null>;
  }>({
    first_name: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
    }),
    last_name: new FormControl('', {
      validators: [Validators.maxLength(50)],
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      validators: [
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern(/^[0-9]{10}$/),
      ],
    }),
  });

  /**
   * Returns the validation error message for a specific form field.
   *
   * @param field The name of the form field
   * @returns The error message string or 'null' if no error exists
   */
  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

  // Starts the OTP resend countdown timer and disables the resend button.
  startCountdown(): void {
    this.isResendDisabled.set(true);
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.isResendDisabled.set(false); // Enable the resend button
        this.countdown = 30; // Reset countdown for next use
      }
    }, 1000);
  }

  /**
   * Handles the resed OTP logic for both restore and normal registration modes.
   *
   * Restarts the countdown timer after resending.
   */
  resendOtp(): void {
    if (this.isRestoreMode()) {
      this.onSendOtp();
    } else {
      this.onResendOtp();
    }

    // Restart the countdown timer after resending the OTP
    this.startCountdown();
  }

  /**
   * Handles the "Verify" button click.
   * Initiates user verification or OTP submission based on the current mode.
   */
  onClickVerify() {
    if (!this.form.valid) {
      return;
    }

    const userToSend = this.prepareUserToSend();
    this.isLoading.set(true);
    if (!this.isOtpMode()) {
      this.handleUserVerification(userToSend);
    } else {
      this.handleOtpSubmission(userToSend);
    }
  }

  /**
   * Prepares a sanitized user object by excluding empty fields.
   * @returns A sanitized partial user object
   */
  private prepareUserToSend(): Partial<RegisterUser> {
    const user: RegisterUser = this.form.value as RegisterUser;
    return Object.keys(user).reduce((acc, key) => {
      const typedKey = key as keyof RegisterUser;
      if (user[typedKey]) {
        acc[typedKey] = user[typedKey];
      }
      return acc;
    }, {} as Partial<RegisterUser>);
  }

  /**
   * Handles user verification for registration.
   *
   * Adds an OTP control to the form and starts the countdown on success.
   * @param userToSend Partial user data that is required for verification
   */
  private handleUserVerification(userToSend: Partial<RegisterUser>) {
    this.authService.verifyUser(userToSend).subscribe({
      next: () => {
        this.isOtpMode.set(true);
        this.addOtpControl();
        this.startCountdown();
      },
      error: () => {
        this.registerFailed.set(true);
        if (this.stateService.accountDeleted()) {
          this.isRestoreMode.set(true);
        }
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Handles OTP submission for registration.
   * Navigates to the "dashboard" page on success.
   */
  private handleOtpSubmission(userToSend: Partial<RegisterUser>) {
    const otp = this.form.get('otp')?.value;
    this.authService.registerUserWithOtp(userToSend, { otp }).subscribe({
      next: () => {
        this.toastr.success('User registered successfully', 'Success');
        this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      },
    });
  }

  // Adds the OTP control to the form
  private addOtpControl() {
    this.form.addControl(
      'otp',
      new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[0-9]{6}$/),
      ]),
    );
  }

  // Activates "Restore Account" mode and updates form controls accordingly.
  onRestoreAccount(): void {
    this.isRestoreMode.set(true);
    this.isOtpMode.set(false);
    this.form.removeControl('first_name');
    this.form.removeControl('password');
    this.form.addControl(
      'restoreAccountEmail',
      new FormControl(this.form.get('email')?.value, [
        Validators.required,
        Validators.email,
      ]),
    );
    this.form.removeControl('email');
  }

  // Sends an OTP for account restoration and updates form controls to display OTP field.
  onSendOtp(): void {
    if (!this.form.valid) {
      return;
    }
    const email = this.form.get('restoreAccountEmail')?.value;
    this.isLoading.set(true);
    this.authService.verifyExistingUser(email).subscribe({
      next: () => {
        this.isOtpMode.set(true);
        this.form.addControl(
          'otp',
          new FormControl('', [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(6),
            Validators.pattern(/^[0-9]{6}$/),
          ]),
        );
        this.startCountdown();
        this.isLoading.set(false);
      },
    });
  }

  // Handles the resend OTP functionality for normal registration.
  onResendOtp(): void {
    if (this.form.controls.email?.valid) {
      const userToSend = this.prepareUserToSend();
      this.isLoading.set(true);
      this.authService.verifyUser(userToSend).subscribe({
        next: () => {
          this.startCountdown();
          this.isLoading.set(false);
        },
      });
    }
  }

  /**
   * Submits the OTP for account restoration
   * Displays success or warning messages based on the outcome.
   */
  onSubmitOtp(): void {
    if (!this.form.valid) {
      this.toastr.warning(
        'Please fill in all required fields correctly.',
        'Warning',
      );
      return;
    }

    const email = this.form.get('restoreAccountEmail')!.value!;
    const otp = this.form.get('otp')!.value!;

    this.submitOtp(email, otp);
  }

  /**
   * Submits the OTP and restores the account.
   * @param email The email for account restoration
   * @param otp The OTP entered by the user
   */
  private submitOtp(email: string, otp: string): void {
    if (!email || !otp) {
      return;
    }
    this.isLoading.set(true);
    this.authService.restoreAccount(email, otp).subscribe({
      next: () => {
        this.toastr.success('Account restored successfully', 'Success');
        this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      },
    });
  }

  // Resents the form to its initial state for registration.
  onBackToRegister(): void {
    this.isRestoreMode.set(false);
    this.isOtpMode.set(false);

    this.resetFormForRegistration();
  }

  // Resents the form and re-adds controls required for registration.
  private resetFormForRegistration(): void {
    this.form.reset();
    this.form.addControl(
      'first_name',
      new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ]),
    );
    this.form.addControl(
      'last_name',
      new FormControl('', [Validators.maxLength(50)]),
    );
    this.form.addControl(
      'email',
      new FormControl('', [Validators.required, Validators.email]),
    );
    this.form.addControl(
      'phone',
      new FormControl('', [
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern(/^[0-9]{10}$/),
      ]),
    );
  }

  // Initiates Google Sign-In by redirecting to the authentication URL.
  onGoogleSignUp() {
    window.open('http://localhost:3000/api/auth/google', '_self');
  }
}
