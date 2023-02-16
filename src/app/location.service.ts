import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor(private geolocation: Geolocation) { }
  async getLocation(){

    let result = await this.geolocation.getCurrentPosition().then((resp: { coords: { latitude: any; longitude: any; }; }) => {
        var lat = resp.coords.latitude
       var long = resp.coords.longitude
       var gpscoordinates = lat + ',' + long 
       return gpscoordinates
      }).catch((error: any) => {
        console.log('Error getting location', error);
      });
      
     //  let watch = this.geolocation.watchPosition();
     //  watch.subscribe((data) => {
     //   // data can be a set of coordinates, or an error (if an error occurred).
     //   // data.coords.latitude
     //   // data.coords.longitude
     //  });
   return result
   }
   
}
