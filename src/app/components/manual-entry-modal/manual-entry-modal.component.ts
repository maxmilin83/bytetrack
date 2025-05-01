import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manual-entry-modal',
  templateUrl: './manual-entry-modal.component.html',
  styleUrls: ['./manual-entry-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ManualEntryModalComponent implements OnInit {
  foodForm!: FormGroup;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  ngOnInit() {
    this.foodForm = this.fb.group({
      name: ['', Validators.required],
      calories: ['', [Validators.required, Validators.min(0)]],
      protein: ['', [Validators.required, Validators.min(0)]],
      carbs: ['', [Validators.required, Validators.min(0)]],
      fat: ['', [Validators.required, Validators.min(0)]]
    });
  }

  preventInvalidNumberInput(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.foodForm.valid) {
      const formData = {
        name: this.foodForm.value.name,
        calories: parseFloat(this.foodForm.value.calories),
        protein: parseFloat(this.foodForm.value.protein),
        carbs: parseFloat(this.foodForm.value.carbs),
        fat: parseFloat(this.foodForm.value.fat)
      };
      return this.modalCtrl.dismiss(formData, 'confirm');
    }
    return; 
  }
}