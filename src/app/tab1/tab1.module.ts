import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { WeatherApiService } from '../weather-api.service';
import { Tab1PageRoutingModule } from './tab1-routing.module';
import { ActivityProviderService } from '../activity-provider.service';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab1PageRoutingModule
  ],
  declarations: [Tab1Page],
  providers: [WeatherApiService, ActivityProviderService] // Add ActivityProviderService here
})
export class Tab1PageModule {
  constructor(public weatherApiService: WeatherApiService, public activityProviderService: ActivityProviderService) { 
  }
}
