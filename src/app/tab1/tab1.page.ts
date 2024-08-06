// import { Component } from '@angular/core';
// import { WeatherApiService } from '../weather-api.service';

// @Component({
//   selector: 'app-tab1',
//   templateUrl: 'tab1.page.html',
//   styleUrls: ['tab1.page.scss']
// })
// export class Tab1Page {
//   forecastarray: any = [];
//   processedForecastArray: any[] = []; // Declare the property here
//   //TODO: Build ML model to predict trail reopen from weather data.  Use this array to train the model.
//   constructor(public weatherapiservice: WeatherApiService) {
//     this.weatherapiservice.location();
//     this.wetherCall();
//   }

//   // Get forecast for interpolation with HTML page
//   wetherCall() {
//     // get current time for run limiter
//     var timestamp = new Date().getTime();
//     // check if enough time has passed to execute again
//     // var execute = this.weatherapiservice.verifyRunLimiter(timestamp);
//     var execute = true
//     if (execute) {
//       this.weatherapiservice.firstWeatherCall().then(result => {
//         this.forecastarray = result;
//         console.log("executed weather call from tab1" + this.forecastarray);
//         // Process the forecast array here if needed
//         this.processForecastArray();
//       });
//     }
//   }

//   // Example method to process the forecast array
//   processForecastArray() {
//     this.processedForecastArray = this.forecastarray.map((forecast: any) => {
//       // Convert forecast to string if it's not already a string
//     const forecastString = typeof forecast === 'string' ? forecast : JSON.stringify(forecast);

//       // Adjusted regex patterns to match the provided data format
//       let dayMatch = forecastString.match(/^(.*?)Temperature/);
//       let tempMatch = forecastString.match(/Temperature(-?\d+)/); // Corrected to include potential negative temperatures
//           // Adjusted regex for precipitation to include an optional space
//       let precipMatch = forecastString.match(/Precipitation\s*(\d+)/);
//       return {
//         // Trim the day string to remove any leading or trailing whitespace or unwanted characters
//         day: dayMatch ? dayMatch[1].trim().replace(/^[\["]+/, '') : '',
//         temperature: tempMatch ? parseInt(tempMatch[1]) : 0,
//         precipitation: precipMatch ? parseInt(precipMatch[1]) : 0
//       };
//     });
//   }
// }
import { Component } from '@angular/core';
import { WeatherApiService } from '../weather-api.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  forecastArray: any = [];
  processedForecastArray: any[] = []; // Declare the property here

  constructor(public weatherApiService: WeatherApiService) {
    this.weatherCall(); // Ensuring the call is made when the component is initialized
  }

  weatherCall() {
    this.weatherApiService.firstWeatherCall().then(result => {
      this.forecastArray = result;
      console.log("Weather forecast data received: ", this.forecastArray);
      this.processForecastArray();
    }).catch(error => {
      console.error("Failed to retrieve weather data: ", error);
    });
  }

  processForecastArray() {
    this.processedForecastArray = this.forecastArray.map((forecast: any) => {
      // Assuming forecast contains all necessary properties directly
      return {
        day: forecast.name, // Name of the period, e.g., "Today"
        temperature: forecast.temperature,
        isDaytime: forecast.isDaytime,
        HDD: forecast.HDD,
        CDD: forecast.CDD,
        precipitationProbability: forecast.precipitationProbability,
        estimatedPrecipitation: forecast.quantitativePrecipitation,
        detailedForecast: forecast.detailedForecast
      };
    });

    console.log("Processed Forecast Data: ", this.processedForecastArray);
  }
}
