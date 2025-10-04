from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # <--- FIX: ADD THIS LINE
from pydantic import BaseModel, Field
import uvicorn
import datetime
# --- IMPORTANT: Import your app class from the sibling file ---
# Assuming NutriWiseApp is defined in NutriWiseApp.py
from NutriWiseApp import NutriWiseApp 
from typing import Dict # Need Dict for the nutrient_values field
# Assuming your NutriWiseApp class is available via import (e.g., in a file named nutriwise_app.py)
# If you kept both classes in the same file, you'd only need: from .your_file_name import NutriWiseApp
# For simplicity, we'll assume the NutriWiseApp class code is accessible or defined below.

# --- START: Placeholder for NutriWiseApp Class (Replace with actual import) ---
# NOTE: In a real project, you would 'import {NutriWiseApp}' from your file.
# For this example, we assume NutriWiseApp and its dependencies (sqlite3, pandas) are available.
# (The full NutriWiseApp code from your V4 response should be here or imported.)
# ----------------------------------------------------------------------------------
class NewFoodItem(BaseModel):
    food_name: str
    category: str
    portion_size_g: float
    # Matches the structure of your NutrientValues interface in React Native
    nutrient_values: Dict[str, float] 
# Initialize FastAPI app
app = FastAPI(title="NutriWise Backend API", version="1.0.0")

# --- CORS Configuration (NEW SECTION) ---
# Define allowed origins (where your frontend is running)
origins = [
    # Allows requests from any origin (safe for local development)
    "http://localhost",
    "http://localhost:8081", # Common React Native Metro Bundler port
    "http://127.0.0.1",
    "http://10.0.2.2", # Android emulator localhost
    "http://10.0.3.2", # Genymotion emulator localhost
    "*" # Use '*' ONLY for testing/development. Restrict this in production!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # List of origins that are allowed to make requests
    allow_credentials=True,
    allow_methods=["*"],    # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],    # Allows all headers
)
# --

# # Instantiate the NutriWiseApp class once globally
# try:
#     # IMPORTANT: Ensure your NutriWiseApp class is imported/available here
#     # Placeholder: Replace with actual instantiation if classes are separate
#     # Example: nutriwise_app = NutriWiseApp()
    
#     # For demonstration, we'll assume a successful setup
#     print("API starting. NutriWiseApp dependency connected.")
    
#     # Placeholder Class (REMOVE THIS LINE AND UNCOMMENT YOUR REAL APP INSTANTIATION)
#     class MockNutriWiseApp:
#         def log_food(self, date, food, portion): return f"Logged {food}"
#         def get_recommendations(self, start, end, num): return {"status": "success", "recommendations": []}
    
#     nutriwise_app = MockNutriWiseApp() 
    
# except Exception as e:
#     print(f"FATAL ERROR: Could not initialize NutriWiseApp: {e}")
#     # Handle this gracefully in a real server environment


# Instantiate the NutriWiseApp class
try:
    nutriwise_app = NutriWiseApp() 
    print("API: NutriWiseApp successfully initialized and connected to DB.")
except Exception as e:
    print(f"API FATAL ERROR: Could not initialize NutriWiseApp: {e}")
    # You might want to raise an exception here to stop the server from starting


# --- Pydantic Models for Data Validation (Input/Output Schemas) ---

class FoodLog(BaseModel):
    """Schema for data coming from the React Native app when logging food."""
    date: str = Field(..., example=datetime.date.today().strftime('%Y-%m-%d'), description="Date in YYYY-MM-DD format.")
    food_name: str = Field(..., example="Apple", description="Name of the food item.")
    portions: float = Field(1.0, gt=0, description="Number of portions eaten.")

class RecommendationRequest(BaseModel):
    """Schema for requesting recommendations over a date range."""
    start_date: str = Field(..., example="2025-10-01")
    end_date: str = Field(..., example="2025-10-07")
    num_suggestions: int = Field(3, ge=1)

# --- API Endpoints ---

@app.post("/log/food", summary="Logs a new food entry for the user.")
async def log_food_entry(log: FoodLog):
    """Receives food intake data and logs it using the NutriWiseApp."""
    
    # Call the backend logic
    result = nutriwise_app.log_food(log.date, log.food_name, log.portions)
    
    # Assuming success if the result doesn't start with '❌'
    if result.startswith("✅"):
        return {"status": "success", "message": result}
    else:
        # If the food name is invalid, return a client error (400)
        raise HTTPException(status_code=400, detail=result)


@app.post("/analysis/recommendations", summary="Generates weekly nutrition recommendations.")
async def get_weekly_recommendations(request: RecommendationRequest):
    """Calculates weekly deficiency and suggests high-nutrient foods."""
    
    # Input validation (FastAPI handles most, but date format is good to check)
    try:
        datetime.datetime.strptime(request.start_date, '%Y-%m-%d')
        datetime.datetime.strptime(request.end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Date format must be YYYY-MM-DD.")
    
    # Call the backend logic
    report = nutriwise_app.get_recommendations(
        request.start_date, 
        request.end_date, 
        request.num_suggestions
    )
    
    if report.get("status") == "success":
        return report
    else:
        raise HTTPException(status_code=500, detail="Internal analysis error.")

@app.post("/admin/add_food", summary="Adds a new food item to the database (Admin action).")
async def add_new_food(item: NewFoodItem):
    """Placeholder for the missing admin endpoint logic."""
    # Assuming 'nutriwise_admin' instance is available or you call the logic
    # NOTE: You need to decide how to handle the NutriWiseAdmin instance here.
    # For a running API, you should instantiate NutriWiseAdmin *if* it doesn't already exist.
    
    # Placeholder success message (replace with actual admin logic call)
    message = f"✅ Logged new food: {item.food_name}. (Admin logic placeholder)."
    return {"status": "success", "message": message}
    # ------------------------------------------
# --- Running the Server ---
if __name__ == "__main__":
    # This runs the API server locally on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
