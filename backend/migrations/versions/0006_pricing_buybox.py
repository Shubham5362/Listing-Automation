"""add pricing, competitor and Buy Box tracking

Revision ID: 0006_pricing_buybox
Revises: 0005_seller_account_owner
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_pricing_buybox"
down_revision = "0005_seller_account_owner"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "price_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id"), nullable=False),
        sa.Column("old_price", sa.Numeric(12, 2)),
        sa.Column("new_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("source", sa.String(30), nullable=False),
        sa.Column("reason", sa.String(500)),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_price_history_listing_id", "price_history", ["listing_id"])
    op.create_index("ix_price_history_created_at", "price_history", ["created_at"])
    op.create_table(
        "pricing_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id")),
        sa.Column("min_price", sa.Numeric(12, 2)),
        sa.Column("max_price", sa.Numeric(12, 2)),
        sa.Column("target_margin_percent", sa.Numeric(6, 2)),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_pricing_rules_seller_account_id", "pricing_rules", ["seller_account_id"])
    op.create_index("ix_pricing_rules_listing_id", "pricing_rules", ["listing_id"])
    op.create_table(
        "competitor_prices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id"), nullable=False),
        sa.Column("competitor_name", sa.String(200), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False),
        sa.Column("captured_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_competitor_prices_listing_id", "competitor_prices", ["listing_id"])
    op.create_index("ix_competitor_prices_captured_at", "competitor_prices", ["captured_at"])
    op.create_table(
        "buy_box_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id"), nullable=False),
        sa.Column("won", sa.Boolean(), nullable=False),
        sa.Column("seller_name", sa.String(200)),
        sa.Column("winning_price", sa.Numeric(12, 2)),
        sa.Column("captured_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_buy_box_snapshots_listing_id", "buy_box_snapshots", ["listing_id"])
    op.create_index("ix_buy_box_snapshots_captured_at", "buy_box_snapshots", ["captured_at"])


def downgrade() -> None:
    op.drop_index("ix_buy_box_snapshots_captured_at", table_name="buy_box_snapshots")
    op.drop_index("ix_buy_box_snapshots_listing_id", table_name="buy_box_snapshots")
    op.drop_table("buy_box_snapshots")
    op.drop_index("ix_competitor_prices_captured_at", table_name="competitor_prices")
    op.drop_index("ix_competitor_prices_listing_id", table_name="competitor_prices")
    op.drop_table("competitor_prices")
    op.drop_index("ix_pricing_rules_listing_id", table_name="pricing_rules")
    op.drop_index("ix_pricing_rules_seller_account_id", table_name="pricing_rules")
    op.drop_table("pricing_rules")
    op.drop_index("ix_price_history_created_at", table_name="price_history")
    op.drop_index("ix_price_history_listing_id", table_name="price_history")
    op.drop_table("price_history")
