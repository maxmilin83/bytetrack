import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import { camera, barChartOutline, settingsOutline, arrowForward, arrowBack, checkmark } from 'ionicons/icons';

// Register all icons used in the app
addIcons({
  'camera': camera,
  'bar-chart-outline': barChartOutline,
  'settings-outline': settingsOutline,
  'arrow-forward': arrowForward,
  'arrow-back': arrowBack,
  'checkmark': checkmark
});

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));