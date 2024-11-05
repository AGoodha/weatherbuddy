import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocationService } from './location.service';

interface ForecastPeriod {
  temperature: number;
  isDaytime: boolean;
  probabilityOfPrecipitation: {
    value: number;
  };
  detailedForecast: string;
  startTime: string;
  endTime: string;
}

interface GridData {
  properties: {
    quantitativePrecipitation: {
      values: Array<{
        value: number;
        validTime: string;
      }>
    }
  }
}

interface Forecast {
  temperature: number;
  isDaytime: boolean;
  precipitationProbability: number;
  quantitativePrecipitation: number;
  detailedForecast: string;
  predictedSoilMoisture?: number; // Added property for predicted soil moisture
  Predicted_SoilMoisture?: number; // New property added
}

@Injectable({
  providedIn: 'root'
})
export class WeatherApiService {
  baseTemperature: number = 65; // Base temperature for HDD and CDD calculations
  private readonly FORECAST_STORAGE_KEY = 'forecastData';

  constructor(private http: HttpClient, public locationservice: LocationService) { }

  async location() {
    try {
      const location = await this.locationservice.getLocation();
      return location;
    } catch (error) {
      console.error('Error parsing returned location', error);
      return null;
    }
  }

  async firstWeatherCall() {
    const location = await this.location();
    if (!location) return;

    const apiURL = `https://api.weather.gov/points/${location}`;
    const gridDataUrl = await this.http.get<any>(apiURL).toPromise().then(response => response.properties.forecastGridData);
    const forecastUrl = await this.http.get<any>(apiURL).toPromise().then(response => response.properties.forecast);

    if (!gridDataUrl || !forecastUrl) return;

    const forecastData = await this.http.get<any>(forecastUrl).toPromise();
    const gridData = await this.http.get<GridData>(gridDataUrl).toPromise();

    const periods: Forecast[] = forecastData.properties.periods.map((forecast: ForecastPeriod) => {
      const { temperature, isDaytime, probabilityOfPrecipitation, startTime, endTime, detailedForecast } = forecast; 
      const precipitationProbability = probabilityOfPrecipitation?.value ?? 0;

      const quantitativePrecip = gridData.properties.quantitativePrecipitation.values.find(precip => {
        const precipStartTime = new Date(precip.validTime.split('/')[0]);
        const forecastStartTime = new Date(startTime);
        const forecastEndTime = new Date(endTime);
        return precipStartTime >= forecastStartTime && precipStartTime < forecastEndTime;
      })?.value ?? 0;

      return {
        temperature,
        isDaytime,
        precipitationProbability,
        quantitativePrecipitation: quantitativePrecip,
        detailedForecast
      };
    }).filter((forecast: Forecast) => forecast.isDaytime);

    // Save the forecast data to local storage
    this.saveForecastToLocal(periods);

    // Call sendForecastCSV with the forecast data and wait for it to complete
    await this.sendForecastCSV(periods);

    return periods;
  }

  private saveForecastToLocal(forecast: Forecast[]): void {
    const dataWithTimestamp = {
      forecast,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(this.FORECAST_STORAGE_KEY, JSON.stringify(dataWithTimestamp));
  }

  private getForecastFromLocal(): Forecast[] {
    const data = localStorage.getItem(this.FORECAST_STORAGE_KEY);
    if (data) {
      const parsedData = JSON.parse(data);
      const currentTime = new Date().getTime();
      const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      // Check if the data is older than 7 days
      if (currentTime - parsedData.timestamp < sevenDaysInMillis) {
        return parsedData.forecast;
      } else {
        this.clearForecastFromLocal(); // Clear expired data
      }
    }
    return [];
  }

  private clearForecastFromLocal(): void {
    localStorage.removeItem(this.FORECAST_STORAGE_KEY);
  }

  async send14DaysForecast() {
    const storedForecast = this.getForecastFromLocal();
    if (storedForecast.length > 0) {
          // Send the stored forecast data to the ML model
          await this.sendForecastCSV(storedForecast);
          // Optionally clear the stored data after sending
          this.clearForecastFromLocal();
        } else {
          console.log('No forecast data available to send.');
        }
      }
    
      generateCSV(forecast: Forecast[]): string {
        const headers = ['Precipitation', 'Temperature'];
        const rows = forecast.map(f => [
          f.quantitativePrecipitation,
          f.temperature
        ]);
    
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
          csvContent += row.join(',') + '\n';
        });
    
        return csvContent;
      }
    
      private extractPredictedSoilMoisture(response: any): number[] {
        // Assuming the response is a JSON string, parse it into an object
        const data = JSON.parse(response);
        
        // Check if data is an array
        if (Array.isArray(data)) {
            // Map through the array to extract the Predicted_SoilMoisture values
            const predictedValues = data.map(entry => parseFloat(entry.Predicted_SoilMoisture));
            
            // Return the array of predicted values
            return predictedValues;
        }
        
        // Return an empty array if the data is not in the expected format
        return [];
      }
    
      private updateForecastWithSoilMoisture(forecast: Forecast[], predictedSoilMoisture: number[]): void {
        // Ensure that the forecast and predicted values have the same length
        const length = Math.min(forecast.length, predictedSoilMoisture.length);
    
        // Update each forecast entry with the corresponding predicted soil moisture
        for (let i = 0; i < length; i++) {
            forecast[i]['Predicted_SoilMoisture'] = predictedSoilMoisture[i]; // Add the predicted soil moisture to each item
        }
      }
    
      async sendForecastCSV(forecast: Forecast[]): Promise<void> {
        if (!forecast) return;
    
        const csvData = this.generateCSV(forecast);
        const headers = new HttpHeaders({
          'Content-Type': 'text/csv'
        });
    
        const endpoint = 'https://www.goodhartapps.com/predict';
        console.log('CSV Data:', csvData);
    
        try {
          const response = await this.http.post(endpoint, csvData, { headers }).toPromise();
          console.log('CSV data sent successfully', response);
    
          // Process the response to extract predicted soil moisture
          const predictedSoilMoisture = this.extractPredictedSoilMoisture(response);
          console.log('Predicted Soil Moisture:', predictedSoilMoisture);
    
          // Update the forecast data with the predicted soil moisture
          this.updateForecastWithSoilMoisture(forecast, predictedSoilMoisture);
          console.log('Forecast with predicted soil moisture:', forecast);
        } catch (error) {
          console.error('Error sending CSV data', error);
        }
      }
    }
    
