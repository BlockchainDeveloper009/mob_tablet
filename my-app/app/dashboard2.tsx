import React, { useState, useEffect } from 'react';
import RecommendationsScreen from './with_fAutoRecommendationLoad';
import { Text, View, StyleSheet, ScrollView, Image, FlatList, Dimensions, TouchableOpacity } from 'react-native';

// --- Global Configuration ---
const { width, height } = Dimensions.get('window');
const ROTATION_INTERVAL = 5000; // 5 seconds per page
const AI_REFRESH_INTERVAL = 30 * 60 * 1000; // Refresh AI content every 30 minutes

// --- API Configuration ---
const apiKey = ""; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

// Helper for fetching with exponential backoff
const fetchWithBackoff = async (url, options, retries = 3) => {
 for (let i = 0; i < retries; i++) {
 try {
 const response = await fetch(url, options);
 if (response.ok) {
 return response.json();
 }
 throw new Error(`HTTP error! status: ${response.status}`);
 } catch (error) {
 if (i === retries - 1) {
 console.error("Fetch failed after all retries:", error);
 throw error;
 }
 const delay = Math.pow(2, i) * 1000;
 await new Promise(resolve => setTimeout(resolve, delay));
 }
 }
};

// --- Mock Data ---
const mockWeather = {
 city: 'San Francisco, CA',
 temp: '68°F (20°C)',
 condition: 'Partly Cloudy',
 icon: '☁️',
 humidity: '65%',
 wind: '10 mph W',
};
const mockReminders = [
 { id: '1', text: 'Call dentist for appointment', due: 'Today, 2:00 PM' },
 { id: '2', text: 'Review Q3 budget report', due: 'Tomorrow Morning' },
 { id: '3', text: 'Order office supplies', due: 'End of Day' },
 { id: '4', text: 'Weekly team check-in prep', due: 'Wednesday' },
];
const mockTasks = [
 { id: '1', text: 'Finish dashboard integration', status: 'Pending', icon: '💻' },
 { id: '2', text: 'Update tablet firmware', status: 'Pending', icon: '📱' },
 { id: '3', text: 'Schedule team retrospective', status: 'Completed', icon: '✅' },
 { id: '4', text: 'Deploy latest cloud functions', status: 'Pending', icon: '☁️' },
 { id: '5', text: 'Review performance metrics', status: 'Pending', icon: '📊' },
];
const memorableImage = "https://placehold.co/800x600/00cc99/101010?text=Memorable+Image";

// --- Page Components (Moved inside KioskDashboard) ---

// Weather Page (Page 1)
const WeatherPage = ({ geminiSummary }) => (
 <View style={pageStyles.pageContainer}>
 <Text style={pageStyles.pageTitle}>Current Weather</Text>
 <View style={weatherStyles.card}>
 <Text style={weatherStyles.city}>{mockWeather.city}</Text>
 <Text style={weatherStyles.icon}>{mockWeather.icon}</Text>
 <Text style={weatherStyles.temp}>{mockWeather.temp}</Text>
 <Text style={weatherStyles.condition}>{mockWeather.condition}</Text>
 <View style={weatherStyles.detailRow}>
 <Text style={weatherStyles.detailText}>Humidity: {mockWeather.humidity}</Text>
 <Text style={weatherStyles.detailText}>Wind: {mockWeather.wind}</Text>
 </View>
 </View>
 <View style={aiStyles.aiCard}>
 <Text style={aiStyles.aiTitle}>✨ AI Local Insight</Text>
 <Text style={aiStyles.aiText}>{geminiSummary}</Text>
 </View>
 </View>
);

// Image Page (Page 2)
const ImagePage = () => (
 <View style={pageStyles.pageContainer}>
 <Text style={pageStyles.pageTitle}>Memorable View</Text>
 <Image
 source={{ uri: memorableImage }}
 style={imageStyles.image}
 resizeMode="cover"
 key={memorableImage}
 onError={(e) => console.log('Image failed to load:', e.nativeEvent.error)}
 />
 <Text style={imageStyles.caption}>A moment to remember.</Text>
 </View>
);

// Reminders Page (Page 3)
const RemindersPage = () => (
 <View style={pageStyles.pageContainer}>
 <Text style={pageStyles.pageTitle}>Daily Reminders</Text>
 <FlatList
 data={mockReminders}
 keyExtractor={item => item.id}
 renderItem={({ item }) => (
 <View style={listStyles.reminderItem}>
 <Text style={listStyles.reminderText}>{item.text}</Text>
 <Text style={listStyles.reminderDue}>{item.due}</Text>
 </View>
 )}
 contentContainerStyle={listStyles.listContent}
 style={{ maxHeight: height * 0.45 }}
 />
 </View>
);

// Tasks Page (Page 4)
const TasksPage = ({ geminiInsight }) => (
 <View style={pageStyles.pageContainer}>
 <Text style={pageStyles.pageTitle}>Pending Tasks</Text>
 <FlatList
 data={mockTasks.filter(task => task.status === 'Pending')}
 keyExtractor={item => item.id}
 renderItem={({ item }) => (
 <View style={listStyles.taskItem}>
 <Text style={listStyles.taskIcon}>{item.icon}</Text>
 <Text style={listStyles.taskText}>{item.text}</Text>
 </View>
 )}
 contentContainerStyle={listStyles.listContent}
 style={{ maxHeight: height * 0.35 }}
 ListEmptyComponent={() => <Text style={listStyles.emptyText}>No pending tasks!</Text>}
 />
 <View style={aiStyles.aiCard}>
 <Text style={aiStyles.aiTitle}>✨ AI Priority Focus</Text>
 <Text style={aiStyles.aiText}>{geminiInsight}</Text>
 </View>
 </View>
);




// --- Kiosk Dashboard Component (The Rotating Page Logic) ---

const KioskDashboard = ({ navigate }) => {
 const pages = [
	 { name: 'Weather', component: WeatherPage },
	 { name: 'Image', component: ImagePage },
	 { name: 'Reminders', component: RemindersPage },
	 { name: 'Tasks', component: TasksPage },
	 { name: 'Recommendations', component: RecommendationsScreen },
 ];
 const [currentPageIndex, setCurrentPageIndex] = useState(0);
 
 // State for AI-generated content
 const [geminiWeatherSummary, setGeminiWeatherSummary] = useState('Generating local weather insight...');
 const [geminiTaskInsight, setGeminiTaskInsight] = useState('Analyzing pending workload...');

 // Function to fetch AI summaries
 const fetchAiContent = async () => {
 // 1. Fetch Weather Insight
 try {
 const weatherPrompt = `Act as a local news anchor. Provide a concise, two-sentence current weather update for ${mockWeather.city}. Focus on the immediate conditions and what to expect next hour.`;
 const weatherPayload = {
 contents: [{ parts: [{ text: weatherPrompt }] }],
 tools: [{ "google_search": {} }],
 };
 const weatherResponse = await fetchWithBackoff(GEMINI_API_URL, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(weatherPayload)
 });
 const weatherText = weatherResponse?.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to fetch weather insight.';
 setGeminiWeatherSummary(weatherText);
 } catch (error) {
 console.error("Gemini Weather Error:", error);
 setGeminiWeatherSummary('AI service unavailable for weather insight.');
 }

 // 2. Fetch Task Insight
 try {
 const pendingTasks = mockTasks.filter(task => task.status === 'Pending').map(task => task.text).join(', ');
 const taskPrompt = `Based on the following list of pending tasks: [${pendingTasks}]. Provide a single, encouraging, and actionable sentence of advice to start the workday.`;
 const taskPayload = {
 contents: [{ parts: [{ text: taskPrompt }] }],
 };
 const taskResponse = await fetchWithBackoff(GEMINI_API_URL, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(taskPayload)
 });
 const taskText = taskResponse?.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to analyze tasks.';
 setGeminiTaskInsight(taskText);
 } catch (error) {
 console.error("Gemini Task Error:", error);
 setGeminiTaskInsight('AI service unavailable for task insight.');
 }
 };


 // Set up the automatic page rotation interval and AI refresh
 useEffect(() => {
 const rotationInterval = setInterval(() => {
 setCurrentPageIndex(prevIndex => (prevIndex + 1) % pages.length);
 }, ROTATION_INTERVAL);

 fetchAiContent(); 
 const aiRefreshInterval = setInterval(fetchAiContent, AI_REFRESH_INTERVAL);

 return () => {
 clearInterval(rotationInterval);
 clearInterval(aiRefreshInterval);
 }
 }, []);

 const pageName = pages[currentPageIndex].name;

 // Function to render the active page
 const renderActivePage = () => {
	 switch (pageName) {
		 case 'Weather':
			 return <WeatherPage geminiSummary={geminiWeatherSummary} />;
		 case 'Tasks':
			 return <TasksPage geminiInsight={geminiTaskInsight} />;
		 case 'Image':
			 return <ImagePage />;
		 case 'Reminders':
			 return <RemindersPage />;
		 case 'Recommendations':
			 return <RecommendationsScreen />;
		 default:
			 return null;
	 }
 };

 return (
 <View style={dashboardStyles.container}>
 <View style={dashboardStyles.header}>
 <Text style={dashboardStyles.title}>Kiosk Dashboard</Text>
 <TouchableOpacity style={dashboardStyles.backButton} onPress={() => navigate('Home')}>
 <Text style={dashboardStyles.backButtonText}>← Home</Text>
 </TouchableOpacity>
 </View>
 <Text style={dashboardStyles.pageIndicator}>
 Now Showing: {pageName} ({currentPageIndex + 1}/{pages.length})
 </Text>
 
 <View style={dashboardStyles.content}>
 {renderActivePage()}
 </View>
 
 <View style={dashboardStyles.footer}>
 <Text style={dashboardStyles.footerText}>AI Content Refreshed: {new Date().toLocaleTimeString()}</Text>
 </View>
 </View>
 );
}

// --- Navigation Pages ---

const HomePage = ({ navigate }) => (
 <View style={homeStyles.container}>
 <Text style={homeStyles.title}>Welcome to the Kiosk System</Text>
 <Text style={homeStyles.subtitle}>Select a page to view:</Text>
 
 <View style={homeStyles.linkContainer}>
 <TouchableOpacity 
 style={homeStyles.linkButton} 
 onPress={() => navigate('Dashboard')}
 >
 <Text style={homeStyles.linkText}>📊 Kiosk Dashboard (Rotating Content)</Text>
 </TouchableOpacity>
 
 <TouchableOpacity 
 style={[homeStyles.linkButton, { backgroundColor: '#333333' }]} 
 onPress={() => navigate('About')}
 >
 <Text style={homeStyles.linkText}>ℹ️ About This System</Text>
 </TouchableOpacity>
 
 <TouchableOpacity 
 style={[homeStyles.linkButton, { backgroundColor: '#333333' }]} 
 onPress={() => navigate('Contact')}
 >
 <Text style={homeStyles.linkText}>📞 Contact Support</Text>
 </TouchableOpacity>
 </View>
 </View>
);

const AboutPage = ({ navigate }) => (
 <View style={homeStyles.container}>
 <Text style={homeStyles.title}>About</Text>
 <Text style={homeStyles.pageText}>
 This Kiosk System is designed for high-visibility, real-time information display. It leverages AI (Gemini API) for context-aware content and features a rotating dashboard for efficient communication of various updates.
 </Text>
 <TouchableOpacity style={homeStyles.backButton} onPress={() => navigate('Home')}>
 <Text style={homeStyles.backButtonText}>← Go to Home</Text>
 </TouchableOpacity>
 </View>
);

const ContactPage = ({ navigate }) => (
 <View style={homeStyles.container}>
 <Text style={homeStyles.title}>Contact</Text>
 <Text style={homeStyles.pageText}>
 For technical support or content updates, please contact:
 {'\n\n'}
 Email: support@kiosksystem.com
 {'\n'}
 Phone: 555-DASH-555
 </Text>
 <TouchableOpacity style={homeStyles.backButton} onPress={() => navigate('Home')}>
 <Text style={homeStyles.backButtonText}>← Go to Home</Text>
 </TouchableOpacity>
 </View>
);


// --- Main App Component (Router) ---

export default function Dashboard() {
 const [currentScreen, setCurrentScreen] = useState('Home');
 
 const renderScreen = () => {
 switch (currentScreen) {
 case 'Home':
 return <HomePage navigate={setCurrentScreen} />;
 case 'Dashboard':
 return <KioskDashboard navigate={setCurrentScreen} />;
 case 'About':
 return <AboutPage navigate={setCurrentScreen} />;
 case 'Contact':
 return <ContactPage navigate={setCurrentScreen} />;
 default:
 return <HomePage navigate={setCurrentScreen} />;
 }
 }

 return (
 <View style={styles.container}>
 {renderScreen()}
 </View>
 );
}

// --- Stylesheet ---

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: '#101010', // Dark background
 },
});

const homeStyles = StyleSheet.create({
 container: {
 flex: 1,
 padding: 50,
 alignItems: 'center',
 justifyContent: 'center',
 },
 title: {
 fontSize: 48,
 fontWeight: '700',
 color: '#00cc99',
 marginBottom: 10,
 textAlign: 'center',
 },
 subtitle: {
 fontSize: 24,
 color: '#999999',
 marginBottom: 50,
 },
 linkContainer: {
 width: width * 0.7,
 },
 linkButton: {
 backgroundColor: '#00cc99',
 padding: 25,
 borderRadius: 15,
 marginBottom: 20,
 alignItems: 'center',
 shadowColor: '#00cc99',
 shadowOffset: { width: 0, height: 4 },
 shadowOpacity: 0.5,
 shadowRadius: 10,
 elevation: 8,
 },
 linkText: {
 fontSize: 22,
 fontWeight: '600',
 color: '#101010',
 },
 pageText: {
 fontSize: 20,
 color: '#ffffff',
 textAlign: 'center',
 marginBottom: 40,
 lineHeight: 30,
 width: '80%',
 },
 backButton: {
 padding: 15,
 marginTop: 20,
 backgroundColor: '#2b2b2b',
 borderRadius: 10,
 },
 backButtonText: {
 color: '#00cc99',
 fontSize: 18,
 }
});

const dashboardStyles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: '#101010',
 padding: 30,
 paddingTop: 50,
 },
 header: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: 20,
 borderBottomWidth: 1,
 borderBottomColor: '#333333',
 paddingBottom: 10,
 },
 title: {
 fontSize: 36,
 fontWeight: '700',
 color: '#00cc99',
 },
 pageIndicator: {
 fontSize: 20,
 color: '#999999',
 marginBottom: 20,
 textAlign: 'center',
 },
 content: {
 flex: 1,
 alignItems: 'center',
 justifyContent: 'center',
 },
 footer: {
 marginTop: 20,
 alignItems: 'flex-end',
 },
 footerText: {
 fontSize: 14,
 color: '#555555',
 },
 backButton: {
 padding: 10,
 borderRadius: 8,
 backgroundColor: '#00cc9920',
 },
 backButtonText: {
 color: '#00cc99',
 fontSize: 18,
 fontWeight: '500',
 }
});


const pageStyles = StyleSheet.create({
 pageContainer: {
 width: width * 0.8, // Make content large for tablet
 minHeight: height * 0.6,
 padding: 30,
 backgroundColor: '#1f1f1f',
 borderRadius: 20,
 shadowColor: '#00cc99',
 shadowOffset: { width: 0, height: 0 },
 shadowOpacity: 0.5,
 shadowRadius: 15,
 elevation: 10,
 alignItems: 'center',
 },
 pageTitle: {
 fontSize: 32,
 fontWeight: 'bold',
 color: '#ffffff',
 marginBottom: 25,
 textTransform: 'uppercase',
 },
});

const weatherStyles = StyleSheet.create({
 card: {
 alignItems: 'center',
 },
 city: {
 fontSize: 24,
 color: '#00cc99',
 marginBottom: 10,
 fontWeight: '600',
 },
 icon: {
 fontSize: 120,
 marginBottom: 20,
 },
 temp: {
 fontSize: 72,
 fontWeight: '200',
 color: '#ffffff',
 marginBottom: 5,
 },
 condition: {
 fontSize: 28,
 color: '#cccccc',
 marginBottom: 30,
 },
 detailRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 width: '80%',
 },
 detailText: {
 fontSize: 18,
 color: '#999999',
 }
});

const imageStyles = StyleSheet.create({
 image: {
 width: '100%',
 height: '70%',
 borderRadius: 15,
 marginBottom: 15,
 borderColor: '#00cc99',
 borderWidth: 3,
 },
 caption: {
 fontSize: 20,
 color: '#cccccc',
 fontStyle: 'italic',
 }
});

const listStyles = StyleSheet.create({
 listContent: {
 width: '100%',
 paddingHorizontal: 10,
 },
 reminderItem: {
 backgroundColor: '#2b2b2b',
 padding: 18,
 borderRadius: 12,
 marginBottom: 12,
 width: '100%',
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 borderLeftWidth: 5,
 borderLeftColor: '#00cc99',
 },
 reminderText: {
 fontSize: 20,
 color: '#ffffff',
 flex: 1,
 },
 reminderDue: {
 fontSize: 16,
 color: '#999999',
 fontWeight: '500',
 },
 taskItem: {
 backgroundColor: '#2b2b2b',
 padding: 18,
 borderRadius: 12,
 marginBottom: 12,
 width: '100%',
 flexDirection: 'row',
 alignItems: 'center',
 borderLeftWidth: 5,
 borderLeftColor: '#f1c40f', // Yellow for pending tasks
 },
 taskIcon: {
 fontSize: 24,
 marginRight: 15,
 },
 taskText: {
 fontSize: 20,
 color: '#ffffff',
 },
 emptyText: {
 fontSize: 20,
 color: '#999999',
 textAlign: 'center',
 marginTop: 50,
 }
});

const aiStyles = StyleSheet.create({
 aiCard: {
 marginTop: 30,
 width: '100%',
 backgroundColor: '#00cc9930', // Semi-transparent green background
 borderRadius: 10,
 padding: 15,
 borderLeftWidth: 3,
 borderLeftColor: '#00cc99',
 },
 aiTitle: {
 fontSize: 18,
 fontWeight: '700',
 color: '#ffffff',
 marginBottom: 5,
 },
 aiText: {
 fontSize: 18,
 color: '#e0e0e0',
 lineHeight: 24,
 }
});