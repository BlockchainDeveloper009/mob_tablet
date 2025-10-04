-- ====================================================================
-- 1. SCHEMA CREATION (using NUTRI mnemonic prefix)
-- ====================================================================

-- Table 1: NUTRI_REF_Nutrient (Master list of nutrients and their RDI)
CREATE TABLE IF NOT EXISTS NUTRI_REF_Nutrient (
    nutrient_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    rdi_daily REAL NOT NULL,
    rdi_weekly REAL -- (rdi_daily * 7)
);

-- Table 2: NUTRI_REF_Food (Inventory of food, categorized)
CREATE TABLE IF NOT EXISTS NUTRI_REF_Food (
    food_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- e.g., 'Veggie', 'Fruit', 'Pulse'
    portion_size_g REAL NOT NULL -- Standard portion size (e.g., 100.0)
);

-- Table 3: NUTRI_MAP_Content (Links food to nutrient values per portion)
CREATE TABLE IF NOT EXISTS NUTRI_MAP_Content (
    content_id INTEGER PRIMARY KEY,
    food_id INTEGER NOT NULL,
    nutrient_id INTEGER NOT NULL,
    value_per_portion REAL NOT NULL,
    FOREIGN KEY (food_id) REFERENCES NUTRI_REF_Food (food_id),
    FOREIGN KEY (nutrient_id) REFERENCES NUTRI_REF_Nutrient (nutrient_id),
    UNIQUE (food_id, nutrient_id)
);

-- Table 4: NUTRI_USER_Consumption (Tracks user's actual intake)
CREATE TABLE IF NOT EXISTS NUTRI_USER_Consumption (
    entry_id INTEGER PRIMARY KEY,
    date TEXT NOT NULL, -- Stored as 'YYYY-MM-DD'
    food_id INTEGER NOT NULL,
    portions_eaten REAL NOT NULL, -- Number of standard portions (e.g., 1.5)
    FOREIGN KEY (food_id) REFERENCES NUTRI_REF_Food (food_id)
);


-- ====================================================================
-- 2. INSERT REFERENCE DATA (Sample Data)
-- ====================================================================

-- A. Insert into NUTRI_REF_Nutrient
INSERT INTO NUTRI_REF_Nutrient (name, unit, rdi_daily, rdi_weekly) VALUES
('Calories', 'kcal', 2000.0, 14000.0),
('Protein', 'g', 50.0, 350.0),
('Fiber', 'g', 30.0, 210.0),
('Vitamin C', 'mg', 75.0, 525.0),
('Iron', 'mg', 18.0, 126.0);


-- B. Insert into NUTRI_REF_Food
INSERT INTO NUTRI_REF_Food (name, category, portion_size_g) VALUES
('Broccoli', 'Veggie', 100.0),
('Apple', 'Fruit', 150.0),
('Lentils (Cooked)', 'Pulse', 100.0),
('Spinach (Raw)', 'Veggie', 50.0);


-- C. Insert into NUTRI_MAP_Content (Linking Food to Nutrients)
-- We use the auto-assigned IDs (1-5 for Nutrients, 1-4 for Food).

-- --- Broccoli (food_id=1) ---
INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) VALUES
(1, 1, 34.0),   -- Calories
(1, 2, 2.8),    -- Protein
(1, 3, 2.6),    -- Fiber
(1, 4, 89.2),   -- Vitamin C
(1, 5, 0.73);   -- Iron

-- --- Apple (food_id=2) ---
INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) VALUES
(2, 1, 78.0),   -- Calories
(2, 2, 0.39),   -- Protein
(2, 3, 3.6),    -- Fiber
(2, 4, 6.45),   -- Vitamin C
(2, 5, 0.18);   -- Iron

-- --- Lentils (food_id=3) ---
INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) VALUES
(3, 1, 116.0),  -- Calories
(3, 2, 9.02),   -- Protein
(3, 3, 7.9),    -- Fiber
(3, 4, 1.5),    -- Vitamin C
(3, 5, 3.33);   -- Iron


-- ====================================================================
-- 3. SAMPLE DAILY CONSUMPTION (User Input for two days)
-- ====================================================================

-- Day 1: October 1, 2025
INSERT INTO NUTRI_USER_Consumption (date, food_id, portions_eaten) VALUES 
('2025-10-01', 1, 2.0),  -- 2 portions of Broccoli
('2025-10-01', 2, 1.0);  -- 1 portion of Apple

-- Day 2: October 2, 2025
INSERT INTO NUTRI_USER_Consumption (date, food_id, portions_eaten) VALUES 
('2025-10-02', 3, 1.5);  -- 1.5 portions of Lentils