import { Component, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { register } from 'swiper/element/bundle';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Register Swiper custom elements
register();

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WelcomePage implements AfterViewInit {
  @ViewChild('swiper') swiperRef: ElementRef | undefined;
  
  private swiper: any;

  constructor(private router: Router) {}
  
  ngAfterViewInit() {
    // Initialize swiper after view init
    const swiperEl = this.swiperRef?.nativeElement;
  
    // Set any Swiper options
    Object.assign(swiperEl, {
      injectStyles: [':host { height: 100% }'],
      pagination: {
        clickable: true
      },
      initialSlide: 0
    });
    
    // Initialize swiper
    swiperEl.initialize();
    
    // Store reference
    this.swiper = swiperEl.swiper;
  }

  nextSlide() {
    if (this.swiper) {
      this.swiper.slideNext();
    } else {
      console.error('Swiper not initialized');
    }
  }

  previousSlide() {
    if (this.swiper) {
      this.swiper.slidePrev();
    }
  }

  async completeWelcome() {
    await Preferences.set({ key: 'hasSeenWelcome', value: 'true' });
    //Navigate to onboarding instead of home
    this.router.navigateByUrl('/onboarding', { replaceUrl: true });
  }
  
  skipWelcome() {
    this.completeWelcome();
  }
}