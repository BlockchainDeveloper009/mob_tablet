import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import { 
  registerBackgroundTimeCheck, 
  setTargetEventTime, 
  clearTargetEventTime 
} from '../tasks/TimeCheckTask'; // Adjust path as necessary

const TARGET_TIME_KEY = 'TARGET_EVENT_TIME';

export default function ScheduleScreen() {
  const [targetTime, setTargetTime] = useState<Date | null>(null);
  const [status, setStatus] = useState('Checking task status...');

  useEffect(() => {
    // Check initial status on component mount
    const checkStatus = async () => {
      const timeIso = await AsyncStorage.getItem(TARGET_TIME_KEY);
      if (timeIso) {
        setTargetTime(new Date(timeIso));
        setStatus('Task is active and scheduled.');
      } else {
        setStatus('No scheduled task active.');
      }
    };
    checkStatus();
  //  registerBackgroundTimeCheck();
  }, []);

  const scheduleEvent = async () => {
    // Schedule for 1 hour from now for testing
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000); 
    
    await                                                                                                                                                                                                                                                                                                           Time(oneHourFromNow);
    setTargetTime(oneHourFromNow);
    setStatus('Task active! Will check around: ' + oneHourFromNow.toLocaleTimeString());
  };

  const cancelEvent = async () => {
    await clearTargetEventTime();
    setTargetTime(null);
    setStatus('Scheduled task cancelled.');
  };

  const forceRunTask = async () => {
    if (__DEV__ && Platform.OS !== 'web') {
      // ONLY WORKS IN DEVELOPMENT BUILDS on a physical device.
      // This is for immediate testing only.
      await BackgroundTask.triggerTaskWorkerForTestingAsync(100); 
      Alert.alert("Testing Run", "The task worker has been triggered in the background.");
    } else {
      Alert.alert("Development Only", "This feature only works in Expo Go / Development builds.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Background Service Scheduler</Text>
      <Text style={styles.status}>Status: {status}</Text>
      
      {targetTime && (
        <Text style={styles.target}>Target Event Time: {targetTime.toLocaleString()}</Text>
      )}

      <View style={styles.buttonContainer}>
        <Button 
          title={targetTime ? "Reschedule for 1 Hour" : "Schedule Event (1 Hour)"} 
          onPress={scheduleEvent} 
        />
        <View style={{ marginVertical: 10 }} />
        <Button 
          title="Cancel Scheduled Event" 
          onPress={cancelEvent} 
          disabled={!targetTime}
          color="red"
        />
        <View style={{ marginVertical: 20 }} />
        <Button 
          title="Force Run Task (DEV ONLY)" 
          onPress={forceRunTask} 
          disabled={!targetTime}
          color="green"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  status: { fontSize: 16, marginBottom: 10, color: 'blue' },
  target: { fontSize: 16, marginBottom: 30, color: 'black' },
  buttonContainer: { width: '100%' },
});