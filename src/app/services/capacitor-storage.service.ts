import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class CapacitorStorage {
  async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
    });
  }

  async get(key: string): Promise<any> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async getUserProfile(): Promise<any> {
    return this.get('userProfile');
  }

  async setUserProfile(profile: any): Promise<void> {
    await this.set('userProfile', profile);
  }

  async getAllKeys(): Promise<string[]> {
    const { keys } = await Preferences.keys();
    return keys;
  }
} 