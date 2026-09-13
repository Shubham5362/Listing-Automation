"""add listing update approval and history

Revision ID: 0014_listing_updates
Revises: 0013_background_jobs
"""

from alembic import op
import sqlalchemy as sa

revision = "0014_listing_updates"
down_revision = "0013_background_jobs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "listing_updates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id"), nullable=False),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("proposed_changes_json", sa.Text(), nullable=False),
        sa.Column("previous_state_json", sa.Text(), nullable=False),
        sa.Column("resulting_state_json", sa.Text(), nullable=True),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
    )
    op.create_index("ix_listing_updates_listing_id", "listing_updates", ["listing_id"])
    op.create_index("ix_listing_updates_seller_account_id", "listing_updates", ["seller_account_id"])
    op.create_index("ix_listing_updates_marketplace_account_id", "listing_updates", ["marketplace_account_id"])
    op.create_index("ix_listing_updates_status", "listing_updates", ["status"])
    op.create_index("ix_listing_updates_job_id", "listing_updates", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_listing_updates_job_id", table_name="listing_updates")
    op.drop_index("ix_listing_updates_status", table_name="listing_updates")
    op.drop_index("ix_listing_updates_marketplace_account_id", table_name="listing_updates")
    op.drop_index("ix_listing_updates_seller_account_id", table_name="listing_updates")
    op.drop_index("ix_listing_updates_listing_id", table_name="listing_updates")
    op.drop_table("listing_updates")
