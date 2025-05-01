import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonInput,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { DataStorageService, MealEntry } from '../../services/data-storage.service';
import { addIcons } from 'ionicons';
import { trashOutline, chevronBackOutline, calendarOutline, chevronForwardOutline } from 'ionicons/icons';
import moment from 'moment';
import Chart from 'chart.js/auto';

// Update meal interface to match MealEntry from DataStorageService
interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date?: string; // Optional for backward compatibility
  timestamp: number;
}

interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieTarget: number;
}

interface MacroGoals {
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonLabel
  ],
  providers: [DatePipe]
})
export class ProgressPage implements OnInit, AfterViewInit {
  selectedDate: Date = new Date();
  dailySummary: DailySummary = { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, calorieTarget: 2000 };
  dailyMeals: Meal[] = [];
  macroGoals: MacroGoals = { protein: 150, carbs: 200, fat: 70 };
  currentCalorieTarget: number = 2000;

  @ViewChild('calorieChart') calorieChartCanvas!: ElementRef;
  calorieChart!: Chart;
  selectedTrendPeriod: string = 'week';
  
  averageCalories: number = 0;
  highestCalories: number = 0;
  lowestCalories: number = 0;
  trendPeriodLabel: string = '';
  
  // Color schemes for the chart
  chartColors = {
    primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--ion-color-primary') || '#3880ff',
    backgroundColor: 'rgba(56, 128, 255, 0.2)',
    borderColor: 'rgba(56, 128, 255, 1)',
    gridColor: 'rgba(0, 0, 0, 0.1)'
  };

  constructor(
    private storageService: StorageService,
    private datePipe: DatePipe,
    private storage: DataStorageService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({chevronBackOutline,calendarOutline,chevronForwardOutline,trashOutline});
  }

  async ngOnInit() {
    await this.loadCurrentSettingsAndGoals();
    await this.loadDailyData();
    await this.loadCalorieTrendsData();
  }

  async ionViewWillEnter() {
    await this.loadCurrentSettingsAndGoals();
    this.loadDailyData();
    await this.loadCalorieTrendsData();
    if (this.calorieChart) {
      this.updateCalorieTrends();
    }
  }

  async ngAfterViewInit() {
    // Delay chart creation to ensure the canvas is ready
    setTimeout(() => {
      this.createCalorieChart();
    }, 500);
  }

  // Format date to 'yyyy-MM-dd'
  getFormattedDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  // Load current calorie target and macro goals
  async loadCurrentSettingsAndGoals() {
    const target = await this.storageService.getNumber('calorieTarget');
    const storedMacroGoals = await this.storageService.getObject<MacroGoals>('macroGoals');
    if (storedMacroGoals) {
      this.macroGoals = storedMacroGoals;
    }
    this.currentCalorieTarget = target ?? 2000;
  }

  // Load daily data for the selected date
  async loadDailyData() {
    const formattedDate = this.getFormattedDate(this.selectedDate);
    const dateNumeric = formattedDate.replace(/-/g, '');
    const summaryStorageKey = `dailySummary_${dateNumeric}`;
    const todayFormatted = this.getFormattedDate(new Date());
    let targetForThisDate: number;

    if (formattedDate === todayFormatted) {
      const currentTarget = await this.storageService.getNumber('calorieTarget');
      targetForThisDate = currentTarget ?? this.currentCalorieTarget;
    } else {
      const storedSummary = await this.storageService.getObject<DailySummary>(summaryStorageKey);
      targetForThisDate = storedSummary?.calorieTarget ?? this.currentCalorieTarget;
    }
    this.currentCalorieTarget = targetForThisDate;

    // Use DataStorageService to get daily logs instead of global meals
    this.dailyMeals = await this.storage.getDailyLog(dateNumeric);
    // Sort meals by timestamp in descending order (newest first)
    this.dailyMeals.sort((a, b) => b.timestamp - a.timestamp);

    const storedSummary = await this.storageService.getObject<DailySummary>(summaryStorageKey);

    if (storedSummary) {
      this.dailySummary = {
        totalCalories: storedSummary.totalCalories || 0,
        totalProtein: storedSummary.totalProtein || 0,
        totalCarbs: storedSummary.totalCarbs || 0,
        totalFat: storedSummary.totalFat || 0,
        calorieTarget: targetForThisDate
      };
    } else {
      let calculatedTotals = {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };
      this.dailyMeals.forEach(meal => {
        calculatedTotals.totalCalories += meal.calories;
        calculatedTotals.totalProtein += meal.protein;
        calculatedTotals.totalCarbs += meal.carbs;
        calculatedTotals.totalFat += meal.fat;
      });
      this.dailySummary = {
        ...calculatedTotals,
        calorieTarget: targetForThisDate
      };
    }

    await this.loadCurrentSettingsAndGoals();
  }

  // Save the current daily summary to storage
  async saveDailySummary() {
    const formattedDate = this.getFormattedDate(this.selectedDate);
    const summaryStorageKey = `dailySummary_${formattedDate.replace(/-/g, '')}`;
    const summaryToSave: DailySummary = {
      ...this.dailySummary,
      calorieTarget: this.currentCalorieTarget
    };
    await this.storageService.setObject(summaryStorageKey, summaryToSave);
  }

  // Delete a meal and update the summary
  async deleteMeal(mealToDelete: Meal) {
    // Show confirmation dialog before deleting
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: `Are you sure you want to delete ${mealToDelete.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              // Use DataStorageService to delete the meal
              await this.storage.deleteMealEntry(mealToDelete.id);
              
              // Reload the data to reflect changes
              await this.loadDailyData();
              await this.saveDailySummary();
              
              // Show success toast
              const toast = await this.toastController.create({
                message: 'Meal successfully deleted',
                duration: 2000,
                position: 'top',
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              console.error('Error deleting meal:', error);
              // Show error toast
              const toast = await this.toastController.create({
                message: 'Failed to delete meal',
                duration: 2000,
                position: 'top',
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
  
    await alert.present();
  }

  // Handle date selection changes
  onDateSelected(event: any) {
    if (event.value && event.value instanceof Date) {
      this.selectedDate = event.value;
      this.loadDailyData();
      // Update trends when date changes
      this.updateCalorieTrends();
    } else {
      console.warn("Invalid date selected:", event.value);
    }
  }

  // Calculate calorie progress percentage
  getCalorieProgress(): number {
    if (!this.currentCalorieTarget || this.currentCalorieTarget === 0) return 0;
    return (this.dailySummary.totalCalories / this.currentCalorieTarget) * 100;
  }

  // Determine the color of the calorie progress bar
  getCalorieProgressColor(): string {
    const progress = this.getCalorieProgress();
    if (progress > 100) return 'danger';
    if (progress >= 85) return 'success';
    return 'primary';
  }

  // Generate the label for the calorie progress bar
  getCalorieProgressLabel(): string {
    const diff = this.currentCalorieTarget - this.dailySummary.totalCalories;
    return diff >= 0 ? `${Math.round(diff)} kcal remaining` : `${Math.round(Math.abs(diff))} kcal over`;
  }

  // Calculate macro progress percentage
  getMacroProgress(macro: keyof MacroGoals): number {
    const totalKey = `total${macro.charAt(0).toUpperCase() + macro.slice(1)}` as keyof DailySummary;
    const total = (this.dailySummary[totalKey] as number) || 0;
    const goal = this.macroGoals[macro];
    if (!goal || goal === 0) return 0;
    return (total / goal) * 100;
  }

  /**
   * Returns a friendly date string that uses relative terms when appropriate
   */
  getRelativeDateDisplay(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for date comparison
    
    const selectedDay = new Date(this.selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selectedDay.getTime() === today.getTime()) {
      return 'Today';
    } else if (selectedDay.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (selectedDay.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return this.selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  /**
   * Opens the date picker when clicking on the date or calendar icon
   */
  openDatePicker(): void {
    // Programmatically click the hidden date picker toggle
    const datePickerToggle = document.querySelector('mat-datepicker-toggle button') as HTMLElement;
    if (datePickerToggle) {
      datePickerToggle.click();
    }
  }

  /**
   * Navigate to the previous day
   */
  previousDay(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() - 1);
    this.selectedDate = date;
    this.onDateSelected({value: date});
  }

  /**
   * Navigate to the next day
   */
  nextDay(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + 1);
    this.selectedDate = date;
    this.onDateSelected({value: date});
  }

  // Create the chart for displaying calorie trends
  createCalorieChart() {
    const ctx = this.calorieChartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;
    
    this.calorieChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Calories',
          data: [],
          backgroundColor: this.chartColors.backgroundColor,
          borderColor: this.chartColors.borderColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: this.chartColors.gridColor
            },
            ticks: {
              color: '#666'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#666'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    
    this.updateCalorieTrends();
  }
  
  // Load calorie data for trends
  async loadCalorieTrendsData() {
    if (this.selectedTrendPeriod === 'week') {
      await this.loadWeeklyCalorieTrends();
    } else {
      await this.loadMonthlyCalorieTrends();
    }
  }
  
  // Load weekly calorie trends
  async loadWeeklyCalorieTrends() {
    const selectedDate = new Date(this.selectedDate);
    const data = [];
    const labels = [];
    
    // Update the trend period label
    this.trendPeriodLabel = this.getWeekRangeLabel(selectedDate);
    
    // Find the first day of the week containing the selected date
    const day = selectedDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - day); // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Load data for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      // Format the date for storage key
      const formattedDate = this.getFormattedDate(date);
      const summaryStorageKey = `dailySummary_${formattedDate.replace(/-/g, '')}`;
      
      // Get the data from storage
      const storedSummary = await this.storageService.getObject<DailySummary>(summaryStorageKey);
      const calories = storedSummary?.totalCalories || 0;
      
      // Format label as day name (e.g., "Mon")
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      data.push(calories);
      labels.push(dayLabel);
    }
    
    // Update statistics and chart
    this.updateStatistics(data);
    
    if (this.calorieChart) {
      this.calorieChart.data.labels = labels;
      this.calorieChart.data.datasets[0].data = data;
      this.calorieChart.update();
    }
  }

  // Load monthly calorie trends
  async loadMonthlyCalorieTrends() {
    const selectedDate = new Date(this.selectedDate);
    const data = [];
    const labels = [];
    
    // Update the trend period label
    this.trendPeriodLabel = this.getMonthRangeLabel(selectedDate);
    
    // Find the current week within the month (0-4, with 0 being the first week)
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const totalWeeksInMonth = Math.ceil((lastDayOfMonth.getDate() + firstDayOfMonth.getDay()) / 7);
    
    // Generate data for each week in the month
    for (let weekIndex = 0; weekIndex < totalWeeksInMonth; weekIndex++) {
      // Calculate the start date of this week (may include days from previous month)
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(1 - firstDayOfMonth.getDay() + (weekIndex * 7));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      let weeklyTotal = 0;
      let daysWithData = 0;
      
      // Sum up calories for each day in this week
      for (let j = 0; j < 7; j++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + j);
        
        // Only count days within the current month
        if (date.getMonth() === selectedDate.getMonth() && 
            date.getFullYear() === selectedDate.getFullYear()) {
          
          const formattedDate = this.getFormattedDate(date);
          const summaryStorageKey = `dailySummary_${formattedDate.replace(/-/g, '')}`;
          
          const storedSummary = await this.storageService.getObject<DailySummary>(summaryStorageKey);
          
          if (storedSummary?.totalCalories) {
            weeklyTotal += storedSummary.totalCalories;
            daysWithData++;
          }
        }
      }
      
      // Calculate daily average for this week
      const weeklyAverage = daysWithData > 0 ? Math.round(weeklyTotal / daysWithData) : 0;
      
      // Format label as date range (e.g., "Apr 1-7")
      const labelStart = startDate.toLocaleDateString('en-US', { day: 'numeric' });
      const labelEnd = endDate.toLocaleDateString('en-US', { day: 'numeric' });
      const weekLabel = (weekIndex === 0) ? 
        `${labelStart}-${labelEnd}` : 
        `${labelStart}-${labelEnd}`;
      
      data.push(weeklyAverage);
      labels.push(weekLabel);
    }
    
    // Calculate statistics
    this.updateStatistics(data);
    
    if (this.calorieChart) {
      this.calorieChart.data.labels = labels;
      this.calorieChart.data.datasets[0].data = data;
      this.calorieChart.update();
    }
  }
  
  // Update statistics based on provided data
  updateStatistics(data: number[]) {
    const validData = data.filter(val => val > 0);
    
    if (validData.length > 0) {
      this.averageCalories = Math.round(validData.reduce((sum, val) => sum + val, 0) / validData.length);
      this.highestCalories = Math.max(...validData);
      this.lowestCalories = Math.min(...validData);
    } else {
      this.averageCalories = 0;
      this.highestCalories = 0;
      this.lowestCalories = 0;
    }
  }
  
  // Handle changing between weekly and monthly view
  updateCalorieTrends() {
    this.loadCalorieTrendsData();
  }

  // Generate a date range string for the current week containing the selected date
  getWeekRangeLabel(date: Date): string {
    // Find the first day (Sunday) of the week
    const startDate = new Date(date);
    const day = startDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    startDate.setDate(startDate.getDate() - day); // Go to the first day of week (Sunday)
    
    // Find the last day (Saturday) of the week
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Format the date range
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startFormatted} - ${endFormatted}`;
  }

  // Generate a date range string for the current month containing the selected date
  getMonthRangeLabel(date: Date): string {
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return monthName;
  }
}
