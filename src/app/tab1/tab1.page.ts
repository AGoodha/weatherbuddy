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
        detailedForecast: forecast.detailedForecast,
        predictedSoilMoisture: forecast.Predicted_SoilMoisture 
      };
    });

    console.log("Processed Forecast Data: ", this.processedForecastArray);
  }
}
