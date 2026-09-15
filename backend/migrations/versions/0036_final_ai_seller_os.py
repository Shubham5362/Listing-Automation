"""final ai seller os layer

Revision ID: 0036_final_ai_seller_os
Revises: 0035_enterprise_reliability_security
"""
from alembic import op
import sqlalchemy as sa

revision = "0036_final_ai_seller_os"
down_revision = "0035_enterprise_reliability_security"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "seller_os_action_proposals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("risk", sa.String(30), nullable=False, server_default="low"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(30), nullable=False, server_default="approval_required"),
        sa.Column("evidence", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_seller_os_action_seller", "seller_os_action_proposals", ["seller_account_id"])
    op.create_table(
        "seller_os_context_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("context", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_seller_os_context_seller", "seller_os_context_snapshots", ["seller_account_id"])


def downgrade() -> None:
    op.drop_table("seller_os_context_snapshots")
    op.drop_table("seller_os_action_proposals")
