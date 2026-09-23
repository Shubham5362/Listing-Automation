"""marketplace form knowledge

Revision ID: 0038_marketplace_form_knowledge
Revises: 0037_widen_marketplace_account
"""
from alembic import op
import sqlalchemy as sa

revision = "0038_marketplace_form_knowledge"
down_revision = "0037_widen_marketplace_account"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketplace_form_knowledge",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace", sa.String(length=80), nullable=False),
        sa.Column("category", sa.String(length=200), nullable=False),
        sa.Column("adapter_version", sa.String(length=30), nullable=False),
        sa.Column("schema_version", sa.String(length=50), nullable=False),
        sa.Column("schema_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("fields_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="ready"),
        sa.Column("source", sa.String(length=40), nullable=False, server_default="adapter"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "marketplace", "category", name="uq_marketplace_form_knowledge_seller_marketplace_category"),
    )
    for name, column in [
        ("ix_marketplace_form_knowledge_seller_account_id", "seller_account_id"),
        ("ix_marketplace_form_knowledge_marketplace", "marketplace"),
        ("ix_marketplace_form_knowledge_category", "category"),
        ("ix_marketplace_form_knowledge_status", "status"),
    ]:
        op.create_index(name, "marketplace_form_knowledge", [column])


def downgrade() -> None:
    for name in [
        "ix_marketplace_form_knowledge_status",
        "ix_marketplace_form_knowledge_category",
        "ix_marketplace_form_knowledge_marketplace",
        "ix_marketplace_form_knowledge_seller_account_id",
    ]:
        op.drop_index(name, table_name="marketplace_form_knowledge")
    op.drop_table("marketplace_form_knowledge")
