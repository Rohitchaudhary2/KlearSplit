import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { RegisterUser } from '../register-types.model';
import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { OtpDialogComponent } from '../otp-dialog/otp-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

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
  private authService = inject(AuthService);
  private formErrorMessages = inject(FormErrorMessageService);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog); // Inject MatDialog service

  registerFailed = signal(false);
  isRestoreMode = signal(false);
  isOtpMode = signal(false);

  constructor() {
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

  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

  onClickVerify() {
    if (this.form.valid) {
      const user: RegisterUser = this.form.value as RegisterUser;

      // Create a new user object without empty fields
      const userToSend: Partial<RegisterUser> = {};
      Object.keys(user).forEach((key) => {
        const typedKey = key as keyof RegisterUser; // Type assertion
        if (user[typedKey] !== '' && user[typedKey] !== null) {
          userToSend[typedKey] = user[typedKey];
        }
      });
      if (!this.isOtpMode()) {
        this.authService.verifyUser(userToSend).subscribe({
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
          },
          error: () => {
            this.registerFailed.set(true);
          },
        });
      } else {
        const otp = this.form.get('otp')?.value;
        this.authService.registerUserWithOtp(userToSend, { otp }).subscribe({
          next: () => {
            this.toastr.success('User registered successfully', 'Success');
            this.router.navigate(['/friends']);
          },
        });
      }
    }
  }

  // Method to handle "Forgot Password" click
  onRestoreAccount(): void {
    this.isRestoreMode.set(true);
    this.isOtpMode.set(false);
    this.form.removeControl('password');
    this.form.addControl(
      'restoreAccountEmail',
      new FormControl(this.form.get('email')?.value, [
        Validators.required,
        Validators.email,
      ]),
    );
  }

  // Method to handle OTP field display after submit
  onSendOtp(): void {
    this.isOtpMode.set(true);
    if (this.form.valid) {
      const email = this.form.get('restoreAccountEmail')?.value;
      this.authService.verifyExistingUser(email).subscribe();
    }
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

  onSubmitOtp(): void {
    if (this.form.valid) {
      const email = this.form.get('restoreAccountEmail')?.value;
      const otp = this.form.get('otp')?.value;

      this.authService.restoreAccount(email, otp).subscribe({
        next: () => {
          this.toastr.success('Account restored successfully', 'Success');
          this.router.navigate(['/dashboard']);
        },
      });
    } else {
      this.toastr.warning(
        'Please fill in all required fields correctly.',
        'Warning',
      );
    }
  }

  onBackToRegister(): void {
    this.isRestoreMode.set(false);
    this.isOtpMode.set(false);
    this.form.removeControl('restoreAccountEmail');
    this.form.removeControl('otp');
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

  openOtpDialog(user: Partial<RegisterUser>) {
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      data: user,
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.registerUserWithOtp(user, result).subscribe({
          next: () => {
            this.toastr.success('User registered successfully', 'Success');
            this.router.navigate(['/friends']);
          },
        });
      }
    });
    dialogRef.updateSize('25%');
  }

  onGoogleSignUp() {
    window.open('http://localhost:3000/api/auth/google', '_self');
  }
}
