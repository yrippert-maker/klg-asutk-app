"""
API маршруты для системы юридических документов:
- юрисдикции, документы, перекрёстные ссылки, правовые комментарии, судебная практика
- запуск мультиагентного ИИ-анализа и подготовки документов по нормам
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.helpers import audit, paginate_query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Jurisdiction, LegalDocument, CrossReference, LegalComment, JudicialPractice
from app.schemas.legal import (
    JurisdictionCreate,
    JurisdictionUpdate,
    JurisdictionOut,
    LegalDocumentCreate,
    LegalDocumentUpdate,
    LegalDocumentOut,
    CrossReferenceCreate,
    CrossReferenceOut,
    LegalCommentCreate,
    LegalCommentUpdate,
    LegalCommentOut,
    JudicialPracticeCreate,
    JudicialPracticeUpdate,
    JudicialPracticeOut,
    AnalysisRequest,
    AnalysisResponse,
)
from app.services.legal_agents import LegalAnalysisOrchestrator

router = APIRouter(prefix="/legal", tags=["legal"])


# --- Jurisdictions ---

@router.get("/jurisdictions", response_model=list[JurisdictionOut])
def list_jurisdictions(
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Jurisdiction)
    if active_only:
        q = q.filter(Jurisdiction.is_active.is_(True))
    return q.order_by(Jurisdiction.code).all()


@router.post("/jurisdictions", response_model=JurisdictionOut, status_code=status.HTTP_201_CREATED)
def create_jurisdiction(
    payload: JurisdictionCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin")),
):
    j = Jurisdiction(**payload.model_dump())
    db.add(j)
    db.commit()
    db.refresh(j)
    return j


@router.get("/jurisdictions/{jid}", response_model=JurisdictionOut)
def get_jurisdiction(jid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    j = db.get(Jurisdiction, jid)
    if not j:
        raise HTTPException(status_code=404, detail="Jurisdiction not found")
    return j


@router.patch("/jurisdictions/{jid}", response_model=JurisdictionOut)
def update_jurisdiction(
    jid: str,
    payload: JurisdictionUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin")),
):
    j = db.get(Jurisdiction, jid)
    if not j:
        raise HTTPException(status_code=404, detail="Jurisdiction not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(j, k, v)
    db.commit()
    db.refresh(j)
    return j


# --- Legal Documents ---

@router.get("/documents", response_model=list[LegalDocumentOut])
def list_legal_documents(
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    jurisdiction_id: str | None = Query(None),
    document_type: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(LegalDocument)
    if jurisdiction_id:
        q = q.filter(LegalDocument.jurisdiction_id == jurisdiction_id)
    if document_type:
        q = q.filter(LegalDocument.document_type == document_type)
    q = q.order_by(LegalDocument.created_at.desc())
    return paginate_query(q, page, per_page)


@router.post("/documents", response_model=LegalDocumentOut, status_code=status.HTTP_201_CREATED)
def create_legal_document(
    payload: LegalDocumentCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    d = LegalDocument(**payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.get("/documents/{doc_id}", response_model=LegalDocumentOut)
def get_legal_document(doc_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    return d


@router.patch("/documents/{doc_id}", response_model=LegalDocumentOut)
def update_legal_document(
    doc_id: str,
    payload: LegalDocumentUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@router.get("/documents/{doc_id}/cross-references", response_model=list[CrossReferenceOut])
def list_document_cross_references(
    doc_id: str,
    direction: str = Query("outgoing", description="outgoing|incoming"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(CrossReference)
    if direction == "incoming":
        q = q.filter(CrossReference.target_document_id == doc_id)
    else:
        q = q.filter(CrossReference.source_document_id == doc_id)
    return q.limit(100).all()


# --- Cross References (ручное добавление) ---

@router.post("/cross-references", response_model=CrossReferenceOut, status_code=status.HTTP_201_CREATED)
def create_cross_reference(
    payload: CrossReferenceCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    ref = CrossReference(**payload.model_dump())
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


# --- Legal Comments ---

@router.get("/comments", response_model=list[LegalCommentOut])
def list_legal_comments(
    jurisdiction_id: str | None = Query(None),
    document_id: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(LegalComment)
    if jurisdiction_id:
        q = q.filter(LegalComment.jurisdiction_id == jurisdiction_id)
    if document_id:
        q = q.filter(LegalComment.document_id == document_id)
    from fastapi import Query as FQuery
    return paginate_query(q.order_by(LegalComment.created_at.desc()), 1, limit)


@router.post("/comments", response_model=LegalCommentOut, status_code=status.HTTP_201_CREATED)
def create_legal_comment(
    payload: LegalCommentCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    c = LegalComment(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/comments/{cid}", response_model=LegalCommentOut)
def update_legal_comment(
    cid: str,
    payload: LegalCommentUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    c = db.get(LegalComment, cid)
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


# --- Judicial Practice ---

@router.get("/judicial-practices", response_model=list[JudicialPracticeOut])
def list_judicial_practices(
    jurisdiction_id: str | None = Query(None),
    document_id: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(JudicialPractice)
    if jurisdiction_id:
        q = q.filter(JudicialPractice.jurisdiction_id == jurisdiction_id)
    if document_id:
        q = q.filter(JudicialPractice.document_id == document_id)
    # nulls_last портировано под SQLite < 3.30: (col IS NULL) ASC — не-NULL первыми
    return q.order_by(
        JudicialPractice.decision_date.is_(None),
        JudicialPractice.decision_date.desc(),
        JudicialPractice.created_at.desc(),
    )
    return paginate_query(q, 1, limit)


@router.post("/judicial-practices", response_model=JudicialPracticeOut, status_code=status.HTTP_201_CREATED)
def create_judicial_practice(
    payload: JudicialPracticeCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    p = JudicialPractice(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/judicial-practices/{pid}", response_model=JudicialPracticeOut)
def update_judicial_practice(
    pid: str,
    payload: JudicialPracticeUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    p = db.get(JudicialPractice, pid)
    if not p:
        raise HTTPException(status_code=404, detail="Judicial practice not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


# --- ИИ-анализ (мультиагентный) ---

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_document(
    payload: AnalysisRequest,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    """
    Запуск мультиагентного анализа: классификация, соответствие нормам, перекрёстные ссылки,
    подбор правовых комментариев и судебной практики, рекомендации по оформлению.
    """
    orch = LegalAnalysisOrchestrator(db=db)
    out = orch.run(
        document_id=payload.document_id,
        jurisdiction_id=payload.jurisdiction_id,
        title=payload.title,
        content=payload.content,
        skip_agents=payload.skip_agents,
        save_cross_references=payload.save_cross_references,
    )

    # Опционально: обновить документ в БД, если document_id передан
    if payload.document_id and out.get("document_type"):
        d = db.get(LegalDocument, payload.document_id)
        if d:
            d.document_type = out["document_type"]
            d.analysis_json = out.get("analysis_json")
            d.compliance_notes = out.get("compliance_notes")
            db.commit()

    return AnalysisResponse(
        document_type=out["document_type"],
        analysis_json=out.get("analysis_json"),
        compliance_notes=out.get("compliance_notes"),
        results=out.get("results", {}),
    )


@router.post("/documents/{doc_id}/analyze", response_model=AnalysisResponse)
def analyze_existing_document(
    doc_id: str,
    skip_agents: list[str] | None = Query(None),
    save_cross_references: bool = Query(True),
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    """Запуск ИИ-анализа для уже существующего документа по id."""
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    orch = LegalAnalysisOrchestrator(db=db)
    out = orch.run(
        document_id=doc_id,
        jurisdiction_id=d.jurisdiction_id,
        title=d.title,
        content=d.content,
        existing_document_type=d.document_type,
        skip_agents=skip_agents,
        save_cross_references=save_cross_references,
    )
    d.document_type = out["document_type"]
    d.analysis_json = out.get("analysis_json")
    d.compliance_notes = out.get("compliance_notes")
    db.commit()
    db.refresh(d)
    return AnalysisResponse(
        document_type=out["document_type"],
        analysis_json=out.get("analysis_json"),
        compliance_notes=out.get("compliance_notes"),
        results=out.get("results", {}),
    )


# -----------------------------------------------------------------------
#  ДОПОЛНИТЕЛЬНЫЕ ФАП (№5-7 из перечня исходных документов)
# -----------------------------------------------------------------------

FAP_ADDITIONAL = {
    "ФАП-148": {
        "full_name": "Требования к эксплуатантам гражданских воздушных судов по обеспечению поддержания лётной годности",
        "document": "Приказ Минтранса России от 23.06.2003 № 148",
        "status": "Действует",
        "scope": [
            "Обязанности эксплуатанта по ПЛГ",
            "Программа ТО воздушного судна",
            "Контроль за выполнением директив лётной годности",
            "Ведение эксплуатационной документации",
            "Учёт наработки агрегатов и компонентов",
            "Контроль назначенных ресурсов и сроков службы",
        ],
        "relevance_to_system": "Базовый документ для модулей: Лётная годность, ТО, Чек-листы, Риски",
    },
    "ФАП-149": {
        "full_name": "Требования к электросветотехническому обеспечению полётов",
        "document": "Приказ Минтранса России от 23.06.2003 № 149",
        "status": "Действует",
        "scope": [
            "Нормы электросветотехнического обеспечения на аэродромах",
            "Требования к светосигнальному оборудованию",
            "Контроль технического состояния электросветотехнических средств",
            "Периодичность проверок и ТО",
        ],
        "relevance_to_system": "Учитывается при аудитах аэродромной инфраструктуры и чек-листах",
    },
    "ФАП-10": {
        "full_name": "Сертификационные требования к эксплуатантам коммерческой гражданской авиации",
        "document": "Приказ Минтранса России от 04.02.2003 № 10 (ФАП-246 от 13.08.2015 — актуальная редакция)",
        "status": "Заменён ФАП-246, но ряд положений действует",
        "scope": [
            "Организационная структура эксплуатанта",
            "Требования к руководящему персоналу",
            "Система управления безопасностью полётов",
            "Программа подготовки авиационного персонала",
            "Требования к парку ВС",
        ],
        "relevance_to_system": "Базис для модуля Сертификация эксплуатантов (заявки, организации)",
    },
}


@router.get("/fap-additional", tags=["legal"])
def get_additional_fap():
    """Дополнительные ФАП: 148, 149, 10."""
    return FAP_ADDITIONAL


# -----------------------------------------------------------------------
#  ПОРУЧЕНИЕ ПРЕЗИДЕНТА + ФЗ-488 + ВЫСТУПЛЕНИЕ КУДИНОВА + ТЗ АСУ ТК
# -----------------------------------------------------------------------

NATIONAL_PLG_FRAMEWORK = {
    "presidential_order": {
        "name": "Поручение Президента РФ Пр-1379 от 17.07.2019, п.2 пп.«в»",
        "subject": "Гармонизация условий поддержания лётной годности ВС",
        "requirements": [
            "Создание национальной системы поддержания лётной годности",
            "Гармонизация требований с международными стандартами (ICAO, EASA)",
            "Обеспечение непрерывности контроля технического состояния ВС",
        ],
    },
    "fz_488": {
        "name": "Федеральный закон от 30.12.2021 № 488-ФЗ",
        "subject": "Введение статьи 37.2 ВК РФ «Поддержание лётной годности»",
        "article_37_2": {
            "text": "Поддержание лётной годности ВС — комплекс мер по обеспечению соответствия ВС "
                    "требованиям к лётной годности и поддержанию его безопасной эксплуатации",
            "obligations": [
                "Эксплуатант обязан обеспечивать ПЛГ",
                "ФАВТ осуществляет государственный контроль за ПЛГ",
                "Организация по ТО должна иметь сертификат",
            ],
        },
    },
    "kudinov_speech": {
        "name": "Выступление Кудинова В.В., начальника УПЛГ Росавиации",
        "source": "Протокол Общественного совета ФАВТ от 21.10.2025 №14",
        "key_points": [
            "Необходимость создания национальной цифровой системы ПЛГ",
            "Переход от бумажного документооборота к электронному",
            "Интеграция с ФГИС РЭВС и другими информационными системами ФАВТ",
            "Обеспечение прослеживаемости всех операций по ТО и ПЛГ",
            "Автоматизация контроля сроков действия сертификатов и директив",
        ],
        "relevance": "Определяет вектор развития АСУ ТК как элемента национальной системы ПЛГ",
    },
    "tz_asu_tk": {
        "name": "Техническое задание на АСУ ТК «Контроль летной годности ВС»",
        "approved_by": "Утверждено заместителем министра транспорта РФ 24.07.2022",
        "scope": [
            "Автоматизация процессов контроля лётной годности",
            "Учёт воздушных судов и их технического состояния",
            "Контроль выполнения программ ТО",
            "Управление сертификационными процедурами",
            "Мониторинг рисков безопасности полётов",
            "Интеграция с системами ФАВТ и эксплуатантов",
            "Обеспечение доступа для регулятора (ФАВТ) к агрегированным данным",
        ],
        "system_modules_mapping": {
            "Реестр ВС": "/aircraft, /airworthiness",
            "Организации": "/organizations",
            "Сертификация": "/applications, /regulator/certifications",
            "Чек-листы и аудиты": "/checklists, /audits",
            "Управление рисками": "/risks, /regulator/safety-indicators",
            "Документооборот": "/documents, /inbox",
            "Панель регулятора": "/regulator",
            "Аналитика": "/analytics, /dashboard",
        },
    },
}


@router.get("/national-plg-framework", tags=["legal"])
def get_national_plg_framework():
    """
    Национальная система ПЛГ — Поручение Президента, ФЗ-488,
    выступление Кудинова, ТЗ АСУ ТК.
    """
    return NATIONAL_PLG_FRAMEWORK


@router.get("/compliance-matrix", tags=["legal"])
def get_compliance_matrix():
    """
    Матрица соответствия: 19 исходных документов → модули системы.
    """
    return {
        "system": "КЛГ АСУ ТК v16",
        "developer": "АО «REFLY»",
        "matrix": [
            {"num": 1, "document": "Воздушный кодекс РФ (60-ФЗ)", "articles": "ст. 8, 35, 36, 37, 37.2",
             "modules": ["Панель ФАВТ", "Сертификация", "Лётная годность", "Реестр ВС"],
             "status": "implemented"},
            {"num": 2, "document": "ФАП-21 (Часть 21)", "articles": "Приказ №184",
             "modules": ["Сертификация АТ", "Организации"],
             "status": "implemented"},
            {"num": 3, "document": "ФАП-128", "articles": "Приказ №128",
             "modules": ["Чек-листы полётов", "Аудиты"],
             "status": "implemented"},
            {"num": 4, "document": "ФАП-145 (Часть 145)", "articles": "Приказ №367",
             "modules": ["ТО ВС", "Организации ТО", "Аудиты ТО"],
             "status": "implemented"},
            {"num": 5, "document": "ФАП-148", "articles": "Приказ №148",
             "modules": ["Лётная годность", "Программы ТО", "Контроль ресурсов"],
             "status": "implemented"},
            {"num": 6, "document": "ФАП-149", "articles": "Приказ №149",
             "modules": ["Аудиты инфраструктуры", "Чек-листы"],
             "status": "implemented"},
            {"num": 7, "document": "ФАП-10 / ФАП-246", "articles": "Приказ №10 / №246",
             "modules": ["Сертификация эксплуатантов", "Организации"],
             "status": "implemented"},
            {"num": 8, "document": "ФАП-147", "articles": "Приказ №147",
             "modules": ["Персонал ТО", "Квалификация экипажей"],
             "status": "implemented"},
            {"num": 9, "document": "EASA Part-M", "articles": "Reg. 1321/2014 Annex I",
             "modules": ["Лётная годность", "Программы ТО"],
             "status": "implemented"},
            {"num": 10, "document": "EASA Part-CAMO", "articles": "Reg. 2019/1383",
             "modules": ["Организации CAMO", "ПЛГ"],
             "status": "implemented"},
            {"num": 11, "document": "ICAO Annex 6", "articles": "Part I, Ch.8",
             "modules": ["Сертификация", "ТО", "Чек-листы"],
             "status": "implemented"},
            {"num": 12, "document": "ICAO Annex 8", "articles": "4th edition",
             "modules": ["Лётная годность", "Сертификация типа"],
             "status": "implemented"},
            {"num": 13, "document": "ICAO Doc 9760", "articles": "3rd edition",
             "modules": ["Лётная годность", "Панель ФАВТ"],
             "status": "implemented"},
            {"num": 14, "document": "ICAO Annex 19", "articles": "2nd edition",
             "modules": ["Управление рисками", "Безопасность полётов"],
             "status": "implemented"},
            {"num": 15, "document": "ICAO Doc 9734", "articles": "Part A, 3rd edition",
             "modules": ["Панель ФАВТ", "Аудиты", "Надзор"],
             "status": "implemented"},
            {"num": 16, "document": "Поручение Президента Пр-1379", "articles": "п.2 пп.«в»",
             "modules": ["Вся система — как элемент нац. системы ПЛГ"],
             "status": "implemented"},
            {"num": 17, "document": "ФЗ-488 (ст. 37.2 ВК)", "articles": "от 30.12.2021",
             "modules": ["Лётная годность", "ПЛГ", "Контроль ФАВТ"],
             "status": "implemented"},
            {"num": 18, "document": "Выступление Кудинова В.В.", "articles": "Протокол ОС №14",
             "modules": ["Цифровизация", "Интеграция ФГИС", "Электронный документооборот"],
             "status": "implemented"},
            {"num": 19, "document": "ТЗ АСУ ТК", "articles": "Утв. 24.07.2022",
             "modules": ["Все модули системы"],
             "status": "implemented"},
        ],
    }
