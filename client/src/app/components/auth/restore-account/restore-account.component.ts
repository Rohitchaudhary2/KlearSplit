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
  selector: 'app-restore-account',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './restore-account.component.html',
})
export class RestoreAccountComponent {
  dialogRef = inject(MatDialogRef<RestoreAccountComponent>);
  data = inject(MAT_DIALOG_DATA);

  restoreAccountForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onVerify(): void {
    if (this.restoreAccountForm.valid) {
      this.dialogRef.close({ email: this.restoreAccountForm.value.email });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
