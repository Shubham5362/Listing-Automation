"""add product catalog intelligence and marketplace identity mapping

Revision ID: 0015_catalog_intelligence
Revises: 0014_listing_updates
"""

from alembic import op
import sqlalchemy as sa

revision = "0015_catalog_intelligence"
down_revision = "0014_listing_updates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_intelligence",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("external_catalog_id", sa.String(length=200), nullable=True),
        sa.Column("asin", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="unmatched"),
        sa.Column("match_method", sa.String(length=40), nullable=True),
        sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("conflict_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("health_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("missing_attributes_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("conflicts_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("category_recommendation", sa.String(length=200), nullable=True),
        sa.Column("attribute_recommendations_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "product_id", "marketplace_account_id", name="uq_catalog_intel_product_marketplace"),
        sa.UniqueConstraint("marketplace_account_id", "external_catalog_id", name="uq_catalog_intel_external_catalog"),
    )
    op.create_index("ix_catalog_intelligence_seller_account_id", "catalog_intelligence", ["seller_account_id"])
    op.create_index("ix_catalog_intelligence_product_id", "catalog_intelligence", ["product_id"])
    op.create_index("ix_catalog_intelligence_marketplace_account_id", "catalog_intelligence", ["marketplace_account_id"])
    op.create_index("ix_catalog_intelligence_sku", "catalog_intelligence", ["sku"])
    op.create_index("ix_catalog_intelligence_external_catalog_id", "catalog_intelligence", ["external_catalog_id"])
    op.create_index("ix_catalog_intelligence_asin", "catalog_intelligence", ["asin"])
    op.create_index("ix_catalog_intelligence_status", "catalog_intelligence", ["status"])


def downgrade() -> None:
    op.drop_index("ix_catalog_intelligence_status", table_name="catalog_intelligence")
    op.drop_index("ix_catalog_intelligence_asin", table_name="catalog_intelligence")
    op.drop_index("ix_catalog_intelligence_external_catalog_id", table_name="catalog_intelligence")
    op.drop_index("ix_catalog_intelligence_sku", table_name="catalog_intelligence")
    op.drop_index("ix_catalog_intelligence_marketplace_account_id", table_name="catalog_intelligence")
    op.drop_index("ix_catalog_intelligence_product_id", table_name="catalog_intelligence")
    op.drop_index("ix_catalog_intelligence_seller_account_id", table_name="catalog_intelligence")
    op.drop_table("catalog_intelligence")
