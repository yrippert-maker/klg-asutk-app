from datetime import datetime, date
"""
Модели для системы анализа и подготовки юридических документов.

Типы документов: законодательные, рекомендательные, директивные, уведомительные и др.
Перекрёстные ссылки, правовые комментарии, судебная практика.
"""

from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class DocumentType(str, enum.Enum):
    """Тип юридического документа."""
    LEGISLATIVE = "legislative"       # законодательный (закон, кодекс)
    RECOMMENDATORY = "recommendatory"  # рекомендательный
    DIRECTIVE = "directive"            # директивный
    NOTIFICATION = "notification"      # уведомительный
    REGULATORY = "regulatory"          # нормативно-правовой (приказы, постановления)
    CONTRACTUAL = "contractual"        # договорной
    JUDICIAL = "judicial"              # судебный акт
    OTHER = "other"


class Jurisdiction(Base, TimestampMixin):
    """Юрисдикция (страна/регион) для привязки норм законодательства."""
    __tablename__ = "legal_jurisdictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)  # RU, KZ, EU, US-CA
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_ru: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    documents: Mapped[list["LegalDocument"]] = relationship("LegalDocument", back_populates="jurisdiction")
    comments: Mapped[list["LegalComment"]] = relationship("LegalComment", back_populates="jurisdiction")
    judicial_practices: Mapped[list["JudicialPractice"]] = relationship("JudicialPractice", back_populates="jurisdiction")


class LegalDocument(Base, TimestampMixin):
    """Юридический документ (законодательный, рекомендательный, директивный, уведомительный и т.д.)."""
    __tablename__ = "legal_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    jurisdiction_id: Mapped[str] = mapped_column(String(36), ForeignKey("legal_jurisdictions.id"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(32), nullable=False)  # DocumentType value

    title: Mapped[str] = mapped_column(String(1024), nullable=False)
    title_original: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    short_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # для ссылок: "ГК РФ", "ИКАО Doc 9859"

    # Содержимое и метаданные
    content: Mapped[str | None] = mapped_column(Text, nullable=True)  # полный текст или резюме
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    effective_date: Mapped[str | None] = mapped_column(String(32), nullable=True)  # 2024-01-15
    publication_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    registration_number: Mapped[str | None] = mapped_column(String(128), nullable=True)  # номер в реестре

    # Результаты ИИ-анализа
    analysis_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: вывод агентов
    compliance_notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # замечания по соответствию нормам
    source_file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    jurisdiction: Mapped["Jurisdiction"] = relationship("Jurisdiction", back_populates="documents")
    outgoing_refs: Mapped[list["CrossReference"]] = relationship(
        "CrossReference", foreign_keys="CrossReference.source_document_id", back_populates="source_document"
    )
    incoming_refs: Mapped[list["CrossReference"]] = relationship(
        "CrossReference", foreign_keys="CrossReference.target_document_id", back_populates="target_document"
    )

    __table_args__ = (Index("ix_legal_docs_juris_type", "jurisdiction_id", "document_type"),)


class CrossReference(Base, TimestampMixin):
    """Перекрёстная ссылка между цитируемыми документами."""
    __tablename__ = "legal_cross_references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    source_document_id: Mapped[str] = mapped_column(String(36), ForeignKey("legal_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    target_document_id: Mapped[str] = mapped_column(String(36), ForeignKey("legal_documents.id", ondelete="CASCADE"), nullable=False, index=True)

    # Контекст цитирования
    quote_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)  # фрагмент текста, где упоминается
    target_article: Mapped[str | None] = mapped_column(String(128), nullable=True)  # "ст. 15", "п. 3.2"
    relevance: Mapped[str | None] = mapped_column(String(32), nullable=True)  # high, medium, low
    created_by_agent: Mapped[str | None] = mapped_column(String(64), nullable=True)  # имя агента

    source_document: Mapped["LegalDocument"] = relationship("LegalDocument", foreign_keys=[source_document_id], back_populates="outgoing_refs")
    target_document: Mapped["LegalDocument"] = relationship("LegalDocument", foreign_keys=[target_document_id], back_populates="incoming_refs")

    __table_args__ = (Index("ix_cross_ref_source_target", "source_document_id", "target_document_id", unique=True),)


class LegalComment(Base, TimestampMixin):
    """Правовой комментарий к нормам/документам (для использования в базе)."""
    __tablename__ = "legal_comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    jurisdiction_id: Mapped[str] = mapped_column(String(36), ForeignKey("legal_jurisdictions.id"), nullable=False, index=True)
    document_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("legal_documents.id", ondelete="SET NULL"), nullable=True, index=True)

    title: Mapped[str] = mapped_column(String(512), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    article_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)  # ст. 123 ГК РФ
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str | None] = mapped_column(String(512), nullable=True)  # издательство, источник
    is_official: Mapped[bool] = mapped_column(default=False, nullable=False)  # официальный комментарий

    jurisdiction: Mapped["Jurisdiction"] = relationship("Jurisdiction", back_populates="comments")


class JudicialPractice(Base, TimestampMixin):
    """Судебная практика (решения, определения, постановления) для базы."""
    __tablename__ = "legal_judicial_practices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    jurisdiction_id: Mapped[str] = mapped_column(String(36), ForeignKey("legal_jurisdictions.id"), nullable=False, index=True)
    document_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("legal_documents.id", ondelete="SET NULL"), nullable=True, index=True)

    court_name: Mapped[str] = mapped_column(String(512), nullable=False)
    case_number: Mapped[str | None] = mapped_column(String(128), nullable=True)
    decision_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    legal_grounds: Mapped[str | None] = mapped_column(Text, nullable=True)  # правовые основания (статьи)
    outcome: Mapped[str | None] = mapped_column(String(64), nullable=True)  # удовлетворено, отказ, и т.д.
    full_text_ref: Mapped[str | None] = mapped_column(String(1024), nullable=True)  # ссылка на полный текст

    jurisdiction: Mapped["Jurisdiction"] = relationship("Jurisdiction", back_populates="judicial_practices")
