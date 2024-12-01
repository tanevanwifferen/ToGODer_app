export interface BackgroundServiceConfig {
    enabled: boolean;
    preferredHour: number; // 0-23 for hour of day
    amount: number; // 0 for never, 1 for always, 0.5 for half the time
}
