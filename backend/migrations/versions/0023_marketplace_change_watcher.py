"""add marketplace schema change watcher tables

Revision ID: 0023_marketplace_change_watcher
Revises: 0022_adaptive_autofill
"""
from alembic import op
import sqlalchemy as sa

revision = "0023_marketplace_change_watcher"
down_revision = "0022_adaptive_autofill"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketplace_schema_changes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("marketplace", sa.String(50), nullable=False),
        sa.Column("category", sa.String(200), nullable=False),
        sa.Column("old_snapshot_id", sa.Integer(), sa.ForeignKey("marketplace_adapter_snapshots.id")),
        sa.Column("new_snapshot_id", sa.Integer(), sa.ForeignKey("marketplace_adapter_snapshots.id")),
        sa.Column("change_type", sa.String(50), nullable=False),
        sa.Column("field_name", sa.String(200)),
        sa.Column("old_value_json", sa.Text()),
        sa.Column("new_value_json", sa.Text()),
        sa.Column("canonical", sa.String(100)),
        sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("severity", sa.String(20), nullable=False, server_default="info"),
        sa.Column("status", sa.String(30), nullable=False, server_default="detected"),
        sa.Column("auto_adaptable", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    for name, column in (("marketplace", "marketplace"), ("category", "category"), ("change_type", "change_type"), ("field", "field_name"), ("canonical", "canonical"), ("severity", "severity"), ("status", "status")):
        op.create_index(f"ix_marketplace_schema_changes_{name}", "marketplace_schema_changes", [column])

    op.create_table(
        "marketplace_mapping_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("marketplace", sa.String(50), nullable=False),
        sa.Column("category", sa.String(200), nullable=False),
        sa.Column("canonical", sa.String(100), nullable=False),
        sa.Column("marketplace_field", sa.String(200), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("source_change_id", sa.Integer(), sa.ForeignKey("marketplace_schema_changes.id")),
        sa.Column("status", sa.String(30), nullable=False, server_default="proposed"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    for name, column in (("marketplace", "marketplace"), ("category", "category"), ("canonical", "canonical"), ("status", "status")):
        op.create_index(f"ix_marketplace_mapping_versions_{name}", "marketplace_mapping_versions", [column])

    op.create_table(
        "marketplace_change_impacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("change_id", sa.Integer(), sa.ForeignKey("marketplace_schema_changes.id"), nullable=False),
        sa.Column("affected_products", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("affected_listings", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("auto_fixable", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("review_required", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("blocked", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("details_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_marketplace_change_impacts_change", "marketplace_change_impacts", ["change_id"])


def downgrade() -> None:
    op.drop_index("ix_marketplace_change_impacts_change", table_name="marketplace_change_impacts")
    op.drop_table("marketplace_change_impacts")
    for name in ("status", "canonical", "category", "marketplace"):
        op.drop_index(f"ix_marketplace_mapping_versions_{name}", table_name="marketplace_mapping_versions")
    op.drop_table("marketplace_mapping_versions")
    for name in ("status", "severity", "canonical", "field", "change_type", "category", "marketplace"):
        op.drop_index(f"ix_marketplace_schema_changes_{name}", table_name="marketplace_schema_changes")
    op.drop_table("marketplace_schema_changes")
