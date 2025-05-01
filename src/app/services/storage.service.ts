import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  // Stores a string value
  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  // Retrieves a string value
  async get(key: string): Promise<string | null> {
    const item = await Preferences.get({ key });
    return item.value;
  }

  // Stores an object by converting it to a JSON string
  async setObject(key: string, value: any): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }

  // Retrieves an object by parsing the JSON string
  async getObject<T>(key: string): Promise<T | null> {
    const item = await Preferences.get({ key });
    if (item.value) {
      try {
        return JSON.parse(item.value) as T;
      } catch (error) {
        console.error(`Error parsing JSON for key ${key}:`, error);
        return null; 
      }
    }
    return null;
  }

  // Retrieves a number, parsing it from a string
  async getNumber(key: string): Promise<number | null> {
    const item = await Preferences.get({ key });
    if (item.value !== null && item.value !== undefined && !isNaN(Number(item.value))) {
        return Number(item.value);
    }
    return null;
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async keys(): Promise<string[]> {
    const { keys } = await Preferences.keys();
    return keys;
  }

  async clear(): Promise<void> {
    await Preferences.clear();
  }
}