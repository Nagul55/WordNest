import os
import psycopg2
from dotenv import load_dotenv

dotenv_path = r"c:\Users\nagul\Documents\GitHub\WordNest\backend\.env"
load_dotenv(dotenv_path)

db_password = os.getenv("SUPABASE_DB_PASSWORD", "7AuVmSNf00kJ31fT")
supabase_url = os.getenv("SUPABASE_URL", "")
project_ref = supabase_url.split("//")[1].split(".")[0]

db_host = "aws-1-ap-northeast-2.pooler.supabase.com"
db_user = f"postgres.{project_ref}"
conn_string = f"postgresql://{db_user}:{db_password}@{db_host}:6543/postgres?sslmode=require"

try:
    conn = psycopg2.connect(conn_string, connect_timeout=10)
    cursor = conn.cursor()
    
    print("Adding onboarding columns to public.profiles...")
    cursor.execute("""
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS age TEXT,
        ADD COLUMN IF NOT EXISTS occupation TEXT,
        ADD COLUMN IF NOT EXISTS referral_source TEXT,
        ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
    """)
    conn.commit()
    print("Schema update successful!")

    # Verify columns
    cursor.execute("""
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'profiles';
    """)
    print("\n--- Current profiles table columns ---")
    for row in cursor.fetchall():
        print(row)

    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
