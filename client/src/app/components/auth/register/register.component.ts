import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { RegisterUser } from '../register-types.model';
import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'] // Fix: styleUrl -> styleUrls
})
export class RegisterComponent {
  router = inject(Router);
  authService = inject(AuthService);
  formErrorMessages = inject(FormErrorMessageService);
  toastr = inject(ToastrService);

  form = new FormGroup({
    first_name: new FormControl('', {
      validators: [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(50)
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
        Validators.pattern(/^[0-9]{10}$/)
      ],
    }),
  });

  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

  googleLoginHandler(){
    window.open('http://localhost:3000/auth/google', '_self');
  }

  onClickVerify() {
    if (this.form.valid) {
      const user: RegisterUser = this.form.value as RegisterUser;
      this.authService.registerUser(user).subscribe({
        next: () => {
          this.toastr.success('User registered successfully', 'Success', { timeOut: 3000 });
        },
        error: (err) => {
          // Assuming that the error will have a message
          this.toastr.error(err?.error?.message || 'Registration failed!', 'Error', { timeOut: 3000 });
        }
      });
    } else {
      this.toastr.error('Please fill out the form correctly.', 'Validation Error', { timeOut: 3000 });
    }
  }
}
