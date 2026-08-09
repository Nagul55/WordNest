import os
import psycopg2
from dotenv import load_dotenv

# Load backend/app's .env
dotenv_path = r"c:\Users\nagul\Documents\GitHub\WordNest\backend\.env"
load_dotenv(dotenv_path)

db_password = os.getenv("SUPABASE_DB_PASSWORD", "7AuVmSNf00kJ31fT")
supabase_url = os.getenv("SUPABASE_URL", "")
project_ref = supabase_url.split("//")[1].split(".")[0]

db_host = "aws-1-ap-northeast-2.pooler.supabase.com"
db_user = f"postgres.{project_ref}"
conn_string = f"postgresql://{db_user}:{db_password}@{db_host}:6543/postgres?sslmode=require"

try:
    conn = psycopg2.connect(conn_string, connect_timeout=5)
    cursor = conn.cursor()
    
    print("Executing SQL to add DELETE policy...")
    cursor.execute("""
        DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
        CREATE POLICY "Users can delete own profile" ON public.profiles
            FOR DELETE USING (auth.uid() = id);
    """)
    conn.commit()
    print("Successfully added Users can delete own profile RLS policy!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
