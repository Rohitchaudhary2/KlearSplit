import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { LoginUser } from '../login-types.model';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatButtonModule } from '@angular/material/button';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { MatDialog } from '@angular/material/dialog';
import { OtpDialogComponent } from '../otp-dialog/otp-dialog.component';
import { API_URLS } from '../../../constants/api-urls';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

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
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  private readonly googleAuthUrl = API_URLS.googleAuth;

  loginFailed = false;
  hidePassword = true;

  constructor() {
    this.form.valueChanges.subscribe(() => {
      this.loginFailed = false;
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
          this.toastr.success('User logged in successfully', 'Success');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loginFailed = true;
        },
      });
    }
  }

  openForgotPasswordDialog() {
    const dialogRef = this.dialog.open(ForgotPasswordComponent, {
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
    dialogRef.updateSize('25%');
  }

  openOtpDialog(user: { email: string }) {
    const dialogRef = this.dialog.open(OtpDialogComponent, {
      data: user,
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.forgotPassword(user, result).subscribe();
      }
    });
    dialogRef.updateSize('25%');
  }

  onGoogleSignIn() {
    window.open(this.googleAuthUrl, '_self');
  }
}
