"""Сервис автоматического сканирования рисков на основе данных о ВС."""

from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models import (
    RiskAlert, MaintenanceTask, LimitedLifeComponent, LandingGearComponent,
    DefectReport, AirworthinessCertificate, Aircraft
)


def scan_risks(db: Session) -> int:
    """Сканирует все ВС и создаёт предупреждения о рисках. Возвращает количество созданных предупреждений."""
    created = 0
    now = datetime.now(timezone.utc)
    warning_days = 7
    critical_days = 3
    
    # 1. MaintenanceTask: next_due в прошлом или скоро
    tasks = db.query(MaintenanceTask).join(Aircraft).filter(
        MaintenanceTask.next_due.isnot(None)
    ).all()
    
    for task in tasks:
        if task.next_due:
            days_until = (task.next_due - now).days
            if days_until < 0:
                severity = "critical"
                title = f"Просрочено ТО: {task.task_number}"
                message = f"Карта программы ТО {task.task_number} просрочена на {abs(days_until)} дней"
            elif days_until <= critical_days:
                severity = "critical"
                title = f"Скоро ТО: {task.task_number}"
                message = f"Карта программы ТО {task.task_number} должна быть выполнена через {days_until} дней"
            elif days_until <= warning_days:
                severity = "high"
                title = f"Приближается ТО: {task.task_number}"
                message = f"Карта программы ТО {task.task_number} должна быть выполнена через {days_until} дней"
            else:
                continue
            
            # Проверяем, нет ли уже такого предупреждения
            existing = db.query(RiskAlert).filter(
                RiskAlert.entity_type == "maintenance_task",
                RiskAlert.entity_id == task.id,
                RiskAlert.is_resolved == False
            ).first()
            
            if not existing:
                alert = RiskAlert(
                    entity_type="maintenance_task",
                    entity_id=task.id,
                    aircraft_id=task.aircraft_id,
                    severity=severity,
                    title=title,
                    message=message,
                    due_at=task.next_due
                )
                db.add(alert)
                created += 1
    
    # 2. LimitedLifeComponent: expected_date
    components = db.query(LimitedLifeComponent).join(Aircraft).filter(
        LimitedLifeComponent.expected_date.isnot(None)
    ).all()
    
    for comp in components:
        if comp.expected_date:
            days_until = (comp.expected_date - now).days
            if days_until < 0:
                severity = "critical"
                title = f"Просрочен компонент: {comp.part_number}"
                message = f"Компонент {comp.part_number} (SN: {comp.serial_number}) просрочен на {abs(days_until)} дней"
            elif days_until <= critical_days:
                severity = "critical"
                title = f"Скоро срок компонента: {comp.part_number}"
                message = f"Компонент {comp.part_number} должен быть заменён через {days_until} дней"
            elif days_until <= warning_days:
                severity = "high"
                title = f"Приближается срок компонента: {comp.part_number}"
                message = f"Компонент {comp.part_number} должен быть заменён через {days_until} дней"
            else:
                continue
            
            existing = db.query(RiskAlert).filter(
                RiskAlert.entity_type == "limited_life",
                RiskAlert.entity_id == comp.id,
                RiskAlert.is_resolved == False
            ).first()
            
            if not existing:
                alert = RiskAlert(
                    entity_type="limited_life",
                    entity_id=comp.id,
                    aircraft_id=comp.aircraft_id,
                    severity=severity,
                    title=title,
                    message=message,
                    due_at=comp.expected_date
                )
                db.add(alert)
                created += 1
    
    # 3. LandingGearComponent: due_at
    landing_gear = db.query(LandingGearComponent).join(Aircraft).filter(
        LandingGearComponent.due_at.isnot(None)
    ).all()
    
    for lg in landing_gear:
        if lg.due_at:
            days_until = (lg.due_at - now).days
            if days_until < 0:
                severity = "critical"
                title = f"Просрочено шасси: {lg.part_number}"
                message = f"Компонент шасси {lg.part_number} просрочен на {abs(days_until)} дней"
            elif days_until <= critical_days:
                severity = "critical"
                title = f"Скоро срок шасси: {lg.part_number}"
                message = f"Компонент шасси {lg.part_number} должен быть заменён через {days_until} дней"
            elif days_until <= warning_days:
                severity = "high"
                title = f"Приближается срок шасси: {lg.part_number}"
                message = f"Компонент шасси {lg.part_number} должен быть заменён через {days_until} дней"
            else:
                continue
            
            existing = db.query(RiskAlert).filter(
                RiskAlert.entity_type == "landing_gear",
                RiskAlert.entity_id == lg.id,
                RiskAlert.is_resolved == False
            ).first()
            
            if not existing:
                alert = RiskAlert(
                    entity_type="landing_gear",
                    entity_id=lg.id,
                    aircraft_id=lg.aircraft_id,
                    severity=severity,
                    title=title,
                    message=message,
                    due_at=lg.due_at
                )
                db.add(alert)
                created += 1
    
    # 4. DefectReport: limit_date
    defects = db.query(DefectReport).join(Aircraft).filter(
        DefectReport.limit_date.isnot(None)
    ).all()
    
    for defect in defects:
        if defect.limit_date:
            days_until = (defect.limit_date - now).days
            if days_until < 0:
                severity = "critical"
                title = f"Просрочен дефект: {defect.wo_number or 'N/A'}"
                message = f"Дефект {defect.wo_number or 'N/A'} просрочен на {abs(days_until)} дней"
            elif days_until <= critical_days:
                severity = "critical"
                title = f"Скоро срок устранения дефекта: {defect.wo_number or 'N/A'}"
                message = f"Дефект {defect.wo_number or 'N/A'} должен быть устранён через {days_until} дней"
            elif days_until <= warning_days:
                severity = "high"
                title = f"Приближается срок устранения дефекта: {defect.wo_number or 'N/A'}"
                message = f"Дефект {defect.wo_number or 'N/A'} должен быть устранён через {days_until} дней"
            else:
                continue
            
            existing = db.query(RiskAlert).filter(
                RiskAlert.entity_type == "defect_report",
                RiskAlert.entity_id == defect.id,
                RiskAlert.is_resolved == False
            ).first()
            
            if not existing:
                alert = RiskAlert(
                    entity_type="defect_report",
                    entity_id=defect.id,
                    aircraft_id=defect.aircraft_id,
                    severity=severity,
                    title=title,
                    message=message,
                    due_at=defect.limit_date
                )
                db.add(alert)
                created += 1
    
    # 5. AirworthinessCertificate: expiry_date (60 дней предупреждение)
    certs = db.query(AirworthinessCertificate).join(Aircraft).filter(
        AirworthinessCertificate.expiry_date.isnot(None),
        AirworthinessCertificate.status == "valid"
    ).all()
    
    for cert in certs:
        if cert.expiry_date:
            days_until = (cert.expiry_date - now).days
            if days_until < 0:
                severity = "critical"
                title = f"Истёк сертификат лётной годности: {cert.certificate_number}"
                message = f"Сертификат {cert.certificate_number} истёк {abs(days_until)} дней назад"
            elif days_until <= 30:
                severity = "critical"
                title = f"Скоро истекает сертификат: {cert.certificate_number}"
                message = f"Сертификат {cert.certificate_number} истекает через {days_until} дней"
            elif days_until <= 60:
                severity = "high"
                title = f"Приближается срок сертификата: {cert.certificate_number}"
                message = f"Сертификат {cert.certificate_number} истекает через {days_until} дней"
            else:
                continue
            
            existing = db.query(RiskAlert).filter(
                RiskAlert.entity_type == "airworthiness_certificate",
                RiskAlert.entity_id == cert.id,
                RiskAlert.is_resolved == False
            ).first()
            
            if not existing:
                alert = RiskAlert(
                    entity_type="airworthiness_certificate",
                    entity_id=cert.id,
                    aircraft_id=cert.aircraft_id,
                    severity=severity,
                    title=title,
                    message=message,
                    due_at=cert.expiry_date
                )
                db.add(alert)
                created += 1
    
    db.commit()
    return created
