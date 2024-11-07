import { Component } from '@angular/core';
import { WeatherApiService } from '../weather-api.service';
import { ActivityProviderService } from '../activity-provider.service'; // Import the service

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  forecastArray: any = [];
  processedForecastArray: any[] = [];
  activityFrequency: number = 0;
  precipitationThreshold: number = 0;

  constructor(
    public weatherApiService: WeatherApiService,
    private activityProviderService: ActivityProviderService // Inject the service
  ) {
    this.weatherCall();
    this.getActivityThresholds();
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
      return {
        day: forecast.name,
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

  async getActivityThresholds() {
    const lastActivity = await this.getLastSavedActivity(); // Await the method to get the last activity
    if (lastActivity) {
      this.activityFrequency = lastActivity.frequency;
      this.precipitationThreshold = lastActivity.precipitationThreshold;
      console.log("Activity Frequency: ", this.activityFrequency);
      console.log("Precipitation Threshold: ", this.precipitationThreshold);
    }
  }

  async getLastSavedActivity() {
    const activities = await this.activityProviderService.getActivities(); // Get all activities
    return activities.length > 0 ? activities[activities.length - 1] : null; // Return the last activity if exists
  }
}
