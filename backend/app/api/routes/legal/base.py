from typing import Dict, Any, List
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class LegalBaseHandler:
    """Базовый класс для обработчиков legal модулей"""
    
    def __init__(self):
        self.logger = logger
    
    def validate_request(self, data: Dict[str, Any]) -> bool:
        """Базовая валидация запросов"""
        if not data:
            raise HTTPException(status_code=400, detail="Empty request data")
        return True
    
    def handle_error(self, error: Exception, context: str = ""):
        """Унифицированная обработка ошибок"""
        self.logger.error(f"Error in {context}: {str(error)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    def format_response(self, data: Any, message: str = "Success") -> Dict[str, Any]:
        """Стандартный формат ответов"""
        return {
            "status": "success",
            "message": message,
            "data": data
        }