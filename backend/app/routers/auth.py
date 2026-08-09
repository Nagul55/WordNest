from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Initialize Supabase Admin client using Service Role Key
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class DeleteAccountRequest(BaseModel):
    user_id: str

@router.delete("/delete")
async def delete_account(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        # Verify the user using the provided JWT
        user_response = supabase_admin.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user_id = user_response.user.id
        
        # Delete the user using the admin API
        supabase_admin.auth.admin.delete_user(user_id)
        
        return {"status": "success", "message": "Account securely deleted"}
        
    except Exception as e:
        print(f"Delete account error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
