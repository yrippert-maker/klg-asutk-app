"""Initial schema + audit_log table

Revision ID: 0001
Revises:
Create Date: 2026-02-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    NOTE: This migration handles ONLY the audit_log table.
    All other tables are created by SQLAlchemy create_all() on startup.
    Run `alembic revision --autogenerate -m "Full schema"` after first deploy
    to capture the complete schema in Alembic.
    """
    op.create_table(
        'audit_log',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('user_email', sa.String(255), nullable=True),
        sa.Column('user_role', sa.String(50), nullable=True),
        sa.Column('organization_id', sa.String(36), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(100), nullable=False),
        sa.Column('entity_id', sa.String(36), nullable=True),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    # Indexes for RLS and queries
    op.create_index('idx_audit_log_org', 'audit_log', ['organization_id'])
    op.create_index('idx_audit_log_entity', 'audit_log', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_log_user', 'audit_log', ['user_id'])
    op.create_index('idx_audit_log_created', 'audit_log', ['created_at'])


def downgrade() -> None:
    op.drop_table('audit_log')
