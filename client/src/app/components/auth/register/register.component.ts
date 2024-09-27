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

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'], // Fix: styleUrl -> styleUrls
})
export class RegisterComponent {
  router = inject(Router);
  authService = inject(AuthService);
  formErrorMessages = inject(FormErrorMessageService);
  toastr = inject(ToastrService);
  dialog = inject(MatDialog); // Inject MatDialog service

  form = new FormGroup({
    first_name: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
    }),
    last_name: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(50)],
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      validators: [
        Validators.required,
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
      this.authService.verifyUser(user).subscribe({
        next: () => {
          this.openOtpDialog(user); // Open dialog box for OTP input
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || 'OTP verification failed!',
            'Error',
            { timeOut: 3000 },
          );
        },
      });
    } else {
      this.toastr.error(
        'Please fill out the form correctly.',
        'Validation Error',
        { timeOut: 3000 },
      );
    }
  }

  openOtpDialog(user: RegisterUser) {
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      width: '500px',
      data: user,
      enterAnimationDuration: '1000ms',
      exitAnimationDuration: '1000ms',
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
}
