import React, { useState } from 'react';
import { Button, View } from 'react-native';
import { saveEvent, deleteEvent } from '../utils/CalendarManager';

export default function AlarmScreen() {
  const [currentEventId, setCurrentEventId] = useState<string | undefined>(undefined);

  const handleCreateOrUpdate = async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
    const endTomorrow = new Date(tomorrow.getTime() + 60 * 60 * 1000); // +1 hour

    const details = {
      title: 'Reminder from App!',
      startDate: tomorrow,
      endDate: endTomorrow,
      notes: currentEventId ? 'Event updated!' : 'Initial event note.',
      eventId: currentEventId, // This makes it an update if set
    };

    const newId = await saveEvent(details);
    if (newId) {
      setCurrentEventId(newId);
    }
  };

  const handleDelete = async () => {
    if (currentEventId) {
      const success = await deleteEvent(currentEventId);
      if (success) {
        setCurrentEventId(undefined);
      }
    } else {
      alert('No event ID to delete.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Button 
        title={currentEventId ? 'Update Existing Event' : 'Create New Event'}
        onPress={handleCreateOrUpdate}
      />
      <View style={{ height: 20 }} />
      <Button 
        title="Delete Event" 
        onPress={handleDelete} 
        disabled={!currentEventId}
        color="red"
      />
    </View>
  );
}