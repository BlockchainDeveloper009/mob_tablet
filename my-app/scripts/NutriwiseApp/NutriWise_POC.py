import datetime
from collections import defaultdict

class NutriWise:
    """
    A simplified model for the NutriWise app logic.
    Tracks food intake, calculates deficiencies, and provides food recommendations.
    """

    # Simplified Recommended Daily Allowances (RDAs) for demonstration (in arbitrary units)
    RDAS = {
        "Calories": 2000,
        "Protein": 50,  # grams
        "Fiber": 25,    # grams
        "Vitamin D": 15, # mcg
        "Calcium": 1000, # mg
    }

    # Food Database with key nutrients
    FOOD_DATABASE = {
        "Salmon (4 oz)": {"Calories": 208, "Protein": 20, "Fiber": 0, "Vitamin D": 11, "Calcium": 9},
        "Spinach (1 cup)": {"Calories": 7, "Protein": 1, "Fiber": 4, "Vitamin D": 0, "Calcium": 30},
        "Yogurt (1 cup)": {"Calories": 150, "Protein": 8, "Fiber": 0, "Vitamin D": 3, "Calcium": 415},
        "Whole-Wheat Bread (2 slices)": {"Calories": 160, "Protein": 6, "Fiber": 5, "Vitamin D": 0, "Calcium": 50},
        "White Bread (2 slices)": {"Calories": 140, "Protein": 4, "Fiber": 1, "Vitamin D": 0, "Calcium": 20},
        "Spaghetti (1 cup)": {"Calories": 220, "Protein": 8, "Fiber": 3, "Vitamin D": 0, "Calcium": 10},
        "Black Beans (1/2 cup)": {"Calories": 114, "Protein": 8, "Fiber": 8, "Vitamin D": 0, "Calcium": 23},
        "Omelette": {"Calories": 250, "Protein": 15, "Fiber": 1, "Vitamin D": 1, "Calcium": 60},
    }

    # Recommendations based on nutrient deficiencies
    RECOMMENDATION_GUIDE = {
        "Vitamin D": ["Salmon (4 oz)", "Yogurt (1 cup)"],
        "Fiber": ["Black Beans (1/2 cup)", "Whole-Wheat Bread (2 slices)", "Spinach (1 cup)"],
        "Calcium": ["Yogurt (1 cup)", "Spinach (1 cup)"],
        "Protein": ["Salmon (4 oz)", "Black Beans (1/2 cup)"],
    }

    def __init__(self):
        # Stores food logs: { 'YYYY-MM-DD': [{'food': 'Salmon', 'amount': 1}] }
        self.food_log = defaultdict(list)

    # ----------------------------------------------------------------------
    # 1. Logging Functions
    # ----------------------------------------------------------------------

    def log_food(self, date_str, food_name):
        """Logs a single food item for a specific date."""
        if food_name in self.FOOD_DATABASE:
            self.food_log[date_str].append({'food': food_name, 'nutrients': self.FOOD_DATABASE[food_name]})
            print(f"✅ Logged: {food_name} on {date_str}")
        else:
            print(f"❌ Error: {food_name} not found in database.")

    # ----------------------------------------------------------------------
    # 2. Analysis Functions
    # ----------------------------------------------------------------------

    def get_weekly_summary(self, start_date_str, end_date_str):
        """Calculates total nutrient intake and identifies deficiencies over a week."""
        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        num_days = (end_date - start_date).days + 1
        
        # Initialize weekly totals for all nutrients to zero
        weekly_totals = {nutrient: 0 for nutrient in self.RDAS}

        # Calculate total intake for the week
        for date_str, meals in self.food_log.items():
            current_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            if start_date <= current_date <= end_date:
                for meal in meals:
                    for nutrient, value in meal['nutrients'].items():
                        weekly_totals[nutrient] += value

        # Calculate daily average and compliance
        deficiency_report = {}
        compliance_score = 0
        total_deficiency_percent = 0
        
        for nutrient, rda in self.RDAS.items():
            # Calculate average daily intake
            avg_daily_intake = weekly_totals[nutrient] / num_days
            
            # Calculate deficiency/surplus
            percent_of_rda = (avg_daily_intake / rda) * 100
            
            deficiency_report[nutrient] = {
                "Average Intake": round(avg_daily_intake, 1),
                "RDA": rda,
                "Percent of RDA": round(percent_of_rda, 1)
            }
            total_deficiency_percent += min(percent_of_rda, 100) # Only count up to 100% for score

        compliance_score = round(total_deficiency_percent / len(self.RDAS), 1)
        
        # Identify top 3 deficiencies (excluding calories)
        top_deficiencies = sorted([
            (report["Percent of RDA"], nutrient)
            for nutrient, report in deficiency_report.items() if nutrient != "Calories"
        ], key=lambda x: x[0])[:3]

        return weekly_totals, deficiency_report, compliance_score, top_deficiencies

    # ----------------------------------------------------------------------
    # 3. Display Function (The User Output)
    # ----------------------------------------------------------------------

    def show_weekly_report(self, start_date_str, end_date_str):
        """Generates and prints the full NutriWise weekly report."""
        
        weekly_totals, deficiency_report, compliance_score, top_deficiencies = \
            self.get_weekly_summary(start_date_str, end_date_str)
        
        deficiency_names = [name for score, name in top_deficiencies]

        print("-" * 50)
        print("          NUTRIWISE WEEKLY REPORT 📊")
        print("-" * 50)

        ## 1. Weekly Overview: The Deficiency Report
        print("\n## 1. Weekly Overview: Deficiency Report")
        print(f"🎯 Weekly Compliance Score: **{compliance_score}%** (Average of all nutrients)")
        print(f"⚠️ Top 3 Deficiencies: **{', '.join(deficiency_names)}**\n")
        
        for score, name in top_deficiencies:
             print(f"   - {name}: Only met {score}% of the recommended daily amount.")
        
        print("-" * 50)

        ## 2. Daily Log: The Review
        print("\n## 2. Daily Log: The Review")
        
        current_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()

        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            day_name = current_date.strftime('%A')
            
            meals = self.food_log[date_str]
            if meals:
                food_list = ", ".join([item['food'].split('(')[0].strip() for item in meals])
                
                # Simple check for a low score to simulate the red alert
                is_low = False
                for nutrient in deficiency_names:
                    daily_intake = sum(item['nutrients'].get(nutrient, 0) for item in meals)
                    if daily_intake < self.RDAS.get(nutrient, 0) * 0.5: # Flag if less than 50% of RDA for a deficient nutrient
                        is_low = True
                        break

                flag = "🔴 LOW ALERT" if is_low else "🟢 Balanced"
                print(f"   - **{day_name} ({date_str})**: {food_list} - {flag}")
            else:
                 print(f"   - **{day_name} ({date_str})**: No food logged.")
                 
            current_date += datetime.timedelta(days=1)
        
        print("-" * 50)

        ## 3. Recommended Food Options: The Solution
        print("\n## 3. Recommended Food Options: The Solution")
        print("Based on your weekly trends, here's what you should be eating more of:")
        
        for name in deficiency_names:
            rda = self.RDAS.get(name, "N/A")
            avg_intake = deficiency_report.get(name, {}).get("Average Intake", "N/A")
            
            recommendations = self.RECOMMENDATION_GUIDE.get(name, ["No specific recommendations found."])
            
            print(f"\n### 💡 Focus Area: {name}")
            print(f"   - Your Avg Daily Intake: {avg_intake} vs. RDA: {rda}")
            print("   - **Suggested Foods**: " + ", ".join(recommendations))
        
        print("-" * 50)
        return top_deficiencies

# ----------------------------------------------------------------------
# DEMONSTRATION
# ----------------------------------------------------------------------

# 1. Initialize the app
app = NutriWise()
start_date = '2025-10-01' # Wednesday
end_date = '2025-10-07'   # Tuesday

# 2. Log a week's worth of food data (with intentional deficiencies in Fiber and Vitamin D)
app.log_food('2025-10-01', 'Omelette')
app.log_food('2025-10-01', 'White Bread (2 slices)')
app.log_food('2025-10-01', 'Spaghetti (1 cup)')

app.log_food('2025-10-02', 'Omelette')
app.log_food('2025-10-02', 'White Bread (2 slices)')
app.log_food('2025-10-02', 'Salmon (4 oz)') # Helps Vitamin D today

app.log_food('2025-10-03', 'Omelette')
app.log_food('2025-10-03', 'Spaghetti (1 cup)')

app.log_food('2025-10-04', 'Omelette')
app.log_food('2025-10-04', 'Yogurt (1 cup)') # Helps Calcium
app.log_food('2025-10-04', 'Black Beans (1/2 cup)') # Helps Fiber

# 3. Generate the report (This is the function you would call in the app)
app.show_weekly_report(start_date, end_date)