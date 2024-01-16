import { Component } from '@angular/core';
import { WeatherApiService } from '../weather-api.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  forecastarray: any = [];
  processedForecastArray: any[] = []; // Declare the property here
  //TODO: Build ML model to predict trail reopen from weather data.  Use this array to train the model.
  constructor(public weatherapiservice: WeatherApiService) {
    this.weatherapiservice.location();
    this.wetherCall();
  }

  // Get forecast for interpolation with HTML page
  wetherCall() {
    // get current time for run limiter
    var timestamp = new Date().getTime();
    // check if enough time has passed to execute again
    var execute = this.weatherapiservice.verifyRunLimiter(timestamp);
    if (execute) {
      this.weatherapiservice.firstWeatherCall().then(result => {
        this.forecastarray = result;
        console.log("executed weather call from tab1" + this.forecastarray);
        // Process the forecast array here if needed
        this.processForecastArray();
      });
    }
  }

  // Example method to process the forecast array
  processForecastArray() {
    this.processedForecastArray = this.forecastarray.map((forecast: any) => {
      // Convert forecast to string if it's not already a string
    const forecastString = typeof forecast === 'string' ? forecast : JSON.stringify(forecast);

      // Adjusted regex patterns to match the provided data format
      let dayMatch = forecastString.match(/^(.*?)Temperature/);
      let tempMatch = forecastString.match(/Temperature(-?\d+)/); // Corrected to include potential negative temperatures
          // Adjusted regex for precipitation to include an optional space
      let precipMatch = forecastString.match(/Precipitation\s*(\d+)/);
      return {
        // Trim the day string to remove any leading or trailing whitespace or unwanted characters
        day: dayMatch ? dayMatch[1].trim().replace(/^[\["]+/, '') : '',
        temperature: tempMatch ? parseInt(tempMatch[1]) : 0,
        precipitation: precipMatch ? parseInt(precipMatch[1]) : 0
      };
    });
  }
}
