
"""
### 2. `NutriWiseApp` Class (User Side)

This class inherits the connection but focuses only on the core application logic (Log, Analyze, Recommend).
"""
import sqlite3
import datetime
import pandas as pd
from NutriWiseAdmin import NutriWiseAdmin
class NutriWiseApp:
    """
    Handles all user-facing functions: food logging, data analysis (get_daily_intake_df), 
    and recommendations. Connects to the database established by NutriWiseAdmin.
    """
    DB_NAME = 'NutriWise.db'

    def __init__(self):
        # Assumes NutriWiseAdmin has already set up the DB
        self.conn = sqlite3.connect(self.DB_NAME)
        self.cursor = self.conn.cursor()
        
    # ----------------------------------------------------------------------
    # 1. Logging Function 
    # ----------------------------------------------------------------------

    def log_food(self, date_str, food_name, portions=1.0):
        """Logs a user consumption entry."""
        self.cursor.execute("SELECT food_id FROM NUTRI_REF_Food WHERE name = ?", (food_name,))
        result = self.cursor.fetchone()
        
        if result:
            food_id = result[0]
            self.cursor.execute("""
                INSERT INTO NUTRI_USER_Consumption (date, food_id, portions_eaten) 
                VALUES (?, ?, ?)
            """, (date_str, food_id, portions))
            self.conn.commit()
            return f"✅ App: Logged {portions} portion(s) of {food_name}."
        else:
            return f"❌ App Error: Food '{food_name}' not found in food database."
    
    # ----------------------------------------------------------------------
    # 2. Analysis and Reporting Functions 
    # ----------------------------------------------------------------------

    def get_rda_targets(self):
        """Fetches all nutrient targets from the reference table."""
        self.cursor.execute("SELECT name, rdi_daily, rdi_weekly, unit FROM NUTRI_REF_Nutrient")
        return {row[0]: {'daily': row[1], 'weekly': row[2], 'unit': row[3]} for row in self.cursor.fetchall()}

    def get_daily_intake_df(self, start_date_str, end_date_str):
        """Calculates daily nutrient intake and returns a Pandas DataFrame."""
        
        query = """
            SELECT
                T1.date,
                T4.name AS nutrient_name,
                SUM(T1.portions_eaten * T3.value_per_portion) AS daily_intake
            FROM NUTRI_USER_Consumption AS T1
            JOIN NUTRI_REF_Food AS T2 ON T1.food_id = T2.food_id
            JOIN NUTRI_MAP_Content AS T3 ON T2.food_id = T3.food_id
            JOIN NUTRI_REF_Nutrient AS T4 ON T3.nutrient_id = T4.nutrient_id
            WHERE T1.date BETWEEN ? AND ?
            GROUP BY T1.date, T4.name
            ORDER BY T1.date, T4.name
        """
        
        self.cursor.execute(query, (start_date_str, end_date_str))
        log_data = self.cursor.fetchall()
        
        df = pd.DataFrame(log_data, columns=['Date', 'Nutrient', 'Intake'])
        df_pivoted = df.pivot_table(index='Date', columns='Nutrient', values='Intake').reset_index()

        start = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
        end = datetime.datetime.strptime(end_date_str, '%Y-%m-%d')
        date_range = [(start + datetime.timedelta(days=i)).strftime('%Y-%m-%d') for i in range((end - start).days + 1)]
        
        full_df = pd.DataFrame({'Date': date_range}).merge(df_pivoted, on='Date', how='left').fillna(0)
        full_df['Day'] = pd.to_datetime(full_df['Date']).dt.strftime('%a')
        
        return full_df
    
    # ----------------------------------------------------------------------
    # 3. Recommendation Logic 
    # ----------------------------------------------------------------------
    
    def _get_deficient_nutrients(self, df_intake):
        """Analyzes the weekly intake against targets and returns a prioritized list."""
        targets = self.get_rda_targets()
        weekly_intake = df_intake.drop(columns=['Date', 'Day']).sum().to_dict()
        deficiencies = {}

        for nutrient, intake in weekly_intake.items():
            if nutrient in targets and nutrient != 'Calories': 
                rda_weekly = targets[nutrient]['weekly']
                if intake < rda_weekly:
                    deficiencies[nutrient] = {'deficit_pct': (rda_weekly - intake) / rda_weekly}
        
        sorted_deficits = sorted(deficiencies.items(), key=lambda x: x[1]['deficit_pct'], reverse=True)
        return [item[0] for item in sorted_deficits]


    def get_recommendations(self, start_date_str, end_date_str, num_suggestions=3):
        """Generates a list of food recommendations based on the user's weekly deficits."""
        
        df_intake = self.get_daily_intake_df(start_date_str, end_date_str)
        deficient_nutrients = self._get_deficient_nutrients(df_intake)

        if not deficient_nutrients:
            return {"status": "success", "message": "Congratulations! You met all tracked nutrient goals this week! 🎉"}

        recommendations = []
        for nutrient_name in deficient_nutrients:
            query = """
                SELECT 
                    T2.name, 
                    T3.value_per_portion,
                    T4.unit
                FROM NUTRI_REF_Nutrient AS T4
                JOIN NUTRI_MAP_Content AS T3 ON T4.nutrient_id = T3.nutrient_id
                JOIN NUTRI_REF_Food AS T2 ON T3.food_id = T2.food_id
                WHERE T4.name = ? 
                ORDER BY T3.value_per_portion DESC
                LIMIT ?
            """
            self.cursor.execute(query, (nutrient_name, num_suggestions))
            top_foods = self.cursor.fetchall()
            
            nutrient_recs = []
            for food_name, value, unit in top_foods:
                if value > 0:
                     nutrient_recs.append(f"{food_name} ({value:.1f} {unit} per portion)")
            
            if nutrient_recs:
                recommendations.append({
                    "nutrient": nutrient_name,
                    "suggestions": nutrient_recs
                })

        return {"status": "success", "recommendations": recommendations}

    def close(self):
        """Closes the database connection."""
        self.conn.close()

# ----------------------------------------------------------------------
# ----------------------------------------------------------------------

## Testing/Demonstration Environment
if __name__ == '__main__':
    # 1. ADMIN SETUP AND CUSTOMIZATION
    admin = NutriWiseAdmin()
    
    # Admin adds custom foods based on user preference
    print(admin.add_food_item(
        food_name='Orgain Powder Shake', 
        category='Supplement', 
        portion_size_g=46.0, 
        nutrient_values={'Protein': 21.0, 'Fiber': 7.0, 'Calories': 150}
    ))
    print(admin.add_food_item(
        food_name='Moringa Powder', 
        category='Herb/Spice', 
        portion_size_g=10.0, 
        nutrient_values={'Vitamin C': 1.8, 'Iron': 2.8, 'Calories': 30}
    ))
    admin.close()


    # 2. USER APPLICATION USAGE
    app = NutriWiseApp()
    
    start_date = '2025-10-01'
    end_date = '2025-10-07'

    # User logs custom foods
    print(app.log_food('2025-10-04', 'Orgain Powder Shake', portions=1))
    print(app.log_food('2025-10-05', 'Moringa Powder', portions=0.5))
    print(app.log_food('2025-10-06', 'Apple', portions=2)) # Using a default food

    # Analyze and Recommend
    df_report = app.get_daily_intake_df(start_date, end_date)
    print("\n--- Daily Consumption Report ---")
    print(df_report)
    
    report = app.get_recommendations(start_date, end_date, num_suggestions=3)

    print("\n--- Recommendation Report (Suggests custom foods) ---")
    if 'recommendations' in report:
        for rec in report['recommendations']:
            print(f"\n🎯 **Nutrient Deficient:** {rec['nutrient']}")
            print("   Suggested Foods to Meet Goal:")
            for item in rec['suggestions']:
                print(f"   - {item}")
    else:
        print(report['message'])

    app.close()