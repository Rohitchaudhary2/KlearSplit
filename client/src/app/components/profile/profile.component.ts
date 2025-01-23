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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ToastrService } from "ngx-toastr";

import { AuthService } from "../auth/auth.service";
import { FormErrorMessageService } from "../shared/form-error-message.service";
import { UserService } from "../user.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: "./profile.component.html",
  styleUrls: [ "./profile.component.css" ],
})
export class ProfileComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  private readonly formErrorMessages = inject(FormErrorMessageService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  hidePassword = true;
  previewImage: string | null = null;
  selectedFile: File | null = null;
  hoveringImage = false;
  imageSelected = false;
  currentUser = this.authService.currentUser;
  
  profileForm = new FormGroup({
    first_name: new FormControl("", {
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
    }),
    last_name: new FormControl("", {
      validators: [ Validators.maxLength(50) ],
    }),
    email: new FormControl("", {
      validators: [ Validators.required, Validators.email ],
    }),
    phone: new FormControl("", {
      validators: [
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern(/^\d{10}$/),
      ],
    }),
  });

  changePasswordForm = new FormGroup({
    current_password: new FormControl("", {
      validators: [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*\d)[a-z\d]{8,20}$/),
      ]
    }),
    new_password: new FormControl("", {
      validators: [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*\d)[a-z\d]{8,20}$/),
      ]
    }),
    confirm_password: new FormControl("", {
      validators: [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*\d)[a-z\d]{8,20}$/),
      ]
    })
  }, {
    validators: this.passwordMatchValidator
  });

  ngOnInit(): void {
    this.initializeForm();
    // Trigger revalidation when either new_password or confirm_password changes
    this.changePasswordForm.get("new_password")?.valueChanges
      .subscribe(() => {
        this.changePasswordForm.get("confirm_password")?.updateValueAndValidity();
      });

    this.changePasswordForm.get("confirm_password")?.valueChanges
      .subscribe(() => {
        this.changePasswordForm.get("new_password")?.updateValueAndValidity();
      });
  }

  /**
   * Initializes the reactive form with default values and validators.
   */
  initializeForm(): void {
    this.profileForm.patchValue({
      first_name: this.currentUser()!.first_name,
      last_name: this.currentUser()!.last_name,
      email: this.currentUser()!.email,
      phone: this.currentUser()!.phone,
    });
  }

  /**
   * Returns the validation error message for a specific change password form field.
   *
   * @param field The name of the form field
   * @returns The error message string or 'null' if no error exists
   */
  changePasswordFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.changePasswordForm, field);
  }

  /**
   * Returns the validation error message for a specific profile form field.
   *
   * @param field The name of the form field
   * @returns The error message string or 'null' if no error exists
   */
  profileFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.profileForm, field);
  }

  /**
   * Validator to check if `new_password` matches `confirm_password`.
   */
  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get("new_password")?.value;
    const confirmPassword = form.get("confirm_password")?.value;

    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? { mismatch: true }
      : null;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  selectImage(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
      this.imageSelected = true;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Update and saves the user profile.
   */
  saveChanges(): void {
    if (!this.profileForm.valid || !this.profileForm.dirty && !this.imageSelected) {
      this.toastr.warning("Invalid Details", "Warning");
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
      formData.append("profile", this.selectedFile);
    }

    this.userService.updateUser(this.authService.currentUser()!.user_id, formData).subscribe({
      next: () => this.toastr.success("Updated Profile Successfully", "Success"),
      error: () => this.toastr.error("Error Updating Profile", "Error")
    });
  }

  changePassword() {
    if (!this.changePasswordForm.valid) {
      return;
    }

    const formData = new FormData;
    formData.append("password", this.changePasswordForm.get("current_password")!.value!);
    formData.append("new_password", this.changePasswordForm.get("confirm_password")!.value!);

    this.userService.updateUser(this.authService.currentUser()!.user_id, formData).subscribe({
      next: () => this.toastr.success("Updated Profile Successfully", "Success"),
      error: () => this.toastr.error("Error Updating Profile", "Error")
    });
  }
}
