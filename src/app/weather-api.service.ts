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
    return periods;
  }

  generateCSV(forecast: Forecast[]): string {
    const headers = ['Temperature', 'Is Daytime', 'Precipitation Probability', 'Quantitative Precipitation', 'Detailed Forecast'];
    const rows = forecast.map(f => [
      f.temperature,
      f.isDaytime,
      f.precipitationProbability,
      f.quantitativePrecipitation,
      f.detailedForecast
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  }

  async sendForecastCSV(endpoint: string) {
    const forecast = await this.firstWeatherCall();
    if (!forecast) return;

    const csvData = this.generateCSV(forecast);
    const headers = new HttpHeaders({
      'Content-Type': 'text/csv'
    });

    this.http.post(endpoint, csvData, { headers })
      .subscribe(response => {
        console.log('CSV data sent successfully', response);
      }, error => {
        console.error('Error sending CSV data', error);
      });
  }

  verifyRunLimiter(timestamp: number) {
    const firstTenSeconds = timestamp + 1000000;
    const execute = timestamp <= firstTenSeconds;
    console.log("Ten second limit:", firstTenSeconds);
    return execute;
  }
}
