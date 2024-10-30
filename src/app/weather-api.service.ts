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
    }).filter((forecast: Forecast) => forecast.isDaytime); // Explicitly define the type here
  
    console.log("Weather Data:", periods);
  
    // Call sendForecastCSV with the forecast data and wait for it to complete
    await this.sendForecastCSV(periods);
  
    return periods; // Now this will return after predicted soil moisture is added
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

    const endpoint = 'http://137.184.9.15:5000/predict';
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

