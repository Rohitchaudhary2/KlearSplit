import { Component, inject } from '@angular/core';
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
import { RestoreAccountComponent } from '../restore-account/restore-account.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'], // Fix: styleUrl -> styleUrls
})
export class RegisterComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private formErrorMessages = inject(FormErrorMessageService);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog); // Inject MatDialog service

  form = new FormGroup({
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
      this.authService.verifyUser(userToSend).subscribe({
        next: () => {
          this.openOtpDialog(userToSend); // Open dialog box for OTP input
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || 'OTP verification failed!',
            'Error',
            { timeOut: 3000 },
          );
        },
      });
    }
  }

  openOtpDialog(user: Partial<RegisterUser>) {
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      width: '500px',
      data: user,
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.registerUserWithOtp(user, result).subscribe({
          next: () => {
            this.toastr.success('User registered successfully', 'Success', {
              timeOut: 3000,
            });
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.toastr.error(
              err?.error?.message || 'Registration failed!',
              'Error',
              { timeOut: 3000 },
            );
          },
        });
      }
    });
  }

  openRestoreAccountDialog() {
    const dialogRef = this.dialog.open(RestoreAccountComponent, {
      width: '500px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.verifyExistingUser(result).subscribe({
          next: () => {
            this.openOtpDialogRestoreAccount(result);
          },
        });
      }
    });
  }

  openOtpDialogRestoreAccount(user: { email: string }) {
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      width: '500px',
      data: user,
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.restoreAccount(user, result).subscribe({
          error: (err) => {
            this.toastr.error(
              err?.error?.message || 'Unable to restore account at the moment!',
              'Error',
              { timeOut: 3000 },
            );
          },
        });
      }
    });
  }

  onGoogleSignUp() {
    window.open('http://localhost:3000/api/auth/google', '_self');
  }
}
