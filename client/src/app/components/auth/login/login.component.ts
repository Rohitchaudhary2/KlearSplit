import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { LoginUser } from '../login-types.model';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  router = inject(Router);
  formErrorMessages = inject(FormErrorMessageService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

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
    } else {
      this.toastr.error(
        'Please fill out the form correctly.',
        'Validation Error',
        { timeOut: 3000 },
      );
    }
  }
}
