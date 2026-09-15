"""add intelligent listing generation persistence

Revision ID: 0024_listing_intelligence
Revises: 0023_marketplace_change_watcher
"""
from alembic import op
import sqlalchemy as sa

revision = "0024_listing_intelligence"
down_revision = "0023_marketplace_change_watcher"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "listing_intelligence_generations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("mode", sa.String(20), nullable=False, server_default="review"),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("bullets_json", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("keywords_json", sa.Text(), nullable=False),
        sa.Column("attributes_json", sa.Text(), nullable=False),
        sa.Column("variation_json", sa.Text(), nullable=False),
        sa.Column("compliance_json", sa.Text(), nullable=False),
        sa.Column("quality_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("confidence_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("source_knowledge_version", sa.Integer()),
        sa.Column("source_schema_version", sa.String(100)),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("product_id", "marketplace_account_id", "version", name="uq_listing_intelligence_version"),
    )
    op.create_index("ix_listing_intelligence_generations_product", "listing_intelligence_generations", ["product_id"])
    op.create_index("ix_listing_intelligence_generations_account", "listing_intelligence_generations", ["marketplace_account_id"])
    op.create_index("ix_listing_intelligence_generations_status", "listing_intelligence_generations", ["status"])

    op.create_table(
        "listing_intelligence_feedback",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("generation_id", sa.Integer(), sa.ForeignKey("listing_intelligence_generations.id"), nullable=False),
        sa.Column("field_name", sa.String(50), nullable=False),
        sa.Column("original_value", sa.Text(), nullable=False),
        sa.Column("edited_value", sa.Text(), nullable=False),
        sa.Column("reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_listing_intelligence_feedback_generation", "listing_intelligence_feedback", ["generation_id"])


def downgrade() -> None:
    op.drop_index("ix_listing_intelligence_feedback_generation", table_name="listing_intelligence_feedback")
    op.drop_table("listing_intelligence_feedback")
    op.drop_index("ix_listing_intelligence_generations_status", table_name="listing_intelligence_generations")
    op.drop_index("ix_listing_intelligence_generations_account", table_name="listing_intelligence_generations")
    op.drop_index("ix_listing_intelligence_generations_product", table_name="listing_intelligence_generations")
    op.drop_table("listing_intelligence_generations")
