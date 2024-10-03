import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { config } from '../../../environments/config';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly secretKey = config.encryptionSecretKey; // You should store this key securely

  // Encrypt and store the userId
  setUserId(userId: string): void {
    const encryptedUserId = CryptoJS.AES.encrypt(
      userId,
      this.secretKey,
    ).toString();
    localStorage.setItem('userId', encryptedUserId);
  }

  // Decrypt and retrieve the userId
  getUserId(): string | null {
    const encryptedUserId = localStorage.getItem('userId');
    if (encryptedUserId) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedUserId, this.secretKey);
        const decryptedId = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedId) {
          throw new Error('Failed to decrypt the user ID.');
        }

        return decryptedId;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Remove the userId from localStorage
  removeUserId(): void {
    localStorage.removeItem('userId');
  }
}
