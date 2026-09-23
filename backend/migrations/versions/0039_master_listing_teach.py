"""master listing teach sessions

Revision ID: 0039_master_listing_teach
Revises: 0038_marketplace_form_knowledge
"""
from alembic import op
import sqlalchemy as sa

revision = "0039_master_listing_teach"
down_revision = "0038_marketplace_form_knowledge"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "master_listing_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace", sa.String(length=80), nullable=False),
        sa.Column("category", sa.String(length=200), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("fields_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="draft"),
        sa.Column("source", sa.String(length=40), nullable=False, server_default="manual_teach"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "marketplace", "category", name="uq_master_listing_template_seller_marketplace_category"),
    )
    op.create_index("ix_master_listing_templates_seller_account_id", "master_listing_templates", ["seller_account_id"])
    op.create_index("ix_master_listing_templates_marketplace", "master_listing_templates", ["marketplace"])
    op.create_index("ix_master_listing_templates_category", "master_listing_templates", ["category"])
    op.create_index("ix_master_listing_templates_status", "master_listing_templates", ["status"])

    op.create_table(
        "listing_teach_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("marketplace", sa.String(length=80), nullable=False),
        sa.Column("category", sa.String(length=200), nullable=False),
        sa.Column("state", sa.String(length=30), nullable=False, server_default="collecting"),
        sa.Column("observed_fields_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("unresolved_fields_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_listing_teach_sessions_seller_account_id", "listing_teach_sessions", ["seller_account_id"])
    op.create_index("ix_listing_teach_sessions_product_id", "listing_teach_sessions", ["product_id"])
    op.create_index("ix_listing_teach_sessions_marketplace", "listing_teach_sessions", ["marketplace"])
    op.create_index("ix_listing_teach_sessions_state", "listing_teach_sessions", ["state"])


def downgrade() -> None:
    for name in [
        "ix_listing_teach_sessions_state", "ix_listing_teach_sessions_marketplace",
        "ix_listing_teach_sessions_product_id", "ix_listing_teach_sessions_seller_account_id",
    ]:
        op.drop_index(name, table_name="listing_teach_sessions")
    op.drop_table("listing_teach_sessions")
    for name in [
        "ix_master_listing_templates_status", "ix_master_listing_templates_category",
        "ix_master_listing_templates_marketplace", "ix_master_listing_templates_seller_account_id",
    ]:
        op.drop_index(name, table_name="master_listing_templates")
    op.drop_table("master_listing_templates")
