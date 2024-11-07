import { Injectable } from '@angular/core';
import localforage from 'localforage';

@Injectable({
  providedIn: 'root'
})
export class ActivityProviderService {
  private dbName: string = 'activities';
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private async initDB() {
    // Set up LocalForage configuration
    localforage.config({
      name: this.dbName,
      storeName: 'activities' // Should be alphanumeric, with underscores
    });
  }

  async saveActivity(activity: { id?: number; name: string; frequency: number; precipitationThreshold: number; }): Promise<void> {
    await this.dbReady;
    // Use the activity's id as the key, or generate a new one if not provided
    const key = activity.id ? activity.id.toString() : Date.now().toString();
    await localforage.setItem(key, activity);
  }

  async getActivities(): Promise<any[]> {
    await this.dbReady;
    const activities: any[] = [];
    // Iterate through all items in the store
    await localforage.iterate((value, key) => {
      activities.push(value);
    });
    return activities;
  }

  async deleteActivity(activityId: number): Promise<void> {
    await this.dbReady;
    await localforage.removeItem(activityId.toString());
  }
}
