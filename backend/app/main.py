from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn, os

from app.core.config import settings
from app.api.routes import (
    health_router,
    organizations_router,
    aircraft_router,
    cert_applications_router,
    attachments_router,
    notifications_router,
    ingest_router,
    airworthiness_router,
    modifications_router,
    users_router,
    legal_router,
    risk_alerts_router,
    checklists_router,
    checklist_audits_router,
    inbox_router,
    tasks_router,
    audit_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="KLG ASUTK API", version="2.0.0", lifespan=lifespan)
co = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=co, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

P = "/api/v1"
app.include_router(health_router, prefix=P, tags=["health"])
app.include_router(organizations_router, prefix=P, tags=["organizations"])
app.include_router(aircraft_router, prefix=P, tags=["aircraft"])
app.include_router(cert_applications_router, prefix=P, tags=["cert-applications"])
app.include_router(attachments_router, prefix=P, tags=["attachments"])
app.include_router(notifications_router, prefix=P, tags=["notifications"])
app.include_router(ingest_router, prefix=P, tags=["ingest"])
app.include_router(airworthiness_router, prefix=P, tags=["airworthiness"])
app.include_router(modifications_router, prefix=P, tags=["modifications"])
app.include_router(users_router, prefix=P, tags=["users"])
app.include_router(legal_router, prefix=P, tags=["legal"])
app.include_router(risk_alerts_router, prefix=P, tags=["risk-alerts"])
app.include_router(checklists_router, prefix=P, tags=["checklists"])
app.include_router(checklist_audits_router, prefix=P, tags=["checklist-audits"])
app.include_router(inbox_router, prefix=P, tags=["inbox"])
app.include_router(tasks_router, prefix=P, tags=["tasks"])
app.include_router(audit_router, prefix=P, tags=["audit"])

@app.get("/")
async def root(): return {"message": "KLG ASUTK API"}

@app.get("/health")
async def health(): return {"status": "healthy"}

if __name__=="__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)