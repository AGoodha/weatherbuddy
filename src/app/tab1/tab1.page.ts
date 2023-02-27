import { Component } from '@angular/core';
import { WeatherApiService } from '../weather-api.service';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  forecastarray: any = [];

  constructor(public weatherapiservice: WeatherApiService) {
    this.weatherapiservice.location();
    this.wetherCall();
  }
  //Get forecast for interpolation with html page
wetherCall(){
   //get current time for run limter
  var timestamp = new Date().getTime();
 //check if enough time has passed to execute again
 var execute = this.weatherapiservice.verifyRunLimiter(timestamp);
  if(execute) {
  this.weatherapiservice.firstWeatherCall().then(result=> {
    this.forecastarray = result
   console.log("executed weather call from tab1" + this.forecastarray);
    })
   }
}
//TODO finish run limter on wetaher API call and location call
}
