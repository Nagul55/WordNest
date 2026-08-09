import os
import psycopg2
from dotenv import load_dotenv

# Load backend/app's .env
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

db_password = os.getenv("SUPABASE_DB_PASSWORD", "7AuVmSNf00kJ31fT")
supabase_url = os.getenv("SUPABASE_URL", "")
project_ref = supabase_url.split("//")[1].split(".")[0]

regions = [
    "ap-south-1",
    "ap-southeast-1",
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "ca-central-1",
    "sa-east-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "ap-northeast-2"
]

connected = False
conn = None

# Scan both cluster subdomains (aws-0 and aws-1)
for cluster in ["aws-0", "aws-1"]:
    for region in regions:
        db_host = f"{cluster}-{region}.pooler.supabase.com"
        db_user = f"postgres.{project_ref}"
        
        # Try both transaction (6543) and session (5432) ports
        for port in [6543, 5432]:
            conn_string = f"postgresql://{db_user}:{db_password}@{db_host}:{port}/postgres?sslmode=require"
            try:
                conn = psycopg2.connect(conn_string, connect_timeout=3)
                print(f"SUCCESS: Connected to {cluster}-{region} on port {port}!")
                connected = True
                break
            except Exception as e:
                pass
                
        if connected:
            break
    if connected:
        break

if not connected:
    print("Could not connect to any regional pooler. Trying direct IPv6...")
    try:
        db_host = f"db.{project_ref}.supabase.co"
        conn_string = f"postgresql://postgres:{db_password}@{db_host}:5432/postgres"
        conn = psycopg2.connect(conn_string, connect_timeout=5)
        print("Connected via direct IPv6!")
        connected = True
    except Exception as e:
        print(f"IPv6 Direct also failed: {e}")

if connected and conn:
    try:
        cursor = conn.cursor()
        schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "supabase", "schema_v3_analytics.sql"))
        print(f"Reading schema from: {schema_path}")
        with open(schema_path, "r", encoding="utf-8") as f:
            sql = f.read()
            
        print("Executing SQL analytics script...")
        cursor.execute(sql)
        conn.commit()
        print("Database tables and RLS policies initialized successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error executing SQL: {e}")
else:
    print("Could not establish a connection to the database.")
