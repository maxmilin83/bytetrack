
import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface MealEntry {
  id: string; 
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number; 
}

export interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieTarget: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {

  private readonly CALORIE_TARGET_KEY = 'calorieTarget';
  private readonly LAST_OPENED_KEY = 'lastOpenedDate';
  private readonly DAILY_LOG_PREFIX = 'dailyLogs_';
  private readonly DAILY_SUMMARY_PREFIX = 'dailySummary_';

  constructor() { }


  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  // --- Calorie Target ---
  async setCalorieTarget(target: number): Promise<void> {
    await Preferences.set({ key: this.CALORIE_TARGET_KEY, value: target.toString() });

    const todayStr = this.getTodayDateString();
    const summary = await this.getDailySummary(todayStr);
    summary.calorieTarget = target;
    await this.setDailySummary(todayStr, summary);
  }

  async getCalorieTarget(): Promise<number | null> {
    const { value } = await Preferences.get({ key: this.CALORIE_TARGET_KEY });
    return value ? parseInt(value, 10) : null; 
  }

  // --- Last Opened Date & New Day Check ---
  async checkAndResetForNewDay(): Promise<void> {
    const todayStr = this.getTodayDateString();
    const { value: lastOpenedStr } = await Preferences.get({ key: this.LAST_OPENED_KEY });

    if (lastOpenedStr !== todayStr) {
      console.log(`New day detected (${todayStr}). Resetting daily data.`);
      
      
      // Update last opened date
      await Preferences.set({ key: this.LAST_OPENED_KEY, value: todayStr });
    } else {
      console.log(`Same day (${todayStr}). No reset needed.`);
    }
  }

  // --- Daily Log ---
  private getDailyLogKey(dateStr: string): string {
    return `${this.DAILY_LOG_PREFIX}${dateStr}`;
  }

  async getDailyLog(dateStr: string): Promise<MealEntry[]> {
    const key = this.getDailyLogKey(dateStr);
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : [];
  }

  private async setDailyLog(dateStr: string, log: MealEntry[]): Promise<void> {
    const key = this.getDailyLogKey(dateStr);
    await Preferences.set({ key, value: JSON.stringify(log) });
  }

  // --- Daily Summary ---
  private getDailySummaryKey(dateStr: string): string {
    return `${this.DAILY_SUMMARY_PREFIX}${dateStr}`;
  }

  async getDailySummary(dateStr: string): Promise<DailySummary> {
    const key = this.getDailySummaryKey(dateStr);
    const { value } = await Preferences.get({ key });
    const globalTarget = await this.getCalorieTarget() || 2000;
    if (value) {
      const parsed = JSON.parse(value);
      // Use the calorieTarget from the summary if present, otherwise fallback to global
      return {
        ...parsed,
        calorieTarget: typeof parsed.calorieTarget === 'number' ? parsed.calorieTarget : globalTarget
      };
    } else {
      return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, calorieTarget: globalTarget };
    }
  }

  private async setDailySummary(dateStr: string, summary: DailySummary): Promise<void> {
    const key = this.getDailySummaryKey(dateStr);
    await Preferences.set({ key, value: JSON.stringify(summary) });
  }

  // --- Add Meal Entry ---
  async addMealEntry(meal: Omit<MealEntry, 'id' | 'timestamp'>, dateStr?: string): Promise<void> {
    const targetDate = dateStr || this.getTodayDateString();
    const log = await this.getDailyLog(targetDate);
    const summary = await this.getDailySummary(targetDate);

    const newEntry: MealEntry = {
      ...meal,
      id: crypto.randomUUID(), 
      timestamp: Date.now()
    };

    log.push(newEntry);

    // Update summary
    summary.totalCalories += newEntry.calories;
    summary.totalProtein += newEntry.protein;
    summary.totalCarbs += newEntry.carbs;
    summary.totalFat += newEntry.fat;

    // Save updated log and summary
    await this.setDailyLog(targetDate, log);
    await this.setDailySummary(targetDate, summary);
    console.log('Meal added and summary updated:', newEntry, summary);
  }

  // --- Delete Meal Entry ---
  async deleteMealEntry(mealId: string): Promise<void> {
    const todayStr = this.getTodayDateString();
    let log = await this.getDailyLog(todayStr);
    const summary = await this.getDailySummary(todayStr);

    const entryToRemove = log.find(entry => entry.id === mealId);

    if (entryToRemove) {
      // Update summary by subtracting the removed meal's values
      summary.totalCalories -= entryToRemove.calories;
      summary.totalProtein -= entryToRemove.protein;
      summary.totalCarbs -= entryToRemove.carbs;
      summary.totalFat -= entryToRemove.fat;

      // Ensure totals don't go below zero due to potential floating point issues
      summary.totalCalories = Math.max(0, summary.totalCalories);
      summary.totalProtein = Math.max(0, summary.totalProtein);
      summary.totalCarbs = Math.max(0, summary.totalCarbs);
      summary.totalFat = Math.max(0, summary.totalFat);


      // Filter out the meal entry
      log = log.filter(entry => entry.id !== mealId);

      // Save updated log and summary
      await this.setDailyLog(todayStr, log);
      await this.setDailySummary(todayStr, summary);
      console.log('Meal deleted and summary updated. ID:', mealId, summary);
    } else {
       console.warn('Meal entry not found for deletion. ID:', mealId);
    }
  }

   // --- Get Today's Data Combined ---
   async getTodaysData(): Promise<{ log: MealEntry[], summary: DailySummary }> {
     await this.checkAndResetForNewDay(); // Ensure data is for today
     const todayStr = this.getTodayDateString();
     const [log, summary] = await Promise.all([
       this.getDailyLog(todayStr),
       this.getDailySummary(todayStr)
     ]);
     return { log, summary };
   }
}