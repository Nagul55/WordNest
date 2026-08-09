import os
import psycopg2
from dotenv import load_dotenv
import uuid

# Load backend/app's .env
dotenv_path = r"c:\Users\nagul\Documents\GitHub\WordNest\backend\.env"
load_dotenv(dotenv_path)

db_password = os.getenv("SUPABASE_DB_PASSWORD", "7AuVmSNf00kJ31fT")
supabase_url = os.getenv("SUPABASE_URL", "")
if not supabase_url:
    print("No Supabase URL found. Can't test.")
    exit(1)
    
project_ref = supabase_url.split("//")[1].split(".")[0]
db_host = "aws-1-ap-northeast-2.pooler.supabase.com"
db_user = f"postgres.{project_ref}"
conn_string = f"postgresql://{db_user}:{db_password}@{db_host}:6543/postgres?sslmode=require"

print(f"Connecting to {db_host} as {db_user}...")
try:
    conn = psycopg2.connect(conn_string, connect_timeout=10)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. First, apply the schema migration
    print("Applying schema.sql...")
    with open(r"c:\Users\nagul\Documents\GitHub\WordNest\supabase\schema.sql", "r", encoding="utf-8") as f:
        schema_sql = f.read()
    
    conn.notices[:] = []
    cursor.execute(schema_sql)
    for notice in conn.notices:
        print("NOTICE:", notice.strip())
        
    print("Migration applied successfully.")
    
    # 2. Setup Test Users
    cursor.execute("SELECT id FROM public.profiles LIMIT 2;")
    users = cursor.fetchall()
    if len(users) < 2:
        print("Need at least 2 users in the database to run stress test.")
        exit(1)
        
    user_a_id = users[0][0]
    user_b_id = users[1][0]
    
    print(f"\nUsing Test User A: {user_a_id}")
    print(f"Using Test User B: {user_b_id}")
    
    # 3. Create a study set for User A
    set_a_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO public.study_sets (id, user_id, title, is_public) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING RETURNING id;", 
                   (set_a_id, user_a_id, "User A Deck", True))
    
    # 4. Stress Test RLS
    print("\n--- Testing RLS Policies ---")
    
    # Define a helper to run queries as a specific user
    def run_as_user(user_id, sql, params=()):
        try:
            with psycopg2.connect(conn_string) as test_conn:
                with test_conn.cursor() as test_cursor:
                    test_cursor.execute("SET request.jwt.claims TO %s;", (f'{{"sub": "{user_id}", "role": "authenticated"}}',))
                    test_cursor.execute("SET role authenticated;")
                    test_cursor.execute(sql, params)
                    if test_cursor.description:
                        return True, test_cursor.fetchall()
                    test_conn.commit()
                    return True, None
        except Exception as e:
            return False, str(e)

    # Test 1: User B tries to insert a flashcard but spoofing User A's user_id
    card_id = str(uuid.uuid4())
    print("\nTest 1: User B spoofing User A's user_id on INSERT")
    success, result = run_as_user(user_b_id, 
        "INSERT INTO public.flashcards (id, set_id, user_id, term, definition) VALUES (%s, %s, %s, %s, %s);",
        (card_id, set_a_id, user_a_id, "Spoofed Term", "Spoofed Def")
    )
    if not success:
        print("[PASS] Spoofed INSERT rejected (as expected)!")
        print("   Error:", result.split('\n')[0])
    else:
        print("[FAIL] WARNING: Spoofed INSERT succeeded! RLS failed!")

    # Test 2: User B legitimate INSERT (using User B's user_id)
    card_id_2 = str(uuid.uuid4())
    print("\nTest 2: User B legitimate INSERT (using User B's user_id)")
    success, result = run_as_user(user_b_id, 
        "INSERT INTO public.flashcards (id, set_id, user_id, term, definition) VALUES (%s, %s, %s, %s, %s);",
        (card_id_2, set_a_id, user_b_id, "Legit Term", "Legit Def")
    )
    if success:
        print("[PASS] Legitimate INSERT succeeded!")
    else:
        print("[FAIL] WARNING: Legitimate INSERT failed!")
        print("   Error:", result.split('\n')[0])
        
    # Finished testing

except Exception as e:
    print(f"Global Error: {e}")
finally:
    if 'conn' in locals() and conn:
        cursor.close()
        conn.close()
