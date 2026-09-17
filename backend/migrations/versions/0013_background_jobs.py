"""add durable background worker job fields

Revision ID: 0013_background_jobs
Revises: 0012_marketplace_sync_runs
"""

from alembic import op
import sqlalchemy as sa

revision = "0013_background_jobs"
down_revision = "0012_marketplace_sync_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=True))
    op.add_column("jobs", sa.Column("result", sa.Text(), nullable=True))
    op.add_column("jobs", sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("jobs", sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"))
    op.add_column("jobs", sa.Column("run_after", sa.DateTime(), nullable=True))
    op.add_column("jobs", sa.Column("locked_at", sa.DateTime(), nullable=True))
    op.add_column("jobs", sa.Column("worker_id", sa.String(length=100), nullable=True))
    op.create_index("ix_jobs_seller_account_id", "jobs", ["seller_account_id"])
    op.create_index("ix_jobs_run_after", "jobs", ["run_after"])
    op.create_index("ix_jobs_locked_at", "jobs", ["locked_at"])
    op.create_index("ix_jobs_worker_id", "jobs", ["worker_id"])
    op.alter_column("jobs", "attempts", server_default=None)
    op.alter_column("jobs", "max_attempts", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_jobs_worker_id", table_name="jobs")
    op.drop_index("ix_jobs_locked_at", table_name="jobs")
    op.drop_index("ix_jobs_run_after", table_name="jobs")
    op.drop_index("ix_jobs_seller_account_id", table_name="jobs")
    op.drop_column("jobs", "worker_id")
    op.drop_column("jobs", "locked_at")
    op.drop_column("jobs", "run_after")
    op.drop_column("jobs", "max_attempts")
    op.drop_column("jobs", "attempts")
    op.drop_column("jobs", "result")
    op.drop_column("jobs", "seller_account_id")
