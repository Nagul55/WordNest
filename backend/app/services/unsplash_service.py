import httpx
import urllib.parse
from typing import List, Dict, Any
from app.config import UNSPLASH_ACCESS_KEY

UNSPLASH_SEARCH_URL = "https://api.unsplash.com/search/photos"

def _get_fallback_images(query: str, count: int = 6) -> List[Dict[str, Any]]:
    """Generates dynamic term-specific image fallbacks when Unsplash API is offline or rate-limited."""
    clean_query = query.strip() or "learning"
    encoded = urllib.parse.quote(clean_query)
    
    return [
        {
            "id": f"fallback-lf-{encoded}-1",
            "url": f"https://loremflickr.com/800/500/{encoded}?random=1",
            "thumb": f"https://loremflickr.com/400/250/{encoded}?random=1",
            "alt_text": f"{clean_query} illustration",
            "author": "Visual Media"
        },
        {
            "id": f"fallback-pol-{encoded}-2",
            "url": f"https://image.pollinations.ai/prompt/photo%20of%20{encoded}?width=800&height=500&nologo=true",
            "thumb": f"https://image.pollinations.ai/prompt/photo%20of%20{encoded}?width=400&height=250&nologo=true",
            "alt_text": f"Photo of {clean_query}",
            "author": "AI Studio"
        },
        {
            "id": f"fallback-lf-{encoded}-3",
            "url": f"https://loremflickr.com/800/500/{encoded}?random=2",
            "thumb": f"https://loremflickr.com/400/250/{encoded}?random=2",
            "alt_text": f"{clean_query} visual",
            "author": "Visual Media"
        },
        {
            "id": f"fallback-pol-{encoded}-4",
            "url": f"https://image.pollinations.ai/prompt/high%20quality%20picture%20of%20{encoded}?width=800&height=500&nologo=true",
            "thumb": f"https://image.pollinations.ai/prompt/high%20quality%20picture%20of%20{encoded}?width=400&height=250&nologo=true",
            "alt_text": f"Picture of {clean_query}",
            "author": "AI Studio"
        }
    ][:count]

async def search_images(query: str, per_page: int = 6) -> List[Dict[str, Any]]:
    """
    Searches Unsplash for high-quality educational images to attach to flashcard terms.
    Falls back to dynamic term-specific images if API key is inactive or rate limited.
    """
    if not UNSPLASH_ACCESS_KEY or UNSPLASH_ACCESS_KEY == "your-access-key-here":
        return _get_fallback_images(query, per_page)

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
            
            if results:
                return results
            return _get_fallback_images(query, per_page)
        except Exception as e:
            print(f"[Unsplash Service Exception]: {str(e)} -> Using term-specific fallbacks for '{query}'")
            return _get_fallback_images(query, per_page)
