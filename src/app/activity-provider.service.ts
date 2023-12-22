import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class ActivityProviderService {
  private db: SQLiteDBConnection | null = null;
  private dbReady: Promise<void>;
  private dbName: string = 'activities.db';

  constructor() {
    this.dbReady = this.initDB();
  }

  private async initDB() {
    try {
      const sqlite = new SQLiteConnection(CapacitorSQLite);
      this.db = await sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      await this.db.open();
      await this.db.execute(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        frequency INTEGER,
        precipitationThreshold INTEGER
      );`);
    } catch (error) {
      console.error('Error during DB initialization:', error);
    }
  }

  async saveActivity(activity: { name: string; frequency: number; precipitationThreshold: number; }): Promise<void> {
    await this.dbReady;
    const statement = `INSERT INTO activities (name, frequency, precipitationThreshold) VALUES (?, ?, ?)`;
    if (this.db) {
      await this.db.run(statement, [activity.name, activity.frequency, activity.precipitationThreshold]);
    }
  }

  async getActivities(): Promise<any[] | undefined> {
    await this.dbReady;
    const statement = `SELECT * FROM activities`;
    if (this.db) {
      const result = await this.db.query(statement);
      return result?.values;
    }
    return undefined;
  }

  async deleteActivity(activityId: number): Promise<void> {
    await this.dbReady;
    const statement = `DELETE FROM activities WHERE id = ?`;
    if (this.db) {
      await this.db.run(statement, [activityId]);
    }
  }
}
