// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { LocationService } from './location.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class WeatherApiService {
//   constructor(private http: HttpClient, public locationservice: LocationService) { }
//   async location() {
//     let location = await this.locationservice.getLocation().then((location) => {
//      // console.log(location + "location on tbts")
//       return location
//     }).catch((error) => {
//       console.log('Error parsing returned location', error);
//     });
//     return location;
//   }
//   //get time stamp only used in firstWeatherCall
//   firstWeatherCallTimeStamp() {
//     var timestamp = new Date().getTime();
//     return timestamp;
//   }


//   async firstWeatherCall() {

//     //get location 
//     let location = await this.location().then((val) => {
//       return val;
//     })

//     const apiURL = "https://api.weather.gov/points/" + location;
//     //TODO add interfaces to define the structure of the response to be more type safe
//     //get url for detailed forecast
  
    
    
//     let firstUrl =  await this.http.get(apiURL).toPromise().then((response: any) => {
//      let properties = response["properties"];
//      let forecasturl = properties["forecast"];
//      // console.log("forecasturl" + forecasturl);
//       return forecasturl;
//     });

//     console.log("forecasturl1" + firstUrl)
//     const sevendayforecast = new Array;
//     //get detailed forecast
//     let result = await this.http.get(firstUrl).toPromise().then((response: any) => {
//       // console.log("log" + res)
//       let properties = response["properties"];
//       let periods = properties["periods"];
//       // console.log("log" + properties)
//       for (var i = 0; i < periods.length; i++) {
//         let forecast = periods[i];
//         let temp = forecast["temperature"];
//          let name = forecast["name"];
//         let starttime = JSON.stringify(forecast["startTime"]);
//         let enddateindex = starttime.lastIndexOf(":") - 12;
//         let date = starttime.substring(0, enddateindex);
//         let endtime = forecast["endTime"];
//         let isdaytime = forecast['isDaytime'];
//         let windspeed = forecast["windSpeed"];
//         let windDirection = forecast["windDirection"];
//         let detailedForecast = forecast["detailedForecast"];
//         var detailedForecastString = JSON.stringify(forecast["detailedForecast"])
//         var percentprecipIndexEnd = detailedForecastString.toUpperCase().indexOf("%") - 1;
//         var percentprecipIndexStart = percentprecipIndexEnd - 3;
//         var percentprecip = (detailedForecast.substring(percentprecipIndexStart, percentprecipIndexEnd))
//         if (percentprecip.length <= 0) {
//           percentprecip = "0";
//         };
//         sevendayforecast.push([name + "Temperature" +temp + "Precipitation" + percentprecip]);
//       }
//       return sevendayforecast;
//     })
//     this.firstWeatherCallTimeStamp();
//     console.log("result1" + sevendayforecast)
//     return result;

//   }
//   //Compare given time with timestamp of last API ccall only for first weather API call. 
// verifyRunLimiter(timestamp: number) {
//   var execute = false;
//   var firsttensecoinds= timestamp + 1000000;
//   if((timestamp <= firsttensecoinds)){
//     console.log("tensecondprint=" + firsttensecoinds)
//     var execute = true;
//   }
//   return execute;
// }
  //TODO forcast will be collected on demand and used once a day then purged
//}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocationService } from './location.service';

// Interface to define the structure of a weather forecast
interface Forecast {
  temperature: number;
  isDaytime: boolean;
  HDD: number;
  CDD: number;
  precipitationProbability: number;
  estimatedPrecipitation: number;
  detailedForecast: string;
  mlModelPrediction?: string; // This will hold the prediction from the ML model
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
    const firstUrl = await this.http.get(apiURL).toPromise().then((response: any) => response?.properties?.forecast);

    console.log("Forecast URL: " + firstUrl);
    if (!firstUrl) return;

    const result = await this.http.get(firstUrl).toPromise().then(async (response: any) => {
      const periods: Forecast[] = response?.properties?.periods.map((forecast: any) => {
        const { temperature, isDaytime, probabilityOfPrecipitation, dewpoint, relativeHumidity } = forecast;
        const HDD = Math.max(0, this.baseTemperature - temperature);
        const CDD = Math.max(0, temperature - this.baseTemperature);
        const precipitationProbability = probabilityOfPrecipitation?.value ?? 0;
        const estimatedPrecipitation = this.estimatePrecipitation(precipitationProbability, dewpoint.value, relativeHumidity.value);

        return {
          temperature,
          isDaytime,
          HDD,
          CDD,
          precipitationProbability,
          estimatedPrecipitation,
          detailedForecast: forecast.detailedForecast
        };
      });
      //TODO create end point in AWS hosting ML model to make prediction on trail ridability given this data. 
      // // Simulate sending weather data to an API and getting a response
      // const apiResponse = await this.sendWeatherDataToAPI(periods);
      // if (apiResponse) {
      //   periods.forEach((forecast: Forecast, index: number) => {
      //     forecast.mlModelPrediction = apiResponse[index]?.mlModelPrediction || 'No prediction';
      //   });
      // }
      return periods;
    });

    console.log("Weather Data:", result);
    return result;
  }

  estimatePrecipitation(precipProbability: number, dewPoint: number, humidity: number): number {
    if (precipProbability === 0) return 0;
    // Simple model assuming the likelihood of precipitation amount increases with humidity and dew point
    const precipitation = precipProbability * dewPoint * humidity / 10000;
    return parseFloat(precipitation.toFixed(2)); // Return a reasonable precision
  }

  // async sendWeatherDataToAPI(data: Forecast[]): Promise<any[]> {
  //   const apiUrl = 'http://your-api-endpoint-ip-address'; // Replace with your actual API endpoint
  //   return this.http.post<any[]>(apiUrl, data).toPromise();
  // }
  

  verifyRunLimiter(timestamp: number) {
    const firstTenSeconds = timestamp + 1000000;
    const execute = timestamp <= firstTenSeconds;
    console.log("Ten second limit:", firstTenSeconds);
    return execute;
  }
}


