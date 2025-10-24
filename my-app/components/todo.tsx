// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, StyleSheet, Button, Alert } from 'react-native';
// // import * as Notifications from 'expo-notifications';
// import * as FileSystem from 'expo-file-system';
// import * as Localization from 'expo-localization';
// import { File, Directory, Paths } from 'expo-file-system';
// type Reminder = {
//   id: string;
//   title: string;
//   description: string;
//   dueDate: string; // ISO string
//   frequency: string; // e.g., "daily", "hourly", "custom"
//   timezone: string;
// };

// //const REMINDERS_FILE = 'reminders.json'; //FileSystem.documentDirectory + 'reminders.json';
// //const REMINDERS_FILE = Paths.document + 'reminders.json';
// const REMINDERS_FILE =  'reminders.json';

// async function loadReminders(): Promise<Reminder[]> {
//   try {
//     // 1. Create a File object for the reminders file
//     const remindersFile = new File(REMINDERS_FILE);

//     // 2. Use the new .info() method to check for existence (replaces getInfoAsync)
//     const fileInfo = await remindersFile.info();
    
//     if (!fileInfo.exists) {
//       return [];
//     }
    
//     // 3. Use the new .text() method to read content (replaces readAsStringAsync)
//     const fileContent = await remindersFile.text();
    
//     return JSON.parse(fileContent);
//   } catch (e) {
//     console.error("Failed to load reminders:", e);
//     // If the file is not found on the first run, or there's a parse error, return empty
//     return [];
//   }
// }
// // Assuming you have imported File and Paths correctly:
// // import { Paths, File } from 'expo-file-system'; 
// // const REMINDERS_FILE = Paths.document + 'reminders.json';

// async function saveReminders(reminders: Reminder[]) {
//   // 1. Create a File object
//   const remindersFile = new File(Paths.cache, REMINDERS_FILE);
//   remindersFile.create();
//   const content = JSON.stringify(reminders);

//   // 2. Use the new .write() method, passing the required second argument: {}
//   // You can specify options like { encoding: 'utf8' } if needed, 
//   // but an empty object satisfies the TypeScript signature.
//   await remindersFile.write(content, {}); 
// }




// async function scheduleReminder(reminder: Reminder) {
//  // Create the Date object from the ISO string
//   const triggerDate = new Date(reminder.dueDate); 
  
//   // FIX: Wrap the Date object in a { date: Date } object 
//   const triggerInput = { date: triggerDate };

//   // await Notifications.scheduleNotificationAsync({
//   //   content: {
//   //     title: reminder.title,
//   //     body: reminder.description,
//   //     data: { id: reminder.id },
//   //   },
//   //   // Pass the correctly typed object
//   //   trigger: triggerInput, 
//   // });
// }

// export default function RemindersScreen() {
//   const [reminders, setReminders] = useState<Reminder[]>([]);

//   useEffect(() => {
//     (async () => {
//       await Notifications.requestPermissionsAsync();
//       const loaded = await loadReminders();
//       setReminders(loaded);
//     })();
//   }, []);
// function getLocalTimezone(): string {
//   return 'UTC'; //Localization.timezone || 'UTC';
// }
//   // Example: Add a new reminder (for demo)
//   const addDemoReminder = async () => {
//     const now = new Date();
//     const due = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
//     const newReminder: Reminder = {
//       id: Math.random().toString(),
//       title: 'Demo Reminder',
//       description: 'This is a demo reminder.',
//       dueDate: due.toISOString(),
//       frequency: 'once',
//       timezone: getLocalTimezone(),
//     };
//     const updated = [...reminders, newReminder];
//     setReminders(updated);
//     await saveReminders(updated);
//     await scheduleReminder(newReminder);
//     Alert.alert('Reminder added and scheduled!');
//   };

//   const renderItem = ({ item }: { item: Reminder }) => (
//     <View style={styles.item}>
//       <Text style={styles.title}>{item.title}</Text>
//       <Text>{item.description}</Text>
//       <Text>
//         Due: {new Date(item.dueDate).toLocaleString()} ({item.timezone})
//       </Text>
//       <Text>Frequency: {item.frequency}</Text>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Button title="Add Demo Reminder" onPress={addDemoReminder} />
//       <FlatList
//         data={reminders}
//         keyExtractor={item => item.id}
//         renderItem={renderItem}
//         numColumns={4}
//         contentContainerStyle={styles.list}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 10, backgroundColor: '#fff' },
//   list: { marginTop: 20 },
//   item: {
//     flex: 1,
//     margin: 5,
//     padding: 8,
//     backgroundColor: '#e0e0e0',
//     borderRadius: 8,
//     minWidth: 120,
//     maxWidth: 180,
//   },
//   title: { fontWeight: 'bold', marginBottom: 4 },
// });