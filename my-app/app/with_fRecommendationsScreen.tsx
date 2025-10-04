// src/screens/RecommendationsScreen.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { 
  RecommendationResponse, 
  FoodSuggestion, 
  RecommendationRequestPayload 
} from '../interfaces/Recommendation_interfaces'; // Adjust path as needed
//import { AdminNewFoodPayload, NutrientValues } from '../interfaces/admin_interfaces';


// IMPORTANT: Use your local IP or 10.0.2.2 for Android emulator
const API_BASE_URL = 'http://localhost:8000'; 

// Function to get the date string in YYYY-MM-DD format
const getFormattedDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const RecommendationsScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Press the button to get weekly recommendations.');

  // Function to fetch data from the FastAPI backend
  const fetchRecommendations = async () => {
    setLoading(true);
    setMessage('');
    setRecommendations([]);

    // Define a rolling 7-day period for analysis
    const payload: RecommendationRequestPayload = {
      start_date: "2025-10-01",//getFormattedDate(7), // 7 days ago
      end_date: "2025-10-07",//getFormattedDate(0),  // Today
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
          setMessage('Analysis complete. See your personalized recommendations below.');
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

      <TouchableOpacity 
        style={styles.button} 
        onPress={fetchRecommendations} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Analyzing...' : 'GET RECOMMENDATIONS'}
        </Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}

      <Text style={styles.messageText}>{message}</Text>

      <ScrollView style={styles.resultsArea}>
        {renderRecommendations()}
      </ScrollView>
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
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 10,
  },
  messageText: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 15,
    textAlign: 'center',
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
});

export default RecommendationsScreen;