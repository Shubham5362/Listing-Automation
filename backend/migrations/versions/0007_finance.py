"""add finance and settlements

Revision ID: 0007_finance
Revises: 0006_returns_customer_ops
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_finance"
down_revision = "0006_returns_customer_ops"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "finance_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=True),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id"), nullable=True),
        sa.Column("entry_type", sa.String(40), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("tax_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("external_reference", sa.String(200), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    for name, col in [("seller_account_id", "seller_account_id"), ("marketplace_account_id", "marketplace_account_id"), ("order_id", "order_id"), ("product_id", "product_id"), ("listing_id", "listing_id"), ("entry_type", "entry_type"), ("external_reference", "external_reference"), ("occurred_at", "occurred_at")]:
        op.create_index(f"ix_finance_entries_{name}", "finance_entries", [col])

    op.create_table(
        "settlements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("external_settlement_id", sa.String(200), nullable=False),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=False),
        sa.Column("gross_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("fees_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("refunds_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("net_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reconciled_at", sa.DateTime(), nullable=True),
    )
    for name in ["seller_account_id", "marketplace_account_id", "external_settlement_id", "status"]:
        op.create_index(f"ix_settlements_{name}", "settlements", [name])


def downgrade() -> None:
    op.drop_table("settlements")
    op.drop_table("finance_entries")
