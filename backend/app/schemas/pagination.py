"""
Pagination schemas and utilities for multi-user server deployment.
Supports cursor-based and offset-based pagination.
"""
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, Query


T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query params for pagination."""
    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    per_page: int = Field(default=25, ge=1, le=100, description="Items per page (max 100)")
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response wrapper."""
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    
    @classmethod
    def from_query(cls, query: Query, params: PaginationParams, schema_cls=None):
        total = query.count()
        items = query.offset(params.offset).limit(params.per_page).all()
        if schema_cls:
            items = [schema_cls.model_validate(i) for i in items]
        pages = (total + params.per_page - 1) // params.per_page
        return cls(
            items=items,
            total=total,
            page=params.page,
            per_page=params.per_page,
            pages=pages,
        )


def paginate(db: Session, query, params: PaginationParams):
    """Apply pagination to a SQLAlchemy query. Returns (items, total)."""
    total = query.count()
    items = query.offset(params.offset).limit(params.per_page).all()
    return items, total
