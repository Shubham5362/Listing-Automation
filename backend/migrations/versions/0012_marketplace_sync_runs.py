"""persist marketplace synchronization runs

Revision ID: 0012_marketplace_sync_runs
Revises: 0011_ai_commands, 0011_marketplace_sync, 0011_notifications
"""

from alembic import op
import sqlalchemy as sa

revision = "0012_marketplace_sync_runs"
down_revision = ("0011_ai_commands", "0011_marketplace_sync", "0011_notifications")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketplace_sync_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_marketplace_sync_runs_marketplace_account_id", "marketplace_sync_runs", ["marketplace_account_id"])
    op.create_index("ix_marketplace_sync_runs_seller_account_id", "marketplace_sync_runs", ["seller_account_id"])
    op.create_index("ix_marketplace_sync_runs_status", "marketplace_sync_runs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_marketplace_sync_runs_status", table_name="marketplace_sync_runs")
    op.drop_index("ix_marketplace_sync_runs_seller_account_id", table_name="marketplace_sync_runs")
    op.drop_index("ix_marketplace_sync_runs_marketplace_account_id", table_name="marketplace_sync_runs")
    op.drop_table("marketplace_sync_runs")
