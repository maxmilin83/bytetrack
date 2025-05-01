import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { IonicModule, ModalController, Platform, ViewWillEnter, IonList, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { OpenAiService } from '../../services/openai.service';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ManualEntryModalComponent } from '../../components/manual-entry-modal/manual-entry-modal.component';
import { DataStorageService, DailySummary, MealEntry } from '../../services/data-storage.service';
import { StorageService } from '../../services/storage.service';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ManualEntryModalComponent]
})
export class HomePage implements OnInit, ViewWillEnter {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('loggedFoodList') loggedFoodList?: IonList;

  capturedImage: string | undefined;
  imageLoading = false;
  foodResult: any = null;
  errorMessage: string | null = null;

  todaysSummary: DailySummary = { 
    totalCalories: 0, 
    totalProtein: 0, 
    totalCarbs: 0, 
    totalFat: 0,
    calorieTarget: 2000
  };
  todaysLog: MealEntry[] = [];
  calorieProgress: number = 0;
  calorieProgressColor: string = 'success';

  currentCalorieTarget: number = 2000;

  get calorieTarget(): number {
    return this.todaysSummary.calorieTarget;
  }

  private openAiService = inject(OpenAiService);
  private modalCtrl = inject(ModalController);
  private platform = inject(Platform);
  private dataStorageService = inject(DataStorageService);
  private storageService = inject(StorageService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  trackMealById(index: number, meal: MealEntry): string {
    return meal.id;
  }

  async ngOnInit() {
    await this.loadCurrentTarget();
  }

  async ionViewWillEnter() {
    await this.loadCurrentTarget();
    this.loadTodaysData();
    this.resetAnalysisState();
  }

  async loadCurrentTarget() {
    const target = await this.storageService.getNumber('calorieTarget');
    this.currentCalorieTarget = target ?? 2000;
  }

  async loadTodaysData(): Promise<void> {
    try {
      const { log, summary } = await this.dataStorageService.getTodaysData();
      this.todaysLog = log.sort((a, b) => b.timestamp - a.timestamp);
      this.todaysSummary = summary;
      this.updateCalorieProgress();
      console.log('Loaded today\'s data:', this.todaysSummary, 'Log:', this.todaysLog);
    } catch (error) {
      console.error("Error loading today's data:", error);
      this.errorMessage = "Could not load today's data.";
      this.todaysLog = [];
      this.todaysSummary = { 
        totalCalories: 0, 
        totalProtein: 0, 
        totalCarbs: 0, 
        totalFat: 0, 
        calorieTarget: 2000 
      };
      this.updateCalorieProgress();
    }
  }

  updateCalorieProgress(): void {
    const target = this.todaysSummary.calorieTarget;
    if (target > 0) {
      this.calorieProgress = Math.min(this.todaysSummary.totalCalories / target, 1.5);
      this.calorieProgressColor = this.todaysSummary.totalCalories > target ? 'danger' : 'success';
    } else {
      this.calorieProgress = 0;
      this.calorieProgressColor = 'medium';
    }
  }

  async takePhoto(): Promise<void> {
    if (!Capacitor.isPluginAvailable('Camera')) {
       this.errorMessage = 'Camera is not available on this device.';
       return;
    }
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Camera,
      });
      this.capturedImage = image.dataUrl;
      if (this.capturedImage) this.analyzeImage();
    } catch (error: any) {
       if (error.message?.includes('cancelled')) {
         this.errorMessage = null; 
       } else {
         this.errorMessage = 'Failed to take photo.'; console.error('Camera error:', error);
       }
    }
  }

  async uploadPhoto(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Photos,
        });
        this.capturedImage = image.dataUrl;
        if (this.capturedImage) this.analyzeImage();
      } catch (error: any) {
         if (error.message?.includes('cancelled')) {
           this.errorMessage = null; 
         } else {
           this.errorMessage = 'Failed to select photo.'; console.error('Photo selection error:', error);
         }
      }
    } else {
      this.triggerWebFileUpload();
    }
  }

  triggerWebFileUpload(): void { this.fileInput?.nativeElement.click(); }

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) { this.errorMessage = 'Please select an image file.'; return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.capturedImage = e.target?.result as string;
        if (this.capturedImage) this.analyzeImage();
      };
      reader.onerror = () => { this.errorMessage = 'Error reading image file.'; };
      reader.readAsDataURL(file);
    }
  }

  analyzeImage(): void {
    if (!this.capturedImage) return;
    this.imageLoading = true; this.errorMessage = null; this.foodResult = null;
    this.openAiService.analyzeFood(this.capturedImage).subscribe({
      next: (result) => {
        this.imageLoading = false;
        if (result.error) { this.errorMessage = result.error; } else { this.foodResult = result; }
      },
      error: (error) => {
        this.imageLoading = false;
        this.errorMessage = error.error?.message || error.message || 'Failed to analyze image';
        console.error('Analysis error:', error);
      }
    });
  }

  async openManualEntryModal(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: ManualEntryModalComponent });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      await this._addMealToLog(data);
    }
  }

  async addFoodToToday(): Promise<void> {
    if (this.foodResult) {
      await this._addMealToLog(this.foodResult);
    } else {
      console.warn("AddFoodToToday called without foodResult");
    }
  }

  private async _addMealToLog(mealData: Omit<MealEntry, 'id' | 'timestamp'>) {
    if (!mealData) return;
    try {
      await this.dataStorageService.addMealEntry(mealData);
      await this.loadTodaysData();
      this.resetAnalysisState();
      
      // Show success toast
      const toast = await this.toastController.create({
        message: `${mealData.name} added to your meals!`,
        duration: 2000,
        position: 'top',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error adding meal:', error);
      this.errorMessage = 'Failed to add meal to log.';
      
      // Show error toast
      const toast = await this.toastController.create({
        message: 'Failed to add meal to log',
        duration: 2000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    }
  }

  async deleteFoodEntry(mealId: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this meal?',
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
              await this.dataStorageService.deleteMealEntry(mealId);
              await this.loadTodaysData();
              
              // Show success toast at the top of the screen
              const toast = await this.toastController.create({
                message: 'Meal successfully deleted',
                duration: 2000,
                position: 'top', 
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              console.error('Error deleting meal:', error);
              
              // Show error toast at the top of the screen
              const toast = await this.toastController.create({
                message: 'Failed to delete meal',
                duration: 2000,
                position: 'top', 
                color: 'danger'
              });
              await toast.present();
              
              this.errorMessage = 'Failed to delete meal from log.';
            }
          }
        }
      ]
    });

    await alert.present();
  }

  resetAnalysisState(): void {
    this.capturedImage = undefined;
    this.foodResult = null;
    this.errorMessage = null;
    this.imageLoading = false;
  }
}

addIcons({
  'trash-outline': trashOutline
});