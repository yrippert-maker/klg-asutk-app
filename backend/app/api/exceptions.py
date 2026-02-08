"""
Централизованная обработка исключений для API.
"""
import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


async def pydantic_validation_error_handler(request: Request, exc: ValidationError):
    """Ошибки валидации Pydantic при сериализации ответа (например, datetime из SQLite)."""
    errs = exc.errors()
    logger.warning("Pydantic ValidationError on %s: %s", request.url.path, errs)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Ошибка формата данных. Подробности в логе бэкенда.",
            "errors": errs,
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Обработчик ошибок валидации Pydantic."""
    errors = exc.errors()
    logger.warning(f"Validation error on {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Ошибка валидации данных",
            "errors": errors,
        },
    )


async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Обработчик ошибок целостности БД (дубликаты, внешние ключи и т.д.)."""
    logger.error(f"Database integrity error on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": "Нарушение целостности данных. Возможно, запись уже существует.",
        },
    )


async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    """Обработчик общих ошибок SQLAlchemy."""
    logger.error(f"Database error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Ошибка базы данных. Обратитесь к администратору.",
        },
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Обработчик всех остальных исключений."""
    logger.error(
        f"Unhandled exception on {request.url.path}: {str(exc)}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Внутренняя ошибка сервера. Обратитесь к администратору.",
        },
    )
