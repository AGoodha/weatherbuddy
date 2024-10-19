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
    
    console.log("Grid Data URL: " + gridDataUrl);
    console.log("Forecast URL: " + forecastUrl);
    if (!gridDataUrl || !forecastUrl) return;

    const forecastData = await this.http.get<any>(forecastUrl).toPromise();
    const gridData = await this.http.get<GridData>(gridDataUrl).toPromise();

    const periods: Forecast[] = forecastData.properties.periods.map((forecast: ForecastPeriod) => {
      const { temperature, isDaytime, probabilityOfPrecipitation, startTime, endTime, detailedForecast } = forecast; 
      const precipitationProbability = probabilityOfPrecipitation?.value ?? 0;

      // Find the quantitative precipitation value corresponding to the forecast period
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
    });

    console.log("Weather Data:", periods);

    // Call sendForecastCSV with the forecast data
    await this.sendForecastCSV(periods);

    return periods;
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

  private extractPredictedSoilMoisture(response: any): number {
    // Assuming the response is a CSV string, split it into lines
    const lines = response.split('\n');
    
    // Get the last line which contains the predicted soil moisture
    const lastLine = lines[lines.length - 1];
    
    // Split the last line by commas and extract the Predicted_SoilMoisture value
    const values = lastLine.split(',');
    
    // Assuming Predicted_SoilMoisture is the last value in the response
    return parseFloat(values[values.length - 1]);
  }

  private updateForecastWithSoilMoisture(forecast: Forecast[], predictedSoilMoisture: number) {
    // Update each forecast entry with the predicted soil moisture
    forecast.forEach(item => {
      item['Predicted_SoilMoisture'] = predictedSoilMoisture; // Add the predicted soil moisture to each item
    });
  }
  async sendForecastCSV(forecast: Forecast[]) {
    if (!forecast) return;

    const csvData = this.generateCSV(forecast);
    const headers = new HttpHeaders({
      'Content-Type': 'text/csv'
    });

    const endpoint = 'http://137.184.9.15:5000/predict';
    console.log('csvdata', csvData);
    
    this.http.post(endpoint, csvData, { headers })
      .subscribe(response => {
        console.log('CSV data sent successfully', response);
        
        // Process the response to extract Predicted_SoilMoisture
        const predictedSoilMoisture = this.extractPredictedSoilMoisture(response);
        
        // Update the forecast data with the predicted soil moisture
        this.updateForecastWithSoilMoisture(forecast, predictedSoilMoisture);
      });
  }
}
