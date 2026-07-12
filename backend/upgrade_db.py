import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'database', 'ecosphere.db')

def upgrade():
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Update employees table
    # Check if columns exist
    cursor.execute("PRAGMA table_info(employees)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'gender' not in columns:
        cursor.execute("ALTER TABLE employees ADD COLUMN gender VARCHAR(20)")
        print("Added column 'gender' to 'employees'")
    if 'age' not in columns:
        cursor.execute("ALTER TABLE employees ADD COLUMN age INTEGER")
        print("Added column 'age' to 'employees'")
    if 'employment_type' not in columns:
        cursor.execute("ALTER TABLE employees ADD COLUMN employment_type VARCHAR(30)")
        print("Added column 'employment_type' to 'employees'")
    if 'joining_date' not in columns:
        cursor.execute("ALTER TABLE employees ADD COLUMN joining_date DATE")
        print("Added column 'joining_date' to 'employees'")
        
    # 2. Update department_scores table
    cursor.execute("PRAGMA table_info(department_scores)")
    score_columns = [col[1] for col in cursor.fetchall()]
    
    if 'total_score' not in score_columns:
        cursor.execute("ALTER TABLE department_scores ADD COLUMN total_score FLOAT DEFAULT 0.0")
        print("Added column 'total_score' to 'department_scores'")
    if 'last_updated' not in score_columns:
        cursor.execute("ALTER TABLE department_scores ADD COLUMN last_updated DATETIME")
        print("Added column 'last_updated' to 'department_scores'")
        
    # 3. Create settings table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        environmental_weight INTEGER DEFAULT 40,
        social_weight INTEGER DEFAULT 30,
        governance_weight INTEGER DEFAULT 30,
        evidence_required BOOLEAN DEFAULT 1,
        auto_carbon BOOLEAN DEFAULT 1,
        auto_badge BOOLEAN DEFAULT 1
    )
    """)
    print("Checked/Created table 'settings'")
    
    # Insert default settings if empty
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO settings (environmental_weight, social_weight, governance_weight, evidence_required, auto_carbon, auto_badge) VALUES (40, 30, 30, 1, 1, 1)")
        print("Inserted default row into 'settings'")
        
    conn.commit()
    conn.close()
    print("Database migration completed successfully!")

if __name__ == "__main__":
    upgrade()
