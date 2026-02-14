"""
Email notification service — stub for production.
Replace SMTP settings with real credentials.
Production: use SendGrid, Mailgun, or AWS SES.
"""
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    to: str
    subject: str
    body: str
    html: bool = True


class EmailService:
    """Email notification service. Stub implementation — logs instead of sending."""

    def __init__(self, smtp_host: str = "", smtp_port: int = 587,
                 username: str = "", password: str = "", from_addr: str = "noreply@klg.refly.ru"):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_addr = from_addr
        self._enabled = bool(smtp_host)

    def send(self, msg: EmailMessage) -> bool:
        """Send email. Returns True if sent/logged successfully."""
        if not self._enabled:
            logger.info(f"[EMAIL STUB] To: {msg.to} | Subject: {msg.subject}")
            logger.debug(f"[EMAIL STUB] Body: {msg.body[:200]}...")
            return True

        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            message = MIMEMultipart("alternative")
            message["Subject"] = msg.subject
            message["From"] = self.from_addr
            message["To"] = msg.to

            content_type = "html" if msg.html else "plain"
            message.attach(MIMEText(msg.body, content_type))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.username:
                    server.login(self.username, self.password)
                server.sendmail(self.from_addr, msg.to, message.as_string())

            logger.info(f"Email sent to {msg.to}: {msg.subject}")
            return True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False

    def send_risk_alert(self, to: str, risk_title: str, risk_level: str, aircraft: str):
        """Send risk alert notification."""
        return self.send(EmailMessage(
            to=to,
            subject=f"[КЛГ] ⚠️ Риск {risk_level}: {risk_title}",
            body=f"""
            <h2>Предупреждение о риске</h2>
            <p><strong>Уровень:</strong> {risk_level}</p>
            <p><strong>ВС:</strong> {aircraft}</p>
            <p><strong>Описание:</strong> {risk_title}</p>
            <p><a href="https://klg.refly.ru/risks">Перейти к рискам →</a></p>
            """,
        ))

    def send_application_status(self, to: str, app_number: str, new_status: str):
        """Send application status change notification."""
        status_labels = {"approved": "Одобрена ✅", "rejected": "Отклонена ❌", "under_review": "На рассмотрении 🔍"}
        return self.send(EmailMessage(
            to=to,
            subject=f"[КЛГ] Заявка {app_number}: {status_labels.get(new_status, new_status)}",
            body=f"""
            <h2>Статус заявки изменён</h2>
            <p><strong>Заявка:</strong> {app_number}</p>
            <p><strong>Новый статус:</strong> {status_labels.get(new_status, new_status)}</p>
            <p><a href="https://klg.refly.ru/applications">Перейти к заявкам →</a></p>
            """,
        ))


# Singleton
email_service = EmailService()


# Critical alert templates
CRITICAL_TEMPLATES = {
    "ad_new_mandatory": {
        "subject": "⚠️ Новая обязательная ДЛГ: {ad_number}",
        "body": "Зарегистрирована обязательная директива лётной годности {ad_number}.\n"
                "Типы ВС: {aircraft_types}\nСрок выполнения: {deadline}\n"
                "Требуется: немедленное планирование выполнения.",
    },
    "life_limit_critical": {
        "subject": "🔴 КРИТИЧЕСКИЙ РЕСУРС: {component} P/N {pn}",
        "body": "Компонент {component} (P/N {pn}, S/N {sn}) достиг критического остатка ресурса.\n"
                "Остаток: {remaining}\nТребуется: немедленная замена или капремонт.",
    },
    "personnel_expired": {
        "subject": "⚠️ Просрочена квалификация: {specialist}",
        "body": "У специалиста {specialist} просрочена квалификация: {qualification}.\n"
                "Требуется: немедленное направление на переподготовку.",
    },
    "defect_critical": {
        "subject": "🔴 КРИТИЧЕСКИЙ ДЕФЕКТ: {aircraft_reg}",
        "body": "Зарегистрирован критический дефект на ВС {aircraft_reg}.\n"
                "ATA: {ata}\nОписание: {description}\nТребуется: ВС к полётам не допускается.",
    },
}


async def send_critical_alert(alert_type: str, recipients: list, **kwargs):
    """Send critical alert email using template."""
    template = CRITICAL_TEMPLATES.get(alert_type)
    if not template:
        logger.error("Unknown alert template: %s", alert_type)
        return False
    subject = template["subject"].format(**kwargs)
    body = template["body"].format(**kwargs)
    for recipient in recipients:
        await send_email(recipient, subject, body)
    return True
