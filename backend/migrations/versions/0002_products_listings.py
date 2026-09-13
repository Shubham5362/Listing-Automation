"""add products and listings

Revision ID: 0002_products_listings
Revises: 0001_core
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_products_listings"
down_revision = "0001_core"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("sku", sa.String(100), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("brand", sa.String(200)),
        sa.Column("category", sa.String(200)),
        sa.Column("hsn_code", sa.String(20)),
        sa.Column("gst_rate", sa.Numeric(5, 2)),
        sa.Column("cost_price", sa.Numeric(12, 2)),
        sa.Column("mrp", sa.Numeric(12, 2)),
        sa.Column("attributes_json", sa.Text()),
        sa.Column("image_urls_json", sa.Text()),
        sa.Column("parent_sku", sa.String(100)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "sku", name="uq_products_seller_sku"),
    )
    op.create_index("ix_products_seller_account_id", "products", ["seller_account_id"])
    op.create_index("ix_products_sku", "products", ["sku"])
    op.create_index("ix_products_brand", "products", ["brand"])
    op.create_index("ix_products_category", "products", ["category"])
    op.create_index("ix_products_parent_sku", "products", ["parent_sku"])

    op.create_table(
        "listings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("sku", sa.String(100), nullable=False),
        sa.Column("external_listing_id", sa.String(200)),
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"),
        sa.Column("title", sa.String(500)),
        sa.Column("price", sa.Numeric(12, 2)),
        sa.Column("inventory_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("attributes_json", sa.Text()),
        sa.Column("marketplace_data_json", sa.Text()),
        sa.Column("validation_errors_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("marketplace_account_id", "sku", name="uq_listings_account_sku"),
    )
    op.create_index("ix_listings_product_id", "listings", ["product_id"])
    op.create_index("ix_listings_marketplace_account_id", "listings", ["marketplace_account_id"])
    op.create_index("ix_listings_sku", "listings", ["sku"])
    op.create_index("ix_listings_external_listing_id", "listings", ["external_listing_id"])
    op.create_index("ix_listings_status", "listings", ["status"])


def downgrade() -> None:
    op.drop_table("listings")
    op.drop_table("products")
