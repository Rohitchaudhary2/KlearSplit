import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { LoginUser } from '../login-types.model';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatButtonModule } from '@angular/material/button';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { MatDialog } from '@angular/material/dialog';
import { OtpDialogComponent } from '../otp-dialog/otp-dialog.component';
import { API_URLS } from '../../../constants/api-urls';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private formErrorMessages = inject(FormErrorMessageService);
  private dialog = inject(MatDialog);

  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  private readonly googleAuthUrl = API_URLS.googleAuth;

  form = new FormGroup({
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

  onSubmit() {
    if (this.form.valid) {
      const user: LoginUser = this.form.value as LoginUser;
      this.authService.login(user).subscribe({
        next: () => {
          this.toastr.success('User logged in successfully', 'Success', {
            timeOut: 3000,
          });
        },
        error: (err) => {
          // Assuming that the error will have a message
          this.toastr.error(err?.error?.message || 'Login failed!', 'Error', {
            timeOut: 3000,
          });
        },
      });
    }
  }

  openForgotPasswordDialog() {
    const dialogRef = this.dialog.open(ForgotPasswordComponent, {
      width: '500px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.verifyForgotPasswordUser(result).subscribe({
          next: () => {
            this.openOtpDialog(result);
          },
        });
      }
    });
  }

  openOtpDialog(user: { email: string }) {
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      width: '500px',
      data: user,
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.forgotPassword(user, result).subscribe({
          error: (err) => {
            this.toastr.error(
              err?.error?.message || 'Unable to send password at the moment!',
              'Error',
              { timeOut: 3000 },
            );
          },
        });
      }
    });
  }

  onGoogleSignIn() {
    window.open(this.googleAuthUrl, '_self');
  }
}
