"""add action approval and control records

Revision ID: 0019_action_control
Revises: 0018_merge_final_heads
"""

from alembic import op
import sqlalchemy as sa

revision = "0019_action_control"
down_revision = "0018_merge_final_heads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "action_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("risk", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id"), nullable=True),
        sa.Column("result", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("rejected_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_action_requests_seller_account_id", "action_requests", ["seller_account_id"])
    op.create_index("ix_action_requests_action", "action_requests", ["action"])
    op.create_index("ix_action_requests_risk", "action_requests", ["risk"])
    op.create_index("ix_action_requests_status", "action_requests", ["status"])
    op.create_index("ix_action_requests_job_id", "action_requests", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_action_requests_job_id", table_name="action_requests")
    op.drop_index("ix_action_requests_status", table_name="action_requests")
    op.drop_index("ix_action_requests_risk", table_name="action_requests")
    op.drop_index("ix_action_requests_action", table_name="action_requests")
    op.drop_index("ix_action_requests_seller_account_id", table_name="action_requests")
    op.drop_table("action_requests")
