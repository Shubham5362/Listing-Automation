"""restore seller operations schema migration

Revision ID: 0027_seller_operations
Revises: 0026_vision_listing_validation
"""
from alembic import op
import sqlalchemy as sa

revision = "0027_seller_operations"
down_revision = "0026_vision_listing_validation"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "business_health_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("overall_score", sa.Integer(), nullable=False),
        sa.Column("listing_score", sa.Integer(), nullable=False),
        sa.Column("inventory_score", sa.Integer(), nullable=False),
        sa.Column("order_score", sa.Integer(), nullable=False),
        sa.Column("pricing_score", sa.Integer(), nullable=False),
        sa.Column("compliance_score", sa.Integer(), nullable=False),
        sa.Column("diagnostics_score", sa.Integer(), nullable=False),
        sa.Column("image_score", sa.Integer(), nullable=False),
        sa.Column("reason_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_business_health_snapshots_seller_account_id", "business_health_snapshots", ["seller_account_id"])
    op.create_index("ix_business_health_snapshots_created_at", "business_health_snapshots", ["created_at"])

    op.create_table(
        "operation_alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("fingerprint", sa.String(128), nullable=False),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("source", sa.String(80), nullable=False),
        sa.Column("entity_type", sa.String(80)),
        sa.Column("entity_id", sa.String(100)),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("resolved_at", sa.DateTime()),
        sa.UniqueConstraint("seller_account_id", "fingerprint", name="uq_operation_alert_seller_fingerprint"),
    )
    for column in ("seller_account_id", "alert_type", "severity", "source", "is_read", "created_at"):
        op.create_index("ix_operation_alerts_" + column, "operation_alerts", [column])


def downgrade():
    for column in ("created_at", "is_read", "source", "severity", "alert_type", "seller_account_id"):
        op.drop_index("ix_operation_alerts_" + column, table_name="operation_alerts")
    op.drop_table("operation_alerts")
    op.drop_index("ix_business_health_snapshots_created_at", table_name="business_health_snapshots")
    op.drop_index("ix_business_health_snapshots_seller_account_id", table_name="business_health_snapshots")
    op.drop_table("business_health_snapshots")
