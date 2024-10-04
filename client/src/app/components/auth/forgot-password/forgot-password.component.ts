import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  dialogRef = inject(MatDialogRef<ForgotPasswordComponent>);
  data = inject(MAT_DIALOG_DATA);

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onVerify(): void {
    if (this.forgotPasswordForm.valid) {
      this.dialogRef.close({ email: this.forgotPasswordForm.value.email });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
