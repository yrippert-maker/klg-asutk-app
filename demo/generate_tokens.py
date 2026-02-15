#!/usr/bin/env python3
"""
Генератор demo JWT-токенов для КЛГ АСУ ТК.

Использование:
    python demo/generate_tokens.py                    # Все 5 пользователей
    python demo/generate_tokens.py --role admin      # Только admin
    python demo/generate_tokens.py --format curl     # Формат для curl
    python demo/generate_tokens.py --format env      # Формат для .env

Требуется: pip install python-jose[cryptography]
"""
import json
import os
import sys
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path

try:
    from jose import jwt
except ImportError:
    print("Установите: pip install python-jose[cryptography]")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
USERS_FILE = SCRIPT_DIR / "users.json"

# Настройки JWT
SECRET = os.getenv("JWT_SECRET", "demo-secret-change-in-production-2026")
ALGORITHM = "HS256"
EXPIRE_DAYS = int(os.getenv("DEMO_TOKEN_EXPIRE_DAYS", "30"))


def load_users(role_filter: str | None = None) -> list[dict]:
    with open(USERS_FILE) as f:
        users = json.load(f)["demo_users"]
    if role_filter:
        users = [u for u in users if u["role"] == role_filter]
    return users


def generate_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    claims = {
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "org_id": user.get("org_id"),
        "iat": now,
        "exp": now + timedelta(days=EXPIRE_DAYS),
        "iss": "klg-demo",
    }
    return jwt.encode(claims, SECRET, algorithm=ALGORITHM)


def main():
    parser = argparse.ArgumentParser(description="Генератор demo JWT-токенов КЛГ")
    parser.add_argument("--role", help="Фильтр по роли")
    parser.add_argument("--format", choices=["table", "curl", "env", "json"], default="table")
    parser.add_argument("--base-url", default="https://localhost", help="Базовый URL для curl")
    args = parser.parse_args()

    users = load_users(args.role)
    if not users:
        print(f"Пользователи не найдены (роль: {args.role})")
        sys.exit(1)

    tokens = []
    for u in users:
        token = generate_token(u)
        tokens.append({**u, "token": token})

    if args.format == "table":
        print(f"\n{'='*80}")
        print(f"  КЛГ АСУ ТК — Demo-токены (срок: {EXPIRE_DAYS} дней)")
        print(f"{'='*80}\n")
        for t in tokens:
            print(f"  🔑 {t['name']}")
            print(f"     Роль: {t['role']}")
            print(f"     Email: {t['email']}")
            print(f"     Org: {t.get('org_id') or '—'}")
            print(f"     Описание: {t['description']}")
            print(f"     Token: {t['token'][:40]}...{t['token'][-10:]}")
            print()
        print(f"  Всего: {len(tokens)} токенов")
        print(f"  Secret: {SECRET[:10]}...")
        print(f"  Срок действия: до {(datetime.now(timezone.utc) + timedelta(days=EXPIRE_DAYS)).strftime('%d.%m.%Y')}")
        print(f"{'='*80}\n")

    elif args.format == "curl":
        for t in tokens:
            print(f"# {t['name']} ({t['role']})")
            print(f"curl -H 'Authorization: Bearer {t['token']}' {args.base_url}/api/v1/health")
            print()

    elif args.format == "env":
        for t in tokens:
            key = f"DEMO_TOKEN_{t['role'].upper()}"
            print(f"{key}={t['token']}")

    elif args.format == "json":
        print(json.dumps([{"name": t["name"], "role": t["role"], "email": t["email"], "token": t["token"]} for t in tokens], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
