import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  async ngOnInit() {
    const { value: onboardingComplete } = await Preferences.get({ key: 'onboardingComplete' });
    const { value: welcomeComplete } = await Preferences.get({ key: 'hasSeenWelcome' });
    
    if (onboardingComplete === 'true') {
      this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } else if (welcomeComplete === 'true') {
      this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/welcome', { replaceUrl: true });
    }
  }
}