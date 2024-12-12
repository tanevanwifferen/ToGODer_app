import { Platform } from "react-native";
import { AndroidHealthService } from "../health/AndroidHealthService";
import { IOSHealthService } from "../health/IOSHealthService";
import { WebHealthService } from "../health/WebHealthService";
import { IHealthService } from "../health/types";

export class HealthService {
  private static instance: IHealthService;

  private static getInstance(): IHealthService {
    if (!HealthService.instance) {
      if (Platform.OS === "ios") {
        HealthService.instance = new IOSHealthService();
      } else if (Platform.OS === "android") {
        HealthService.instance = new AndroidHealthService();
      } else {
        HealthService.instance = new WebHealthService();
      }
    }
    return HealthService.instance;
  }

  static async checkAvailability(): Promise<boolean> {
    return HealthService.getInstance().checkAvailability();
  }

  static async requestPermissions(): Promise<boolean> {
    return HealthService.getInstance().requestPermissions();
  }

  static async getWeeklyExerciseStats() {
    return HealthService.getInstance().getWeeklyExerciseStats();
  }

  static async getSixWeekExerciseStats() {
    return HealthService.getInstance().getSixWeekExerciseStats();
  }

  static async getSixMonthExerciseStats() {
    return HealthService.getInstance().getSixMonthExerciseStats();
  }

  static async getDailyMentalHealthStats() {
    return HealthService.getInstance().getDailyMentalHealthStats();
  }

  static async getWeeklyMentalHealthStats() {
    return HealthService.getInstance().getWeeklyMentalHealthStats();
  }

  static async getMonthlyMentalHealthStats() {
    return HealthService.getInstance().getMonthlyMentalHealthStats();
  }

  static async getWeeklySleepStats() {
    return HealthService.getInstance().getWeeklySleepStats();
  }

  static async getMonthlySleepStats() {
    return HealthService.getInstance().getMonthlySleepStats();
  }

  static async getHealthDataSummerized(): Promise<string> {
    // generate a string that summarizes excersize minutes, mental health valence, and sleep data
    const weeklyExerciseStats = await HealthService.getWeeklyExerciseStats();
    const monthlyExerciseStats = await HealthService.getWeeklyExerciseStats();
    const weeklyMentalHealthStats =
      await HealthService.getWeeklyMentalHealthStats();
    const monthlyMentalHealthStats =
      await HealthService.getMonthlyMentalHealthStats();
    const weeklySleepStats = await HealthService.getWeeklySleepStats();
    const monthlySleepStats = await HealthService.getMonthlySleepStats();

    let toreturn = [];

    if (weeklyExerciseStats.averageMinutes != 0) {
      toreturn.push(`excercised average per day this week: ${weeklyExerciseStats.averageMinutes}, \
     this month: ${monthlyExerciseStats.averageMinutes} minutes.`);
    }

    if (
      weeklyMentalHealthStats.averageValence !== 0 &&
      monthlyMentalHealthStats.averageValence !== 0
    ) {
      toreturn.push(`average weekly mood (0-10) ${weeklyMentalHealthStats.averageValence * 10} and average monthly mood is ${monthlyMentalHealthStats.averageValence * 10}`);
    }

    if (
      weeklySleepStats.averageTimeSpentInBed !== 0 &&
      monthlySleepStats.averageTimeSpentInBed !== 0
    ) {
      toreturn.push(`\nSleep stats:\n\
      Weekly: ${Math.round(
        weeklySleepStats.averageTimeSpentInBed / 60
      )} hours in bed, typically at ${weeklySleepStats.averageGoingToBedtime}\n\
      Monthly: ${Math.round(
        monthlySleepStats.averageTimeSpentInBed / 60
      )} hours in bed, typically at ${monthlySleepStats.averageGoingToBedtime}`);
    }

    return toreturn.length == 0 ? 'unknown' : toreturn.join('\n\n'); 
  }
}
