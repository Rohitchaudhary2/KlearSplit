import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { User, RegisterResponse } from '../../shared/user/types.model';
import { map, tap } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

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

  get isValidFirstName() {
    return (
      this.form.controls.first_name.touched &&
      this.form.controls.first_name.dirty &&
      this.form.controls.first_name.invalid
    );
  };

  get isValidEmail() {
    return (
      this.form.controls.email.touched &&
      this.form.controls.email.dirty &&
      this.form.controls.email.invalid
    );
  };

  get isValidPhone() {
    return (
      this.form.controls.phone.touched &&
      this.form.controls.phone.dirty &&
      this.form.controls.phone.invalid
    );
  };

  onSubmit() {
    if (this.form.valid) {
      const user: User = this.form.value as User;
      this.authService.registerUser(user).subscribe((response: HttpResponse<any>): void => {
        console.log(response);
        const accessToken = response.headers.get('Authorization');
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        } else {
          console.error('No access token found in response.');
        }
        this.router.navigate(['/dashboard']);
      }, (error) => {
        console.error('Registration failed:', error);
      });
    }
  }
  
}
