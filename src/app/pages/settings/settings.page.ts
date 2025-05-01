import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonSelect,
  IonSelectOption,
  ToastController
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    IonSelect,
    IonSelectOption
  ]
})
export class SettingsPage implements OnInit {
  age: number = 30;
  height: number = 170;
  weight: number = 70;
  gender: string = 'male';
  activityLevel: string = 'moderate';
  goal: string = 'maintain';
  calculatedCalories: number = 0;

  constructor(private toastController: ToastController) {}

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    try {
      const { value } = await Preferences.get({ key: 'userProfile' });
      console.log('Raw profile value from Preferences:', value);
      
      if (value) {
        const profile = JSON.parse(value);
        this.age = parseInt(profile.age) || 30;
        this.height = parseInt(profile.height) || 170;
        this.weight = parseInt(profile.weight) || 70;
        this.gender = profile.gender || 'male';
        this.activityLevel = profile.activityLevel || 'moderate';
        this.goal = profile.goal || 'maintain';
        console.log('Loaded profile:', profile);
        this.calculateCalories();
      } else {
        console.log('No profile found in preferences, using defaults');
        this.calculateCalories();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  calculateCalories() {
    let bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age;
    if (this.gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };

    let tdee = bmr * activityMultipliers[this.activityLevel as keyof typeof activityMultipliers];

    const goalAdjustments = {
      lose: -500,
      maintain: 0,
      gain: 500
    };

    this.calculatedCalories = Math.round(tdee + goalAdjustments[this.goal as keyof typeof goalAdjustments]);
  }

  async saveProfile() {
    try {
      const profile = {
        age: this.age,
        height: this.height,
        weight: this.weight,
        gender: this.gender,
        activityLevel: this.activityLevel,
        goal: this.goal
      };
      
      await Preferences.set({
        key: 'userProfile',
        value: JSON.stringify(profile)
      });

      await Preferences.set({
        key: 'calorieTarget',
        value: this.calculatedCalories.toString()
      });

      console.log('Profile and calories saved successfully');
      
      // Show success toast
      const toast = await this.toastController.create({
        message: 'Profile saved successfully',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Show error toast
      const toast = await this.toastController.create({
        message: 'Failed to save profile',
        duration: 2000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    }
  }

  updateAge(value: string | null | undefined) {
    if (value) {
      this.age = parseInt(value) || 0;
      this.calculateCalories();
    }
  }

  updateHeight(value: string | null | undefined) {
    if (value) {
      this.height = parseInt(value) || 0;
      this.calculateCalories();
    }
  }

  updateWeight(value: string | null | undefined) {
    if (value) {
      this.weight = parseInt(value) || 0;
      this.calculateCalories();
    }
  }

  updateGender(value: string | null | undefined) {
    if (value) {
      this.gender = value;
      this.calculateCalories();
    }
  }

  updateActivityLevel(value: string | null | undefined) {
    if (value) {
      this.activityLevel = value;
      this.calculateCalories();
    }
  }

  updateGoal(value: string | null | undefined) {
    if (value) {
      this.goal = value;
      this.calculateCalories();
    }
  }
}
