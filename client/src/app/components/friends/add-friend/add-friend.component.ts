import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-friend',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './add-friend.component.html',
  styleUrl: './add-friend.component.css',
})
export class AddFriendComponent {
  dialogRef = inject(MatDialogRef<AddFriendComponent>);

  AddfriendForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onAdd(): void {
    if (this.AddfriendForm.valid) {
      this.dialogRef.close({ email: this.AddfriendForm.value.email });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
