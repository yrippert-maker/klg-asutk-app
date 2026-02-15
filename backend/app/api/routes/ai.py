"""AI-ассистент КЛГ АСУ ТК — работает через Anthropic Claude API."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(tags=["ai"])


class AIRequest(BaseModel):
    prompt: str
    task: str = "chat"  # chat | summarize | extract_risks | classify | translate
    context: str | None = None


class AIResponse(BaseModel):
    result: str | None
    model: str
    provider: str = "anthropic"


@router.post("/ai/chat", response_model=AIResponse)
def ai_chat(
    req: AIRequest,
    user=Depends(get_current_user),
):
    """Отправить запрос AI-ассистенту (Anthropic Claude)."""
    from app.services.ai_service import chat, analyze_document

    if req.task == "chat":
        system = (
            "Ты — AI-ассистент системы КЛГ АСУ ТК (контроль лётной годности воздушных судов). "
            "Отвечай на русском языке. Используй терминологию ВК РФ, ФАП, ICAO, EASA."
        )
        if req.context:
            system += f"\n\nКонтекст: {req.context}"
        result = chat(prompt=req.prompt, system=system)
    else:
        text = f"{req.context}\n\n{req.prompt}" if req.context else req.prompt
        result = analyze_document(text=text, task=req.task)

    if result is None:
        raise HTTPException(503, "AI-сервис недоступен. Проверьте ANTHROPIC_API_KEY.")

    return AIResponse(result=result, model=settings.ANTHROPIC_MODEL)
