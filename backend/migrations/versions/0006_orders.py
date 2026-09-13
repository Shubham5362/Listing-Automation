"""add orders management

Revision ID: 0006_orders
Revises: 0005_seller_account_owner
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_orders"
down_revision = "0005_seller_account_owner"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("external_order_id", sa.String(200), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("payment_status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("customer_name", sa.String(200)),
        sa.Column("customer_email", sa.String(320)),
        sa.Column("customer_phone", sa.String(50)),
        sa.Column("shipping_address", sa.Text()),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("shipping_fee", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("ordered_at", sa.DateTime(), nullable=False),
        sa.Column("shipped_at", sa.DateTime()),
        sa.Column("delivered_at", sa.DateTime()),
        sa.Column("cancelled_at", sa.DateTime()),
        sa.Column("tracking_number", sa.String(200)),
        sa.Column("carrier", sa.String(100)),
        sa.Column("marketplace_data_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("marketplace_account_id", "external_order_id", name="uq_orders_account_external_id"),
    )
    for name, column in (
        ("ix_orders_seller_account_id", "seller_account_id"),
        ("ix_orders_marketplace_account_id", "marketplace_account_id"),
        ("ix_orders_external_order_id", "external_order_id"),
        ("ix_orders_status", "status"),
        ("ix_orders_payment_status", "payment_status"),
        ("ix_orders_ordered_at", "ordered_at"),
        ("ix_orders_tracking_number", "tracking_number"),
    ):
        op.create_index(name, "orders", [column])

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id")),
        sa.Column("sku", sa.String(100), nullable=False),
        sa.Column("title", sa.String(500)),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_product_id", "order_items", ["product_id"])
    op.create_index("ix_order_items_sku", "order_items", ["sku"])


def downgrade() -> None:
    op.drop_table("order_items")
    for name in (
        "ix_orders_tracking_number", "ix_orders_ordered_at", "ix_orders_payment_status", "ix_orders_status",
        "ix_orders_external_order_id", "ix_orders_marketplace_account_id", "ix_orders_seller_account_id",
    ):
        op.drop_index(name, table_name="orders")
    op.drop_table("orders")
