import * as FileSystem from 'expo-file-system';

const STORAGE_FILE = FileSystem.documentDirectory + 'foodPlannerWeek.json';

export type MealPlan = {
  [day: string]: {
    Breakfast: string;
    Snacks: string;
    Lunch: string;
    Dinner: string;
    Comments: string;
  };
};

/**
 * Saves the meal plan for the week to local storage.
 */
export async function saveMealPlan(mealPlan: MealPlan): Promise<void> {
  const data = JSON.stringify(mealPlan);
  await FileSystem.writeAsStringAsync(STORAGE_FILE, data, { encoding: FileSystem.EncodingType.UTF8 });
}

/**
 * Loads the meal plan for the week from local storage.
 * Returns an empty object if not found or on error.
 */
export async function loadMealPlan(): Promise<MealPlan> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);
    if (!fileInfo.exists) return {};
    const data = await FileSystem.readAsStringAsync(STORAGE_FILE, { encoding: FileSystem.EncodingType.UTF8 });
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

/**
 * Removes the stored meal plan (for testing or reset).
 */
export async function clearMealPlan(): Promise<void> {
  try {
    await FileSystem.deleteAsync(STORAGE_FILE, { idempotent: true });
  } catch {
    // ignore
  }
}