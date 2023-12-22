import { Component } from '@angular/core';
import { ActivityProviderService } from '../activity-provider.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  activityName: string = '';
  activityFrequency: number = 0;
  precipitationThreshold: number = 0;
  activities: any[] = []; // Array to hold activities

  constructor(private activityProvider: ActivityProviderService) {
    this.loadActivities(); // Load activities on initialization
  }

  async saveActivity() {
    const newActivity = {
      name: this.activityName,
      frequency: this.activityFrequency,
      precipitationThreshold: this.precipitationThreshold
    };
    await this.activityProvider.saveActivity(newActivity);
    this.loadActivities(); // Reload activities after saving

    // Clear the form fields
    this.activityName = '';
    this.activityFrequency = 0;
    this.precipitationThreshold = 0;
  }

  async loadActivities() {
    // Using nullish coalescing operator to ensure this.activities is always an array
    this.activities = await this.activityProvider.getActivities() ?? [];
  }

  async deleteActivity(activityId: number) {
    await this.activityProvider.deleteActivity(activityId);
    this.loadActivities(); // Reload activities after deletion
  }
}
