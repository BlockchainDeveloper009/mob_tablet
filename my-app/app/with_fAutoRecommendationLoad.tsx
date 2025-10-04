// src/screens/RecommendationsScreen.tsx (Updated)

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl, // Added for potential pull-to-refresh later
} from 'react-native';
import { 
  RecommendationResponse, 
  FoodSuggestion, 
  RecommendationRequestPayload 
} from '../interfaces/Recommendation_interfaces'; 

// IMPORTANT: Use your local IP or 10.0.2.2 for Android emulator
const API_BASE_URL = 'http://localhost:8000'; 
/**
 * Calculates the start and end dates (YYYY-MM-DD) for the current calendar week, 
 * treating Sunday as the start of the week (day 0).
 * @returns {start_date: string, end_date: string}
 */
const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate the difference in days to get to the start of the week (Sunday)
  // This is the number of days we need to subtract from today.
  const diffToSunday = dayOfWeek; 
  
  // Calculate Start Date (Sunday)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - diffToSunday);

  // Calculate End Date (Saturday)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const format = (date: Date): string => date.toISOString().slice(0, 10);

  return {
    start_date: format(startDate),
    end_date: format(endDate),
  };
};

// Function to get the date string in YYYY-MM-DD format
const getFormattedDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const RecommendationsScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(true); // Start as true to show spinner immediately
  const [message, setMessage] = useState('Fetching analysis...');

  // Function to fetch data from the FastAPI backend
  const fetchRecommendations = async () => {
    setLoading(true);
    setMessage('Analyzing last 7 days of consumption...');
    setRecommendations([]);
  // 1. Calculate the standard seven-day calendar week
    const { start_date, end_date } = getWeekDates();
    // Define a rolling 7-day period for analysis
    const payload: RecommendationRequestPayload = {
      start_date: start_date, // 7 days ago
      end_date: end_date,  // Today
      num_suggestions: 3,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/analysis/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: RecommendationResponse = await response.json();

      if (response.ok && data.status === 'success') {
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
          setMessage(`Analysis for ${payload.start_date} to ${payload.end_date}.`);
        } else if (data.message) {
          // Handles the case where the user met all goals (message: "Congratulations...")
          setMessage(data.message);
        }
      } else {
        // Handle server/API errors (e.g., HTTP 400, 500)
        setMessage(`Error: ${data.message || (data as any).detail || 'Failed to fetch recommendations.'}`);
      }
    } catch (error) {
      console.error('Network or Parsing Error:', error);
      setMessage('Network connection failed. Ensure the FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Auto-fetch on component load using useEffect ---
  useEffect(() => {
    fetchRecommendations();
  }, []); // Empty dependency array ensures this runs ONLY ONCE when the component mounts.
  // --------------------------------------------------------

  // Function to render the list of suggestions
  const renderRecommendations = () => {
    if (recommendations.length === 0) {
      return null;
    }

    return recommendations.map((item, index) => (
      <View key={index} style={styles.nutrientContainer}>
        <Text style={styles.nutrientHeader}>🎯 {item.nutrient} Deficient</Text>
        {item.suggestions.map((suggestion, subIndex) => (
          <Text key={subIndex} style={styles.suggestionText}>
            • {suggestion}
          </Text>
        ))}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Nutrition Analysis</Text>

      {/* Display a centered spinner while loading */}
      {loading && <ActivityIndicator size="large" color="#28a745" style={styles.loader} />}

      {/* Display message/status */}
      <Text style={styles.messageText}>{message}</Text>

      {/* Display results only when not loading */}
      {!loading && (
        <ScrollView style={styles.resultsArea}
            refreshControl={ // Optional: Add pull-to-refresh functionality
                <RefreshControl refreshing={loading} onRefresh={fetchRecommendations} />
            }
        >
          {recommendations.length > 0 ? renderRecommendations() : (
             <Text style={styles.noDataText}>
                {message.includes("Error") || message.includes("Analyzing") ? "" : message}
             </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 40,
  },
  messageText: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  resultsArea: {
    flex: 1,
  },
  nutrientContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nutrientHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 5,
  },
  suggestionText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#555',
    paddingVertical: 2,
  },
  noDataText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 20,
      color: '#6c757d',
  }
});

export default RecommendationsScreen;