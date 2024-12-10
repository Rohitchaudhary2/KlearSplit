import { NgClass } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ToastrService } from "ngx-toastr";

import { API_URLS } from "../../../constants/api-urls";
import { FormErrorMessageService } from "../../shared/form-error-message.service";
import { AuthService } from "../auth.service";
import { LoginUser } from "../login-types.model";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgClass,
  ],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent implements OnInit {
  private readonly formErrorMessages = inject(FormErrorMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  private readonly googleAuthUrl = API_URLS.googleAuth;

  loginFailed = signal(false);
  hidePassword = signal(true);
  isForgotPasswordMode = signal(false);
  isOtpMode = signal(false);
  isResendDisabled = signal(true);
  isLoading = signal(false);
  countdown = 30;

  constructor() {
    // Reset the loginFailed state whenever the form value changes
    this.form.valueChanges.subscribe(() => {
      this.loginFailed.set(false);
    });
  }

  form = new FormGroup<{
    email?: FormControl<string | null>;
    password?: FormControl<string | null>;
    forgotPasswordEmail?: FormControl<string | null | undefined>;
    otp?: FormControl<string | null>;
  }>({
    email: new FormControl("", {
      validators: [ Validators.required, Validators.email ],
    }),
    password: new FormControl("", {
      validators: [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*\d)[a-z\d]{8,20}$/),
      ],
    }),
  });

  ngOnInit(): void {
    // Check for query parameters and display an error message if any
    if (Object.keys(this.route.snapshot.queryParams).length > 0) {
      const { error } = this.route.snapshot.queryParams;
      const errorMessage = decodeURIComponent(error);
      this.toastr.error(errorMessage, "Error");
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
  }

  /**
   * Returns the validation error message for a specific form field.
   *
   * @param field The name of the form field
   * @returns The error message string or 'null' if no error exists
   */
  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

  // Starts a countdown timer to enable the "Resend OTP" button after a delay.
  startCountdown(): void {
    this.isResendDisabled.set(true);
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.isResendDisabled.set(false); // Enable the resend button
        this.countdown = 30; // Reset countdown for next use
      }
    }, 1000);
  }

  // resends the OTP and restarts the countdown timer.
  resendOtp(): void {
    this.onSendOtp();
    this.startCountdown();
  }

  /**
   * Handles the form submission for login.
   * If the form is valid, triggers the login process via the AuthService.
   */
  onSubmit() {
    if (!this.form.valid) {
      return;
    }
    const user: LoginUser = this.form.value as LoginUser;
    this.isLoading.set(true);
    this.authService.login(user).subscribe({
      next: () => {
        this.toastr.success("User logged in successfully", "Success");
        this.router.navigate([ "/dashboard" ]);
      },
      error: () => {
        this.loginFailed.set(true);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  // Switches the form to "Forgot Password" mode by updating form controls.
  onForgotPassword(): void {
    this.isForgotPasswordMode.set(true);
    this.isOtpMode.set(false);
    this.form.removeControl("password");
    this.form.addControl(
      "forgotPasswordEmail",
      new FormControl(this.form.get("email")?.value, [
        Validators.required,
        Validators.email,
      ]),
    );
    this.form.removeControl("email");
  }

  /**
   * Sends an OTP to the user's email for password recovery.
   * Activates OTP mode and disables the resend button temporarily.
   */
  onSendOtp(): void {
    const email = this.getEmailForOtp();
    if (!email) {
      return;
    }
    this.isLoading.set(true);
    this.authService.verifyForgotPasswordUser(email).subscribe({
      next: () => this.activateOtpMode(),
      complete: () => this.isLoading.set(false)
    });
  }

  /**
   * Retrieves the appropriate email value based on the current form mode.
   * @returns Email string or null if not available.
   */
  private getEmailForOtp(): string {
    return this.isForgotPasswordMode()
      ? this.form.get("forgotPasswordEmail")!.value!
      : this.form.get("email")!.value!;
  }

  // Activates OTP mode by updating the form and enabling the countdown timer.
  private activateOtpMode(): void {
    this.isOtpMode.set(true);
    if (!this.form.contains("otp")) {
      this.form.addControl(
        "otp",
        new FormControl("", [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^\d{6}$/),
        ]),
      );
    }
    this.isLoading.set(false);
    this.startCountdown();
  }

  /**
   * Handles the submission of the OTP for password recovery.
   * Validates the form and calls the AuthService to verify the OTP.
   */
  onSubmitOtp(): void {
    if (!this.form.valid) {
      this.toastr.warning(
        "Please fill in all required fields correctly.",
        "Warning",
      );
      return;
    }

    const email = this.form.get("forgotPasswordEmail")?.value;
    const otp = this.form.get("otp")?.value;
    this.isLoading.set(true);
    if (email && otp) {
      this.authService.forgotPassword(email, otp).subscribe({
        next: () => this.onBackToLogin(),
        complete: () => this.isLoading.set(false)
      });
    }
  }

  /**
   * Resets the form back to the login state.
   * Removes controls for "Forgot Password" and OTP modes, and restores login controls.
   */
  onBackToLogin(): void {
    this.isForgotPasswordMode.set(false);
    this.isOtpMode.set(false);
    this.form.removeControl("forgotPasswordEmail");
    this.form.removeControl("otp");
    this.form.addControl(
      "email",
      new FormControl("", [ Validators.required, Validators.email ]),
    );
    this.form.addControl(
      "password",
      new FormControl("", [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*\d).{8,20}$/),
      ]),
    );
    this.isLoading.set(false);
  }

  // Initiates Google Sign-In by redirecting to the authentication URL.
  onGoogleSignIn() {
    const newWindow = window.open(this.googleAuthUrl, "_self");
    if (newWindow) {
      newWindow.opener = null; // Ensures no link between the parent and the new window
    }
  }
}
