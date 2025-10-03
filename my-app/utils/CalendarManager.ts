import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

// --- TYPE DEFINITIONS ---

// Define a type for the data needed to create or update an event
interface EventDetails {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  // Optional ID for updating/deleting
  eventId?: string; 
}

// --- UTILITY FUNCTIONS ---

/**
 * Ensures calendar permissions are granted.
 * @returns The ID of the default calendar, or null if permissions are denied.
 */
export async function getCalendarPermissionAndDefaultId(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.warn('Calendar API is not available on the web.');
    return null;
  }
  
  // 1. Request Permission
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Calendar access is needed to manage events.');
    return null;
  }
  
  // 2. Find a Calendar to use (e.g., the default one)
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find(
    (cal) => cal.allowsModifications && cal.accessLevel === Calendar.CalendarAccessLevel.OWNER
  );

  if (!defaultCalendar) {
    Alert.alert('Error', 'No writable calendar found on the device.');
    return null;
  }
  
  return defaultCalendar.id;
}


/**
 * Creates or updates a calendar event/reminder.
 */
export async function saveEvent(details: EventDetails): Promise<string | null> {
  const defaultCalendarId = await getCalendarPermissionAndDefaultId();
  if (!defaultCalendarId) return null;

  try {
    const eventOptions: Calendar.Event = {
      title: details.title,
      startDate: details.startDate,
      endDate: details.endDate,
      location: details.location,
      notes: details.notes,
      // Default alarm/reminder for the event
      alarms: [{ relativeOffset: -15 }], // 15 minutes before
    };

    let eventId: string;

    if (details.eventId) {
      // If eventId exists, update the existing event
      await Calendar.updateEventAsync(details.eventId, eventOptions, {
        futureEvents: false, // Only update this one instance
      });
      eventId = details.eventId;
      Alert.alert('Success', 'Event updated successfully!');
    } else {
      // Otherwise, create a new event
      eventId = await Calendar.createEventAsync(defaultCalendarId, eventOptions);
      Alert.alert('Success', 'Event created successfully!');
    }
    
    return eventId;

  } catch (error) {
    console.error('Failed to save event:', error);
    Alert.alert('Error', 'Could not save the event.');
    return null;
  }
}

/**
 * Deletes a calendar event/reminder.
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  try {
    await Calendar.deleteEventAsync(eventId);
    Alert.alert('Success', 'Event deleted successfully.');
    return true;
  } catch (error) {
    console.error('Failed to delete event:', error);
    Alert.alert('Error', 'Could not delete the event.');
    return false;
  }
}