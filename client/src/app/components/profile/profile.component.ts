import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";

import { AuthService } from "../auth/auth.service";
import { UserService } from "../user.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, MatIconModule ],
  templateUrl: "./profile.component.html",
  styleUrls: [ "./profile.component.css" ],
})
export class ProfileComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  profileForm!: FormGroup;
  previewImage: string | null = null;
  selectedFile: File | null = null;
  hoveringImage = false;
  currentUser = this.authService.currentUser;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initializes the reactive form with default values and validators.
   */
  initializeForm(): void {
    const currentUser = this.authService.currentUser();
    this.profileForm = this.fb.group(
      {
        first_name: [ currentUser?.first_name, [ Validators.required ] ],
        last_name: [ currentUser?.last_name ],
        email: [ currentUser?.email, [ Validators.required, Validators.email ] ],
        phone: [ currentUser?.phone, [ Validators.pattern(/^\d{10}$/) ] ],
        current_password: [ "" ],
        new_password: [
          "",
          [ Validators.minLength(8), Validators.required ],
        ],
        confirm_password: [ "" ],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /**
   * Validator to check if `new_password` matches `confirm_password`.
   */
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get("new_password")?.value;
    const confirmPassword = group.get("confirm_password")?.value;

    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  selectImage(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  saveChanges(): void {
    if (!this.profileForm.valid || !this.profileForm.dirty) {
      return;
    }

    const formData = new FormData();
    Object.keys(this.profileForm.controls).forEach((controlName) => {
      const control = this.profileForm.get(controlName);
      if (control?.value) {
        formData.append(controlName, control.value as string);
      }
    });

    if (this.selectedFile) {
      formData.append("profileImage", this.selectedFile);
    }

    this.userService.updateUser(this.authService.currentUser()!.user_id, formData).subscribe();
  }
}
