import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const TIME_CHECK_TASK_NAME = 'TIME_CHECK_TASK';
const TARGET_TIME_KEY = 'TARGET_EVENT_TIME';

// --- Utility Functions ---

/**
 * Simulates fetching server time. In a real app, this would be an API call.
 * For now, we use the local time as a stand-in for "server-synced" time.
 */
async function getCurrentSyncedTime(): Promise<Date> {
  // Replace with your actual server API call
  // const response = await fetch('YOUR_SERVER_TIME_ENDPOINT');
  // const data = await response.json();
  // return new Date(data.serverTime); 
  
  return new Date(); // Using mobile time for demonstration
}

/**
 * The core logic to run when the background task is executed.
 */
async function checkTimeAndTriggerEvent() {
  console.log('Background task started: checkTimeAndTriggerEvent');

  try {
    const targetTimeIso = await AsyncStorage.getItem(TARGET_TIME_KEY);
    if (!targetTimeIso) {
      console.log('No target event time found. Exiting task.');
      return;
    }

    const targetTime = new Date(targetTimeIso);
    const syncedTime = await getCurrentSyncedTime();

    console.log(`Synced Time: ${syncedTime.toISOString()}`);
    console.log(`Target Time: ${targetTime.toISOString()}`);

    if (syncedTime.getTime() >= targetTime.getTime()) {
      // --- EVENT TRIGGER LOGIC ---
      console.log('TARGET TIME REACHED! Triggering event...');
      
      // In a real background task, you CANNOT show UI like an Alert.
      // Instead, you would:
      // 1. Schedule a Local Notification (recommended for user visibility).
      // 2. Perform a network request (e.g., update server status).
      // 3. Update local storage or database.
      
      // Example: Schedule a local notification
      // await Notifications.scheduleNotificationAsync({
      //   content: { title: "Time Alert!", body: "Your scheduled event has triggered." },
      //   trigger: null, // show immediately
      // });

      // Clean up the task after triggering
      await AsyncStorage.removeItem(TARGET_TIME_KEY);
      await BackgroundTask.unregisterTaskAsync(TIME_CHECK_TASK_NAME);
      console.log('Event triggered and task unregistered.');

    } else {
      console.log('Target time not yet reached.');
    }

  } catch (error) {
    console.error('Error in background task:', error);
  }
}

// 2. Define the Background Task
TaskManager.defineTask(TIME_CHECK_TASK_NAME, checkTimeAndTriggerEvent);


// --- Task Registration Functions ---

/**
 * Registers the background task with the OS.
 */
export async function registerBackgroundTimeCheck(): Promise<boolean> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TIME_CHECK_TASK_NAME);
  if (isRegistered) {
    console.log('Task already registered.');
    return true;
  }
  
  try {
    await BackgroundTask.registerTaskAsync(TIME_CHECK_TASK_NAME, {
      // Minimum interval between task executions, in seconds.
      // The OS may run it less frequently to save battery.
      minimumInterval: 60 * 15, // 15 minutes is the minimum supported by iOS
      stopOnTerminate: false,    // Android only: continue running after app is killed
      startOnBoot: true,         // Android only: start on device boot
    });
    console.log('Background task registered successfully.');
    return true;
  } catch (error) {
    console.error('Failed to register background task:', error);
    return false;
  }
}

/**
 * Sets a new target time for the background service to check against.
 * @param targetDate The future date/time for the event.
 */
export async function setTargetEventTime(targetDate: Date) {
  if (targetDate.getTime() <= new Date().getTime()) {
    Alert.alert('Error', 'Target time must be in the future.');
    return;
  }
  
  await AsyncStorage.setItem(TARGET_TIME_KEY, targetDate.toISOString());
  console.log(`New target time set: ${targetDate.toISOString()}`);

  // Re-register or ensure the task is running
  await registerBackgroundTimeCheck();
}

/**
 * Clears the target time and unregisters the task.
 */
export async function clearTargetEventTime() {
  await AsyncStorage.removeItem(TARGET_TIME_KEY);
  await BackgroundTask.unregisterTaskAsync(TIME_CHECK_TASK_NAME);
  console.log('Target time cleared and task unregistered.');
}