
// src/interfaces/admin_interfaces.ts

/**
 * Interface for the nutrient values sub-object.
 * This should match the keys expected by your Python backend's NUTRI_REF_Nutrient table.
 */
export interface NutrientValues {
  Calories?: number;
  Protein?: number;
  Fiber?: number;
  'Vitamin C'?: number;
  Iron?: number;
  [key: string]: number | undefined; // Allows for dynamic/other nutrients
}

/**
 * Interface for the full payload sent to the /admin/add_food endpoint.
 */
export interface AdminNewFoodPayload {
  food_name: string;
  category: string;
  portion_size_g: number;
  nutrient_values: NutrientValues;
}