// app/components/NutrientTable.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { getAllNutrientValues } from './db/NutriWiseAdmin';
import { NutrientValues } from '../interfaces/admin_interfaces';

const NutrientTable = () => {
  const [nutrients, setNutrients] = useState<NutrientValues[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const data = await getAllNutrientValues();
        setNutrients(data);
      } catch (error) {
        console.error('Failed to load nutrient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNutrients();
  }, []);

  const renderHeader = () => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.header]}>Food Name</Text>
      <Text style={[styles.cell, styles.header]}>Calories</Text>
      <Text style={[styles.cell, styles.header]}>Protein</Text>
      <Text style={[styles.cell, styles.header]}>Carbs</Text>
      <Text style={[styles.cell, styles.header]}>Fat</Text>
    </View>
  );

  const renderItem = ({ item }: { item: NutrientValues }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.foodName}</Text>
      <Text style={styles.cell}>{item.calories}</Text>
      <Text style={styles.cell}>{item.protein}</Text>
      <Text style={styles.cell}>{item.carbs}</Text>
      <Text style={styles.cell}>{item.fat}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;

  return (
    <ScrollView horizontal>
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          data={nutrients}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minWidth: 600,
  },
  loader: {
    marginTop: 100,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 14,
  },
  header: {
    fontWeight: 'bold',
  },
});

export default NutrientTable;
