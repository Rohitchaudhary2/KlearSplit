import { Injectable } from "@angular/core";
import cryptoJS from "crypto-js";

import { config } from "../../../environments/config";

@Injectable({
  providedIn: "root",
})
export class TokenService {
  // Secret key used for encryption and decryption
  private readonly secretKey = config.encryptionSecretKey;
  // Note: This key should be securely stored and not exposed in the frontend.

  /**
   * Encrypts the user ID and stores it in `localStorage`.
   *
   * @param userId - The user ID to be encrypted and saved.
   * This method ensures that sensitive data is not stored in plain text.
   */
  setUserId(userId: string): void {
    const encryptedUserId = cryptoJS.AES.encrypt(
      userId,
      this.secretKey,
    ).toString();
    localStorage.setItem("userId", encryptedUserId);
  }

  /**
   * Retrieves and decrypts the user ID from `localStorage`.
   *
   * This method retrieves the encrypted user ID from `localStorage`, decrypts it using the secret key,
   * and returns the decrypted user ID if valid. If the user ID is not available or invalid, it returns `undefined`.
   *
   * @returns The decrypted user ID if available and valid, or `undefined` otherwise.
   */
  getUserId(): string | undefined {
    // Retrieve the encrypted user ID from localStorage
    const encryptedUserId = this.getEncryptedUserId();
    if (!encryptedUserId) {
      // If no encrypted user ID is found, return undefined
      return undefined;
    }

    // Decrypt and return the decrypted user ID
    return this.decryptUserId(encryptedUserId);
  }

  /**
   * Helper function to retrieve the encrypted user ID from `localStorage`.
   *
   * This function encapsulates the logic of getting the encrypted user ID from `localStorage`.
   *
   * @returns The encrypted user ID stored in `localStorage`, or `undefined` if not found.
   */
  private getEncryptedUserId(): string | undefined {
    return localStorage.getItem("userId") ?? undefined; // Retrieve the encrypted user ID from localStorage
  }

  /**
   * Helper function to decrypt the encrypted user ID.
   *
   * This function takes the encrypted user ID, decrypts it using the AES algorithm with the secret key,
   * and returns the decrypted user ID. If decryption fails, it returns `undefined`.
   *
   * @param encryptedUserId - The encrypted user ID to be decrypted.
   * @returns The decrypted user ID or `undefined` if decryption fails.
   */
  private decryptUserId(encryptedUserId: string): string | undefined {
    // Decrypt the encrypted user ID using the secret key
    const bytes = cryptoJS.AES.decrypt(encryptedUserId, this.secretKey);
    // Convert the decrypted bytes to a UTF-8 string
    const decryptedId = bytes.toString(cryptoJS.enc.Utf8);
    // Return the decrypted ID or undefined if the decryption is empty
    return decryptedId || undefined;
  }

  /**
   * Removes the user ID from `localStorage`.
   *
   * This method removes the encrypted user ID from `localStorage`, effectively logging the user out
   * or clearing any stored authentication information.
   */
  removeUserId(): void {
    // Remove the encrypted user ID from localStorage
    localStorage.removeItem("userId");
  }
}
