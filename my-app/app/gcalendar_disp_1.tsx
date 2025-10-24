import React, { useState, useEffect } from 'react';
// NOTE: These are the standard React Native imports required for mobile
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView 
} from 'react-native';

// --- TypeScript Interface for Data Structure ---
interface Event {
  id: string;
  summary: string;
  start: {
    dateTime?: string; // Optional for all-day events
    date?: string; 
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
}

// Main App component (Default Export)
export default function gCalendar_disp() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- MOCK CREDENTIALS & CONSTANTS (Replace with your own) ---
  const API_KEY = 'AIzaSyBe3rQCjgZ-qfzBIN7lGG2cnuxJ5wm1HH8'; 
  const CALENDAR_ID = 'harrypks19@gmail.com'; 
  const API_URL = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}`;

  // Mock Event Data (Structured like Google Calendar API response)
  const mockEvents: Event[] = [
    {
      id: '1',
      summary: 'Team Sync Meeting',
      start: { dateTime: '2025-10-25T10:00:00-07:00' },
      end: { dateTime: '2025-10-25T11:00:00-07:00' },
      location: 'Zoom/Remote',
    },
    {
      id: '2',
      summary: 'Project Review Phase 1',
      start: { dateTime: '2025-10-25T14:30:00-07:00' },
      end: { dateTime: '2025-10-25T15:30:00-07:00' },
      location: 'Office - Conf Room A',
    },
    {
      id: '3',
      summary: 'Client Demo',
      start: { dateTime: '2025-10-26T09:00:00-07:00' },
      end: { dateTime: '2025-10-26T10:30:00-07:00' },
      location: 'Webex/Client Site',
    },
    {
      id: '4',
      summary: 'Internal Training Session',
      start: { dateTime: '2025-10-27T11:00:00-07:00' },
      end: { dateTime: '2027-10-27T12:00:00-07:00' },
      location: 'Auditorium',
    },
    // Adding a future event
    {
        id: '5',
        summary: 'Annual Planning Kickoff',
        start: { dateTime: '2026-01-10T10:00:00-07:00' },
        end: { dateTime: '2026-01-10T16:00:00-07:00' },
        location: 'HQ Ballroom',
    }
  ].sort((a, b) => new Date(a.start.dateTime || a.start.date!) < new Date(b.start.dateTime || b.start.date!) ? -1 : 1);

  /**
   * Mocks the API call to fetch Google Calendar events.
   */
  const fetchCalendarEvents = async () => {
    // In a real React Native app, you would use 'fetch' here.
    // E.g.: const response = await fetch(API_URL); ... return response.json();
    return new Promise<{ items: Event[] }>((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        resolve({ items: mockEvents });
      }, 1500);
    });
  };

  /**
   * Parses the ISO date string from Google Calendar API into readable date/time strings.
   */
  const formatEventTime = (isoDate: string | undefined) => {
    if (!isoDate) return 'All Day';
    try {
      const date = new Date(isoDate);
      
      const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
      };
      
      // Note: React Native environment may need polyfills for full Intl support on older devices
      return date.toLocaleString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'N/A';
    }
  };


  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCalendarEvents();
      // Only set future events
      const now = new Date();
      const upcomingEvents = response.items.filter(item => {
        const eventStart = new Date(item.start.dateTime || item.start.date!);
        return eventStart >= now;
      }).sort((a, b) => new Date(a.start.dateTime || a.start.date!) < new Date(b.start.dateTime || b.start.date!) ? -1 : 1);

      setEvents(upcomingEvents);
    } catch (e) {
      console.error("Failed to fetch calendar events:", e);
      setError("Failed to load events. Check your API keys/network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // --- Rendering Functions ---

  const renderItem = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.eventTitle}>{item.summary}</Text>
      </View>
      <View style={styles.cardBody}>
        {/* Date/Time */}
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📅</Text> 
          <Text style={styles.detailText}>{formatEventTime(item.start.dateTime || item.start.date)}</Text>
        </View>
        {/* Location */}
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.detailText}>{item.location || 'Unknown Location'}</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Fetching calendar data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.centerContainer, styles.errorContainer]}>
          <Text style={styles.errorTitle}>Error Loading Events</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (events.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noEventsIcon}>🎉</Text>
          <Text style={styles.noEventsText}>No Upcoming Events</Text>
          <Text style={styles.noEventsSubtext}>Your calendar is clear!</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <Text style={styles.subtitle}>Calendar: {CALENDAR_ID}</Text>

        {/* Action Button */}
        <TouchableOpacity 
          onPress={loadEvents} 
          disabled={loading} 
          style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? 'Loading...' : 'Refresh Events'}
          </Text>
        </TouchableOpacity>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- React Native Stylesheet ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Corresponds to gray-100
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5', // Corresponds to indigo-600
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280', // Corresponds to gray-500
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4F46E5', // indigo-600
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  refreshButtonDisabled: {
    backgroundColor: '#9CA3AF', // gray-400
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: 20, // Add padding at the bottom for the last card
  },
  eventCard: {
    marginVertical: 8,
    marginHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937', // gray-900
  },
  cardBody: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2', // red-100
    borderRadius: 10,
    margin: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F87171', // red-400
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B91C1C', // red-700
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#D93A3A', // red-600
    textAlign: 'center',
  },
  noEventsIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  noEventsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4B5563',
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  }
});
