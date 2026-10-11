import json
import httpx
from typing import List, Dict, Any, Optional
from backend.config import settings

class ModelProviderService:
    @staticmethod
    async def get_provider_status() -> Dict[str, Any]:
        ollama_status = "unavailable"
        ollama_models = []
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    ollama_status = "connected"
                    data = res.json()
                    ollama_models = [m.get("name") for m in data.get("models", [])]
        except Exception:
            ollama_status = "unavailable (service offline)"

        anthropic_status = "configured" if settings.ANTHROPIC_API_KEY else "missing_api_key"
        openai_status = "configured" if settings.OPENAI_API_KEY else "missing_api_key"

        return {
            "default_provider": settings.DEFAULT_PROVIDER,
            "ollama": {
                "status": ollama_status,
                "base_url": settings.OLLAMA_BASE_URL,
                "configured_model": settings.OLLAMA_MODEL,
                "available_models": ollama_models
            },
            "anthropic": {
                "status": anthropic_status,
                "model": settings.ANTHROPIC_MODEL
            },
            "openai": {
                "status": openai_status,
                "model": settings.OPENAI_MODEL
            }
        }

    @staticmethod
    async def generate_completion(
        prompt: str,
        system_prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        provider = provider or settings.DEFAULT_PROVIDER
        
        if provider == "ollama":
            target_model = model or settings.OLLAMA_MODEL
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    res = await client.post(
                        f"{settings.OLLAMA_BASE_URL}/api/generate",
                        json={
                            "model": target_model,
                            "prompt": prompt,
                            "system": system_prompt,
                            "stream": False
                        }
                    )
                    if res.status_code == 200:
                        return res.json().get("response", "")
                    else:
                        raise RuntimeError(f"Ollama error: HTTP {res.status_code} - {res.text}")
            except httpx.ConnectError:
                raise RuntimeError(
                    f"Ollama connection refused at {settings.OLLAMA_BASE_URL}. "
                    "Make sure Ollama is installed and running (ollama serve)."
                )
            except Exception as e:
                raise RuntimeError(f"Ollama generation failed: {str(e)}")

        elif provider == "anthropic":
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in .env.")
            target_model = model or settings.ANTHROPIC_MODEL
            try:
                headers = {
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                async with httpx.AsyncClient(timeout=60.0) as client:
                    res = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers=headers,
                        json={
                            "model": target_model,
                            "max_tokens": 4096,
                            "system": system_prompt,
                            "messages": [{"role": "user", "content": prompt}]
                        }
                    )
                    if res.status_code == 200:
                        data = res.json()
                        content_blocks = data.get("content", [])
                        return "".join([b.get("text", "") for b in content_blocks if b.get("type") == "text"])
                    else:
                        raise RuntimeError(f"Anthropic error: HTTP {res.status_code} - {res.text}")
            except Exception as e:
                raise RuntimeError(f"Anthropic generation failed: {str(e)}")

        elif provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OpenAI API key is not configured. Please set OPENAI_API_KEY in .env.")
            target_model = model or settings.OPENAI_MODEL
            try:
                headers = {
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "content-type": "application/json"
                }
                async with httpx.AsyncClient(timeout=60.0) as client:
                    res = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers=headers,
                        json={
                            "model": target_model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": prompt}
                            ]
                        }
                    )
                    if res.status_code == 200:
                        data = res.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        raise RuntimeError(f"OpenAI error: HTTP {res.status_code} - {res.text}")
            except Exception as e:
                raise RuntimeError(f"OpenAI generation failed: {str(e)}")

        else:
            raise ValueError(f"Unsupported model provider: {provider}")
