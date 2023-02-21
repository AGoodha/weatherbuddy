import { Component } from '@angular/core';
import { WeatherApiService } from '../weather-api.service';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(public weatherapiservice: WeatherApiService) {
    this.weatherapiservice.location();
    this.weatherapiservice.firstWeatherCall();
  }

}
