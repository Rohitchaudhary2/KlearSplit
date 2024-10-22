import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { LoginUser } from '../login-types.model';
import { AuthService } from '../auth.service';
import { API_URLS } from '../../../constants/api-urls';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private formErrorMessages = inject(FormErrorMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  private readonly googleAuthUrl = API_URLS.googleAuth;

  loginFailed = signal(false);
  hidePassword = signal(true);
  isForgotPasswordMode = signal(false);
  isOtpMode = signal(false);
  isResendDisabled = signal(true);
  countdown = 30;

  constructor() {
    this.form.valueChanges.subscribe(() => {
      this.loginFailed.set(false);
    });

    if (Object.keys(this.route.snapshot.queryParams).length > 0) {
      const { error } = this.route.snapshot.queryParams;
      const errorMessage = decodeURIComponent(error);
      this.toastr.error(errorMessage, 'Error');
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
  }

  form = new FormGroup<{
    email?: FormControl<string | null>;
    password?: FormControl<string | null>;
    forgotPasswordEmail?: FormControl<string | null | undefined>;
    otp?: FormControl<string | null>;
  }>({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern(new RegExp('^(?=.*[a-z])(?=.*[0-9]).{8,20}$')),
      ],
    }),
  });

  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

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

  resendOtp(): void {
    this.onSendOtp();

    // Restart the countdown timer after resending the OTP
    this.startCountdown();
  }

  onSubmit() {
    if (this.form.valid) {
      const user: LoginUser = this.form.value as LoginUser;
      this.authService.login(user).subscribe({
        next: () => {
          this.toastr.success('User logged in successfully', 'Success');
          this.router.navigate(['/friends']);
        },
        error: () => {
          this.loginFailed.set(true);
        },
      });
    }
  }

  // Method to handle "Forgot Password" click
  onForgotPassword(): void {
    this.isForgotPasswordMode.set(true);
    this.isOtpMode.set(false);
    this.form.removeControl('password');
    this.form.addControl(
      'forgotPasswordEmail',
      new FormControl(this.form.get('email')?.value, [
        Validators.required,
        Validators.email,
      ]),
    );
    this.form.removeControl('email');
  }

  // Method to handle OTP field display after submit
  onSendOtp(): void {
    if (this.form.valid) {
      const email = this.form.get('forgotPasswordEmail')?.value;
      this.authService.verifyForgotPasswordUser(email).subscribe({
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
        },
      });
    }
  }

  onSubmitOtp(): void {
    if (this.form.valid) {
      const email = this.form.get('forgotPasswordEmail')?.value;
      const otp = this.form.get('otp')?.value;

      this.authService.forgotPassword(email, otp).subscribe({
        next: () => {
          this.onBackToLogin();
        },
      });
    } else {
      this.toastr.warning(
        'Please fill in all required fields correctly.',
        'Warning',
      );
    }
  }

  onBackToLogin(): void {
    this.isForgotPasswordMode.set(false);
    this.isOtpMode.set(false);
    this.form.removeControl('forgotPasswordEmail');
    this.form.removeControl('otp');
    this.form.addControl(
      'email',
      new FormControl('', [Validators.required, Validators.email]),
    );
    this.form.addControl(
      'password',
      new FormControl('', [
        Validators.required,
        Validators.pattern(new RegExp('^(?=.*[a-z])(?=.*[0-9]).{8,20}$')),
      ]),
    );
  }

  onGoogleSignIn() {
    window.open(this.googleAuthUrl, '_self');
  }
}
