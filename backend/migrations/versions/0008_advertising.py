"""add advertising campaigns and performance

Revision ID: 0008_advertising
Revises: 0007_finance
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_advertising"
down_revision = "0007_finance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "advertising_campaigns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("external_campaign_id", sa.String(200), nullable=False),
        sa.Column("name", sa.String(300), nullable=False),
        sa.Column("campaign_type", sa.String(50), nullable=False, server_default="sponsored_products"),
        sa.Column("status", sa.String(30), nullable=False, server_default="enabled"),
        sa.Column("daily_budget", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("marketplace_account_id", "external_campaign_id", name="uq_ad_campaign_account_external"),
    )
    for name in ["seller_account_id", "marketplace_account_id", "external_campaign_id", "name", "status"]:
        op.create_index(f"ix_advertising_campaigns_{name}", "advertising_campaigns", [name])

    op.create_table(
        "advertising_performance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("advertising_campaigns.id"), nullable=False),
        sa.Column("report_date", sa.DateTime(), nullable=False),
        sa.Column("impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("spend", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("sales", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("conversions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("orders", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("keyword", sa.String(300), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    for name in ["campaign_id", "report_date", "keyword"]:
        op.create_index(f"ix_advertising_performance_{name}", "advertising_performance", [name])

    op.create_table(
        "advertising_insights",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("advertising_campaigns.id"), nullable=False),
        sa.Column("insight_type", sa.String(50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    for name in ["campaign_id", "insight_type"]:
        op.create_index(f"ix_advertising_insights_{name}", "advertising_insights", [name])


def downgrade() -> None:
    op.drop_table("advertising_insights")
    op.drop_table("advertising_performance")
    op.drop_table("advertising_campaigns")
