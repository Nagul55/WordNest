from fastapi import APIRouter, Query
from app.services.unsplash_service import search_images

router = APIRouter(prefix="/api/unsplash", tags=["Unsplash"])

@router.get("/search")
async def get_images(q: str = Query(..., min_length=2), per_page: int = 6):
    images = await search_images(query=q, per_page=per_page)
    return {"status": "success", "results": images}
