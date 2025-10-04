// src/interfaces/Recommendation_interfaces.ts

/**
 * Interface for a single food suggestion within a nutrient category.
 * Example: {
 * "nutrient": "Iron", 
 * "suggestions": ["Lentils (Cooked) (3.3 mg per portion)", "Moringa Powder (2.8 mg per portion)"]
 * }
 */
export interface FoodSuggestion {
  nutrient: string;
  suggestions: string[];
}

/**
 * Interface for the full response object received from the /analysis/recommendations endpoint.
 */
export interface RecommendationResponse {
  status: "success" | "failure";
  recommendations?: FoodSuggestion[]; // Array of suggestions if deficiencies are found
  message?: string; // Message if no deficiencies found ("Congratulations...") or an error message
}

/**
 * Interface for the request body (payload) sent to the /analysis/recommendations endpoint.
 */
export interface RecommendationRequestPayload {
  start_date: string; // e.g., "2025-10-01"
  end_date: string;   // e.g., "2025-10-07"
  num_suggestions: number; // The number of top food suggestions requested per deficient nutrient
}