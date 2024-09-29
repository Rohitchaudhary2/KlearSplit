import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-otp-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './otp-dialog.component.html'
})
export class OtpDialogComponent {
  dialogRef = inject(MatDialogRef<OtpDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  otpForm = new FormGroup({
    otp: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)])
  });

  onVerify(): void {
    if (this.otpForm.valid) {
      this.dialogRef.close({ otp: this.otpForm.value.otp, ...this.data.user });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
