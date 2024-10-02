import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { config } from '../../../environments/config';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly userIdKey = 'userId';
  private readonly secretKey = config.encryptionSecretKey; // You should store this key securely

  // Encrypt and store the userId
  setUserId(userId: string): void {
    const encryptedUserId = CryptoJS.AES.encrypt(
      userId,
      this.secretKey,
    ).toString();
    localStorage.setItem(this.userIdKey, encryptedUserId);
  }

  // Decrypt and retrieve the userId
  getUserId(): string | null {
    const encryptedUserId = localStorage.getItem(this.userIdKey);
    if (encryptedUserId) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedUserId, this.secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Remove the userId from localStorage
  removeUserId(): void {
    localStorage.removeItem(this.userIdKey);
  }
}
