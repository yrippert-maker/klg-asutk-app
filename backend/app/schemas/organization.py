from typing import Literal
from pydantic import BaseModel, Field, EmailStr, field_validator

from app.schemas.common import TimestampOut


OrgKind = Literal["operator", "mro", "authority", "other"]


class OrganizationCreate(BaseModel):
    kind: OrgKind = Field(..., description="operator|mro|authority|other")
    name: str = Field(..., min_length=2, max_length=255)

    inn: str | None = Field(default=None, description="10 or 12 digits")
    ogrn: str | None = Field(default=None, description="13 or 15 digits")
    address: str | None = Field(default=None, max_length=500)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)

    @field_validator("inn")
    @classmethod
    def validate_inn(cls, v: str | None):
        if v is None or v == "":
            return None
        s = v.strip()
        if not (s.isdigit() and len(s) in (10, 12)):
            raise ValueError("ИНН должен содержать 10 или 12 цифр")
        return s

    @field_validator("ogrn")
    @classmethod
    def validate_ogrn(cls, v: str | None):
        if v is None or v == "":
            return None
        s = v.strip()
        if not (s.isdigit() and len(s) in (13, 15)):
            raise ValueError("ОГРН должен содержать 13 или 15 цифр")
        return s

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None):
        if v is None or v == "":
            return None
        s = v.strip()
        # мягкая валидация: цифры/пробел/()+-
        allowed = set("0123456789+()- ")
        if any(ch not in allowed for ch in s) or len(s) < 5:
            raise ValueError("Телефон содержит недопустимые символы")
        return s


class OrganizationUpdate(BaseModel):
    kind: OrgKind | None = None
    name: str | None = Field(default=None, min_length=2, max_length=255)
    inn: str | None = None
    ogrn: str | None = None
    address: str | None = Field(default=None, max_length=500)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)

    # переиспользуем валидаторы (можно продублировать или вынести в миксин)
    @field_validator("inn")
    @classmethod
    def validate_inn(cls, v: str | None):
        if v is None or v == "":
            return None
        s = v.strip()
        if not (s.isdigit() and len(s) in (10, 12)):
            raise ValueError("ИНН должен содержать 10 или 12 цифр")
        return s

    @field_validator("ogrn")
    @classmethod
    def validate_ogrn(cls, v: str | None):
        if v is None or v == "":
            return None
        s = v.strip()
        if not (s.isdigit() and len(s) in (13, 15)):
            raise ValueError("ОГРН должен содержать 13 или 15 цифр")
        return s

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None):
        if v is None or v == "":
            return None
        s = v.strip()
        allowed = set("0123456789+()- ")
        if any(ch not in allowed for ch in s) or len(s) < 5:
            raise ValueError("Телефон содержит недопустимые символы")
        return s


class OrganizationOut(TimestampOut):
    id: str
    kind: OrgKind
    name: str
    inn: str | None
    ogrn: str | None
    address: str | None
    email: str | None
    phone: str | None

