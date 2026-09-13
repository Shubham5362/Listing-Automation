"""add marketplace connection and sync status

Revision ID: 0011_marketplace_sync
Revises: 0010_automation
"""

from alembic import op
import sqlalchemy as sa

revision = "0011_marketplace_sync"
down_revision = "0010_automation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("marketplace_accounts", sa.Column("connection_error", sa.Text(), nullable=True))
    op.add_column("marketplace_accounts", sa.Column("last_connected_at", sa.DateTime(), nullable=True))
    op.add_column("marketplace_accounts", sa.Column("last_sync_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("marketplace_accounts", "last_sync_at")
    op.drop_column("marketplace_accounts", "last_connected_at")
    op.drop_column("marketplace_accounts", "connection_error")
