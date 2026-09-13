"""merge divergent migration heads from orders, pricing, and returns/finance/advertising

Revision ID: 0009_merge_migration_heads
Revises: 0006_orders, 0006_pricing_buybox, 0008_advertising
"""

from alembic import op

revision = "0009_merge_migration_heads"
down_revision = ("0006_orders", "0006_pricing_buybox", "0008_advertising")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
