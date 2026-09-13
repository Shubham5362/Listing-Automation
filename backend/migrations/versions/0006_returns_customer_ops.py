"""add returns and customer operations

Revision ID: 0006_returns_customer_ops
Revises: 0005_seller_account_owner
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_returns_customer_ops"
down_revision = "0005_seller_account_owner"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "return_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("order_item_id", sa.Integer(), sa.ForeignKey("order_items.id"), nullable=True),
        sa.Column("external_return_id", sa.String(200), nullable=True),
        sa.Column("reason", sa.String(200), nullable=False),
        sa.Column("status", sa.String(40), nullable=False, server_default="requested"),
        sa.Column("resolution", sa.String(30), nullable=False, server_default="none"),
        sa.Column("customer_note", sa.Text(), nullable=True),
        sa.Column("refund_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("replacement_order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("requested_at", sa.DateTime(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_return_requests_seller_account_id", "return_requests", ["seller_account_id"])
    op.create_index("ix_return_requests_order_id", "return_requests", ["order_id"])
    op.create_index("ix_return_requests_order_item_id", "return_requests", ["order_item_id"])
    op.create_index("ix_return_requests_external_return_id", "return_requests", ["external_return_id"])
    op.create_index("ix_return_requests_status", "return_requests", ["status"])
    op.create_index("ix_return_requests_requested_at", "return_requests", ["requested_at"])

    op.create_table(
        "customer_issues",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=True),
        sa.Column("customer_name", sa.String(200), nullable=True),
        sa.Column("customer_contact", sa.String(320), nullable=True),
        sa.Column("subject", sa.String(300), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("ai_reply_suggestion", sa.Text(), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("escalated_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_customer_issues_seller_account_id", "customer_issues", ["seller_account_id"])
    op.create_index("ix_customer_issues_order_id", "customer_issues", ["order_id"])
    op.create_index("ix_customer_issues_marketplace_account_id", "customer_issues", ["marketplace_account_id"])
    op.create_index("ix_customer_issues_status", "customer_issues", ["status"])
    op.create_index("ix_customer_issues_priority", "customer_issues", ["priority"])
    op.create_index("ix_customer_issues_created_at", "customer_issues", ["created_at"])


def downgrade() -> None:
    op.drop_table("customer_issues")
    op.drop_table("return_requests")
