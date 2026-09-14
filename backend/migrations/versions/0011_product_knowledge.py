"""add canonical product knowledge brain

Revision ID: 0011_product_knowledge
Revises: 0010_automation
"""

from alembic import op
import sqlalchemy as sa

revision = "0011_product_knowledge"
down_revision = "0010_automation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_knowledge",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("facts_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("attribute_aliases_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("completeness_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("conflict_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "product_id", name="uq_product_knowledge_seller_product"),
    )
    op.create_index("ix_product_knowledge_seller_account_id", "product_knowledge", ["seller_account_id"])
    op.create_index("ix_product_knowledge_product_id", "product_knowledge", ["product_id"])
    op.create_index("ix_product_knowledge_status", "product_knowledge", ["status"])

    op.create_table(
        "product_knowledge_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_knowledge_id", sa.Integer(), sa.ForeignKey("product_knowledge.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("facts_json", sa.Text(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=False, server_default="system"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("product_knowledge_id", "version", name="uq_product_knowledge_version"),
    )
    op.create_index("ix_product_knowledge_versions_product_knowledge_id", "product_knowledge_versions", ["product_knowledge_id"])
    op.create_index("ix_product_knowledge_versions_product_id", "product_knowledge_versions", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_product_knowledge_versions_product_id", table_name="product_knowledge_versions")
    op.drop_index("ix_product_knowledge_versions_product_knowledge_id", table_name="product_knowledge_versions")
    op.drop_table("product_knowledge_versions")
    op.drop_index("ix_product_knowledge_status", table_name="product_knowledge")
    op.drop_index("ix_product_knowledge_product_id", table_name="product_knowledge")
    op.drop_index("ix_product_knowledge_seller_account_id", table_name="product_knowledge")
    op.drop_table("product_knowledge")
