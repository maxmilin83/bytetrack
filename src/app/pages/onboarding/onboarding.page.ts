import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';
import { arrowForward, arrowBack, checkmark } from 'ionicons/icons';

// Model for user profile
interface UserProfile {
  age: number;
  height: number; // cm
  weight: number; //kg
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  goal: 'lose' | 'maintain' | 'gain';
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class OnboardingPage {
  // Current step in the form
  currentStep = 1;
  totalSteps = 7;
  calculatedCalories = 0;

  // User profile object
  profile: UserProfile = {
    age: 30,
    height: 170,
    weight: 70,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  };


  activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise, desk job' },
    { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { value: 'active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { value: 'veryActive', label: 'Extra Active', description: 'Physical job or twice daily training' }
  ];


  goals = [
    { value: 'lose', label: 'Lose Weight', description: 'Create a calorie deficit' },
    { value: 'maintain', label: 'Maintain Weight', description: 'Stay at current weight' },
    { value: 'gain', label: 'Gain Weight', description: 'Build muscle or increase weight' }
  ];

  constructor(private router: Router) {
    // navigation icons
    addIcons({
      'arrow-forward': arrowForward,
      'arrow-back': arrowBack,
      'checkmark': checkmark
    });
  }

  // Navigation between steps
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.currentStep === 6) {
        // Calculate calories before showing the final screen
        this.calculatedCalories = this.calculateCalories(this.profile);
      }
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Save profile and calculate calories
  async completeOnboarding() {
    await Preferences.set({
      key: 'userProfile',
      value: JSON.stringify(this.profile)
    });
    

    await Preferences.set({
      key: 'calorieTarget',
      value: this.calculatedCalories.toString()
    });
    
    // Mark onboarding as complete
    await Preferences.set({
      key: 'onboardingComplete',
      value: 'true'
    });
    

    this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
  }
  

  calculateCalories(profile: UserProfile): number {
    // MifflinSt Jeor Equation 
    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    
    if (profile.gender === 'male') {
      bmr += 5;
    } else if (profile.gender === 'female') {
      bmr -= 161;
    }
    
    //activity multiplier
    let multiplier = 1.2; 
    
    switch (profile.activityLevel) {
      case 'sedentary':
        multiplier = 1.2;
        break;
      case 'light':
        multiplier = 1.375;
        break;
      case 'moderate':
        multiplier = 1.55;
        break;
      case 'active':
        multiplier = 1.725;
        break;
      case 'veryActive':
        multiplier = 1.9;
        break;
    }
    
    let calories = Math.round(bmr * multiplier);
    

    switch (profile.goal) {
      case 'lose':
        calories -= 500; 
        break;
      case 'gain':
        calories += 500; 
        break;

    }
    
    return calories;
  }
}