"""add AI listing drafts

Revision ID: 0003_ai_listing_drafts
Revises: 0002_products_listings
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_ai_listing_drafts"
down_revision = "0002_products_listings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "listing_drafts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=10), nullable=False, server_default="en"),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("bullets_json", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("keywords_json", sa.Text(), nullable=False),
        sa.Column("attributes_json", sa.Text(), nullable=False),
        sa.Column("quality_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("validation_errors_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("product_id", "marketplace_account_id", "version", name="uq_listing_draft_version"),
    )
    op.create_index("ix_listing_drafts_product_id", "listing_drafts", ["product_id"])
    op.create_index("ix_listing_drafts_marketplace_account_id", "listing_drafts", ["marketplace_account_id"])
    op.create_index("ix_listing_drafts_status", "listing_drafts", ["status"])


def downgrade() -> None:
    op.drop_index("ix_listing_drafts_status", table_name="listing_drafts")
    op.drop_index("ix_listing_drafts_marketplace_account_id", table_name="listing_drafts")
    op.drop_index("ix_listing_drafts_product_id", table_name="listing_drafts")
    op.drop_table("listing_drafts")
