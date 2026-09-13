"""add product media and image intelligence

Revision ID: 0016_product_media
Revises: 0015_catalog_intelligence
"""

from alembic import op
import sqlalchemy as sa

revision = "0016_product_media"
down_revision = "0015_catalog_intelligence"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_media",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("media_type", sa.String(length=20), nullable=False, server_default="image"),
        sa.Column("role", sa.String(length=30), nullable=False, server_default="additional"),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("alt_text", sa.String(length=500), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("quality_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("validation_errors_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("marketplace_rules_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("ai_metadata_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "product_id", "url", name="uq_product_media_seller_product_url"),
    )
    op.create_index("ix_product_media_seller_account_id", "product_media", ["seller_account_id"])
    op.create_index("ix_product_media_product_id", "product_media", ["product_id"])
    op.create_index("ix_product_media_status", "product_media", ["status"])


def downgrade() -> None:
    op.drop_index("ix_product_media_status", table_name="product_media")
    op.drop_index("ix_product_media_product_id", table_name="product_media")
    op.drop_index("ix_product_media_seller_account_id", table_name="product_media")
    op.drop_table("product_media")
