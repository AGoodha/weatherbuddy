import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocationService } from './location.service'

@Injectable({
  providedIn: 'root'
})
export class WeatherApiService {

  constructor(private http: HttpClient, public locationservice: LocationService) { }
  async location() {
    let location = await this.locationservice.getLocation().then((location: any) => {
      //console.log(location + "location on tbts")
      return location
    }).catch((error: any) => {
      console.log('Error parsing returned location', error);
    });
    return location;
  }
  //get time stamp only used in firstWeatherCall
  firstWeatherCallTimeStamp() {
    var timestamp = new Date().getTime();
    return timestamp;
  }


  async firstWeatherCall() {
    let location = await this.location().then((val) => {
      return val;
    })

    const apiURL = "https://api.weather.gov/points/" + location;
    //get url for detailed forecst
    let firstUrl = await this.http.get(apiURL).toPromise().then(res => { // Success
      // console.log("log" + res)
      let properties = res["properties"];
      let periods = properties["forecast"];
      //console.log("periods" + periods)
      return periods;
    })



    const sevendayforecast = new Array;
    //get detailed forecast
    let result = await this.http.get(firstUrl).toPromise().then(res => { // Success
      // console.log("log" + res)
      let properties = res["properties"];
      let periods = properties["periods"];
      // console.log("log" + properties)
      for (var i = 0; i < periods.length; i++) {
        let forecast = periods[i];
        let temp = forecast["temperature"];
        let name = forecast["name"];
        let starttime = JSON.stringify(forecast["startTime"]);
        let enddateindex = starttime.lastIndexOf(":") - 12;
        let date = starttime.substring(0, enddateindex);
        let endtime = forecast["endTime"];
        let isdaytime = forecast['isDaytime'];
        let windspeed = forecast["windSpeed"];
        let windDirection = forecast["windDirection"];
        let detailedForecast = forecast["detailedForecast"];
        var detailedForecastString = JSON.stringify(forecast["detailedForecast"])
        var percentprecipIndexEnd = detailedForecastString.toUpperCase().indexOf("%") - 1;
        var percentprecipIndexStart = percentprecipIndexEnd - 3;
        var percentprecip = (detailedForecast.substring(percentprecipIndexStart, percentprecipIndexEnd))
        if (percentprecip.length <= 0) {
          percentprecip = "0";
        };
        sevendayforecast.push([date, name, isdaytime, temp, percentprecip]);
      }
      return sevendayforecast;
    }).catch((error) => {
      console.log('Error parsing returned forecast', error);
    });
    this.firstWeatherCallTimeStamp();
    return result;

  }
  //TODO forcast will be collected on demand and used once a day then purged
}
