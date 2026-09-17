"""advanced business intelligence

Revision ID: 0034_advanced_business_intelligence
Revises: 0033_advanced_marketplace_expansion
"""
from alembic import op
import sqlalchemy as sa

revision = "0034_advanced_business_intelligence"
down_revision = "0033_advanced_marketplace_expansion"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "business_intelligence_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=False),
        sa.Column("health_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("revenue", sa.Float(), nullable=False, server_default="0"),
        sa.Column("profit", sa.Float(), nullable=False, server_default="0"),
        sa.Column("margin_percent", sa.Float(), nullable=False, server_default="0"),
        sa.Column("metrics", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("insights", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("decisions", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_bi_snapshots_seller", "business_intelligence_snapshots", ["seller_account_id"])
    op.create_index("ix_bi_snapshots_created", "business_intelligence_snapshots", ["created_at"])
    op.create_table(
        "business_scenarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("scenario_type", sa.String(60), nullable=False),
        sa.Column("assumptions", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("projected_revenue", sa.Float(), nullable=False, server_default="0"),
        sa.Column("projected_profit", sa.Float(), nullable=False, server_default="0"),
        sa.Column("projected_margin_percent", sa.Float(), nullable=False, server_default="0"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("explanation", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_business_scenarios_seller", "business_scenarios", ["seller_account_id"])
    op.create_index("ix_business_scenarios_created", "business_scenarios", ["created_at"])


def downgrade():
    op.drop_table("business_scenarios")
    op.drop_table("business_intelligence_snapshots")
