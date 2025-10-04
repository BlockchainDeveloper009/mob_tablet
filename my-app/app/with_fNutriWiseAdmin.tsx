
// src/screens/AdminAddFoodScreen.tsx

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { AdminNewFoodPayload, NutrientValues } from '../interfaces/admin_interfaces';


// IMPORTANT: Use your local IP or 10.0.2.2 for Android emulator
const API_BASE_URL = 'http://localhost:8000'; 
const ADMIN_ADD_FOOD_ENDPOINT = `${API_BASE_URL}/admin/add_food`;

// Define all tracked nutrients for input generation
const TRACKED_NUTRIENTS: Array<keyof NutrientValues> = [
  'Calories', 
  'Protein', 
  'Fiber', 
  'Vitamin C', 
  'Iron'
];

const AdminAddFoodScreen: React.FC = () => {
  // State for basic food details
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('');
  const [portionSize, setPortionSize] = useState('');
  
  // State for nutrient values
  const [nutrientInput, setNutrientInput] = useState<NutrientValues>({});
  const [loading, setLoading] = useState(false);

  // Helper function to update individual nutrient inputs
  const handleNutrientChange = useCallback((key: keyof NutrientValues, value: string) => {
    // Convert input string to number, defaulting to 0 or null if invalid
    const numValue = parseFloat(value) || undefined; 
    setNutrientInput(prev => ({
      ...prev,
      [key]: numValue,
    }));
  }, []);

  // Function to submit the data to the API
  const handleSubmit = async () => {
    // 1. Basic validation
    if (!foodName || !category || !portionSize) {
      Alert.alert('Missing Field', 'Please fill in Food Name, Category, and Portion Size.');
      return;
    }

    const portion = parseFloat(portionSize);
    if (isNaN(portion) || portion <= 0) {
      Alert.alert('Invalid Input', 'Portion size must be a positive number.');
      return;
    }

    // 2. Filter out nutrients that weren't entered or are 0
    const finalNutrientValues: NutrientValues = {};
    for (const key in nutrientInput) {
      const value = nutrientInput[key as keyof NutrientValues];
      if (typeof value === 'number' && value > 0) {
        finalNutrientValues[key as keyof NutrientValues] = value;
      }
    }

    // If no nutrients are logged, ask for confirmation
    if (Object.keys(finalNutrientValues).length === 0) {
      Alert.alert('Missing Data', 'You haven\'t logged any nutrient values. Do you still want to save?', [
        { text: 'Cancel' },
        { text: 'Save Anyway', onPress: () => submitToApi(portion, finalNutrientValues) },
      ]);
      return;
    }
    
    await submitToApi(portion, finalNutrientValues);
  };
  
  const submitToApi = async (portion: number, nutrients: NutrientValues) => {
    setLoading(true);
    
    const payload: AdminNewFoodPayload = {
      food_name: foodName,
      category: category,
      portion_size_g: portion,
      nutrient_values: nutrients,
    };

    try {
      const response = await fetch(ADMIN_ADD_FOOD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || `Added food: ${foodName}`);
        // Clear form after success
        setFoodName('');
        setCategory('');
        setPortionSize('');
        setNutrientInput({});
      } else {
        // Handle API errors (e.g., Food already exists)
        Alert.alert('API Error', data.detail || 'Failed to add food item.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert('Network Error', 'Could not connect to the admin API endpoint.');
    } finally {
      setLoading(false);
    }
  };


  const renderNutrientInputs = () => (
    <>
      <Text style={styles.sectionHeader}>Nutrient Content Per Portion</Text>
      {TRACKED_NUTRIENTS.map(key => (
        <View key={key as string} style={styles.inputGroup}>
          <Text style={styles.label}>{key as string}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder={`Value in ${key === 'Protein' ? 'grams' : 'units'}`}
            onChangeText={(value) => handleNutrientChange(key, value)}
            value={nutrientInput[key as string]?.toString() || ''}
          />
        </View>
      ))}
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Admin: Add New Food Item</Text>

        <Text style={styles.sectionHeader}>Basic Food Details</Text>
        
        {/* Food Name */}
        <Text style={styles.label}>Food Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Orgain Powder Shake"
          onChangeText={setFoodName}
          value={foodName}
        />
        
        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Supplement, Pulse"
          onChangeText={setCategory}
          value={category}
        />
        
        {/* Portion Size */}
        <Text style={styles.label}>Standard Portion Size (grams)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g., 46.0"
          onChangeText={setPortionSize}
          value={portionSize}
        />

        {/* Nutrient Inputs */}
        {renderNutrientInputs()}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Adding...' : 'SUBMIT NEW FOOD ITEM'}
          </Text>
        </TouchableOpacity>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#007bff',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    flex: 1.5,
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  input: {
    flex: 3,
    height: 40,
    paddingLeft: 10,
    color: '#333',
    // Reset styles for nutrient group
    paddingHorizontal: 0, 
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AdminAddFoodScreen;