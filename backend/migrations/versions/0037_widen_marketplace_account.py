"""widen marketplace account identifiers

Revision ID: 0037_widen_marketplace_account
Revises: 0036_final_ai_seller_os
"""
from alembic import op
import sqlalchemy as sa

revision = "0037_widen_marketplace_account"
down_revision = "0036_final_ai_seller_os"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "marketplace_accounts",
        "marketplace",
        existing_type=sa.String(length=30),
        type_=sa.String(length=80),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "marketplace_accounts",
        "marketplace",
        existing_type=sa.String(length=80),
        type_=sa.String(length=30),
        existing_nullable=False,
    )
