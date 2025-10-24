import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ScrollView, Switch } from 'react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Snacks', 'Lunch', 'Dinner', 'Comments'];

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
  'BlackgramDosa',
  'KondaKadalai',
  'Brocolli',
  'EggPlant',
  'LadiesFinger',
  'SorakaiSambar',
  'Flax+Pumpkin+Walnut+Badam+chia',
  'Seeds',
];

const idealMealPlan: { [day: string]: { [meal: string]: string } } = {
  Monday:    { Breakfast: 'Oats', Snacks: 'Fruit', Lunch: 'Brown Rice & Veg', Dinner: 'Soup', Comments: 'Hydrate' },
  Tuesday:   { Breakfast: 'Eggs', Snacks: 'Nuts', Lunch: 'Quinoa Salad', Dinner: 'Grilled Fish', Comments: '' },
  Wednesday: { Breakfast: 'Idli', Snacks: 'Yogurt', Lunch: 'Dal & Roti', Dinner: 'Veg Stir Fry', Comments: '' },
  Thursday:  { Breakfast: 'Poha', Snacks: 'Fruit', Lunch: 'Rice & Sambar', Dinner: 'Paneer Curry', Comments: '' },
  Friday:    { Breakfast: 'Upma', Snacks: 'Seeds', Lunch: 'Millet & Veg', Dinner: 'Soup', Comments: '' },
  Saturday:  { Breakfast: 'Paratha', Snacks: 'Fruit', Lunch: 'Chickpea Curry', Dinner: 'Veg Pulao', Comments: '' },
  Sunday:    { Breakfast: 'Dosa', Snacks: 'Nuts', Lunch: 'Fish Curry', Dinner: 'Salad', Comments: 'Cheat meal' },
};

type MealPlan = {
  [day: string]: {
    Breakfast: string;
    Snacks: string;
    Lunch: string;
    Dinner: string;
    Comments: string;
  };
};

export default function foodPlannerWithDiet() {
  const [darkMode, setDarkMode] = useState(false);
  const weekDates = getCurrentWeekDates();
  const [mealPlan, setMealPlan] = useState<MealPlan>(() =>
    Object.fromEntries(
      DAYS.map((day) => [
        day,
        { Breakfast: '', Snacks: '', Lunch: '', Dinner: '', Comments: '' },
      ])
    )
  );
  const [foodList, setFoodList] = useState(initialFoodList);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);

  // Handle dropping food into a meal slot
  const handleSlotPress = (day: string, meal: string) => {
    if (selectedFood && meal !== 'Comments') {
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

  const theme = darkStyles; //darkMode ? darkStyles : styles;

  return (
    <View style={theme.container}>
      {/* Dark Mode Toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[theme.header, { marginRight: 10 }]}>Dark Theme</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      {/* Section 1: Weekly Meal Grid */}
      <Text style={theme.header}>Weekly Meal Planner</Text>
      <ScrollView horizontal>
        <View>
          <View style={theme.row}>
            <View style={theme.dayCell}><Text style={theme.bold}>Day</Text></View>
            {MEALS.map((meal) => (
              <View key={meal} style={theme.mealCell}>
                <Text style={theme.bold}>{meal}</Text>
              </View>
            ))}
          </View>
          {DAYS.map((day) => (
            <View key={day} style={theme.row}>
              <View style={theme.dayCell}>
                <Text style={theme.bold}>{day}</Text>
              </View>
              {MEALS.map((meal) =>
                meal === 'Comments' ? (
                  <View key={meal} style={theme.mealCell}>
                    <TextInput
                      style={theme.commentInput}
                      value={mealPlan[day][meal]}
                      onChangeText={(text) => handleCommentChange(day, text)}
                      placeholder="Add comment"
                      placeholderTextColor={darkMode ? '#aaa' : '#888'}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    key={meal}
                    style={[
                      theme.mealCell,
                      selectedFood && { borderColor: '#2196f3', borderWidth: 2 },
                    ]}
                    onPress={() => handleSlotPress(day, meal)}
                  >
                    <Text style={{ color: darkMode ? '#fff' : '#000' }}>
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
      <View style={theme.foodSection}>
        <Text style={theme.header}>Available Food Items</Text>
        <FlatList
          data={foodList}
          keyExtractor={(item) => item}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                theme.foodItem,
                selectedFood === item && theme.selectedFoodItem,
              ]}
              onPress={() => setSelectedFood(item)}
            >
              <Text style={{ color: darkMode ? '#fff' : '#000' }}>{item}</Text>
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

      {/* Section 3: Ideal Planner/Dietician Subscribed */}
      <View style={theme.idealSection}>
        <Text style={theme.header}>Ideal Planner / Dietician Subscribed</Text>
        <ScrollView horizontal>
          <View>
            <View style={theme.row}>
              <View style={theme.dayCell}><Text style={theme.bold}>Day</Text></View>
              {MEALS.map((meal) => (
                <View key={meal} style={theme.mealCell}>
                  <Text style={theme.bold}>{meal}</Text>
                </View>
              ))}
            </View>
            {DAYS.map((day) => (
              <View key={day} style={theme.row}>
                <View style={theme.dayCell}>
                  <Text style={theme.bold}>{day}</Text>
                </View>
                {MEALS.map((meal) => (
                  <View key={meal} style={theme.mealCell}>
                    <Text style={{ color: darkMode ? '#fff' : '#000' }}>
                      {idealMealPlan[day]?.[meal] || ''}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, color: '#222' },
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
  bold: { fontWeight: 'bold', color: '#222' },
  commentInput: {
    width: 100,
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    color: '#000',
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
  idealSection: { marginTop: 30 },
});

const darkStyles = StyleSheet.create({
  ...styles,
  container: { ...styles.container, backgroundColor: '#181818' },
  header: { ...styles.header, color: '#fff' },
  dayCell: {
    ...styles.dayCell,
    backgroundColor: '#222',
    borderColor: '#444',
  },
  mealCell: {
    ...styles.mealCell,
    backgroundColor: '#222',
    borderColor: '#444',
  },
  bold: { ...styles.bold, color: '#fff' },
  commentInput: {
    ...styles.commentInput,
    backgroundColor: '#222',
    color: '#fff',
    borderColor: '#555',
  },
  foodSection: { ...styles.foodSection },
  foodItem: {
    ...styles.foodItem,
    backgroundColor: '#333',
  },
  selectedFoodItem: {
    ...styles.selectedFoodItem,
    backgroundColor: '#1976d2',
    borderColor: '#90caf9',
  },
  idealSection: { ...styles.idealSection },
});