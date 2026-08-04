import httpx
from typing import List, Dict, Any
from app.config import UNSPLASH_ACCESS_KEY

UNSPLASH_SEARCH_URL = "https://api.unsplash.com/search/photos"

async def search_images(query: str, per_page: int = 6) -> List[Dict[str, Any]]:
    """
    Searches Unsplash for high-quality educational images to attach to flashcard terms.
    """
    if not UNSPLASH_ACCESS_KEY or UNSPLASH_ACCESS_KEY == "your-access-key-here":
        # Return fallback high-res stock placeholders if API key isn't active
        return [
            {
                "id": "demo-1",
                "url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
                "thumb": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80",
                "alt_text": "Study concept on laptop",
                "author": "Unsplash Community"
            },
            {
                "id": "demo-2",
                "url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
                "thumb": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=80",
                "alt_text": "Open book and study room",
                "author": "Unsplash Community"
            }
        ]

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                UNSPLASH_SEARCH_URL,
                params={"query": query, "per_page": per_page, "orientation": "landscape"},
                headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
                timeout=5.0
            )
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("results", []):
                results.append({
                    "id": item["id"],
                    "url": item["urls"]["regular"],
                    "thumb": item["urls"]["thumb"],
                    "alt_text": item.get("alt_description", query) or query,
                    "author": item["user"]["name"],
                    "author_link": item["user"]["links"]["html"]
                })
            return results
        except Exception as e:
            print(f"[Unsplash Service Error]: {str(e)}")
            return []
