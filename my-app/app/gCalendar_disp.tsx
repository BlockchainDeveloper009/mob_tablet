
import { SafeAreaView } from 'react-native';
import { GoogleCalendar } from '../components/GoogleCalendar';

// export default function gCalendar_disp() {
//   return (
    
     
    
//   );
// }

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Comments'];

const getCurrentWeekDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const initialFoodList = [
  'Eggs',
  'Toast',
  'Chicken',
  'Rice',
  'Salad',
  'Lentil Soup',
  'Pasta',
  'RedGram',
  'BlackBean',
  'Yogurt',
  'BlackgramDosa ',
  'KondaKadalai',
  'Brocolli',
  'EggPlant',
  'LadiesFinger',
  'SorakaiSambar',
  'Flax+Pumpkin+Walnut+Badam+chia',
  'Seeds',
];

type MealPlan = {
  [day: string]: {
    Breakfast: string;
    Lunch: string;
    Dinner: string;
    Comments: string;
  };
};

export default function gCalendar_disp() {
  const weekDates = getCurrentWeekDates();
  const [mealPlan, setMealPlan] = useState<MealPlan>(() =>
    Object.fromEntries(
      DAYS.map((day) => [
        day,
        { Breakfast: '', Lunch: '', Dinner: '', Comments: '' },
      ])
    )
  );
  const [foodList, setFoodList] = useState(initialFoodList);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);

  // Handle dropping food into a meal slot
  const handleSlotPress = (day: string, meal: string) => {
    if (selectedFood) {
      setMealPlan((prev) => ({
        ...prev,
        [day]: { ...prev[day], [meal]: selectedFood },
      }));
      setFoodList((prev) => prev.filter((item) => item !== selectedFood));
      setSelectedFood(null);
    }
  };

  // Handle manual text input for comments
  const handleCommentChange = (day: string, text: string) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], Comments: text },
    }));
  };

  return (
    <View style={styles.container}>

         <GoogleCalendar />
      {/* Section 1: Weekly Meal Grid */}
      <Text style={styles.header}>Weekly Meal Planner</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.row}>
            <View style={styles.dayCell}><Text style={styles.bold}>Day</Text></View>
            {MEALS.map((meal) => (
              <View key={meal} style={styles.mealCell}>
                <Text style={styles.bold}>{meal}</Text>
              </View>
            ))}
          </View>
          {DAYS.map((day, i) => (
            <View key={day} style={styles.row}>
              <View style={styles.dayCell}>
                <Text style={styles.bold}>{day}</Text>
              </View>
              {MEALS.map((meal) =>
                meal === 'Comments' ? (
                  <View key={meal} style={styles.mealCell}>
                    <TextInput
                      style={styles.commentInput}
                      value={mealPlan[day][meal]}
                      onChangeText={(text) => handleCommentChange(day, text)}
                      placeholder="Add comment"
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    key={meal}
                    style={[
                      styles.mealCell,
                      selectedFood && { borderColor: '#2196f3', borderWidth: 2 },
                    ]}
                    onPress={() => handleSlotPress(day, meal)}
                  >
                    <Text>
                      {mealPlan[day][meal] || (
                        selectedFood ? 'Tap to add' : ''
                      )}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Section 2: Food List */}
      <View style={styles.foodSection}>
        <Text style={styles.header}>Available Food Items</Text>
        <FlatList
          data={foodList}
          keyExtractor={(item) => item}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.foodItem,
                selectedFood === item && styles.selectedFoodItem,
              ]}
              onPress={() => setSelectedFood(item)}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#888', margin: 10 }}>All items used!</Text>
          }
        />
        {selectedFood && (
          <Text style={{ color: '#2196f3', marginTop: 8 }}>
            Tap a meal slot above to add "{selectedFood}"
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dayCell: {
    width: 90,
    padding: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mealCell: {
    width: 110,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  bold: { fontWeight: 'bold' },
  commentInput: {
    width: 100,
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
  },
  foodSection: { marginTop: 30 },
  foodItem: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    margin: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  selectedFoodItem: {
    backgroundColor: '#b3e5fc',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
});