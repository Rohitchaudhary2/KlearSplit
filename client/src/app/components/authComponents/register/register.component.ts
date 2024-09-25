import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from '../../shared/user/types.model';
import { HttpResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormErrorMessageService } from '../../shared/form-error-message.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  router = inject(Router);
  authService = inject(AuthService);
  toastr = inject(ToastrService);
  formErrorMessages = inject(FormErrorMessageService);

  form = new FormGroup({
    first_name: new FormControl('', {
      validators: [Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(50)],
    }),
    last_name: new FormControl('', {
      validators: [Validators.maxLength(50)],
    }),
    email: new FormControl('', {
      validators: [Validators.required, 
        Validators.email],
    }),
    phone: new FormControl('', {
      validators: [Validators.required, 
        Validators.minLength(10), 
        Validators.maxLength(10), 
        Validators.pattern(/^[0-9]{10}$/)],
    }),
  });

  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }
  

  onSubmit() {
    if (this.form.valid) {
      const user: User = this.form.value as User;
      this.authService.registerUser(user).subscribe((response: HttpResponse<any>): void => {
        const accessToken = response.headers.get('Authorization');
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          this.router.navigate(['/dashboard']);
        } else {
          this.toastr.error('Something wrong happened, please try again!', 'Error', {
            timeOut: 3000,
          })
        }
      }, (error) => {
        this.toastr.error('Registration failed!', 'Error', {
            timeOut: 3000,
          })
      });
    }
  }
  
}
