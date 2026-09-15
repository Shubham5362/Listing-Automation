"""advanced marketplace expansion

Revision ID: 0033_advanced_marketplace_expansion
Revises: 0032_production_autonomy
"""
from alembic import op
import sqlalchemy as sa

revision = "0033_advanced_marketplace_expansion"
down_revision = "0032_production_autonomy"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("marketplace_capabilities",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("marketplace", sa.String(80), nullable=False),
        sa.Column("capability", sa.String(80), nullable=False), sa.Column("supported", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'")), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_unique_constraint("uq_marketplace_capability", "marketplace_capabilities", ["marketplace", "capability"])
    op.create_index("ix_marketplace_capabilities_marketplace", "marketplace_capabilities", ["marketplace"])

    op.create_table("marketplace_identities",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("marketplace", sa.String(80), nullable=False), sa.Column("entity_type", sa.String(40), nullable=False),
        sa.Column("external_id", sa.String(180), nullable=False), sa.Column("canonical_id", sa.String(180)),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'")), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_unique_constraint("uq_marketplace_identity", "marketplace_identities", ["seller_account_id", "marketplace", "external_id"])
    op.create_index("ix_marketplace_identities_seller_account_id", "marketplace_identities", ["seller_account_id"])
    op.create_index("ix_marketplace_identities_marketplace", "marketplace_identities", ["marketplace"])
    op.create_index("ix_marketplace_identities_canonical_id", "marketplace_identities", ["canonical_id"])

    op.create_table("marketplace_field_mappings",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("marketplace", sa.String(80), nullable=False),
        sa.Column("source_field", sa.String(120), nullable=False), sa.Column("universal_field", sa.String(120), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False), sa.Column("status", sa.String(20), nullable=False, server_default="recommended"),
        sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_unique_constraint("uq_marketplace_field_mapping", "marketplace_field_mappings", ["marketplace", "source_field"])
    op.create_index("ix_marketplace_field_mappings_marketplace", "marketplace_field_mappings", ["marketplace"])

    op.create_table("marketplace_conflicts",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("marketplace", sa.String(80), nullable=False), sa.Column("entity_type", sa.String(40), nullable=False),
        sa.Column("entity_id", sa.String(180), nullable=False), sa.Column("field", sa.String(120), nullable=False),
        sa.Column("source_value", sa.JSON(), nullable=False, server_default=sa.text("'{}'")), sa.Column("target_value", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("resolution", sa.Text()), sa.Column("status", sa.String(20), nullable=False, server_default="open"), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_marketplace_conflicts_seller_account_id", "marketplace_conflicts", ["seller_account_id"])
    op.create_index("ix_marketplace_conflicts_marketplace", "marketplace_conflicts", ["marketplace"])
    op.create_index("ix_marketplace_conflicts_status", "marketplace_conflicts", ["status"])

    op.create_table("marketplace_executions",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("marketplace", sa.String(80), nullable=False), sa.Column("action", sa.String(100), nullable=False), sa.Column("external_id", sa.String(180)),
        sa.Column("status", sa.String(30), nullable=False, server_default="queued"), sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("risk", sa.String(20), nullable=False, server_default="low"), sa.Column("before_state", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("after_state", sa.JSON(), nullable=False, server_default=sa.text("'{}'")), sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("error", sa.Text()), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_marketplace_executions_seller_account_id", "marketplace_executions", ["seller_account_id"])
    op.create_index("ix_marketplace_executions_marketplace", "marketplace_executions", ["marketplace"])
    op.create_index("ix_marketplace_executions_status", "marketplace_executions", ["status"])


def downgrade():
    op.drop_table("marketplace_executions")
    op.drop_table("marketplace_conflicts")
    op.drop_table("marketplace_field_mappings")
    op.drop_table("marketplace_identities")
    op.drop_table("marketplace_capabilities")
