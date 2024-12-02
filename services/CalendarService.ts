import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

interface CalendarEvent {
  title: string;
  date: Date;
}

export class CalendarService {
  private static cache: CalendarEvent[] | null = null;
  private static lastCacheTime: number | null = null;
  private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  static async getUpcomingEvents(): Promise<CalendarEvent[]> {
    // Return empty array for web platform
    if (Platform.OS === 'web') {
      return [];
    }

    // Check if cache is valid
    if (
      CalendarService.cache !== null &&
      CalendarService.lastCacheTime !== null &&
      Date.now() - CalendarService.lastCacheTime < CalendarService.CACHE_DURATION
    ) {
      return CalendarService.cache;
    }

    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        return [];
      }

      // Get calendar IDs
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map((calendar: Calendar.Calendar) => calendar.id);

      // Get current date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setTime(endDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Get events for next month

      // Fetch events from all calendars
      const events: CalendarEvent[] = [];
      for (const calendarId of calendarIds) {
        const calendarEvents = await Calendar.getEventsAsync(
          [calendarId],
          startDate,
          endDate
        );

        events.push(
          ...calendarEvents.map((event: Calendar.Event) => ({
            title: event.title,
            date: new Date(event.startDate)
          }))
        );
      }

      // Sort events by date
      const sortedEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Update cache
      CalendarService.cache = sortedEvents;
      CalendarService.lastCacheTime = Date.now();

      return sortedEvents;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }
}
