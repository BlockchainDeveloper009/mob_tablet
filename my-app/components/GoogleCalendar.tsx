import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';

type Event = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

const GOOGLE_API_KEY = 'AIzaSyBe3rQCjgZ-qfzBIN7lGG2cnuxJ5wm1HH8';
const CALENDAR_ID = 'harrypks19@gmail.com'; // Or your specific calendar id

// Helper to get ISO 8601 datetime strings for start and end of current week (Monday to Sunday)
const getCurrentWeekInterval = (): { timeMin: string; timeMax: string } => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(now.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    timeMin: monday.toISOString(),
    timeMax: sunday.toISOString(),
  };
};

export const GoogleCalendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const { timeMin, timeMax } = getCurrentWeekInterval();
//const API_URL = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}`;
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          CALENDAR_ID,
        )}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error.message || 'Error fetching events');
      } else {
        setEvents(data.items || []);
      }
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No events this week</Text>}
        renderItem={({ item }) => {
          const start = item.start.dateTime || item.start.date;
          const end = item.end.dateTime || item.end.date;
          return (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{item.summary || '(No Title)'}</Text>
              <Text style={styles.eventTime}>
                {start} - {end}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  eventItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  eventTitle: { fontWeight: 'bold', fontSize: 16 },
  eventTime: { color: '#555', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
export default GoogleCalendar;