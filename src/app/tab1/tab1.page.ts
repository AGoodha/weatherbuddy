import { Component } from '@angular/core';
import { WeatherApiService } from '../weather-api.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  forecastarray: any = [];
  processedForecastArray: any[]; // Declare the property here


  constructor(public weatherapiservice: WeatherApiService) {
    this.weatherapiservice.location();
    this.wetherCall();
     // Example original data
     let forecastarray = [
      "TodayTemperature58Precipitation0",
      "TonightTemperature26Precipitation0",
      // Add the rest of your forecast data here...
    ];

    this.processedForecastArray = forecastarray.map(forecastString => {
      let dayMatch = forecastString.match(/^[A-Za-z ]+/);
      let tempMatch = forecastString.match(/Temperature(\d+)/);
      let precipMatch = forecastString.match(/Precipitation(\d+)/);

      return {
        day: dayMatch ? dayMatch[0].trim() : '',
        temperature: tempMatch ? parseInt(tempMatch[1]) : 0,
        precipitation: precipMatch ? parseInt(precipMatch[1]) : 0
      };
    });
  }
  

  // Get forecast for interpolation with html page
  wetherCall() {
    // get current time for run limiter
    var timestamp = new Date().getTime();
    // check if enough time has passed to execute again
    var execute = this.weatherapiservice.verifyRunLimiter(timestamp);
    if (execute) {
      this.weatherapiservice.firstWeatherCall().then(result => {
        this.forecastarray = result;
        console.log("executed weather call from tab1" + this.forecastarray);
      });
    }
  }

}




//TODO fin