"""add marketplace adapter registry and schema snapshots

Revision ID: 0021_marketplace_adapter_framework
Revises: 0020_merge_product_knowledge
"""
from alembic import op
import sqlalchemy as sa

revision = "0021_marketplace_adapter_framework"
down_revision = "0020_merge_product_knowledge"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketplace_adapter_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("marketplace", sa.String(50), nullable=False, index=True),
        sa.Column("adapter_version", sa.String(30), nullable=False),
        sa.Column("schema_version", sa.String(50), nullable=False),
        sa.Column("category", sa.String(200), nullable=False),
        sa.Column("schema_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="active", index=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_adapter_snapshot_marketplace_schema", "marketplace_adapter_snapshots", ["marketplace", "schema_version"])


def downgrade() -> None:
    op.drop_index("ix_adapter_snapshot_marketplace_schema", table_name="marketplace_adapter_snapshots")
    op.drop_table("marketplace_adapter_snapshots")
